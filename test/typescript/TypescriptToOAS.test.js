const { TypescriptToOAS } = require('../../dist/typescript/TypescriptToOAS');
const { arrayCases, edgecases, testsuites, customTypesCases } = require('./TypescriptToOAS.testcases');
const { SyntaxKind } = require('typescript');
const { deepMerge } = require('@pomgui/deep');

describe('TypescriptToOAS', () => {

  describe.each(testsuites)('$type', (suite) => {
    it.each(suite.cases)(`$name`, t => {
      const oas = new TypescriptToOAS(t.name, t.code).convert().getOAS();
      expect(oas).toStrictEqual({ components: { schemas: t.expected } });
    });
  });

  describe('special cases', () => {
    it.each(edgecases)(`$name`, t => {
      const oas = new TypescriptToOAS(t.name, t.code).convert().getOAS();
      expect(oas).toStrictEqual({ components: { schemas: t.expected } });
    });

    it(`Multiple type not supported`, () => {
      expect(() => new TypescriptToOAS('uniontype', `export interface IStringType {a: 'OK'|5convert().|false};`).convert())
        .toThrow(Error);
    });
  });

  describe('Arrays', () => {
    it.each(arrayCases)(`$name`, t => {
      const oas = new TypescriptToOAS(t.name, t.code).convert().getOAS();
      expect(oas).toStrictEqual({ components: { schemas: t.expected } });
    });
  });

  describe('Custom Types', () => {
    it.each(customTypesCases)(`testing '$type'`, t => {
      let type = t.type;
      const expected = deepMerge(t.expected);
      if(['Array', 'Set'].includes(t.type)) {
        type += '<string>';
        expected.items.type = 'string';
      }
      const code = `export interface AType {a: ${type}};`;
      const oas = new TypescriptToOAS(type, code).convert().getOAS();
      expect(oas).toStrictEqual({ components: { schemas: {
        AType: {
          properties: {
            a: expected
          },
          required: ["a"],
          type: "object",
        }
      }}});
    });
  });

});