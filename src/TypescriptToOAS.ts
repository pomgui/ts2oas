import { SyntaxKind } from "typescript";
import * as ts from 'typescript';
// import * as fs from 'fs';
// import { noCircularStringify } from "./NoCircularStringify";
import { deepFreeze, deepMerge } from '@pomgui/deep';

export const TYPES: { [k: number]: string } = {
  [SyntaxKind.ArrayType]: 'array',
  [SyntaxKind.StringKeyword]: 'string',
  [SyntaxKind.NumberKeyword]: 'number',
  [SyntaxKind.BooleanKeyword]: 'boolean',
  [SyntaxKind.UndefinedKeyword]: 'object',
  [SyntaxKind.NullKeyword]: 'object',
  [SyntaxKind.UnknownKeyword]: 'object',
  [SyntaxKind.AnyKeyword]: 'object',
};

const PSEUDO_REFS: any = deepFreeze({
  Date: { type: 'string', format: 'date-time' },
  Uuid: { type: 'string', format: 'uuid' },
  uuid: { type: 'string', format: 'uuid' },
  integer: { type: 'integer', format: 'int32' },
  Jsonb: { type: 'object', additionalProperties: true },
  jsonb: { type: 'object', additionalProperties: true },
  Array: { type: 'array', items: {} },
  Set: { type: 'array', items: {} }
});

export class TypescriptToOAS {
  /** schemas found */
  private _schemas: any = {};
  private _code: string = '';

  getOAS(): any { return { components: { schemas: this._schemas } }; }

  /**
   * Converts all the exported interfaces, classes, and types into OAS schemas object.
   * @param filename Typescript file name
   * @param code Typescript code to be converted
   */
  convert(filename: string, code: string) {
    this._code = code;
    const node = ts.createSourceFile(filename, code, ts.ScriptTarget.Latest);
    node.forEachChild(child => {
      switch (child.kind) {
        case SyntaxKind.InterfaceDeclaration:
        case SyntaxKind.ClassDeclaration:
        case SyntaxKind.TypeAliasDeclaration:
          if (child.modifiers?.some(m => m.kind === SyntaxKind.ExportKeyword))
            // Process it only if it is "exported"
            this._createSchema(child);
          break;
      }
    });
    // Debug:
    // fs.writeFileSync('/tmp/input.json', noCircularStringify(node, (k, v) => k == 'kind' ? `${SyntaxKind[v]} (${v})` : v, 2), 'utf8');
    // fs.writeFileSync('/tmp/ouput.json', JSON.stringify(schemas, null, 2), 'utf8');
    return this;
  }

  private _createSchema(node: any) {
    let schema: any;
    let ignore = false;
    const isTypeLiteral = node.type && node.type.kind == SyntaxKind.TypeLiteral;
    if (node.kind == SyntaxKind.TypeAliasDeclaration && !isTypeLiteral) {
      schema = this._getProperty(node);
      delete schema.required;
    } else {
      schema = {
        type: 'object',
        description: undefined,
        required: [],
        properties: this._getProperties(node)
      };
      Object.keys(schema.properties)
        .forEach(k => {
          if (schema.properties[k].required) schema.required.push(k);
          delete schema.properties[k].required;
        });
    }
    if (node.jsDoc) {
      const tagList = this._extractTags(schema, node.jsDoc);
      ignore = tagList.includes('ts2oas-disable');
    }
    if (node.heritageClauses) {
      const extendsFrom: string[] = [];
      node.heritageClauses.forEach((h: any) =>
        h.types && h.types.forEach((t: any) =>
          t.expression && extendsFrom.push(t.expression.escapedText)))
      const description = schema.description;
      delete schema.description;
      schema = {
        description,
        allOf: [
          schema,
          ...extendsFrom.map(e => ({ $ref: `#/components/schemas/${e}` }))
        ]
      }
    }
    if (!ignore) {
      schema = JSON.parse(JSON.stringify(schema)); // clean 'undefined' fields
      this._schemas[(node as any).name.escapedText] = schema;
    }
  }

  private _getProperties(node: any) {
    const props: any = {};
    const members = node.kind == SyntaxKind.TypeAliasDeclaration ? node.type.members : node.members;
    members
      .filter((mbr: any) => mbr.kind == SyntaxKind.PropertySignature || mbr.kind == SyntaxKind.PropertyDeclaration)
      .filter((mbr: any) => !mbr.modifiers || !mbr.modifiers.some((mod: any) => mod.kind == SyntaxKind.ProtectedKeyword || mod.kind == SyntaxKind.PrivateKeyword))
      .forEach((mbr: any) => props[mbr.name.escapedText] = this._getProperty(mbr));
    return props;
  }

