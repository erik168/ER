module("er.permission");

er.permission.init( {
    test: 1,
    module: {
        mod_hello: 1
    }
});

test("isAllow", function() {
    same( er.permission.isAllow('test'), true, 'allow的权限，返回true');
    same( er.permission.isAllow('notallow'), false, 'not allow的权限，返回false');
});

test("Action AutoAuth", function() {
    er.locator.redirect('/test');
    same( location.hash, '#/test', "有权限的location，被允许通过" );

    er.locator.redirect('/hello2');
    same( location.hash, '#/', "无权限的location，被自动转向到配置的noAuthLocation" );
});


