/*
 * ER (Enterprise RIA)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    er/context.js
 * desc:    context为上下文数据提供环境，分为public,private两个级别
 * author:  erik
 */

///import er;

/**
 * 运行时的上下文数据管理器
 */
er.context = function () {
    var publicContext = {},    // public级别数据容器
        privateContext = {},   // private级别数据容器
        changeListeners = [];  // context变化的监听器容器

    return {
        /**
         * 设置应用环境上下文
         * 
         * @name er.context.set
         * @public
         * @param {string} name 环境变量名
         * @param {Any}    value 环境变量值
         * @param {Object} [opt_arg] 设置选项
         *     @config {string} [contextId] 私有环境id
         */
        set: function ( name, value, opt_arg ) {
            opt_arg         = opt_arg || {};
            var contextId   = opt_arg.contextId;  
            var context     = contextId ? privateContext[ contextId ] : publicContext;
            var evtArg      = {};
            var newValue    = value;
            var i, len;
            
            if ( !context ) {
                throw new Error('ER: private context "' + contextId + '" is not exist.');
            }
            
            if ( !opt_arg.silence ) {
                // 初始化event argument
                contextId && ( evtArg.contextId = contextId );
                evtArg.name     = name;
                evtArg.oldValue = context[ name ] || null;
                evtArg.newValue = newValue;
                
                // change事件触发
                for ( i = 0, len = changeListeners.length; i < len; i++ ) {
                    changeListeners[ i ].call( er.context, evtArg );
                }
            }

            context[ name ] = newValue;
        },
        
        /**
         * 增加私有环境
         * 
         * @public
         * @name er.context.addPrivate
         * @param {string} contextId 私有环境id
         * @param {Object} [opt_container] 数据容器对象
         */
        addPrivate: function ( contextId, opt_container ) {
            if ( !privateContext[ contextId ] ) {
                privateContext[ contextId ] = opt_container || {};
            }
        },
        
        /**
         * 移除私有环境
         * 
         * @public
         * @name er.context.removePrivate
         * @param {string} contextId 私有环境id
         */
        removePrivate: function ( contextId ) {
            privateContext[ contextId ] = null; 
        },
        
        /**
         * 获取上下文环境变量
         * 
         * @public
         * @name er.context.get
         * @param {string} name 上下文变量名
         * @param {Object} opt_arg 读取选项
         *     @config {string} [contextId] 私有环境id
         * @return {Any}
         */
        get: function ( name, opt_arg ) {
            opt_arg = opt_arg || {};

            var contextId = opt_arg.contextId;
            var value;
            var priv;
                
            if ( 'string' == typeof contextId ) {
                priv = privateContext[ contextId ];
                value = priv && priv[ name ];
            }
            
            if ( er._util.hasValue( value ) ) {
                return value;
            }
            
            value = publicContext[ name ];
            if ( er._util.hasValue( value ) ) {
                return value;
            }
    
            return null;
        },

        /**
         * 增加context的change事件监听器
         *
         * @public
         * @name er.context.addChangeListener
         * @param {Function} listener 监听器
         */
        addChangeListener: function ( listener ) {
            changeListeners.push( listener );
        },
        
        /**
         * 移除context的change事件监听器
         *
         * @public
         * @name er.context.addChangeListener
         * @param {Function} listener 监听器
         */
        removeChangeListener: function ( listener ) {
            var len = changeListeners.length;
            while ( len-- ) {
                if ( listener === changeListeners[ len ] ) {
                    changeListeners.splice( len, 1 );
                }
            }
        }
    };
}();
