
er.template.parse( '<!-- target: form1 -->'
    +  '<input type="text" ui="type:TextInput;id:myName" name="name">'
    +  '<input type="text" ui="type:TextInput;id:myEmail" name="email">'
    +  '<textarea ui="type:TextInput;id:myAddr" name="addr"></textarea>'
    +  '<div ui="type:Select;id:mySex" name="sex"></div>');

var testModule3 = new er.Module( {
    config: {
        action: [ 
            {
                path   : '/f',
                action : 'testModule3.action'  
            }
        ]
    }
} );

var testValidateResult;
var testFormQueryString;
testModule3.action = new er.Action( {
    view: new er.View( {
        template: 'form1',

        UI_PROP: {
            myName: { rule: 'required',title:'name' },
            myEmail: { rule: 'required,pattern', pattern: /^[a-z]+@[a-z]+(\.[a-z]+){1,}$/i,title:'email' },
            myAddr: { rule: 'required,maxlength', maxlength: 10,title:'addr' },
            mySex: { datasource: '*sexList',rule: 'required',title:'sex' }
        }
    } ),
    
    model: new er.Model( {
        LOADER_LIST: [ 'sexLoader' ],
        
        sexLoader: new er.Model.Loader( function () {
            this.set( 'sexList', [
                { name: '男', value: 1},
                { name: '女', value: 0}  
            ] );
        } )
    } ),

    onchangeName: function ( name ) {
        esui.get( 'myName' ).setValue( name );
    },

    onchangeAddress: function ( addr ) {
        esui.get( 'myAddr' ).setValue( addr );
    },

    onchangeEmail: function ( em ) {
        esui.get( 'myEmail' ).setValue( em );
    },

    onchangeSex: function ( s ) {
        esui.get( 'mySex' ).setValue( s );
    },

    onvalidate: function () {
        testValidateResult = this.validateForm();
    },

    ontraceqs: function () {
        testFormQueryString = this.getQueryStringByForm();
    }

} );


module("er.extend.actionLikeForm");

test("validateForm", function() {
    er.locator.redirect('/f');

    er.controller.fireMain('validate');
    same( testValidateResult, false, '验证失败' );
    
    er.controller.fireMain('changeName', 'erik');
    er.controller.fireMain('changeAddress', 'baidu');
    er.controller.fireMain('changeEmail', 'erik@a.com');
    er.controller.fireMain('changeSex', '1');

    er.controller.fireMain('validate');
    same( testValidateResult, true, '更新值后验证成功' );

    er.controller.fireMain('changeEmail', 'erik');
    er.controller.fireMain('validate');
    same( testValidateResult, false, '再次验证失败' );
});

test("getQueryStringByForm", function() {
    er.locator.redirect('/f');
    
    er.controller.fireMain('changeName', 'erik');
    er.controller.fireMain('changeAddress', 'baidu');
    er.controller.fireMain('changeEmail', 'erik@a.com');
    er.controller.fireMain('changeSex', '1');

    er.controller.fireMain('traceqs');
    var str = testFormQueryString;
    same( /name=erik/.test(str), true, 'name参数生成成功' );
    same( /addr=baidu/.test(str), true, 'addr参数生成成功' );
    same( new RegExp("email=" + encodeURIComponent('erik@a.com')).test(str), true, 'email参数生成成功' );
    same( /sex=1/.test(str), true, 'sex参数生成成功' );
});




