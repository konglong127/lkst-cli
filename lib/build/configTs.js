const fs = require('fs');

function rmdir(root){
  if(fs.existsSync(root)){
    let dir=fs.readdirSync(root)
    for(let i in dir){
      let state=fs.statSync(`${root}/${dir[i]}`)
      if(state.isDirectory()){
        rmdir(`${root}/${dir[i]}`);
      }else{
        if(`${root}/${dir[i]}`.endsWith('.ts'))
          fs.unlinkSync(`${root}/${dir[i]}`);
      }
    }
  }
}


module.exports = async () => {
  rmdir('./dist/utils');
}
