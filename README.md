# Make Ready

Example usage: `npx make-ready my-app`

The above command generates a new Readymade project in the my-app directory. The script automatically installs the Readymade starter code but could be modified with arguments to instantiate other projects as well.

### Options

- `http` use https instead of ssh for git clone (default = https://github.com/)
- `repo` repo name (default = readymade-ui/starter)
- `script` run script after install (default = npm run dev)
- `ssh` use ssh instead of https for git clone (default = git@github.com)
- `npm` use npm instead of yarn (default is yarn)

### Examples

Clone the default readymade-ui/starter repository into a directory called my-app over ssh from a custom git server, install dependencies and run scripts with npm

```bash
npx make-ready my-app --ssh git@custom-git-server.com --npm
```

Clone another repository into a directory called foo-server, run the serve script post install.

```bash
npx make-ready foo-server --repo steveblue/bazel-typescript-starter --script serve
```
