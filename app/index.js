'use strict';
var yeoman = require('yeoman-generator'),
    fs = require('fs'),
    util = require('util'),
    path = require('path'),
    yosay = require('yosay'),
    chalk = require('chalk'),
    shell = require('shelljs');

var smacssGenerator = yeoman.generators.Base.extend({
    constructor: function () {
        // note: arguments and options should be defined in the constructor.
        yeoman.generators.Base.apply(this, arguments);

        this.option('app-suffix', {
            desc: 'Allow a custom suffix to be added to the module name',
            type: String,
            required: 'false'
        });
        this.env.options['app-suffix'] = this.options['app-suffix'];

        this.option('skip-welcome-message', {
            desc: 'Skips the welcome message',
            type: Boolean
        });

        this.option('skip-install', {
            desc: 'Skips the installation of dependencies',
            type: Boolean
        });

        this.option('skip-install-message', {
            desc: 'Skips the message after the installation of dependencies',
            type: Boolean
        });

        // This method adds support for a `--coffee` flag
        this.option('coffee');
        // And you can then access it later on this way; e.g.
        this.scriptSuffix = (this.options.coffee ? ".coffee": ".js");
    },
});

smacssGenerator.prototype.initializing = function initializing() {
    this.pkg = require('../package.json');
};

smacssGenerator.prototype.welcome = function welcome() {
    if (!this.options['skip-welcome-message']) {
        this.log(yosay('Yo! Welcome to SMACSS'));
        this.log(chalk.magenta.bold('You\'re using the perfectionist generator for frontend.'));
        this.log(chalk.gray('================================================================'));
        this.log(chalk.gray('Answer simple questions to kick start your project'));
    }
};

smacssGenerator.prototype.askAppType = function askAppType() {
    var done = this.async();

    var prompts = [{
        name: 'appName',
        message: 'What would you like to name your app/site?',
        default: process.cwd().split(path.sep).pop()
        },{
        name: 'appType',
        message: 'Kind of app/site you are trying to build?',
        type: 'list',
        choices:[{
            name: 'Simple Web App',
            value: 'typeSimpleWebApp',
            checked: false
        },{
            name: 'Full Pack Web App',
            value: 'typeFullPackWebApp',
            checked: false
        },{
            name: 'Angular App',
            value: 'typeAngularApp',
            checked: false
        }],
        default: 1
    }];
    this.prompt(prompts, function (answers) {
        var type = answers.type;

        this.appName = this._.camelize(this._.slugify(this._.humanize(answers.appName)));
        this.appType = answers.appType;

        done();
    }.bind(this));
};

smacssGenerator.prototype.askAppFeatures = function askAppFeatures() {
    if(this.appType === 'typeFullPackWebApp' || this.appType === 'typeAngularApp') {
        var done = this.async();
        var prompts = [{
            name: 'appFeatures',
            message: 'How about some additional features',
            type: 'checkbox',
            choices:[{
                name: ' jQuery',
                value: 'includeQuery',
                checked: true
            },{
                name: ' Modernizr',
                value: 'includeModernizr',
                checked: false
            }]
        }];
        this.prompt(prompts, function (answers) {
            var appFeatures = answers.appFeatures;

            var hasFeature = function (feat) {
                return appFeatures.indexOf(feat) !== -1;
            };

            this.includeQuery = hasFeature('includeQuery');
            this.includeModernizr = hasFeature('includeModernizr');

            done();
        }.bind(this));
    }
};

