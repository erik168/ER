hello.action = new er.Action({
    VIEW: 'hello',

    CONTEXT_INITER_MAP: {
        name: function (callback) {
            this.setContext('name', this.arg.queryMap.name);
            callback();
        }
    }
});