var lang = {};

var myModule = new er.Module({
    config: {
        action: [
            {
                path    : '/hello',
                action  : 'myModule.hello',
                authority: 'mod_hello',
                noAuthLocation: '/'
            },
            {
                path    : '/',
                action  : 'myModule.hello'
            },
            {
                path    : '/ext',
                action  : 'myModule.ext'
            },
            {
                path    : '/tpl',
                action  : 'myModule.tpl'
            },
            {
                path    : '/tplbyview',
                action  : 'myModule.tplbyview'
            },
            {
                path    : '/auto',
                action  : 'myModule.auto'
            },
            {
                path    : '/test',
                action  : 'myModule.test',
                authority: 'test',
                noAuthLocation: '/hello'
            },
            {
                path    : '/hello2',
                action  : 'myModule.hello',
                authority: 'mod_hello2',
                noAuthLocation: '/'
            }
        ]
    }
});

myModule.model = new er.Model( {
    LOADER_LIST: ['nameLoader'],
    
    nameLoader: new er.Model.Loader( function () {
        this.set( 'name', this.action.getQuery( 'name' ) || 'world' );
    } )
} );

myModule.test = new er.Action({
    view: 'hello',

    model: myModule.model,

    onCustomEvent: function ( evt ) {
        testVar[ evt ]++;
    }
});

er.template.parse('<!--target:tpla-->im a<!--target:tplb-->im b');
myModule.tpl = new er.Action({
    template: function () {
        return this.getQuery('tpl');
    }
} );
myModule.tplbyview = new er.Action({
    view: function () {
        return this.getQuery('tpl');
    }
} );


myModule.hello = new er.Action({
    enter: function () {
        testVar.enter++;
        er.Action.prototype.enter.apply(this, arguments);
    },
    
    leave: function () {
        testVar.leave++;
        er.Action.prototype.leave.apply(this, arguments);
    },

    view: 'hello',

    model: myModule.model,

    onCustomEvent: function ( evt ) {
        testVar[ evt ]++;
    }
});


myModule.ext = new er.Action({
    view: 'hello',

    model: myModule.model

}, 'rename');

er.template.parse('<!--target:hello-->hello ${name}');

er.Action.onenter = function () {
    testVar.onenter++;
};

er.Action.onleave = function () {
    testVar.onleave++;
};
