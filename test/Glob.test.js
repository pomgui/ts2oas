const { Glob } = require('../dist/Glob');
const fs = require('fs');
const helper = require('./Glob.helper');

const cases = [
  { glob: '*.txt', match: ['a.txt', '.txt', '123_.txt', 'x.txt'], dir: '.', pattern: /[^/]*\.txt/ },
  { glob: './*.txt', match: ['a.txt', '.txt', '123_.txt', 'x.txt'], dir: '.', pattern: /[^/]*\.txt/ },
  { glob: '[ax].txt', match: ['a.txt', 'x.txt'], dir: '.', pattern: /[ax]\.txt/ },
  { glob: 'b?.js', match: ['b1.js', 'b2.js'], dir: '.', pattern: /b.\.js/ },
  { glob: '**/*.txt', match: ['a.txt', '.txt', '123_.txt', 'x.txt', 'dir1/a.txt', 'dir1/dir2/x.txt'], dir: '.', pattern: /.*\/?[^/]*\.txt/ },
  { glob: '/home/**/*.txt', match: ['/home/a.txt', '/home/.txt', '/home/123_.txt', '/home/x.txt', '/home/dir1/a.txt', '/home/dir1/dir2/x.txt'], dir: '/home', pattern: /\/home\/.*\/?[^/]*\.txt/ },
  { glob: 'unexistentdir/b?.js', match: [], dir: 'unexistentdir', pattern: /unexistentdir\/b.\.js/ },
  { glob: '/o.txt', match: ['/o.txt'], dir: '/', pattern: /\/o\.txt/ },
  { glob: '/home/?.txt', match: ['/home/a.txt', '/home/x.txt'], dir: '/home', pattern: /\/home\/.\.txt/ },
  { glob: '/home/a.txt', match: ['/home/a.txt'], dir: '/home', pattern: /\/home\/a\.txt/ },
];

describe('glob', () => {
  beforeEach(() => {
    jest.spyOn(fs, 'readdirSync').mockImplementation(helper.readdirSync);
    jest.spyOn(fs, 'statSync').mockImplementation(helper.statSync);
  });
  afterEach(() => {
    jest.clearAllMocks();
  })

  it.each(cases)(`'$glob' should match '$match'`, t => {
    const glob = new Glob(t.glob);
    expect(glob._pattern.toString()).toBe(t.pattern.toString());
    expect(glob._root).toBe(t.dir);
    const files = glob.getFiles();
    expect(files).toStrictEqual(t.match);
  });

  it
});