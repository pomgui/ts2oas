const { NodeFormatter } = require('../../dist/typescript/NodeFormatter');

const code = `import * as ts from 'typescript';

export class NodeFormatter {
  ...
}`;

describe(`NodeFormatter`, ()=>{
  let fmt;
  test(`first line`, () => {
    fmt = new NodeFormatter({ pos: 10 }, code);
    expect(fmt).toMatchObject({
      line: 1,
      col: 11,
      errorLine: `import * as ts from 'typescript';`
    });
  });

  test(`third line`, () => {
    fmt = new NodeFormatter({ pos: 50 }, code);
    expect(fmt).toMatchObject({
      line: 3,
      col: 16,
      errorLine: `export class NodeFormatter {`
    });
  });

  test(`last line`, () => {
    fmt = new NodeFormatter({ pos: 70 }, code);
    expect(fmt).toMatchObject({
      line: 5,
      col: 1,
      errorLine: `}`
    });
  });
});