const rootDir = {
  files: [
    {
      name: '<root>',
      files: [
        { name: 'o.txt' },
        {
          name: 'home',
          files: [{ name: 'a.txt' }, { name: '.txt' }, { name: '123_.txt' }, { name: 'x.txt' }, { name: 'b1.js' }, { name: 'b2.js' },
          { name: '.git', files: [{ name: 'git_x.txt' }] },
          {
            name: 'dir1',
            files: [
              { name: 'a.txt' },
              {
                name: 'dir2',
                files: [{ name: 'x.txt' }]
              }
            ]
          }
          ]
        }
      ]
    }
  ]
};

function getFile(path) {
  let file = rootDir;
  if (!/^[./]/.test(path)) path = './' + path;
  if (path.startsWith('/')) path = '<root>' + path;
  else path = path.replace(/^\./, '<root>/home');
  if (path.endsWith('/')) path = path.substring(0, path.length - 1);
  for (const p of path.split('/'))
    if (!(file = file.files.find(f => f.name == p))) break;
  return file;
}

function readdirSync(path) {
  const dir = getFile(path);
  return dir?.files.map(f => f.name);
}

function statSync(file) {
  return {
    isDirectory() {
      return !!(getFile(file)?.files);
    }
  };
}

module.exports = {
  readdirSync,
  statSync
}