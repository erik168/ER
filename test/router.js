module("er.router");

er.router.add( /^:([0-9]+):([0-9]+)$/, function ( loc,one, two ) {
    testVar.routerNum = parseInt( one, 10 ) + parseInt( two, 10 );
});

test("add 4 custom rule", function() {
    er.locator.redirect(':20:30');
   
    same( testVar.routerNum, 50, ":20:30的url被映射到自定义function" );
});

