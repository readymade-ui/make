#! /usr/bin/env node
import http from "http";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import chalk from "chalk";
import clone from "gh-clone";
import { rimraf } from "rimraf";
import { simpleGit } from "simple-git";
import argvPackage from "process-argv";
import open from "open";

const argv = argvPackage();
const httpRepo = "https://github.com/";
const sshRepo = "git@github.com";
const repoName = "readymade-ui/starter";

const pkg = await import(`./package.json`, {
  assert: { type: "json" },
});

const args = Object.assign(argv, {
  http: argv.options
    ? isNull(argv.options.host)
      ? true
      : isString(argv.options.host)
      ? argv.options.host
      : null
    : null,
  npm: argv.options ? isNull(argv.options.npm) : false,
  repo: argv.options
    ? argv.options.repo
      ? argv.options.repo
      : repoName
    : repoName,
  script: argv.options
    ? isString(argv.options.script)
      ? argv.options.script
      : "start"
    : "start",
  ssh: argv.options
    ? isNull(argv.options.ssh)
      ? true
      : isString(argv.options.ssh)
      ? argv.options.ssh
      : null
    : null,
  open: argv.options
    ? isNull(argv.options.open)
      ? true
      : isString(argv.options.open)
      ? true
      : false
    : false,
  version: pkg.version,
});

function helpItem(key, value) {
  process.stdout.write(`${chalk.white(key)} ${chalk.dim.white(value)} \n`);
}

function exampleItem(key, value) {
  process.stdout.write(`${chalk.blueBright(key)}\n ${chalk.white(value)} \n\n`);
}

function help(args) {
  process.stdout.write(`\n`);
  process.stdout.write(chalk.magenta(`primr ${args.version}\n`));
  process.stdout.write(`\n`);
  process.stdout.write(
    `${chalk.dim.white("Example usage:")} ${chalk.white("npx primr my-app")} \n`
  );
  process.stdout.write(
    chalk.blueBright(
      `^^^ generates a new Readymade project in the my-app directory \n`
    )
  );
  process.stdout.write(`\n`);
  process.stdout.write(chalk.whiteBright(`Options \n`));
  process.stdout.write(chalk.whiteBright(`------- \n`));
  helpItem(
    "http",
    "use https instead of ssh for git clone (default = https://github.com/)"
  );
  helpItem("repo", "repo name (default = readymade-ui/starter)");
  helpItem("script", "run script after install (default = npm run dev)");
  helpItem(
    "ssh",
    "use ssh instead of https for git clone (default = git@github.com)"
  );
  helpItem("npm", "use npm instead of yarn (default is yarn)");
  process.stdout.write(`\n`);
  process.stdout.write(chalk.whiteBright(`Examples \n`));
  process.stdout.write(chalk.whiteBright(`-------- \n`));
  exampleItem(
    "Clone the default readymade-ui/starter repository into a directory called my-app over ssh from a custom git server, install dependencies and run scripts with npm",
    "npx primr my-app --ssh git@custom-git-server.com --npm"
  );
  exampleItem(
    "Clone another repository into a directory called foo-server, run the serve script post install.",
    "npx primr foo-server --repo steveblue/bazel-typescript-starter --script serve"
  );
  process.stdout.write(`\n`);
}

function exists(args) {
  process.stdout.write(`\n`);
  process.stdout.write(
    chalk.red(`${args.command} already exists.\n`) +
      chalk.dim.white(
        `Please remove the directory or install ${args.command} in another location.\n`
      )
  );
  process.stdout.write(`\n`);
}

function init(args) {
  const server = spawn(
    args.npm === true ? "npm" : "yarn",
    args.npm === true ? [args.script] : ["run", args.script],
    {
      cwd: args.command,
      shell: true,
      stdio: "inherit",
    }
  ).on("exit", () => {
    process.stdout.write("🪄 " + chalk.green(args.command + " is ready\n"));
  });

  process.on("exit", () => {
    server.kill();
  });

  if (args.open) {
    const options = {
      hostname: "localhost",
      port: 4443,
      path: "/",
      method: "GET",
    };

    const pingServer = () => {
      const req = http.request(options, (res) => {
        if (res.statusCode === 200) {
          open("http://localhost:4443");
          clearInterval(pingInterval);
        }
      });
      req.on("error", (error) => {
        // console.error(`Error: ${error.message}`);
      });
      req.end();
    };

    const pingInterval = setInterval(pingServer, 100);
  }
}

function install(args) {
  spawn(args.npm === true ? "npm" : "yarn", ["install"], {
    cwd: args.command,
    shell: true,
    stdio: "inherit",
  }).on("exit", () => {
    process.stdout.write("🪄 " + chalk.green(args.command + " is ready\n"));
    init(args);
  });
}

function processPackage(args, rootPackage, git) {
  rimraf.sync(path.resolve(`./${args.command}/yarn.lock`));
  rimraf.sync(path.resolve(`./${args.command}/package-lock.json`));
  rimraf.sync(path.resolve(`./${args.command}/.yarnrc.yml`));
  args.user = {};
  const name = spawn("git", ["config", "--global", "user.name"]);
  name.stdout.setEncoding("utf8");
  name.stdout.on("data", (data) => {
    args.user.name = data;
    const email = spawn("git", ["config", "--global", "user.email"]);
    email.stdout.setEncoding("utf8");
    email.stdout.on("data", (data) => {
      const author = `${args.user.name} <${data}>`.replace(/\n/g, "");
      args.user.email = data;
      rootPackage.description = "";
      rootPackage.repository = "";
      rootPackage.name = args.command;
      rootPackage.author = author;
      rootPackage.version = "1.0.0";
      delete rootPackage.packageManager;
      fs.writeFile(
        path.resolve(`./${args.command}/package.json`),
        JSON.stringify(rootPackage, null, 4),
        (err, data) => {
          if (err) {
            throw err;
          }
          install(args);
        }
      );
    });
  });
}

function customize(args) {
  rimraf.sync(path.resolve(`./${args.command}/.git`));
  const git = simpleGit({
    baseDir: args.command,
  });
  git.init().then(() => {
    fs.readFile(
      path.resolve(`./${args.command}/package.json`),
      "utf-8",
      (err, data) => {
        if (err) {
          throw err;
        }
        processPackage(args, JSON.parse(data), git);
      }
    );
  });
}

function make(args) {
  let hostName = "";
  if (argv.http === true) {
    hostName = httpRepo;
  } else if (isString(argv.http)) {
    hostName = argv.http + "/";
  } else if (args.ssh === true) {
    hostName = sshRepo + ":";
  } else if (isString(argv.ssh)) {
    hostName = args.ssh + ":";
  } else {
    hostName = httpRepo;
  }
  clone(`${hostName}${args.repo}.git`, { dest: args.command })
    .then(() => {
      customize(args);
    })
    .catch((err) => process.stderr.write(err));
}

function start(args) {
  if (args.options && isNull(args.options.help)) {
    help(args);
  }

  if (args.command) {
    if (fs.existsSync(path.resolve("./" + args.command))) {
      exists(args);
    } else {
      make(args);
    }
  }
}

function isString(arg) {
  return typeof arg === "string";
}

function isNull(arg) {
  return arg === null;
}

start(args);
