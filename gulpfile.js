/// <reference path="typings/node/node.d.ts"/>
/*jshint node: true */
/*global require */
'use strict';
//include gulp
var gulp = require('gulp');

// include plug-ins

var _ = require('lodash');
var $$ = require('gulp-load-plugins')();
var clean = require('gulp-clean');
var concat = require('gulp-concat');
var del = require('del');
var glob = require('glob');
var htmlreplace = require('gulp-html-replace');
var install = require('gulp-install');
var jscs = require('gulp-jscs');
var jshint = require('gulp-jshint');
var karma = require('gulp-karma');
var notifier = require('node-notifier');
var pagespeed = require('psi');
var path = require('path');
var plato = require('plato');
var plumber = require('gulp-plumber');
var rename = require('gulp-rename');
var request = require('request');
var requirejsOptimize = require('gulp-requirejs-optimize');
var robocopy = require('robocopy');
var stripDebug = require('gulp-strip-debug');
var todo = require('gulp-todo');
var uglify = require('gulp-uglify');

module.exports = gulp;

/*******************************************************************************
    PROJECT PATHS
*******************************************************************************/
var colors = $$.util.colors;
var dirs = {
  dev: {
    root: './src',
    //templates: './app/templates/**/*.html',
    //fonts: './app/styles/fonts/*',
    less: './src/styles/*.less',
    js: './src/scripts/app/*.js',
    libs: './src/scripts/libs/' //'./app/js/**/*.js',
  },
  dist: {
    root: './dist',
    css: './dist/css',
    js: './dist/scripts/app/js',
    fonts: './dist/fonts'

  }
};

/*******************************************************************************
    ERROR HANDLER FOR GULP PLUMBER
*******************************************************************************/
var onError = function (err) {
  console.log('An error occurred:', err.message);
  this.emit('end');
};

/*******************************************************************************
    INSTALL NPM I BOWER PACKAGES/DEPENDENCIES FOR PROJECT
*******************************************************************************/
gulp.task('install:all', function () {
  gulp.src(['./bower.json', './package.json'])
    .pipe(install());
});
/*******************************************************************************
    COPY TO SRC
*******************************************************************************/

var filesToMove = [
        './**/*.*'
        //'./icons/**/*.*',
        //'./src/page_action/**/*.*',
        //'./manifest.json'
    ];

gulp.task('copyto:src', function () {
  // the base option sets the relative root for the set of files,
  // preserving the folder structure
  gulp.src(filesToMove, {
      base: './'
    })
    .pipe(plumber({
      errorHandler: onError
    }))
    .pipe(gulp.dest('./src'));
});

/*******************************************************************************
    GENERATE TODO.md FILE FROM THE JAVASCRIPT TODOS AND FIXMES
*******************************************************************************/

gulp.task('todo', function () {
  gulp.src('./gulpfile.js')
    .pipe(todo())
    .pipe(gulp.dest('./')) //output todo.md as markdown
    .pipe($$.todo.reporter('json', {
      fileName: 'todo.json'
    }))
    .pipe(gulp.dest('./')); //output todo.json as json
});

/*******************************************************************************
    CREATE VISUALIZER REPORT
*******************************************************************************/
/**
 * Log a message or series of messages using chalk's blue color.
 * Can pass in a string, object or array.
 */
function log(msg) {
  if (typeof (msg) === 'object') {
    for (var item in msg) {
      if (msg.hasOwnProperty(item)) {
        $$.util.log(colors.blue(msg[item]));
      }
    }
  } else {
    $$.util.log(colors.blue(msg));
  }
}

/**
 * Show OS level notification using node-notifier
 */
function notify(options) {
  var notifyOptions = {
    sound: 'Bottle',
    contentImage: path.join(__dirname, 'gulp.png'),
    icon: path.join(__dirname, 'gulp.png')
  };
  _.assign(notifyOptions, options);
  notifier.notify(notifyOptions);
}

gulp.task('plato', function (done) {
  log('Analyzing source with Plato');
  log('Browse to /report/plato/index.html to see Plato results');

  startPlatoVisualizer(done);
  var msg = {
    title: 'Plato report done',
    subtitle: 'Deployed to report folder',
    message: 'Done `done`'
  };
  notify(msg);
});
/*******************************************************************************
    START PLATO INSPECTOR AND VISUALIZER
*******************************************************************************/

function startPlatoVisualizer(done) {
  log('Running Plato');

  var files = glob.sync(dirs.dev.js);
  var excludeFiles = /.*\.spec\.js/;

  var options = {
    title: 'Plato Inspections Report',
    exclude: excludeFiles
  };
  var outputDir = '/report/plato';

  plato.inspect(files, outputDir, options, platoCompleted);

  function platoCompleted(report) {
    var overview = plato.getOverviewReport(report);
    log(overview.summary);
    if (done) {
      done();
    }
  }
}

