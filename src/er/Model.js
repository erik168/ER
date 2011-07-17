/*
 * ER (Enterprise RIA)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    er/Model.js
 * desc:    Model类
 * author:  erik
 */

///import er.context;

er.Model = function () {
    function Model( extend ) {
        var construct = new Function();
        construct.prototype = extend;
        baidu.inherits( construct, Model );

        return construct;
    }

    Model.prototype = {
        construct: function ( option ) {
            option = option || {};

            this._guid = option.guid;
            this._container = {};
            this._changeListener = this.__getChangeListener();

            er.context.addPrivate( this._guid, this._container );
            er.context.addChangeListener( this._changeListener );
        },

        set: function ( name, value ) {
            er.context.set( name, value, this.guid );
        },

        get: function ( name ) {
            return er.context.get( name, this.guid );
        },
        
        stop: function () {
            if ( this._phase == 'loading' ) {
                this._phase == 'waiting';
            }
        },

        start: function () {
            if ( this._phase == 'waiting' ) {
                this._phase == 'loading';
                this.__continue();
            }
        },

        load: function ( finishedCallback ) {
            this._phase = 'loading';

            this._loaderList = this.LOADER_LIST || [];
            this._loaderIndex = 0;
            this._loaderCount = this.loaderList.length;

            this._finishedCallback = finishedCallback || new Function();
        },

        __continue: function () {
            if ( this._phase != 'loading' ) {
                return;
            }

            if ( this._loaderIndex >= this._loaderCount ) {
                this._phase = null;
                this._finishedCallback();
                return;
            }
            
            var loader = this._loaderList[ this._loaderIndex++ ];
            loader.setModel( this );
            loader.load();

            this.__continue();
        },

        dispose: function () {
            er.context.removePrivate( this._guid );
            er.context.removeChangeListener( this._changeListener );

            this._container = null;
            this._changeListener = null;
        },

        getGUID: function () {
            return this._guid;
        },

        onchange: new Function(),

        __getChangeListener: function () {
            var me = this;
            return function ( event ) {
                if ( event.contextId == me.guid ) {
                    me.onchange({
                        oldValue: event.oldValue,
                        newValue: event.newValue
                    });
                }
            };
        }
    };
}();

er.Model.Loader = function ( func, opt_option ) {
    this._func = func;
};

er.Model.Loader.prototype = {
    setModel: function ( model ) {
        this.model = model;
    },

    load: function () {
        this._func();
    },

    stop: function () {
        this.model.stop();
    },

    start: function () {
        this.model.start();
    },

    get: function () {
        return this.model.get.apply( 
            this.model, 
            Array.prototype.slice.call( arguments, 0 ) 
        );
    },

    set: function () {
        this.model.set.apply( 
            this.model, 
            Array.prototype.slice.call( arguments, 0 ) 
        );
    }
};