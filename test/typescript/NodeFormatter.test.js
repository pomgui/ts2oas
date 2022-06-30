const { NodeFormatter } = require('../../dist/typescript/NodeFormatter');

const code = `import * as ts from 'typescript';

export class NodeFormatter {
  ...
}`;

describe(`NodeFormatter`, ()=>{
  let fmt;
  test(`first line`, () => {
    fmt = new NodeFormatter({ pos: 8 }, code);
    expect(fmt).toMatchObject({
      line: 1,
      col: 10,
      errorLine: `import * as ts from 'typescript';`
    });
  });

  test(`third line`, () => {
    fmt = new NodeFormatter({ pos: 47 }, code);
    expect(fmt).toMatchObject({
      line: 3,
      col: 14,
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