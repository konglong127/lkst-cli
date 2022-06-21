const ora = require('ora');
const execa = require('execa');

module.exports.query = async (options) => {
  let { cmd, cArr, path, info } = options;
  return new Promise((resolve, reject) => {
    let subprocess;

    subprocess = execa(cmd, cArr, path);

    const spinner = ora(info).start();
    spinner.color = 'yellow';

    subprocess.stdout.on('data', (info) => {
      spinner.text = info;
    });

    subprocess.stdout.on('end', () => {
      spinner.stop();
      resolve();
    });

  });
}
