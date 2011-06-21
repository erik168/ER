module("er.locator");

er.locator.onredirect = function () {
    testVar.onredirect++;
};

test("redirect", function() {
    er.locator.redirect('/hello');
   
    same( baidu.g( 'Main' ).innerHTML, 'hello world', "主区域被填充内容" );
    same( location.hash, '#/hello', "设置的location被反映到地址栏中" );
    same( testVar.onredirect, 1, 'locator.onredirect事件被触发' );
});
