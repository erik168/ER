module("er.View");

var testView = new er.View();


test("render, repaint and clear", function() {
    var model = new TestModel();
    model.construct();
    er.template.parse('<!--target:testMyView-->sea ${modeltest}')
    var myView = new testView();
    myView.construct( {
        target: 'Main',
        template: 'testMyView',
        model: model
    } );
   
    model.set( 'modeltest', 22222 );
    myView.render();

    same( baidu.g( 'Main' ).innerHTML, 'sea 22222', "render后，target被填充内容" );
   
    myView.clear();
    same( baidu.g( 'Main' ).innerHTML, '', "clear后，target内容被清空" );

    model.dispose();
});

test("extend", function() {
    er.View.extend( {
        render: function () {
            window['__viewextendrender__'] = 1;
            er.View.prototype.render.call( this );
        }
    } );

    

    same( typeof window['__viewextendrender__'], 'undefined', "extend标志位未定义" );
    
    er.template.parse('<!--target:testMyView2-->sea ${modeltest}')
    var model = new TestModel();
    model.construct();
    var myView = new(new er.View())();
    myView.construct( {
        target: 'Main',
        template: 'testMyView2',
        model: model
    } );

    model.set( 'modeltest', 12345 );
    myView.render();

    same( baidu.g( 'Main' ).innerHTML, 'sea 12345', "render后，target被填充内容" );
    same( window['__viewextendrender__'], 1, "extend标志位被置成1" );

    model.dispose();
});
