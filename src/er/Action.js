/*
 * ER (Enterprise RIA)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    er/Action.js
 * desc:    Action的构造器
 * author:  erik
 */

///import er.AbstractAction;
///import er._util;
///import baidu.lang.inherits;
///import baidu.object.extend;

er.Action = function () {
    
    // 声明Action扩展对象
    var ActionBaseX_ = {};

    /**
     * Action类
     * 
     * @desc 
     *      实现action的加载与重绘以及常用列表页与表单页的基础功能
     * @param {Object} obj 业务action功能对象
     * @param {string} opt_name action名，加载默认action的基础功能
     */
    function Action_( obj, opt_name ) {
        var construct = arguments.callee;
        var superClazz = opt_name ? ( ActionBaseX_[ opt_name ] || construct ) : construct;
        
        var clazz = new Function();
        clazz.prototype = obj;
        baidu.inherits( clazz, superClazz );
        return clazz;
    };

    
    Action_.prototype = {
        /**
         * enter时的内部行为
         *
         * @protected
         */ 
        __enter: function () {
            this.__fireEvent( 'enter' );
        },

        /**
         * 开始重绘前的内部行为
         *
         * @protected
         */      
        __beforerender: function () {
            this.__fireEvent( 'beforerender' );
        },
        
        /**
         * 重绘完成后的内部行为
         *
         * @protected
         */      
        __afterrender: function () {
            this.__fireEvent( 'afterrender' );
        },

        /**
         * 开始重绘前的内部行为
         *
         * @protected
         */      
        __beforerepaint: function () {
            this.__fireEvent( 'beforerepaint' );
        },

        /**
         * 重绘完成后的内部行为
         *
         * @protected
         */      
        __afterrepaint: function () {
            this.__fireEvent( 'afterrepaint' );
        },

        /**
         * model加载完成后的内部行为
         *
         * @protected
         */      
        __afterloadmodel: function () {
            this.__fireEvent( 'afterloadmodel' );
        },

        /**
         * model加载前的内部行为
         *
         * @protected
         */      
        __beforeloadmodel: function () {
            var arg = this.arg;
            var queryMap = arg.queryMap;
            var key, value;

            for ( key in queryMap ) {
                value = queryMap[ key ];
                this.model.set( key, value );
            }
            
            this.__fireEvent( 'beforeloadmodel' );
        },

        /**
         * enter完成的内部行为
         *
         * @protected
         */
        __entercomplete: function () {
            this.__fireEvent( 'entercomplete' );
        },

        /**
         * leave的内部行为
         *
         * @protected
         */
        __leave: function () {
            this.__fireEvent( 'leave' );
        },

        /**
         * 自定义事件触发
         *
         * @public
         * @param {string} type 事件名
         * @param {Any} eventArg 事件对象
         */
        fireEvent: function ( type, eventArg ) {
            type = type.replace( /^on/i, '' );
            if ( this.LIFECYCLE_PHASE[ type ] ) {
                throw new Error("ER: Reserve event cannot be fired manually.");
                return;
            }

            this.__fireEvent( type, eventArg );
        },
        
        /**
         * 事件触发的内部方法
         *
         * @private
         * @param {string} type 事件名
         * @param {Any} eventArg 事件对象
         */
        __fireEvent: function ( type, eventArg ) {
            type = type.replace( /^on/i, '' );

            eventHandler = this[ 'on' + type ];
            if ( typeof eventHandler == 'function' ) {
                eventHandler.call( this, eventArg );
            }

            if ( this.LIFECYCLE_PHASE[ type ] ) {
                eventHandler = Action_[ 'on' + type ];
                if ( typeof eventHandler == 'function' ) {
                    eventHandler.call( this, eventArg );
                }
            }
        }
    }; 

    // 实现IAction
    baidu.inherits( Action_, er.AbstractAction );

    /**
     * 扩展Action的功能
     * 
     * @public
     * @param {Object} ext 扩展的功能对象
     * @param {string} opt_name 扩展别名，不提供则扩展默认Action
     */
    Action_.extend = function ( ext, opt_name ) {
        var key, 
            base = Action_.prototype;
        
        if ( opt_name ) {
            base = ActionBaseX_[ opt_name ];
            if ( !base ) {
                base = new Function();
                base.prototype = ext;
                baidu.inherits( base, Action_ );

                ActionBaseX_[ opt_name ] = base;
                return;
            }
            base = base.prototype;
        }
        
        for ( key in ext ) {
            base[ key ] = ext[ key ];
        }
    };
    
    return Action_;
}();
