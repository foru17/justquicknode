/**
 * Project:小蚁微信活动Node中间层服务
 * Author:luo.lei@xiaoyi.com
 */


'use strict'
// require('newrelic'); //参考newrelic官方说明
var express = require('express');
var http = require('http');
var path = require('path');
var compress = require('compression'); //压缩资源 放在顶部


var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var request = require('request');
var morgan = require('morgan'); //http请求日志用

var _ = require('underscore'); //引入underscore

// 基础配置
var i18n = require('i18n'); //国际化模块
// 初始Init
var app = express();
i18n.configure({
    locales: ['en-us', 'zh-cn', 'zh-tw'], // setup some locales - other locales default to en_US silently
    defaultLocale: 'zh-CN',
    directory: './i18n', // i18n 翻译文件目录，我的是 i18n， 可以写成其他的。
    updateFiles: false,
    objectNotation: true, //允许objcet
    indent: "\t",
    extension: '.js' // 由于 JSON 不允许注释，所以用 js 会方便一点，也可以写成其他的，不过文件格式是 JSON
        // setting of log level DEBUG - default to require('debug')('i18n:debug')
});


app.use(i18n.init); //载入国际化模块
app.use(compress()); // 启用Gizp压缩,放在顶部
app.use(morgan('dev')); //日志
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));
app.use(favicon(__dirname + '/public/favicon.ico'));

console.log(__dirname + '/public/favicon.ico');

app.set('views', path.join(__dirname, 'views')); //设置模板页面 本地测试
// app.set('views', path.join(__dirname, 'online/views')); //线上请使用CDN版本
app.set('view engine', 'ejs'); //载入ejs模板

app.set('port', process.env.PORT || 3132); //默认端口

/**
 * 统计进入www.xiaoyi.com/download
 * 通过 /?product={type} 的方式进行路由跳转
 * @param  {[type]}
 * @return {[type]}
 */
app.get("/", function(req, res) {
    var UA = req.headers['user-agent'];
    var _lang = !!req.headers["accept-language"] ? req.headers["accept-language"].split(',')[0].toLowerCase() : 'en-us'; //获取第一系统语言
    res.render('index');
});

// 启动端口
app.listen(app.get('port'), function() {
    console.log('服务器启动,端口: ' + app.get('port'));
})
