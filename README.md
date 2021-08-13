# Bot-Prefab
Join the Discord [server](https://discord.gg/eN8PfTRgh6) if you have any questions!

## What is this?
This package is based on a project of mine [`bot-prefab`](https://github.com/canta-slaus/bot-prefab) and is meant to offer the same functionality as the prefab but **easier to use**.

## Installing and usage
Using [`npm`](https://npmjs.com):
```
$ npm i bot-prefab-package -g
```
or using [`yarn`](https://yarnpkg.com/):
```
$ yarn global add bot-prefab-package
```

Now, go to the folder where you keep your projects and run `prefab` in a terminal (you might have to re-open the terminal after installing the package globally so it adds the command). This will open up the CLI. From here, you can create new projects, update existing ones, edit them, ...

## CLI
After running
```
$ prefab
```
you can choose:
### New project
To create a new project, it will ask your for a name for that project.\
_More options like JS/TS, different databases as well as chosing which features/commands you want to have are planned for the future!_

### Update a project (WIP)
The idea of the prefab is to allow you to easily create projects _but also_ to easily update to the newest version. Here's how it works:\
All necessary base-prefab classes and files will be located in `src/prefab`. However, the classes you use are located in `src/util` and extend the base-prefab classes. This allows you to add anything you would like to add yourself to your own class and to update, the CLI tool will simply replace the base-files!\
This setup also allows you to e.g. change which built-in features (and/or commands) you want to have, switch database systems, ... without too much incovenience.\
_Any changes of the files in `src/prefab` might be lost when updating, as these will be completely replaced!_

### Add command (WIP)
This will ask you for a command name as well as the category and will then create a copy of the template in the category folder.

### Add event (WIP)
Simply chose which event you would like to add and it will create the file in the right folder and add a blank template (including the type declarations)

### Add types (WIP)
To make the most out of the `Manager` class, I recommend defining the key and document type it is storing. For that, you can use either [`JSDoc`](https://jsdoc.app/) as seen in some of the files of the prefab (e.g. `prefab/slashCommand.js`) or make use of `d.ts` files (e.g. `src/types/profile.d.ts`). However, not everyone might know how to use either of those but making use of this is very helpful and makes working with the `Manager` class a lot more pleasant. When you choose this, it will prompt you to specify which schema (actually the model file) you would like to generate the type for.\
_Disclaimer: The resulting type might not be 100% accurate or might be missing some elements, if you find any missing/wrong type declarations, feel free to open a new [`issue`] (https://github.com/canta-slaus/bot-prefab-package/issues) or join the Discord server!_

## Why use this?
The package offers a feature-rich template to make prototyping bots easier and **faster**! It offers a command handler (including slash commands) and event handler. In the future, there will be more options to chose from when creating/updating your project.

## Available Features
- Per server settings (prefix, disabling/enabling certain commands, disabling/enabling all commands in some channels, setting custom permission requirements for commands, customimizable cooldowns based on roles, adding custom aliases for commands)
- Quality of life utility functions (pagination, ...)

## What's next?
The whole purpose of this package is to have a quick and easy way to setup a new project to prototype bots (or have an actual bot for your own server). I would like to keep it all optional and modular, so you can easily swap out certain parts or completely opting out of those. There will be a lot more quality of life features added to allow all kinds of bot behavior and give _you_ the best experience possible while using the package and it's CLI.\
I plan to add support for more languages (TypeScript, ... ?), more databases (SQLite, Firebase, ..), more modules and built-in commands (auto-mod, mod-logs, moderation, reaction roles, ...) but always keeping it easy-to-use.\

_Disclaimer: This package might not be the best for everyone. The structure was purposefully designed to allow the user to add their own ideas, but keeping it easy to update (main flaw of my old bot-prefab is the fact that it was very tedious to update) and thus it comes with a few unneccesary things. It is intended to be a template for you to build on top and to prototype and play with new ideas or even add modules for other people to use, ..._