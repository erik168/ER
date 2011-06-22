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

myModule.test = new er.Action({
    VIEW: 'hello',

    CONTEXT_INITER_MAP: {
        name: function (callback) {
            this.setContext('name', this.arg.queryMap.name || 'world');
            callback();
        }
    },

    onCustomEvent: function ( evt ) {
        testVar[ evt ]++;
    }
});


myModule.hello = new er.Action({
    enter: function () {
        testVar.enter++;
        er.Action.prototype.enter.apply(this, arguments);
    },
    
    leave: function () {
        testVar.leave++;
        er.Action.prototype.leave.apply(this, arguments);
    },

    VIEW: 'hello',

    CONTEXT_INITER_MAP: {
        name: function (callback) {
            this.setContext('name', this.arg.queryMap.name || 'world');
            callback();
        }
    },

    onCustomEvent: function ( evt ) {
        testVar[ evt ]++;
    }
});

er.template.parse('<!--target:hello-->hello ${name}');

er.Action.onenter = function () {
    testVar.onenter++;
};

er.Action.onleave = function () {
    testVar.onleave++;
};