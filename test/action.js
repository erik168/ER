module("er.Action");


test("enter", function() {
    er.locator.redirect( '/hello' );
    same( testVar.enter, 1, "Action的enter方法被执行过" );
    same( testVar.onenter, 1, "Action的onenter事件被触发过" );
});

test("leave", function() {
    er.locator.redirect( '/test' );
    same( testVar.leave, 1, "Action的leave方法被执行过" );
    same( testVar.onleave, 1, "Action的onleave事件被触发过" );
});

test("autoload", function() {
    er.locator.redirect( '/auto' );
    stop();

    setTimeout(function () {
        
        same( baidu.g( 'Main' ).innerHTML, 'hello auto', "主区域被填充auto的内容" );
        same( location.hash, '#/auto', "设置的location被反映到地址栏中" );
        start();
    }, 1000);
});

er.config.ACTION_AUTOLOAD = 1;
er.config.ACTION_ROOT = '.';
er.config.ACTION_PATH = {'myModule.auto':'auto.js'};