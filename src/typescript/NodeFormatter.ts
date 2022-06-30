import * as ts from 'typescript';

export class NodeFormatter {
  public line: number;
  public col: number;
  public errorLine: string;

  constructor(node: ts.Node, code: string) {
    let p = code.lastIndexOf('\n', node.pos) + 1, e = code.indexOf('\n', node.pos);
    if (e < 0) e = code.length;
    this.line = this._lineNo(code, node.pos);
    this.col = node.pos - p + 1;
    this.errorLine = code.substring(p, e).replace('\t', ' ');
  }

  private _lineNo(code: string, index: number): number {
    let count = 1;
    while ((index = code.lastIndexOf('\n', index - 1)) >= 0)
      count++;
    return count;
  }
}