/*jslint node: true */
/*global require */
'use strict';
//include gulp
var gulp = require('gulp');

// include plug-ins
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var del = require('del');
var clean = require('gulp-clean');
var robocopy = require('robocopy');
var htmlreplace = require('gulp-html-replace');
var jshint = require('gulp-jshint');
var jscs = require('gulp-jscs');
var karma = require('gulp-karma');
var requirejsOptimize = require('gulp-requirejs-optimize');
var $$ = require('gulp-load-plugins')();
module.exports = gulp;

/*******************************************************************************
    PROJECT PATHS
*******************************************************************************/
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
    .pipe(gulp.dest('./src'));
});

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
      'analytics': 'scripts/app/analytics_release.js',
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
      'analytics': 'scripts/app/analytics_debug.js',
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
    DEFAULT TASKS
*******************************************************************************/

gulp.task('default', function () {
  // place code for your default task here
});

gulp.task('dev:web', [
 'jshint',
 'htmlreplace:dev'
]);

gulp.task('release:dev', [
 'copyto:src',
 'jshint',
 'htmlreplace:release',
 'clean:web',
 'build:rjs',
 'copyto:dist'
]);

gulp.task('release:mobile', [
 'copyto:src',
 'jshint',
 'htmlreplace:release',
 'clean:mobile',
 'build:rjs',
 'copyto:dist'
]);
