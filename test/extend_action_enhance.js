
er.template.parse( '<!-- target: sea -->just test 4 ${name}' );

var testModule2 = new er.Module( {
    config: {
        action: [ 
            {
                path   : '/e',
                action : 'testModule2.action'  
            },
            {
                path   : '/e2',
                action : 'testModule2.action2'  
            }
        ]
    }
} );


var testStateName;
var testStateAddress;
var testModelQueryString;
var leaved;
var entered;
testModule2.action = new er.Action( {
    view: 'sea',

    STATE_MAP: {
        name: 'sea',
        address: 'hainan'
    },
    
    onenter: function () {
        entered = 1;
    },

    ontracename: function () {
        testStateName = this.model.get( 'name' );
        testStateAddress = this.model.get( 'address' );
    },

    onchangename: function () {
        this.model.set( 'name', 'erik' );
        this.model.set( 'address', 'haikou' );
        this.refresh();
    },

    onreset: function () {
        this.resetState();
    },

    onresetname: function () {
        this.resetState( 'name' );
    },

    onback: function () {
        this.back();
    },
    
    MODEL_QUERY_MAP: {
        myname: 'name',
        myaddress: 'address'
    },

    ontraceqs: function ( arg ) {
        testModelQueryString = this.getQueryStringByModel( arg );
    },

    onsetaddress: function ( address ) {
        this.model.set( 'address', address );
    },

    onleave: function () {
        leaved = 1;
    },

    onoverdue: function () {
        this.reload();
    }
} );

testModule2.action2 = new er.Action( {
    view: 'sea',

    USE_BACK_LOCATION: 1,
    BACK_LOCATION: '/e',
    onback: function () {
        this.back();
    }
} );

module("er.extend.actionEnhance");

test("状态保持与刷新", function() {
    er.locator.redirect('/e');

    er.controller.fireMain('tracename');
    same( testStateName, "sea", "默认状态值被填充" );
    same( testStateAddress, "hainan", "默认状态值被填充" );

    er.controller.fireMain('changename');
    var loc = er.locator.getLocation();
    same( loc.indexOf("/e~") === 0 && /name=erik/.test(loc) && /address=haikou/.test(loc), true, "刷新时，state被带入location" );
    er.controller.fireMain('tracename');
    same( testStateName, "erik", "状态发生变更" );
    same( testStateAddress, "haikou", "状态发生变更" );

    er.controller.fireMain('reset');
    er.controller.fireMain('tracename');
    same( testStateName, "sea", "状态被恢复" );
    same( testStateAddress, "hainan", "状态被恢复" );

    er.controller.fireMain('changename');
    er.controller.fireMain('resetname');
    er.controller.fireMain('tracename');
    same( testStateName, "sea", "name状态被恢复" );
    same( testStateAddress, "haikou", "address状态保留" );

    er.controller.fireMain('changename');
    er.locator.redirect('/e2');
    er.locator.redirect('/e');
    er.controller.fireMain('tracename');
    same( testStateName, "erik", "状态被保持" );
    same( testStateAddress, "haikou", "状态被保持" );
});

test("reload", function() {
    er.locator.redirect('/');
    er.locator.redirect('/e~name=reload');
    leaved = 0;
    entered = 0;
    document.getElementById('Main').innerHTML = '';
    er.controller.fireMain( 'overdue' );
    same( leaved, 1, "当前action被卸载过" );
    same( entered, 1, "当前action被重新装载" );
    same( document.getElementById('Main').innerHTML, 'just test 4 reload', "视图被重新绘制" );
});

test("back", function() {
    er.locator.redirect('/');
    er.locator.redirect('/e');

    er.controller.fireMain('back');
    same( er.locator.getLocation(), "/", "回退到之前的location" );
    
    er.locator.redirect('/');
    er.locator.redirect('/e2');
    er.controller.fireMain('back');

    same( er.locator.getLocation(), "/e", "配置了USE_BACK_LOCATION时，回退到配置的url" );
});

test("getQueryStringByModel", function() {
    er.locator.redirect('/e');
    er.controller.fireMain('reset');
    er.controller.fireMain('traceqs');
    var str = testModelQueryString;
    same( /myname=sea/.test(str) && /myaddress=hainan/.test(str), true, "自动按映射从model拼接参数" );

    er.controller.fireMain('traceqs', {'testname':'name'});
    same( testModelQueryString, "testname=sea", "自定义映射从model拼接参数" );
    
    var addr = '海口';
    er.controller.fireMain('setaddress',addr);
    er.controller.fireMain('traceqs', {'addr':'address'});
    same( testModelQueryString, "addr=" + encodeURIComponent(addr), "参数自动转义" );
});



