import * as fs from 'fs';
import * as path from 'path';

export class Glob {
  private _pattern: RegExp;
  private _root: string;
  private _recursive = false;

  constructor(glob: string) {
    [this._pattern, this._root] = this._parse(glob);
  }

  getFiles(): string[] {
    const me = this;
    const list: string[] = [];
    const pattern = this._pattern;
    if (!fs.existsSync(this._root))
      return [];

    loadDir(this._root);
    return list;

    function loadDir(root: string): void {
      const files = fs.readdirSync(root);
      for (const file of files) {
        if (file == '.git') continue;
        const full = path.join(root, file);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) { if (me._recursive) loadDir(full); }
        else if (pattern.test(full)) list.push(full);
      }
    }
  }

  private _parse(glob: string): [pattern: RegExp, root: string] {
    const isAbsolute = glob.startsWith('/');
    const me = this;
    if (glob.startsWith('./'))
      glob = glob.substring(2);
    else if (glob.startsWith('/'))
      glob = glob.substring(1);
    glob = glob.replace(/\./g, '\\.');
    const parts = glob.split('/');
    const patternArray: string[] = [];
    let dirIdx = 0, dirStop = false;
    parts.forEach((part, i) => {
      const pattern = part.replace(/^\*\*$|[*?]|\[[^]]+\]/, g => {
        switch (g) {
          case '**': me._recursive = true; return '.*';
          case '*': return '[^/]*';
          case '?': g = '.'; // intentionally without return or break
          default: return g;
        }
      });
      patternArray.push(pattern);
      if (pattern === part) {
        if (!dirStop) dirIdx++;
      } else dirStop = true;
    });
    const re = (isAbsolute ? '/' : '') + patternArray.join('/').replace(/\.\*\//g, '.*\/?');
    let root = isAbsolute ? '/' : '';
    if (dirIdx == parts.length) {
      if (dirIdx > 1)
        root += path.dirname(glob);
    } else
      root += parts.slice(0, dirIdx).join('/');
    if (root === '') root = '.';
    return [
      new RegExp(re),
      root
    ];
  }
}