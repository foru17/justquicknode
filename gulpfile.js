/*
创建Gulp配置文件
 */

//引入 gulp

var gulp = require('gulp');

//引入功能组件

var compass = require('gulp-compass');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var del = require('del');
var jshint = require('gulp-jshint');

var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var header = require('gulp-header'); //文件头加banner


var autoprefixer = require('gulp-autoprefixer');
var minifycss = require('gulp-minify-css');
var rename = require('gulp-rename');

// 发布缓存
var RevAll = require('gulp-rev-all');
var revReplace = require('gulp-rev-replace'); //这个可用
var qiniu = require('gulp-qiniu'); //上传到七牛
var qiniuConfig = require('./qiniuconfig.js');


// 图像处理

// var imagemin = require('gulp-imagemin'); //十分大
//var pngquant = require('imagemin-pngquant');
// var spritesmith = require('gulp.spritesmith');
// var imageResize = require('gulp-image-resize');


// 错误处理
var plumber = require("gulp-plumber");
var stylish = require("jshint-stylish");

//开发辅助依赖
var nodemon = require('gulp-nodemon') //node watch
var chalk = require('chalk');

// 设置相关路径
var paths = {
    assets: 'public/assets',
    sass: 'dev/css/sass/**/*',
    css: 'dev/css',
    js: 'dev/js/**/*', //js文件相关目录
    img: 'dev/img/**/*', //图片相关
};

// 文件头
var pkg = require('./package.json');
var banner = ['/**',
    ' * Hello World',
    ' * Updated Time: ' + new Date(),
    ' * ' + pkg.name + ' - ' + pkg.description,
    ' * @author: ' + pkg.author,
    ' * @version: v' + pkg.version,
    ' * @link: ' + pkg.url,
    ' * @license: ' + pkg.license,
    ' */',
    ''
].join('\n');


gulp.task('clean', function(cb) {
    del(['build'], cb);
});

// 图片精灵处理
gulp.task('sprite', function() {
    var spriteData = gulp.src('dev/img/sprite/*.png').pipe(spritesmith({
        imgName: 'sprite@2x.png',
        cssName: '_sprite.scss',
        algorithm: 'alt-diagonal'
    }));
    spriteData.img.pipe(gulp.dest('dev/img/')); // 输出合成图片
    spriteData.css.pipe(gulp.dest('dev/css/sass/')); // 输出的CSS
    // spriteData.pipe(gulp.dest('path/to/output/'));
});


// Sass 处理
gulp.task('sass', function() {
    gulp.src(paths.sass)
        .pipe(plumber())
        .pipe(sourcemaps.init())
        .pipe(sass())
        .pipe(gulp.dest(paths.css))
        .pipe(concat('style.css'))
        .pipe(gulp.dest(paths.css))
        .pipe(minifycss())
        .pipe(sourcemaps.write({
            sourceRoot: 'dev/css/sass'
        }))
        .pipe(rename('dev.min.css'))
        .pipe(header(banner))
        .pipe(gulp.dest('public/assets/css'));

    gulp.src(paths.sass)
        .pipe(plumber())
        .pipe(sass())
        .pipe(gulp.dest(paths.css))
        .pipe(concat('style.css'))
        .pipe(gulp.dest(paths.css))
        .pipe(minifycss())
        .pipe(rename('all.min.css'))
        .pipe(header(banner))
        .pipe(gulp.dest('public/assets/css'));

});




// JS检查
gulp.task('lint', function() {
    return gulp.src(paths.js)
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});


gulp.task('scripts', ['clean'], function() {
    // Minify and copy all JavaScript (except vendor scripts)
    // with sourcemaps all the way down
    gulp.src(paths.js)
        .pipe(plumber())
        .pipe(sourcemaps.init())
        .pipe(jshint())
        .pipe(jshint.reporter(stylish))
        .pipe(uglify())
        .pipe(concat('all.min.js'))
        .pipe(header(banner))
        .pipe(gulp.dest('public/assets/js'))
        .pipe(rename('dev.min.js'))
        .pipe(sourcemaps.write())
        .pipe(header(banner))
        .pipe(gulp.dest('public/assets/js'));

});



// 处理图像
gulp.task('image', function() {
    return gulp.src(paths.img)
        .pipe(imagemin({
            progressive: true,
            svgoPlugins: [{
                removeViewBox: false
            }],
            use: [pngquant()]
        }))
        .pipe(gulp.dest('public/assets/images'));
});


gulp.task('dev', function() {
        console.log( pkg.description);
    nodemon({
        script: 'index.js',
        ext: 'js html',
        ignore: ['dev/*', 'public/*']
    }).on('restart', function(changedFiles) {
        changedFiles.forEach(function(file) {
            console.log(chalk.red('[File Changed]') + chalk.green(file));
        })
        console.log(chalk.green('[nodemon] 服务重新启动'));
    })
})

// 发布
gulp.task('revall', function() {
    del(['build'], function() {
        console.log(chalk.red('[清理] 删除旧有build'));
    });
    var revAll = new RevAll({
        // prefix: 'http://7xjf0o.com2.z0.glb.qiniucdn.com/',
        dontRenameFile: [/^\/favicon.ico$/g]
    });
    return gulp.src(['public/**'])
        .pipe(revAll.revision())
        .pipe(gulp.dest('build/'))
        .pipe(revAll.manifestFile())
        .pipe(gulp.dest('build/assets'))
        .pipe(revAll.versionFile())
        .pipe(gulp.dest('build/assets'));

});


// 发布build之后的assets静态资源到七牛CDN
gulp.task('cdn', function() {
    console.log(chalk.red('[CDN]') + chalk.green(' [七牛] ') + chalk.green(qiniuConfig.Bucket_Name));
    gulp.src('./build/assets/**')
        .pipe(qiniu({
            accessKey: qiniuConfig.ACCESS_KEY,
            secretKey: qiniuConfig.SECRET_KEY,
            bucket: qiniuConfig.Bucket_Name,
            private: false
        }, {
            dir: pkg.name + '/assets/',
            versionFile: './cdn.json'
        }))
});

// 更新ejs模板中的url路劲
gulp.task('indexmap', function() {
    del(['online/views'], function() {
        console.log(chalk.red('[清理] 删除旧有Views'));
    });
    var manifest = gulp.src("./build/assets/rev-manifest.json");
    return gulp.src("views/**/*.ejs") // Minify any CSS sources
        .pipe(rename({
            extname: '.html'
        }))
        .pipe(revReplace({
            manifest: manifest,
            prefix: qiniuConfig.Domain + pkg.name + '/'
        }))
        .pipe(rename({
            extname: '.ejs'
        }))
        .pipe(gulp.dest('online/views'))

    del(['views/*.html']);

});


gulp.task('watch', function() {
    gulp.watch(paths.js, ['scripts']);
    gulp.watch(paths.sass, ['sass']);
});

gulp.task('default', ['watch', 'scripts']);
gulp.task('watch:base', ['watch']);
gulp.task('release:cdn', ['revall', 'cdn', 'indexmap']);
