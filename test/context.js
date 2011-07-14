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
    er.context.set( 'private',  2, {contextId: 'mykey'} );
    same(er.context.get('private'), null, '直接获取private的context，应无法获取，为null');
    same(er.context.get('private', {contextId: 'mykey'}), 2, '通过private key，获取private的context');

    er.context.removePrivate('mykey');
    try {
        er.context.set( 'private',  2, {contextId: 'mykey'} );
        ok( 1 == 2, "往不存在的private环境里setContext应该抛错" );
    } catch (ex) {
        ok( 1 == 1, "往不存在的private环境里setContext应该抛错" );
    }
});

test("change event", function () {
    var num = 0;
    er.context.set('temp', 1);
    function changeListener( evt ) {
        num = evt.newValue;
        same( typeof evt.contextId, 'undefined', "set public context时，contextId未定义" );
        same( evt.oldValue, 1, "oldValue为设置之前的值" );
        same( evt.newValue, 2, "oldValue为需要设置的值" );
    }
    er.context.addChangeListener( changeListener );
    er.context.set( 'temp', 2 );
    same( num, 2, "add后，num的值被changeListener所修改"  );

    er.context.removeChangeListener( changeListener );
    er.context.set( 'temp', 3 );
    same( num, 2, "remove后，num的值不被changeListener所修改" );


    changeListener = function ( evt ) {
        num = evt.newValue;
        same( evt.contextId, 'mykey', "set private context时，contextId为私有环境id" );
        same( evt.oldValue, 1, "oldValue为设置之前的值" );
        same( evt.newValue, 2, "oldValue为需要设置的值" );
    }
    er.context.addPrivate('mykey');
    num = 5;
    er.context.set( 'temp', 1, {contextId: 'mykey'} );
    same( num, 5, "add前，num的值不被changeListener所修改"  );
    er.context.addChangeListener( changeListener );
    er.context.set( 'temp', 2, {contextId: 'mykey'} );
    same( num, 2, "add后，num的值被changeListener所修改"  );

    er.context.removeChangeListener( changeListener );
    er.context.set( 'temp', 3, {contextId: 'mykey'} );
    same( num, 2, "remove后，num的值不被changeListener所修改" );
});



