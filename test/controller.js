module("er.controller");


test("forward", function() {
    try {
        er.controller.forward("/noexist", '', "/noexist");
        ok( 1 == 2, '未配置的path，forward时应throw error' ); 
    } catch(ex) {
        ok( 1 == 1, '未配置的path，forward时应throw error' ); 
    }

    er.controller.forward("/hello~name=ER", "/hello", 'name=ER');
    same( baidu.g( 'Main' ).innerHTML, 'hello ER', "forward后，通过action，主区域被填充内容" );
});

test("loadSub and unloadSub", function() {
    var el = document.createElement('div');
    el.id = 'subWrapper';
    document.body.appendChild( el );

    var runtimeContext = er.controller.loadSub('subWrapper', 'myModule.hello', {queryMap:{name:'ER on sub'}});
    same( el.innerHTML, 'hello ER on sub', "loadSub，子区域被填充内容" );

    er.controller.unloadSub( runtimeContext );
    same( el.innerHTML, '', "unloadSub，子区域内容被清除" );

    document.body.removeChild( el );
    el = null;
});

test("fireMain and fireEvent", function() {
    er.locator.redirect('/hello');
    testVar.fireByMain = 0;
    er.controller.fireMain( 'CustomEvent', 'fireByMain' );
    same( testVar.fireByMain, 1, '当前主Action的CustomEvent事件通过er.controller.fireMain被触发' );
    
    testVar.fireByMain = 0;
    er.controller.fireEvent( 'CustomEvent', 'fireByMain' );
    same( testVar.fireByMain, 1, '当前主Action的CustomEvent事件通过er.controller.fireEvent被触发' );

    var el = document.createElement('div');
    el.id = 'subWrapper';
    document.body.appendChild( el );

    testVar.fireBySub = 0;
    var runtimeContext = er.controller.loadSub('subWrapper', 'myModule.hello', {queryMap:{name:'ER on sub'}});
    er.controller.fireEvent( 'CustomEvent', 'fireBySub', runtimeContext );
    same( testVar.fireBySub, 1, 'sub action的CustomEvent事件通过er.controller.fireEvent被触发' );
    er.controller.unloadSub( runtimeContext );

    document.body.removeChild( el );
    el = null;

});

