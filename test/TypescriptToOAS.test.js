const { TYPES, TypescriptToOAS } = require('../dist/TypescriptToOAS');
const { arrayCases, edgecases, testsuites } = require('./TypescriptToOAS.testcases');
const { SyntaxKind } = require('typescript');

describe('TypescriptToOAS', () => {

  describe.each(testsuites)('$type', (suite) => {
    it.each(suite.cases)(`$name`, t => {
      const oas = new TypescriptToOAS(t.name, t.code).convert().getOAS();
      expect(oas).toStrictEqual({ components: { schemas: t.expected } });
    });
  });

  describe('special cases', () => {
    it.each(edgecases)(`$name`, t => {
      //if (t.name != 'multiple literal type') return;
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

});