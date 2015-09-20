var gulp = require('gulp');
var babel = require('gulp-babel');

var browserify = require('browserify');
var source = require('vinyl-source-stream');

var del = require('del');


var paths = {
  scripts: ['public/javascripts/*.js']
}

gulp.task('clean', function(cb) {
  del(['public/build'], cb);
});

gulp.task('scripts', function() {
  return gulp.src(paths.scripts)
             .pipe(babel())
             .pipe(gulp.dest('public/build'));
});

gulp.task('browserify', function() {
  return browserify('./public/build/app.js')
         .bundle()
         .pipe(source('bundle.js'))
         .pipe(gulp.dest('./public/build/'))
});


gulp.task('watch', function() {
  gulp.watch(paths.scripts, ['scripts']);
});

gulp.task('default', ['watch', 'scripts', 'browserify']);
