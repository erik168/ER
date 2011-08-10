module("er.Action");


test("enter", function() {
    testVar.enter = 0;
    testVar.onenter = 0;
    er.locator.redirect( '/hello~name=erik' );
    same( testVar.enter, 1, "Action的enter方法被执行过" );
    same( testVar.onenter, 1, "Action的onenter事件被触发过" );
});

test("leave", function() {
    testVar.leave = 0;
    testVar.onleave = 0;
    er.locator.redirect( '/test' );
    same( testVar.leave, 1, "Action的leave方法被执行过" );
    same( testVar.onleave, 1, "Action的onleave事件被触发过" );
});

er.Action.extend({
    actionext: function () {
        testVar.actionext = 1;
    }
});

er.Action.extend({
    actionext: function () {
        testVar.actionext = 2;
    }
}, 'rename');

test("extend", function () {
    testVar.actionext = 0;
    er.Action.onentercomplete = function () {
        this.actionext();
    };
    er.locator.redirect( '/hello~name=erik' );
    same( testVar.actionext, 1, "actionext方法extend到Action中" );

    er.locator.redirect( '/ext~name=erik' );
    same( testVar.actionext, 2, "actionext方法extend到带别名的Action中" );
});

test("choose template", function() {
    er.locator.redirect( '/tpl~tpl=tpla' );
    same( baidu.g( 'Main' ).innerHTML, 'im a', "通过template属性选中template tpla" );
    
    er.locator.redirect( '/tplbyview~tpl=tpla' );
    same( baidu.g( 'Main' ).innerHTML, 'im a', "通过view属性选中template tpla" );
    
    er.locator.redirect( '/tpl~tpl=tplb' );
    same( baidu.g( 'Main' ).innerHTML, 'im b', "通过template属性选中template tplb" );
    

    er.locator.redirect( '/tplbyview~tpl=tplb' );
    same( baidu.g( 'Main' ).innerHTML, 'im b', "通过view属性选中template tplb" );
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