/*******************************************************************************
    LINT TASK
*******************************************************************************/
var jsFiles = [
  dirs.dev.js,
  '!test/**/*.js'
];

//longer & precise liniting
gulp.task('lint', function () {
  return gulp.src([
      jsFiles, '!**/*.min.js', '!node_modules/**',
      '!bower_components/**', '!build/**', '!dist/**'
    ])
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(jscs({
      'preset': 'google'
    }));
});

//shorter linting with stylish error reporting
gulp.task('jshint', function () {
  var stream = gulp.src(jsFiles)
    .on('error', function (err) {
      console.error('JSX ERROR in ' + err.fileName);
      console.error(err.message);
      this.end();
    })
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'));

  if (process.env.CI) {
    stream = stream.pipe(jshint.reporter('fail'));
  }

  return stream;
});

/*******************************************************************************
    HTML REPLACE ZA RELEASE
*******************************************************************************/
gulp.task('htmlreplace:release', function () {
  gulp.src('./src/index.html')
    .pipe(htmlreplace({
      //'css': 'styles.min.css',
      'js': 'scripts/main-built.js'
    }))
    .pipe(gulp.dest('dist'));
});

/*******************************************************************************
    HTML REPLACE ZA DEV
*******************************************************************************/

gulp.task('htmlreplace:dev', function () {
  gulp.src('./index.html')
    .pipe(htmlreplace({
      js: {
        src: [['scripts/libs/require.js', 'scripts/main']],
        tpl: '<script src="%s" data-main="%s"></script>'
      }
    }))
    .pipe(gulp.dest('dist'));
});

// Options is a single string htmlreplace({js: 'js/main.js'})

// Options is an array of strings htmlreplace({js: ['js/monster.js', 'js/hero.js']})

/*******************************************************************************
    BUILD TASK
*******************************************************************************/
gulp.task('build:rjs', function () {
  return gulp.src('./src/scripts/app/*.js')
    .pipe(plumber({
      errorHandler: onError
    }))
    .pipe(requirejsOptimize(function (file) {
      return {
        name: '../main',
        optimize: 'uglify2',
        useStrict: true,
        baseUrl: './src/scripts/app/',
        paths: {
          underscore: '../libs/underscore-min'
        },
        shim: {
          'underscore': {
            exports: '_'
          }
        },
        include: '../libs/require',
        exclude: [],
        out: 'main-built.js',
        insertRequire: ['../main']
      };
    }))
    .pipe(stripDebug())
    .pipe(gulp.dest('dist'));
});

/*******************************************************************************
    CLEAN SCRIPTS
*******************************************************************************/
gulp.task('clean:leftovers', [], function () {
  console.log('Clean all files in build folder');
  gulp.src(['./src/libs/require*.*', './src/libs/underscore*.*', './src/scripts/app/vm', 'scripts/main.js'])
    .pipe(clean());
});

/*******************************************************************************
    CONCAT & MINIFY
*******************************************************************************/

// Concatenate & Minify JS
gulp.task('build:otherjs', function () {
  gulp.src('.src/scripts/libs/*.js')
    .pipe(concat('all.js'))
    .pipe(gulp.dest('./dist'))
    .pipe(rename('all.min.js'))
    .pipe(uglify())
    .pipe(stripDebug())
    .pipe(gulp.dest('./dist'));
});
/*******************************************************************************
    DELETE FILES FROM FOLDERS FOR MOBILE WEB
*******************************************************************************/

gulp.task('clean:web', function () {
  del([
    './src/_build',
    './src/scripts/app/config_*.js',
    './src/App_Resources/',
    './src/obj/',
    './src/scripts/_references.js',
    './src/images/background-2048x2048.jpg',
    //'./src/scripts/main.js',
    //'./src/scripts/libs/',
    //'./src/scripts/app/vm/',
    //'./src/scripts/app/*.js',
    './src/cordova.android.js',
    './src/cordova.ios.js',
    './src/cordova.wp8.js',
    './src/*.config',
    './src/*.proj',
    './src/*.iceproj*',
    '!tmp/unicorn.js'
    ], function (err, paths) {
    console.log('Deleted files/folders:\n', paths.join('\n'));
    if (err !== null) {
      console.log('Delete failed:', err);
    }
  });
});

/*******************************************************************************
    DELETE FILES FROM FOLDERS FOR MOBILE APP
*******************************************************************************/

gulp.task('clean:mobile', function () {
  del([
    './src/_build',
    './src/scripts/app/config_*.js',
    './src/obj/',
    './src/scripts/_references.js',
    './src/*.config',
    './src/*.proj',
    './src/*.iceproj*',
    '!tmp/unicorn.js'
    ], function (err, paths) {
    console.log('Deleted files/folders:\n', paths.join('\n'));
    if (err !== null) {
      console.log('Delete failed:', err);
    }
  });
});

/*******************************************************************************
    COPY TO DIST
*******************************************************************************/

