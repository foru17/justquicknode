/**
 * Project:小蚁微信活动Node中间层服务
 * Author:luo.lei@xiaoyi.com
 */

// require('newrelic');
'use strict'
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


// 初始Init
var app = express();
app.use(compress()); // 启用Gizp压缩,放在顶部
app.use(morgan('dev')); //日志
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(favicon(__dirname + '/public/favicon.ico'));

app.set('views', path.join(__dirname, 'views')); //设置模板页面
app.set('view engine', 'ejs'); //载入ejs模板

app.set('port', process.env.PORT || 3133); //默认端口

app.listen(app.get('port'), function() {
    console.log('服务器启动,端口: ' + app.get('port'));
})

app.get("/", function(req, res) {
    res.render("index");
});
app.get("/demo", function(req, res) {
    res.send("Hello Yi");
});
