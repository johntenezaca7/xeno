const { series, parallel, src, dest, watch, gulp } = require("gulp");
const webpackStream = require("webpack-stream");
const webpackConfig = require("./webpack.config");
const cssbeautify = require('gulp-cssbeautify');
const cleanCSS = require('gulp-clean-css');
const uglify = require("gulp-uglify");
const sass = require("gulp-sass");
const exec = require('gulp-exec');
const environments = require('gulp-environments');
const named = require('vinyl-named');
const browserSync = require('browser-sync').create();
const markdownToJSON = require('gulp-markdown-to-json');
const marked = require('marked');
const jsonFormat = require('gulp-json-format');
marked.setOptions({
  smartypants: true,
  gfm: true
});

const _CONFIG = require("./config");

const development = environments.development;
const production = environments.production;

const TARGET_TS_FILE = `${_CONFIG.jsFile}.ts`;
const TARGET_SCSS_FILE = `${_CONFIG.scssFile}.scss`;

const TARGET_JS_FILE = `${_CONFIG.jsFile}.js`;
const TARGET_CSS_FILE = `${_CONFIG.scssFile}.css`;

const _APP_FOLDER_NAME_ = _CONFIG.app;
const _USER_ = _CONFIG.user;

function browsersync() {
  browserSync.init({
    proxy: "http://127.0.0.1:8080/"
  });
}

// File Path Variables
const files = {
  source: {
    scss: `./src/scss/templates/${TARGET_SCSS_FILE}`,
    ts: `./src/typescript/packages/${TARGET_TS_FILE}`,
    mkdwn:"./src/markdown/**.md"
  },
  dev: {
    css: `./dist/css/`,
    js: `./dist/js/`,
  },
  dist: {
    css: `./dist/css/${TARGET_CSS_FILE}`,
    js: `./dist/js/${TARGET_JS_FILE}`,
    json: "./src/json/"
  },
  public: {
    css: `./public/css/${TARGET_CSS_FILE}`,
    js: `./public/js/${TARGET_JS_FILE}`,
  },
  watch: {
    scss: "./src/scss/**/*.scss",
    ts: "./src/typescript/**/*.ts",
    html: `../Core/${_APP_FOLDER_NAME_}/public/**`
  }, 
  app: {
    jsDest: `../Core/${_APP_FOLDER_NAME_}/public/assets/js/`,
    cssDest: `../Core/${_APP_FOLDER_NAME_}/public/assets/css/`
  }
}

// Compile Markdown to JSON
function mrkdwnJSONTask() {
  return src(files.source.mkdwn)
    .pipe(markdownToJSON(marked))
    .pipe(jsonFormat(2))
    .pipe( dest(files.dist.json) );
}

// Pipe JS Prod file  
function G_PIPE_JS_PROD() {
  return src( files.public.js )
    .pipe( dest(files.app.jsDest));
}

function G_PIPE_CSS_PROD() {
  return src( files.public.css )
    .pipe( dest(files.app.cssDest));
}

// Pipe JS Dev files  
function G_PIPE_JS_DEV() {
  console.log('files.app.jsDest:', files.app.jsDest)
  return src( files.dist.js )
    .pipe(dest(files.app.jsDest));
}

function G_PIPE_CSS_DEV() {
  return src( files.dist.css )
    .pipe(dest(files.app.cssDest));
}


// Sass Task
function scssTask() {
  let CSS_ENV;
  let ENV_FILE = production() ? CSS_ENV="PROD" : CSS_ENV="DEV" ;
  return src( files.source.scss )
    .pipe( sass())
    .pipe( development(
      cssbeautify({
        indent: ' ',
        openbrace: 'end-of-line',
        autosemicolon: true
      })
    ))
    .pipe( production(cleanCSS()))
    .pipe( development( dest( files.dev.css ) ))
    .pipe( production( dest( files.public.css ) ))
    .pipe( exec("npm run pipe-dev-css"));
}

// TS Task 
function tsTask() {
  let JS_ENV;
  let ENV_FILE = production() ? JS_ENV="PROD" : JS_ENV="DEV" ;
  production() ? webpackConfig.mode = "production" : webpackConfig.mode = "development";
  return src( files.source.ts )
    .pipe( named())
    .pipe( webpackStream( webpackConfig ))
    .pipe( production(uglify()))
    .pipe( development( dest( files.dev.js ) ))
    .pipe( production( dest( files.public.js ) ))
    .pipe( exec("npm run pipe-dev-js"));
}

// Watch Task
function watchTask() {
  // Init browser-sync
  browsersync();
  // Watch files
  watch( [ files.watch.scss, files.watch.ts, files.watch.html ] ,
    parallel( scssTask, tsTask )).on('change', browserSync.reload);
}

function watchTs() {
  watch( [ files.watch.ts ] ,
    parallel( tsTask )
  ).on('change', browserSync.reload);
}

function watchScss() {
  watch( [ files.watch.scss ] ,
    parallel( scssTask )
  ).on('change', browserSync.reload);
}

function watchMkdwn() {
  watch([ files.source.mkdwn ], 
    parallel( mrkdwnJSONTask )
  ).on('change', browserSync.reload);
}

const _MKDWNJSON = series(
  series( mrkdwnJSONTask ),
  watchMkdwn
);

const DEV_TS = series(
  series( tsTask ) ,
  watchTs
)
const DEV_SCSS = series(
  series( scssTask ) ,
  watchScss
)

const PROD_TS = series(tsTask);
const PROD_SCSS = series(scssTask);

// PIPE PROD FILES
const PIPE_JS_PROD = series(G_PIPE_JS_PROD);
const PIPE_CSS_PROD = series(G_PIPE_CSS_PROD);

// PIPE DEV FILES
const PIPE_JS_DEV = series(G_PIPE_JS_DEV);
const PIPE_CSS_DEV = series(G_PIPE_CSS_DEV);

const defaultTasks = series(
  parallel( tsTask,scssTask ), 
  watchTask
);

// DEV
exports._DEV_TS = DEV_TS;
exports._DEV_SCSS = DEV_SCSS;
// PROD
exports._PROD_TS = PROD_TS;
exports._PROD_SCSS = PROD_SCSS;

// PIPE TO CORE APP
exports._JS_PIPE_DEV = PIPE_JS_DEV;
exports._CSS_PIPE_DEV = PIPE_CSS_DEV;

exports._JS_PIPE_PROD = PIPE_JS_PROD;
exports._CSS_PIPE_PROD = PIPE_CSS_PROD;

exports._MKDWNJSON = _MKDWNJSON;
exports.default = defaultTasks;