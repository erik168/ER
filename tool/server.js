/*
 * 可用于启动一个简单的测试server
 * 使用NodeJs
 * 
 * @author errorrik
 */

// 导入依赖模块
var http = require( 'http' );
var fs   = require( 'fs' );
var url  = require( 'url' );

// ER目录根
var documentRoot = __dirname + '/..';

// Content-Type表
var TYPE_MAP = {
    'js'   : 'text/javascript;charset=UTF-8',
    'html' : 'text/html;charset=UTF-8',
    'css'  : 'text/css;charset=UTF-8',
    'png'  : 'image/png',
    'gif'  : 'image/gif'
};

var server = http.createServer( function ( request, response ) {
    console.log( request.url );
    var urlObj   = url.parse( request.url );
    var fileName = documentRoot + urlObj.pathname.replace( /^\/er/, '' );
    var suffix   = fileName.slice( fileName.lastIndexOf( '.' ) + 1 ).toLowerCase();
    var type     = TYPE_MAP[ suffix ];
    
    if ( !type ) {
        response.end();
        return;
    }

    fs.readFile( fileName, function ( error, file ) {
        response.writeHead( 200, { 'Content-Type': type } );
        response.write( file );
        response.end();
    } );
} ).listen( 80 );

console.log( 'ER test server started!' );

