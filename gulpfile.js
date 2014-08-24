var gulp = require('gulp');
var less = require('gulp-less');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var ngmin = require('gulp-ngmin');
var rev = require('gulp-rev');

gulp.task('less', function(){
    return gulp.src('static/css/app.less', 'static/css/*.less')
        .pipe(less())
        .pipe(concat('app.css'))
        .pipe(gulp.dest('static/dist'));
});


gulp.task('rev', ['less', 'js'], function(){
    return gulp.src(['statis/dist/*.css', 'static/dist/*.js'])
                //.pipe(rev())
                .pipe(gulp.dest('static/dist'))
                //.pipe(rev.manifest())
                //.pipe(gulp.dest('dist'));
});

gulp.task('watch', ['less', 'js'], function(){
    gulp.watch('static/css/*.less',['less']);
    gulp.watch('static/js/*.js',['js']);
});

gulp.task('js', function(){
    gulp.src(['static/js/*.js'])
        .pipe(concat('app.js'))
        .pipe(ngmin())
        .pipe(uglify()) 
        .pipe(gulp.dest('static/dist'))
});

