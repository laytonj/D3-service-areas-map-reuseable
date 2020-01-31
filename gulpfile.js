const {src, dest, series, parallel} = require('gulp');
const del = require('del');
const watch = require('gulp-watch');
const browserSync = require('browser-sync').create();
const babel = require('gulp-babel');
const concatenate = require('gulp-concat');
const uglify = require('gulp-uglify');
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');


const origin = 'src';
const destination = 'build';

//HTML
function html(cb) {
  src(`${origin}/**/*.html`).pipe(dest(destination));
  cb();
}

//CSS
function scss(cb) {
  src([
    `${origin}/scss/serviceAreasMap.scss`
  ])
  .pipe(sass({
    outputStyle: 'compressed'
  }))
  .pipe(autoprefixer())
  .pipe(dest(`${destination}/css`));

  cb();
}

//JS
function js(cb) {
  src([
    `${origin}/js/config.js`,
    `${origin}/js/serviceAreasMap.js`
  ])
  .pipe(babel({
    presets: ['@babel/env']
  }))
  .pipe(concatenate('serviceAreasMap.js'))
  .pipe(uglify())
  .pipe(dest(`${destination}/js`));

  src(`${origin}/js/d3-composite-projections.min.js`).pipe(dest(`${destination}/js`));

  cb();
}

//JSON
function json(cb) {
  src(`${origin}/geo_data/**/*.json`).pipe(dest(`${destination}/geo_data`));
  cb();
}

//DELETE BUILD FOLDER
async function clean(cb) {
  await del(destination);
  cb();
}

//LAUNCH A SERVER
function server(cb) {
  browserSync.init({
    server: {
      baseDir: destination
    }
  });
  cb();
}

//BROWSER REFRESH
function watcher(cb) {
  watch(`${origin}/**/*.html`).on('change', series(html, browserSync.reload));
  watch(`${origin}/**/*.scss`).on('change', series(scss, browserSync.reload));
  watch(`${origin}/**/*.js`).on('change', series(js, browserSync.reload));
  watch(`${origin}/**/*.json`).on('change', series(json, browserSync.reload));
  cb();
}

exports.clean = clean;
exports.default = series(clean, parallel(html, scss, js, json), server, watcher);
