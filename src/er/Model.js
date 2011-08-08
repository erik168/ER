/*
 * ER (Enterprise RIA)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    er/Model.js
 * desc:    Model类
 * author:  erik
 */

///import er.context;
///import er._util;

er.Model = function () {
    function Model( extend ) {
        var construct = new Function();
        construct.prototype = extend;
        baidu.inherits( construct, Model );

        return construct;
    }

    Model.prototype = {
        /**
         * 构造model实例
         *
         * @public
         * @param {Object} options 构造参数
         */
        construct: function ( option ) {
            option = option || {};

            this._guid              = option.guid || er._util.getUID();
            this._container         = {};
            this._changeListener    = this.__getChangeListener();
            this._changeListeners   = [];
            this.action             = option.action;

            er.context.addPrivate( this._guid, this._container );
            er.context.addChangeListener( this._changeListener );
        },
        
        /**
         * 设置数据
         *
         * @public
         * @param {string} name 数据名
         * @param {Any} value 数据值
         */
        set: function ( name, value, opt_arg ) {
            var arg = baidu.object.clone( opt_arg || {} );
            arg.contextId = this._guid;

            er.context.set( name, value, arg );
        },
        
        /**
         * 获取数据
         *
         * @public
         * @param {string} name 数据名
         * @return {Any}
         */
        get: function ( name ) {
            return er.context.get( name, { contextId: this._guid } );
        },
        
        /**
         * 停止model加载动作
         *
         * @public
         */
        stop: function () {
            if ( this._phase == 'loading' ) {
                this._phase = 'waiting';
            }
        },
        
        /**
         * 开始model加载动作
         *
         * @public
         */
        start: function () {
            if ( this._phase == 'waiting' ) {
                this._phase = 'loading';
                this.__continue();
            }
        },
        
        /**
         * 加载model
         *
         * @public
         * @param {Function} finishedCallback 加载完成回调函数
         */
        load: function ( finishedCallback ) {
            this._phase = 'loading';

            this._loaderList = this.LOADER_LIST || [];
            this._loaderIndex = 0;
            this._loaderCount = this._loaderList.length;

            this._finishedCallback = finishedCallback || new Function();
            this.__continue();
        },
        

        /**
         * 继续加载model
         *
         * @private
         */
        __continue: function () {
            if ( this._phase != 'loading' ) {
                return;
            }

            if ( this._loaderIndex >= this._loaderCount ) {
                this._phase = null;
                this._finishedCallback();
                return;
            }
            
            var loader = this[ this._loaderList[ this._loaderIndex++ ] ];
            loader.setModel( this );
            loader.load();

            this.__continue();
        },
        
        /**
         * 添加数据变化的监听器
         *
         * @public
         * @param {Function} listener 监听器
         */
        addChangeListener: function ( listener ) {
            this._changeListeners.push( listener );
        },
        
        /**
         * 移除数据变化的监听器
         *
         * @public
         * @param {Function} listener 监听器
         */
        removeChangeListener: function ( listener ) {
            var changeListeners = this._changeListeners;
            var len = changeListeners.length;

            while ( len-- ) {
                if ( listener === changeListeners[ len ] ) {
                    changeListeners.splice( len, 1 );
                }
            }
        },

        /**
         * 释放model
         *
         * @public
         */
        dispose: function () {
            er.context.removePrivate( this._guid );
            er.context.removeChangeListener( this._changeListener );
            
            this.action = null;
            this._container = null;
            this._changeListener = null;
            this._changeListeners = null;
        },
        
        /**
         * 获取model唯一标识
         *
         * @public
         * @return {string}
         */
        getGUID: function () {
            return this._guid;
        },
        
        /**
         * 获取参数字符串
         *
         * @public
         * @param {Object} opt_queryMap 参数映射表，默认使用model的QUERY_MAP项
         * @return {string}
         */
        getQueryString: function ( opt_queryMap ) {
            var queryMap = opt_queryMap || this.QUERY_MAP,
                buffer   = [],
                value,
                key;
                
            if ( queryMap ) {
                for ( key in queryMap ) {
                    value = this.get( queryMap[ key ] );
                    if ( er._util.hasValue( value ) ) {
                        buffer.push( key + '=' + encodeURIComponent( value ) );
                    }
                }
                
                return buffer.join( '&' );
            }
            
            return '';
        },

        onchange: new Function(),
        
        /**
         * 获取数据模型变化的事件监听器
         *
         * @private
         * @return {Function}
         */
        __getChangeListener: function () {
            var me = this;
            return function ( event ) {
                if ( event.contextId == me._guid ) {
                    var evtArg = {
                        name    : event.name,
                        oldValue: event.oldValue,
                        newValue: event.newValue
                    };
                    var changeListeners = me._changeListeners;
                    var i = 0;
                    var len = changeListeners.length;

                    me.onchange( evtArg );
                    for ( ; i < len; i++ ) {
                        changeListeners[ i ].call( me, evtArg );
                    }
                }
            };
        }
    };

    return Model;
}();

/**
 * model加载器
 *
 * @class
 */
er.Model.Loader = function ( func, opt_option ) {
    this._func = func;
};

er.Model.Loader.prototype = {
    /**
     * 设置当前加载的model
     *
     * @public
     * @param {er.Model} model 当前加载的model
     */
    setModel: function ( model ) {
        this.model = model;
    },

    /**
     * 加载model
     *
     * @public
     */
    load: function () {
        this._func.call( this.model );
    },

    /**
     * 停止加载
     *
     * @public
     */
    stop: function () {
        this.model.stop();
    },
    
    /**
     * 启动加载
     *
     * @public
     */
    start: function () {
        this.model.start();
    },
    
    /**
     * 获取model数据
     *
     * @public
     * @param {string} name 数据名
     * @return {Any}
     */
    get: function () {
        return this.model.get.apply( 
            this.model, 
            Array.prototype.slice.call( arguments, 0 ) 
        );
    },

    /**
     * 填充model数据
     *
     * @public
     * @param {string} name 数据名
     * @param {Any} value 数据值
     */
    set: function () {
        this.model.set.apply( 
            this.model, 
            Array.prototype.slice.call( arguments, 0 ) 
        );
    },
    
    /**
     * 获取参数字符串
     *
     * @public
     * @param {Object} opt_queryMap 参数映射表，默认使用model的QUERY_MAP项
     * @return {string}
     */
    getQueryString: function ( opt_queryMap ) {
        return this.model.getQueryString( opt_queryMap );
    }
};
