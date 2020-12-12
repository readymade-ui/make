#! /usr/bin/env node
const fs = require('fs');
const path = require('path');
const spawn = require('child_process').spawn;
const chalk = require('chalk');
const clone = require('gh-clone');
const rimraf = require('rimraf');
const simpleGit = require('simple-git');
const argv = require('process-argv')();

const package = require(__dirname + '/package.json');
const args = Object.assign(argv, {
  version: package.version,
});

function help(args) {
  process.stdout.write(`\n`);
  process.stdout.write(chalk.magenta(`Make Ready ${args.version}\n`));
  process.stdout.write(
    `${chalk.dim.white('Example usage:')} ${chalk.white(
      'npx make-ready my-app',
    )} \n`,
  );
  process.stdout.write(
    chalk.blueBright(
      `^^^ generates a new Readymade project in the my-app directory \n`,
    ),
  );
  process.stdout.write(`\n`);
}

function exists(args) {
  process.stdout.write(`\n`);
  process.stdout.write(
    chalk.red(`${args.command} already exists.\n`) +
      chalk.dim.white(
        `Please remove the directory or install ${args.command} in another location.\n`,
      ),
  );
  process.stdout.write(`\n`);
}

function init(args) {
  spawn('yarn', ['dev'], {
    cwd: args.command,
    shell: true,
    stdio: 'inherit',
  });
}

function install(args) {
  spawn('yarn', ['install'], {
    cwd: args.command,
    shell: true,
    stdio: 'inherit',
  }).on('exit', () => {
    process.stdout.write(chalk.green(args.command + ' is ready\n'));
    init(args);
  });
}

function processPackage(args, package, git) {
  args.user = {};
  const name = spawn('git', ['config', '--global', 'user.name']);
  name.stdout.setEncoding('utf8');
  name.stdout.on('data', (data) => {
    args.user.name = data;
    const email = spawn('git', ['config', '--global', 'user.email']);
    email.stdout.setEncoding('utf8');
    email.stdout.on('data', (data) => {
      const author = `${args.user.name} <${args.user.email}>`.replace(
        /\n/g,
        '',
      );
      args.user.email = data;
      package.description = '';
      package.repository = '';
      package.name = args.command;
      package.author = author;
      package.version = '1.0.0';
      fs.writeFile(
        path.resolve(`./${args.command}/package.json`),
        JSON.stringify(package, null, 4),
        (err, data) => {
          if (err) {
            throw err;
          }
          install(args);
        },
      );
    });
  });
}

function customize(args) {
  rimraf(path.resolve(`./${args.command}/.git`), {}, () => {
    const git = simpleGit({
      baseDir: args.command,
    });
    git.init().then(() => {
      fs.readFile(
        path.resolve(`./${args.command}/package.json`),
        (err, data) => {
          if (err) {
            throw err;
          }
          processPackage(args, JSON.parse(data), git);
        },
      );
    });
  });
}

function make(args) {
  clone('https://github.com/readymade-ui/starter.git', { dest: args.command })
    .then(() => {
      customize(args);
    })
    .catch((err) => process.stderr.write(err));
}

function start(args) {
  if (args.options && args.options.help == null) {
    help(args);
  }

  if (args.command) {
    if (fs.existsSync(path.resolve('./' + args.command))) {
      exists(args);
    } else {
      make(args);
    }
  }
}

start(args);
