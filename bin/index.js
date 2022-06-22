#!/usr/bin/env node
// npm link 连接工具 npm unlink取消连接
const program=require('commander');

program.version(require('../package.json').version);

// 命令行定制

program
  .command('create <name>')
  .description('create server template.')
  .action(require('../lib/init'))

program
  .command('build project')
  .description(`input 'template build project' under porject folder.`)
  .action(require('../lib/build'))

program.parse(process.argv);
