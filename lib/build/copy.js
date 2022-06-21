const fs = require('fs');

function copyFile(rootPath) {
  if (fs.existsSync(rootPath)) {

    if (!fs.existsSync('./dist/' + rootPath.slice(2, rootPath.length)))
      fs.mkdirSync('./dist/' + rootPath.slice(2, rootPath.length));
    
    let dir = fs.readdirSync(rootPath);
    for (let i in dir) {
      if (fs.statSync(`${rootPath}/${dir[i]}`).isDirectory()) {

        copyFile(`${rootPath}/${dir[i]}`);

        if (!fs.existsSync('./dist/' + rootPath.slice(2, rootPath.length)))
          fs.mkdirSync('./dist/' + `${rootPath}/${dir[i]}`.slice(2, rootPath.length));
      } else {
        
        let res = fs.readFileSync(`${rootPath}/${dir[i]}`, 'utf-8');
        fs.writeFileSync('./dist/' + `${rootPath}/${dir[i]}`.slice(2, `${rootPath}/${dir[i]}`.length), res);
      }
    }
  }
}

module.exports = copyFile;