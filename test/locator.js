module("er.locator");

er.locator.ondirect = function () {
    testVar.ondirect++;
};

test("redirect", function() {
    er.locator.redirect('/hello');
    equals( baidu.g( 'Main' ).innerHTML, 'hello world', "fuck" );
    equals( testVar.ondirect, 1 );
});