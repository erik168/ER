module("er.locator");

test("redirect", function() {
    er.locator.redirect('/hello');
    equals( baidu.g( 'Main' ).innerHTML, 'hello world', "fuck" );
});