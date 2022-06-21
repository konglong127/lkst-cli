const execa = require('execa');
const fs = require('fs');
const prettier = require('prettier')

module.exports = async () => {
  return new Promise(async (resolve, reject) => {
    let subprocess = await execa('tsc', ['-p', './tsconfig.json'], './');
    let pkg = fs.readFileSync('./package.json', 'utf-8');
    pkg = JSON.parse(pkg);
    pkg.scripts = {
      "start": "nodemon ./http/cluster.js",
      "serve": "nodemon ./http/alone.js"
    }

    fs.writeFileSync('./dist/package.json', prettier.format(JSON.stringify(pkg), { parser: 'json' }));
    pkg = fs.readFileSync('./package-lock.json', 'utf-8');
    fs.writeFileSync('./dist/package-lock.json', prettier.format(pkg, { parser: 'json' }));

    let cfg=fs.readFileSync('./dist/config.js','utf-8');
    cfg = cfg.replace(/\/\/[^\n]*/g, '');
    cfg = cfg.replace(/\/\*.*?\*\//g, '');
    fs.writeFileSync('./dist/config.js',prettier.format(cfg, { parser: 'babel' }))
    resolve(subprocess);
  });
}