smacssGenerator.prototype.askAngularModules = function askAngularModules() {
    if(this.appType === 'typeAngularApp') {
        var done = this.async();
        var prompts = [{
            name: 'angularModules',
            message: 'How about including some angular modules',
            type: 'checkbox',
            choices:[{
                name: ' Angular Route',
                value: 'includeRouteModule',
                checked: true
            },{
                name: ' Angular Resource',
                value: 'includeResourceModule',
                checked: false
            },{
                name: ' Angular Sanitize',
                value: 'includeSanitizeModule',
                checked: false
            },{
                name: ' Angular Animate',
                value: 'includeAnimateModule',
                checked: false
            }]
        }];
        this.prompt(prompts, function (answers) {

            var hasModule = function (mod) {
                return answers.angularModules.indexOf(mod) !== -1;
            };

            this.includeRouteModule = hasModule('includeRouteModule');
            this.includeResourceModule = hasModule('includeResourceModule');
            this.includeSanitizeModule = hasModule('includeSanitizeModule');
            this.includeAnimateModule = hasModule('includeAnimateModule');

            var angMods = [];

            if (this.includeRouteModule) {
              angMods.push("'ngRoute'");
            }
            if (this.includeResourceModule) {
              angMods.push("'ngResource'");
            }
            if (this.includeSanitizeModule) {
              angMods.push("'ngSanitize'");
            }
            if (this.includeAnimateModule) {
              angMods.push("'ngAnimate'");
            }

            if (angMods.length) {
              this.env.options.angularDeps = '\n    ' + angMods.join(',\n    ') + '\n  ';
            }

            done();
        }.bind(this));
    }
};

smacssGenerator.prototype.scaffoldFolders = function scaffoldFolders() {
    this.log(chalk.gray('================================================================'));
    this.log(chalk.gray('Creating the project structure'));

    // Common Scaffolding for all projets
    this.mkdir(this.appName + '/app');
    this.mkdir(this.appName + '/app/css');
    this.mkdir(this.appName + '/app/scss');
    this.mkdir(this.appName + '/app/js');
    this.mkdir(this.appName + '/app/images');
    this.mkdir(this.appName + '/app/fonts');

    if(this.appType === 'typeFullPackWebApp' || this.appType === 'typeAngularApp') {
        this.mkdir(this.appName + '/app/partials');
        this.mkdir(this.appName + '/build');
    }
};

smacssGenerator.prototype.copyMainFiles = function copyMainFiles() {
    // Underscore templating context to replace placeholders
    smacssGenerator.context = {
        site_name: this.appName,
    };

    // HTML
    if(this.appType === 'typeSimpleWebApp') {
        this.template("simple-web-app/_index.html", this.appName + "/app/index.html", smacssGenerator.context);
    }
    else if(this.appType === 'typeFullPackWebApp') {
        this.template("full-pack-web-app/_index.html", this.appName + "/app/index.html", smacssGenerator.context);
    }
    else if(this.appType === 'typeAngularApp') {
        this.template("angular-app/_index.html", this.appName + "/app/index.html", smacssGenerator.context);
    }

    // Partial File Include
    if(this.appType === 'typeFullPackWebApp' || this.appType === 'typeAngularApp') {
        this.template("partials/_header.html", this.appName + "/app/partials/_header.html", smacssGenerator.context);
        this.template("partials/_footer.html", this.appName + "/app/partials/_footer.html", smacssGenerator.context);
    }

    // CSS
    this.copy("_master.css", this.appName + "/app/css/master.css");

    // SMACSS - SCSS Structure
    // TODO: Update structure based on ticket #7
    this.copy("scss/_master.scss", this.appName + "/app/scss/master.scss");
    this.copy("scss/_base.scss", this.appName + "/app/scss/base.scss");
    this.copy("scss/_layout.scss", this.appName + "/app/scss/layout.scss");
    this.copy("scss/_reset.scss", this.appName + "/app/scss/reset.scss");
    this.copy("scss/_variables.scss", this.appName + "/app/scss/variables.scss");
    this.copy("scss/_mixins.scss", this.appName + "/app/scss/mixins.scss");
    this.copy("scss/_module.scss", this.appName + "/app/scss/modules/module.scss");
    this.copy("scss/_page_landing.scss", this.appName + "/app/scss/pages/page-landing.scss");

    // JS
    // TODO: Add JS Structure
    this.copy("js/_application.js", this.appName + "/app/js/application.js");
};

