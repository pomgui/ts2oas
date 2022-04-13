const { TYPES, TypescriptToOAS } = require('../dist/TypescriptToOAS');
const { arrayCases, edgecases, testsuites } = require('./TypescriptToOAS.testcases');
const { SyntaxKind } = require('typescript');

describe('TypescriptToOAS', () => {
  let ts2oas;
  beforeEach(() => {
    ts2oas = new TypescriptToOAS();
  });

  describe.each(testsuites)('$type', (suite) => {
    it.each(suite.cases)(`$name`, t => {
      const oas = ts2oas.convert(t.name, t.code).getOAS();
      expect(oas).toStrictEqual({ components: { schemas: t.expected } });
    });
  });

  describe('special cases', () => {
    it.each(edgecases)(`$name`, t => {
      //if (t.name != 'multiple literal type') return;
      const oas = ts2oas.convert(t.name, t.code).getOAS();
      expect(oas).toStrictEqual({ components: { schemas: t.expected } });
    });

    it(`Multiple type not supported`, () => {
      expect(() => ts2oas.convert('uniontype', `export interface IStringType {a: 'OK'|5|false};`))
        .toThrow(Error);
    });
  });

  describe('Arrays', () => {
    it.each(arrayCases)(`$name`, t => {
      const oas = ts2oas.convert(t.name, t.code).getOAS();
      expect(oas).toStrictEqual({ components: { schemas: t.expected } });
    });
  });

});