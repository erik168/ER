er.template.parse( '<!-- target: uiview --><div ui="type:Button;id:myButton"></div><div ui="type:Select;id:mySelect;datasource:*users"></div>' );
er.template.parse( '<!-- target: uiviewsimple --><div ui="type:Button;id:myButton"></div><div ui="type:Select;id:mySelect;"></div>' );
er.template.parse( '<!-- target: uiinputview --><div ui="type:Button;id:myButton"></div>' 
    + '<div ui="type:Select;id:mySelect;"></div>' 
    + '<input type="text" ui="type:TextInput;id:myText;value:*textValue"/>'
    + '<span ui="type:Label;id:myLabel"></span>');
er.template.parse( '<!-- target: uiclear -->just test' );

var testUserData = [
    { name:'erik', value: 1 },
    { name:'ouyang', value: 2 },
    { name:'season', value: 3 }
];

var testUserData2 = [
    { name:'erik', value: 1 },
    { name:'ouyang', value: 2 },
    { name:'season', value: 3 },
    { name:'hello', value: 4 }
];

var testModule = new er.Module( {
    config: {
        action: [ 
            {
                path   : '/',
                action : 'testModule.action'  
            },
            {
                path   : '/two',
                action : 'testModule.action2'  
            },
            {
                path   : '/clear',
                action : 'testModule.actionc'  
            },
            {
                path   : '/input',
                action : 'testModule.actioni'  
            },
            {
                path   : '/inputnosilence',
                action : 'testModule.actionii'  
            }

        ]
    }
} );

var testUserModel = new er.Model( {
    LOADER_LIST: [ 'loadUser' ],

    loadUser: new er.Model.Loader( function () {
        this.set( 'users', testUserData );
    } )
} ) ;

testModule.actionc = new er.Action( {
    view: 'uiclear',
    model: testUserModel
} );

var inputList = null;
var testInputText = null;
testModule.actioni = new er.Action( {
    view: 'uiinputview',
    model: testUserModel,
    ontraceinput: function () {
        inputList = this.view.getInputList();
    },

    ontracevalue: function () {
        testInputText = esui.get( 'myText' ).getValue();
    },

    oneditvalue: function ( value ) {
        this.model.set( 'textValue', value );
    }
} );

testModule.actionii = new er.Action( {
    MODEL_SILENCE: false,
    view: 'uiinputview',
    model: testUserModel,
    ontraceinput: function () {
        inputList = this.view.getInputList();
    },

    ontracevalue: function () {
        testInputText = esui.get( 'myText' ).getValue();
    },

    oneditvalue: function ( value ) {
        this.model.set( 'textValue', value );
    },

    oneditvaluesilence: function ( value ) {
        this.model.set( 'textValue', value, {silence: true} );
    }
} );

testModule.action = new er.Action( {
    view: 'uiview',
    model: testUserModel,

    onafterrender: function () {
        esui.get( 'myButton' ).onclick = this.btnClick;
    },

    btnClick: function () {
        window._selectedUser = esui.get( 'mySelect' ).getValue();
    },

    onclear: function () {
        this.view.clear();
    },

    onchangeuser: function () {
        this.model.set( 'users', testUserData2 );
        this.view.repaint();
    }
} );

testModule.action2 = new er.Action( {
    view: new er.View( {
        template: 'uiviewsimple',
        
        UI_PROP: {
            mySelect: {
                datasource: '*users'
            }
        }
    } ),
    model: testUserModel,

    onafterrender: function () {
        esui.get( 'myButton' ).onclick = this.btnClick;
    },

    btnClick: function () {
        window._selectedUser = esui.get( 'mySelect' ).getValue();
    }
} );

module("er.extend.ui");
test("render repaint & clear", function() {
    er.locator.redirect('/');
   
    same( esui.get('myButton') instanceof esui.Button, true, "button控件被渲染" );
    same( esui.get('mySelect') instanceof esui.Select, true, "select控件被渲染" );
    same( esui.get('mySelect').datasource.length, 3, "*var的方法引用到数据模型" );

    var isRepainted = 0;
    var renderFunc = esui.get('mySelect').render;
    esui.get('mySelect').render = function() {
        isRepainted = 1;
        renderFunc.call( this );
    };
    er.controller.fireMain('changeuser');
    same( esui.get('mySelect').datasource.length, 4, "数据被重新灌入" );
    same( isRepainted, 1, "重绘动作发生" );

    er.controller.fireMain('clear');

    same( esui.get('myButton') , null, "button控件被清除" );
    same( esui.get('mySelect') , null, "select控件被清除" );
});

test("new View 4 action", function() {
    er.locator.redirect('/two');
   
    same( esui.get('myButton') instanceof esui.Button, true, "button控件被渲染" );
    same( esui.get('mySelect') instanceof esui.Select, true, "select控件被渲染" );
    same( esui.get('mySelect').datasource.length, 3, "select的datasource被UI_PROP指定" );
});

test("getInputList", function() {
    er.locator.redirect('/input');
    er.controller.fireMain('traceinput');

    same( inputList.length, 2, "取到两个控件" );
    for ( var i = 0; i < inputList.length; i++ ) {
        same( inputList[i] instanceof esui.InputControl, true, inputList[i].id + "控件是input控件" );
    }
    
    same( esui.get('myLabel') instanceof esui.Control, true, "其他非input控件存在" );
});

test("auto repaint when set model", function() {
    er.locator.redirect('/input');
    er.controller.fireMain('tracevalue');

    same( testInputText, '', "text控件初始值为空" );

    er.controller.fireMain('editvalue', 'erik');
    er.controller.fireMain('tracevalue');

    same( testInputText, '', "默认情况不自动repaint控件" );

    er.locator.redirect('/inputnosilence');
    er.controller.fireMain('tracevalue');

    same( testInputText, '', "text控件初始值为空" );
    
    er.controller.fireMain('editvalue', 'erik');
    er.controller.fireMain('tracevalue');

    same( testInputText, 'erik', "设置MODEL_SILENCE时，model的变更自动映射到控件" );

    er.controller.fireMain('editvaluesilence', 'sea');
    er.controller.fireMain('tracevalue');

    same( testInputText, 'erik', "通过{silence:true}设置model，不会自动重绘并更新控件" );
});