smacssGenerator.prototype.projectfiles = function projectfiles() {
    if(this.appType == 'typeSimpleWebApp') {
        this.template("simple-web-app/_gulpfile.js", this.appName + "/gulpfile.js", smacssGenerator.context);
        this.template("simple-web-app/_package.json", this.appName + "/package.json", smacssGenerator.context);
    }
    else {
        this.template("_gulpfile.js", this.appName + "/gulpfile.js", smacssGenerator.context);
        this.template("_package.json", this.appName + "/package.json", smacssGenerator.context);
        this.template("root/_jshintrc", this.appName + "/.jshintrc", smacssGenerator.context);
    }

    // Root Files
    this.copy("root/_gitignore", this.appName + "/.gitignore");
    this.copy("root/_gitattributes", this.appName + "/.gitattributes");
    this.copy("root/_robots.txt", this.appName + "/robots.txt");
    this.copy("root/_favicon.ico", this.appName + "/app/favicon.ico");
};

smacssGenerator.prototype.injectDependencies = function injectDependencies() {
    // Bower is supported only in full & angular app types
    if(this.appType === 'typeFullPackWebApp' || this.appType === 'typeAngularApp') {
        var bower = {
            name: this.appName,
            private: true,
            dependencies: {}
        };
        this.copy('root/_bowerrc', this.appName + '/.bowerrc');

        if(this.appType === 'typeFullPackWebApp') {
            this.template('root/_full_pack_bower.json', this.appName + '/bower.json');
        }
        else {
            this.template('root/_angular_bower.json', this.appName + '/bower.json');
        }
    }
};

smacssGenerator.prototype.install = function install() {
    // Installation context object
    var installContext = {};
    installContext.appPath = process.cwd() + "/"+ this.appName;

    // Assign context based on app types
    if(this.appType === 'typeSimpleWebApp') {
        installContext.helpCommand = 'npm install';
        installContext.includeNpm = true;
        installContext.includeBower = false;
    }
    else {
        installContext.helpCommand = 'npm install & bower install';
        installContext.includeNpm = true;
        installContext.includeBower = true;
    }

    // activating app directory for installation
    process.chdir(installContext.appPath);

    // Skip Install
    if (this.options['skip-install']) {
        this.log(chalk.gray('================================================================'));
        this.log(chalk.gray('Follow the instructions below'));

        if(this.appType === 'typeSimpleWebApp') {
            this.log(
              'Next Steps:' +
              '\n1) Now '+ chalk.yellow.bold('cd '+ this.appName +'') + ' into your project folder' +
              '\n2) Install dependencies by typing '+ chalk.yellow.bold(installContext.helpCommand) +
              '\n3) Run the server using: ' + chalk.yellow.bold('gulp')
            )
        }
        else if(this.appType === 'typeFullPackWebApp' || this.appType === 'typeAngularApp') {
            this.log(
              'Next Steps:' +
              '\n1) Now '+ chalk.yellow.bold('cd '+ this.appName +'') + ' into your project folder' +
              '\n2) Install dependencies by typing '+ chalk.yellow.bold(installContext.helpCommand) +
              '\n3) Run the server using: ' + chalk.yellow.bold('gulp')
            );
        }
    }
    else {
        this.log(chalk.gray('================================================================'));
        this.log(chalk.gray('Installing Dependencies, please wait...'));

        this.on('end', function () {
            this.installDependencies({
                bower: installContext.includeBower,
                npm: installContext.includeNpm,
                callback: function () {
                    this.emit('dependenciesInstalled');
                }.bind(this)
            });
        });

        this.on('dependenciesInstalled', function() {
            this.log(chalk.gray('================================================================'));
            this.log(chalk.gray('Dependencies Installed, please wait we start the server...'));

            shell.cd(installContext.appPath);
            shell.exec('gulp'); // trigger the server using gulp command
        });
    }
};

smacssGenerator.prototype.helper = function helper() {
    //this.log('App Helper functions and methods');
};

smacssGenerator.prototype.errorHanding = function errorHanding() {
    //this.log('Something has gone wrong! Handle errors in this section');
};

smacssGenerator.prototype.paths = function paths() {
    //this.log('Path Handling');
};

module.exports = smacssGenerator;
