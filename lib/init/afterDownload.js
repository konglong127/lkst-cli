const fs = require('fs');
const prettier = require('prettier');

function donwloadFileProcess(name) {
  return new Promise((resolve, reject) => {
    if(fs.existsSync(`./${name}/koaServerTemplate`)){
      try {
        let dir = fs.readdirSync(`./${name}/koaServerTemplate`);
        for (let i in dir) {
          fs.renameSync(`./${name}/koaServerTemplate/${dir[i]}`, `./${name}/${dir[i]}`);
        }
        resolve();
      } catch (error) {
        reject(error);
      }
    }else if(fs.existsSync(`./${name}/KoaServerTemplateTS`)){
      try {
        let dir = fs.readdirSync(`./${name}/KoaServerTemplateTS`);
        for (let i in dir) {
          fs.renameSync(`./${name}/KoaServerTemplateTS/${dir[i]}`, `./${name}/${dir[i]}`);
        }
        resolve();
      } catch (error) {
        reject(error);
      }
    }else{
      reject('network error!');
    }
  });
}


module.exports = async (name) => {
  await donwloadFileProcess(name);

  if(fs.existsSync(`./${name}/koaServerTemplate`))
    fs.rmdirSync(`./${name}/koaServerTemplate`);
  
  if(fs.existsSync(`./${name}/KoaServerTemplateTS`))
    fs.rmdirSync(`./${name}/KoaServerTemplateTS`);

  let changeName = JSON.parse(fs.readFileSync(`./${name}/package.json`, 'utf-8'));
  changeName.name = name.toLowerCase();
  fs.writeFileSync(`./${name}/package.json`, prettier.format(JSON.stringify(changeName), { parser: 'json' }));

  changeName = JSON.parse(fs.readFileSync(`./${name}/package-lock.json`, 'utf-8'));
  changeName.name = name.toLowerCase();
  fs.writeFileSync(`./${name}/package-lock.json`, prettier.format(JSON.stringify(changeName), { parser: 'json' }));

  fs.unlinkSync(`./${name}/public/img/.gitkeep`);
  fs.unlinkSync(`./${name}/public/video/.gitkeep`);
}