var filesToMove = [
        './**/*.*'
        //'./icons/**/*.*',
        //'./src/page_action/**/*.*',
        //'./manifest.json'
    ];
// TODO rewrite for GULP v4
gulp.task('copyto:dist', ['clean:leftovers'], function () {
  // the base option sets the relative root for the set of files,
  // preserving the folder structure
  gulp.src(filesToMove, {
      base: './src'
    })
    .pipe(gulp.dest('./dist'));
});

/*******************************************************************************
    DEPLOY TO SERVER
    https://github.com/mikeobrien/node-robocopy
*******************************************************************************/
gulp.task('deploy', function () {
  return robocopy({
      source: './dist',
      destination: '//',
      files: ['*.html', '*.htm', '*.js', '*.json', '*.png', '*.jpg', '*.jpeg', '*.gif', '*.css'],
      copy: {
        mirror: true //The mirror option allows you to synchronize your destination with your source folder, removing any deleted files.
      },
      file: {
        excludeFiles: ['packages.config'],
        excludeDirs: ['obj', '_build']
      },
      retry: { //The retry options allows you to retry the copy after so many seconds if it failed
        count: 2,
        wait: 3
      },
      logging: {
        // Writes the status output to the console window, as well as to the log file. [/tee]
        showAndLog: true | false
      }
    })
    .done(function (stdout) {
      console.log(stdout);
    })
    .fail(function (error) {
      console.log(error.message);
    });
});

/*******************************************************************************
    RUN KARMA UNIT TESTS WIP
*******************************************************************************/
// TODO make this work for cordova
gulp.task('test', function () {
  // Be sure to return the stream
  // NOTE: Using the fake './foobar' so as to run the files
  // listed in karma.conf.js INSTEAD of what was passed to
  // gulp.src !
  return gulp.src('./foobar')
    .pipe(karma({
      configFile: 'karma.conf.js',
      action: 'run'
    }))
    .on('error', function (err) {
      // Make sure failed tests cause gulp to exit non-zero
      console.log(err);
      this.emit('end'); //instead of erroring the stream, end it
    });
});

gulp.task('autotest', function () {
  return gulp.watch(['www/js/**/*.js', 'test/spec/*.js'], ['test']);
});

/*******************************************************************************
    SEO -> SEND A REQUEST TO GOOGLE AND BING & INFORM THEM TO RE-INDEX THE SITE
*******************************************************************************/

gulp.task('seo', function (cb) {
  request('http://www.google.com/webmasters/tools/ping?sitemap={URL TO YOUR SITEMAP.XML}');
  request('http://www.bing.com/webmaster/ping.aspx?siteMap={URL TO YOUR SITEMAP.XML}');
  cb();
});

/*******************************************************************************
    TEST SITE AVAILABILITY
*******************************************************************************/
gulp.task('test:sitestatus', function (error) {
  request('yoursite.com', function (error, response, body) {
    if (!error && response.statusCode === 200) {
      console.log(body); // Show the HTML for the page.
    }
  });
  console.log(error);
});

/*******************************************************************************
    RUN PAGESPEED INSIGHTS
*******************************************************************************/
gulp.task('pagespeed:mobile', function (cb) {
  // Update the below URL to the public URL of your site
  pagespeed.output('example.com', {
    strategy: 'mobile',
    // By default we use the PageSpeed Insights free (no API key) tier.
    // Use a Google Developer API key if you have one: http://goo.gl/RkN0vE
    // key: 'YOUR_API_KEY'
  }, cb);
});

gulp.task('pagespeed:desktop', function (cb) {
  // Update the below URL to the public URL of your site
  pagespeed.output('example.com', {
    strategy: 'desktop',
    //nokey: 'true'
    // By default we use the PageSpeed Insights free (no API key) tier.
    // Use a Google Developer API key if you have one: http://goo.gl/RkN0vE
    // key: 'YOUR_API_KEY'
  }, cb);
});

/*******************************************************************************
    DEFAULT TASKS
*******************************************************************************/

gulp.task('default', ['install:all'], function () {
  // place code for your default task here
});

// TODO rewrite for GULP v4
gulp.task('dev:web', [
 'plato',
 'jshint',
 'htmlreplace:dev'
]);

// TODO rewrite for GULP v4
gulp.task('release:dev', [
 'copyto:src',
 'jshint',
 'htmlreplace:release',
 'clean:web',
 'build:rjs',
 'copyto:dist'
]);

// TODO rewrite for GULP v4
gulp.task('release:mobile', [
 'copyto:src',
 'jshint',
 'htmlreplace:release',
 'clean:mobile',
 'build:rjs',
 'copyto:dist'
], function () {
  log('Building everything');

  var msg = {
    title: 'gulp build',
    subtitle: 'Deployed to the dist folder',
    message: 'Runing `gulp release:mobile`'
  };
  log(msg);
  notify(msg);
});
