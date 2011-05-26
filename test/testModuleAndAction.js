var myModule = new er.Module({
    config: {
        action: [{
            path    : '/hello',
            action  : 'myModule.hello'
        }]
    }
});

myModule.hello = new er.Action({
    VIEW: 'hello',
        CONTEXT_INITER_MAP: {
            name: function (callback) {
                this.setContext('name', this.arg.queryMap.name);
                callback();
            }
        }
});

er.template.parse('<!--target:hello-->hello world');