/**
 * Created by shawn on 5/19/16.
 */
'use strict';
​
import path from 'path';
import gulp from 'gulp';
import sass from 'gulp-sass';
import rename from 'gulp-rename';
​
const scssFiles = [
    path.join(__dirname, 'client/scss/silverstripe-portal.scss')
];
​
gulp.task('scss', function () {
    return gulp.src(scssFiles)
        .pipe(sass.sync({outputStyle: 'compressed'}).on('error', sass.logError))
        .pipe(rename({extname: '.min.css'}))
        .pipe(gulp.dest('./client/dist'));
});
​
gulp.task('scss:w', function () {
    gulp.watch('./client/scss/partials/*.scss', ['scss']);
});
​
​
gulp.task('default', ['scss']);