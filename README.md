# primr

Example usage: `npx primr my-app`

The above command generates a new Readymade project in the my-app directory. The script automatically installs the Readymade starter code but could be modified with arguments to instantiate other projects as well.

### Options

- `http` use https instead of ssh for git clone (default = https://github.com/)
- `repo` repo name (default = readymade-ui/starter)
- `script` run script after install (default = yarn dev)
- `ssh` use ssh instead of https for git clone (default = git@github.com)
- `npm` use npm instead of yarn (default is yarn)
- `open` open the default http server
