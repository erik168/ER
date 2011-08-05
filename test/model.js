module("er.Model");

var testModelVar = {};
var TestModel = new er.Model( {
        onchange: function ( e ) {
            testModelVar.changeName = e.name;
            testModelVar.oldV = e.oldValue;
            testModelVar.newV = e.newValue;
        }
    } );


test("model set and get", function() {
    var model = new TestModel();
    model.construct();
   
    model.set( 'modeltest', 22222 );
    same( model.get( 'modeltest' ), 22222, '设置和读取的值应该一致' );

    model.dispose();

    er.context.removePrivate( model._guid );
    same( model.get( 'modeltest' ), null, '释放后应该读不到值' );
});

test("change listen", function() {
    var changeName;
    var oldV;
    var newV;
    var model = new TestModel();
    model.construct();
    
    model.set( 'modeltest', 22222 );
    same( model.get( 'modeltest' ), 22222, '设置和读取的值应该一致' );
    same( testModelVar.changeName, 'modeltest', 'change监听函数工作了' );
    same( testModelVar.oldV, null, '旧值是null' );
    same( testModelVar.newV, 22222, '新值是设置的值' );

    model.dispose();
});