  private _getProperty(member: any): any {
    const prop: any = {
      description: undefined
    };
    this._extractType(prop, member.type);
    prop.required = !member.questionToken;
    if (member.jsDoc)
      this._extractTags(prop, member.jsDoc);
    return prop;
  }

  private _extractType(prop: any, typeNode: ts.TypeNode): void {
    switch (typeNode.kind) {
      case SyntaxKind.UnionType: {
        const types = (typeNode as ts.UnionTypeNode).types;
        const isEnum = !types.some((t: any) => t.kind != SyntaxKind.LiteralType || (t as ts.LiteralTypeNode).literal.kind != SyntaxKind.StringLiteral);
        if (isEnum) {
          prop.type = 'string';
          prop.enum = types.map((t: any) => t.literal.text)
        } else {
          this._printError(`UNION Type not supported`, typeNode);
          throw new Error(`Type not supported`);
        }
      }
        break;
      case SyntaxKind.TypeReference: {
        const typeName = (typeNode as any).typeName.escapedText;
        const pseudoRef = PSEUDO_REFS[typeName];
        if (pseudoRef) {
          deepMerge(prop, pseudoRef);
          if (prop.type == 'array') {
            const targs = (typeNode as any).typeArguments;
            if (targs?.length)
              this._extractType(prop.items, targs[0]);
            else
              prop.items.type = 'object';
          }
        } else
          prop.$ref = '#/components/schemas/' + typeName;
      }
        break;
      case SyntaxKind.LiteralType: {
        prop.type = 'string';
        const literal = (typeNode as any).literal;
        if (literal.kind == SyntaxKind.NullKeyword)
          prop.enum = ['null'];
        else if (literal.kind == SyntaxKind.StringLiteral)
          prop.enum = [literal.text];
        // else {
        //   this._printError(`LiteralType: kind='${SyntaxKind[literal.kind]}' not supported!`, literal);
        // }
      }
        break;
      case SyntaxKind.ArrayType:
      case SyntaxKind.StringKeyword:
      case SyntaxKind.NumberKeyword:
      case SyntaxKind.BooleanKeyword:
      case SyntaxKind.UndefinedKeyword:
      case SyntaxKind.NullKeyword:
      case SyntaxKind.UnknownKeyword:
      case SyntaxKind.AnyKeyword: {
        const type = TYPES[typeNode.kind];
        if (type) {
          prop.type = type;
          if (prop.type == 'array')
            this._extractType(prop.items = {}, (typeNode as ts.ArrayTypeNode).elementType);
        }
      }
        break;
      default: {
        prop.type = 'object';
        this._printError(`Unsupported type <${SyntaxKind[typeNode.kind]} (${typeNode.kind})> forcing to "object"`, typeNode);
      }
    }
  }

  private _printError(msg: string, node: ts.Node): void {
    const code = this._code;
    let p = code.lastIndexOf('\n', node.pos) + 1, e = code.indexOf('\n', node.pos);
    if (e < 0) e = code.length;
    const errLine = code.substring(p, e).replace('\t', ' ');
    console.warn(errLine + '\n' + '^'.padStart(node.pos + 1 - p) + '\n' + msg);
  }

  private _extractTags(prop: any, node: ts.Node[]): string[] {
    const tagList: string[] = [];
    node.forEach(jsdoc => {
      switch (jsdoc.kind) {
        case SyntaxKind.JSDocComment:
          const tags = (jsdoc as any).tags;
          if (tags)
            tags.forEach((tag: any) => {
              const tagName = tag.tagName.escapedText;
              let tagValue: any = tag.comment;
              if (['minimum', 'maximum', 'multipleOf', 'exclusiveMaximum', 'exclusiveMinimum'].includes(tagName)) {
                if (prop.type == 'integer')
                  tagValue = parseInt(tagValue);
                else if (prop.type == 'number')
                  tagValue = parseFloat(tagValue);
              }
              else if ('additionalProperties' === tagName) {
                tagValue = tagValue === 'true';
              }
              prop[tagName] = tagValue;
              tagList.push(tagName);
            });
          prop.description = (jsdoc as any).comment;
      }
    });
    return tagList;
  }
}