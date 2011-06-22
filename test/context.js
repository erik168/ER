module("er.context");


test("public context", function() {
    er.context.set( 'test',  1 );
    same(er.context.get('test'), 1, '设置并获取public context的值：number');
    
    er.context.set( 'test2',  "hello er!" );
    same(er.context.get('test2'), "hello er!", '设置并获取public context的值：string');

    same(er.context.get('noexist'), null, '不存在的context，返回null');
});

test("private context", function() {
    er.context.addPrivate('mykey');
    er.context.set( 'private',  2, 'mykey' );
    same(er.context.get('private'), null, '直接获取private的context，应无法获取，为null');
    same(er.context.get('private', 'mykey'), 2, '通过private key，获取private的context');

    er.context.removePrivate('mykey');
    try {
        er.context.set( 'private',  2, 'mykey' );
        ok( 1 == 2, "往不存在的private环境里setContext应该抛错" );
    } catch (ex) {
        ok( 1 == 1, "往不存在的private环境里setContext应该抛错" );
    }
});



