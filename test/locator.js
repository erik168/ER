module("er.locator");

er.locator.onredirect = function () {
    testVar.onredirect++;
};

test("redirect", function() {
    testVar.onredirect = 0;
    er.locator.redirect('/hello');
   
    same( baidu.g( 'Main' ).innerHTML, 'hello world', "主区域被填充内容" );
    same( location.hash, '#/hello', "设置的location被反映到地址栏中" );
    ok( testVar.onredirect === 1, 'locator.onredirect事件被触发' );
});

test("query parse", function() {
    var name = '中国人民从此站起来了!@#$%^&*()_,./;\'[]{}:"<>?\|-_=+';
    er.locator.redirect('/hello~name=' + encodeURIComponent(name));

    var queryMap = er.locator.getQueryMap();
    same( queryMap.name, name, "设置的name参数应该和parse的name query相等");
});

asyncTest("back and forward", function() {
    er.locator.redirect('/test~name=er');
    er.locator.redirect('/hello~name=er%E6%A1%86%E6%9E%B6');
    er.locator.redirect('/');

    same( location.hash, '#/', "当前location为/" );
    
    history.back();

    setTimeout(function(){  
        if (baidu.browser.firefox) {
            same( location.hash, '#/hello~name=er框架', "后退一次，location为/hello~name=er框架" );
        } else {
            same( location.hash, '#/hello~name=er%E6%A1%86%E6%9E%B6', "后退一次，location为/hello~name=er%E6%A1%86%E6%9E%B6" );
        }
        
        history.back();

        setTimeout(function() {
            same( location.hash, '#/test~name=er', "后退两次，location为/test~name=er" );
            history.forward();

            setTimeout(function() {
                if (baidu.browser.firefox) {
                    same( location.hash, '#/hello~name=er框架', "前进一次，location为/hello~name=er框架" );
                } else {
                    same( location.hash, '#/hello~name=er%E6%A1%86%E6%9E%B6', "前进一次，location为/hello~name=er%E6%A1%86%E6%9E%B6" );
                }
                history.forward();

                setTimeout(function() {
                    same( location.hash, '#/', "前进两次，location为/" );
                    start();
                }, 200);
            }, 200);
        }, 200);
    }, 200);

});