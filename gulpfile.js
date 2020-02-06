const {src, dest, series, parallel} = require('gulp');
const del = require('del');
const watch = require('gulp-watch');
const browserSync = require('browser-sync').create();
const babel = require('gulp-babel');
const concatenate = require('gulp-concat');
const uglify = require('gulp-uglify');
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const replace = require('gulp-replace');


const origin = 'src';
const destination = 'build';

//HTML

function html(cb) {
  src(`${origin}/**/*.html`).pipe(dest(destination));
  cb();
}

function html_dev(cb) {
  src(`${origin}/**/*.html`)
    .pipe(replace("css/serviceAreasMap.css", "https://dev2015.lsc.gov/programprofilemap/budget-request-map/css/serviceAreasMap.css"))
    .pipe(replace("js/d3-composite-projections.min.js", "https://dev2015.lsc.gov/programprofilemap/budget-request-map/js/d3-composite-projections.min.js"))
    .pipe(replace("js/serviceAreasMap.js", "https://dev2015.lsc.gov/programprofilemap/budget-request-map/js/serviceAreasMap.js"))
    .pipe(dest(destination));

  cb();
}

function html_prod(cb) {
  src(`${origin}/**/*.html`)
    .pipe(replace("css/serviceAreasMap.css", "https://www.lsc.gov/programprofilemap/css/serviceAreasMap.css"))
    .pipe(replace("js/d3-composite-projections.min.js", "https://www.lsc.gov/programprofilemap/js/d3-composite-projections.min.js"))
    .pipe(replace("js/serviceAreasMap.js", "https://www.lsc.gov/programprofilemap/js/serviceAreasMap.js"))
    .pipe(dest(destination));

  cb();
}


//CSS & SCSS
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

function js_dev(cb) {
  src([
    `${origin}/js/config.js`,
    `${origin}/js/serviceAreasMap.js`
  ])
  .pipe(babel({
    presets: ['@babel/env']
  }))
  .pipe(concatenate('serviceAreasMap.js'))
  .pipe(uglify())
  .pipe(replace("geo_data/service_areas_topojson_2020_01_16.json", "https://dev2015.lsc.gov/programprofilemap/budget-request-map/geo_data/service_areas_topojson_2020_01_16.json"))
  .pipe(replace("geo_data/mapAreasData_keyed.json", "https://dev2015.lsc.gov/programprofilemap/budget-request-map/geo_data/mapAreasData_keyed.json"))
  .pipe(dest(`${destination}/js`));

  src(`${origin}/js/d3-composite-projections.min.js`).pipe(dest(`${destination}/js`));

  cb();
}

function js_prod(cb) {
  src([
    `${origin}/js/config.js`,
    `${origin}/js/serviceAreasMap.js`
  ])
  .pipe(babel({
    presets: ['@babel/env']
  }))
  .pipe(concatenate('serviceAreasMap.js'))
  .pipe(uglify())
  .pipe(replace("geo_data/service_areas_topojson_2020_01_16.json", "https://www.lsc.gov/programprofilemap/geo_data/service_areas_topojson_2020_01_16.json"))
  .pipe(replace("geo_data/mapAreasData_keyed.json", "https://www.lsc.gov/programprofilemap/geo_data/mapAreasData_keyed.json"))
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
exports.publish_dev = series(clean, parallel(html_dev, scss, js_dev, json));
exports.publish_prod = series(clean, parallel(html_prod, scss, js_prod, json));
