# gulp-starter-kit
Starter kit for Javascript build automation using Gulp & Bower

## Requirements

- Install Node (64-bit version)
	- download [here](https://nodejs.org/download/) 
    - Read here for some [tips on Windows](https://github.com/npm/npm/wiki/Troubleshooting#upgrading-on-windows/)
- Install GitHub for Windows
	- download [here](https://github-windows.s3.amazonaws.com/GitHubSetup.exe)
	
## Quick Start
Clone this repo and install Gulp & Bower using these commands

syntax: ```git clone <repo> <directory>```
```
git clone https://github.com/jerkovicl/gulp-starter-kit/  C:\test
npm install gulp -g
npm install bower -g
npm install //install gulp dependencies
bower install //install bower dependencies
```
## Included files

- ***.abignore*** - Exclude Additional Files From Your Application Package (for AppBuilder project)
- ***.gitignore*** - specifies which files/folder should be ignore when doing git commits
- ***.gitattributes*** -  gives attributes to pathnames [detais](http://git-scm.com/docs/gitattributes)
- ***.npmignore*** -  file to keep stuff out of your package
- ***.editorconfig*** - Define and maintain consistent coding styles between different editors and IDEs.
- ***.jscs.json*** -  JS code style checker, used for enforcing coding style only using defined set of rules,  
                      works in combo with ***.jshintrc***
- ***.jshintrc*** - set of rules defined for linting JS files (protecting against syntax errors and browser bugs)
- ***.jshintignore*** - exclude some files from linting, usually .min.js files
- ***.jlintrc*** - alternative to ***.jshintrc*** file
- ***.csslintrc*** - set of rules defined for linting CSS files using CSSLint, rules [here](http://goo.gl/JJl4rP)
- ***.bowerrc*** - configuration file for Bower, more info [here](http://goo.gl/DQNPM5)
- ***bower.json*** - configuration file to define your project's dependencies
- ***package.json*** - file contains meta data about your app or module. Most importantly, it includes the list of dependencies to install from npm when running npm install
- ***gulpfile.js*** - file that tells Gulp it's tasks and what those tasks are and when to run them
- ***karma.conf.js*** - configuration file for Karma Test Runner

> All dotfiles can be placed at the root of your project or inside user's HOME directory 
