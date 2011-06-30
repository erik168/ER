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
        privateContext = {};   // private级别数据容器

    return {
        /**
         * 设置应用环境上下文
         * 
         * @public
         * @param {string|Object} name 环境变量名
         * @param {Any} value 环境变量值
         * @param {string} opt_contextId 环境id
         */
        set: function ( name, value, opt_contextId ) {
            var context = opt_contextId ? privateContext[ opt_contextId ] : publicContext;
            
            if ( !context ) {
                throw new Error('ER: private context "' + opt_contextId + '" is not exist.');
            }
            context[ name ] = baidu.object.clone( value );
        },
        
        /**
         * 增加私有环境
         * 
         * @param {string} contextId 环境标识
         */
        addPrivate: function ( contextId ) {
            !privateContext[ contextId ] && ( privateContext[ contextId ] = {} );
        },
        
        /**
         * 移除私有环境
         * 
         * @param {string} contextId 环境标识
         */
        removePrivate: function ( contextId ) {
            delete privateContext[ contextId ];
        },
        
        /**
         * 获取上下文环境变量
         * 
         * @public
         * @param {string} name 上下文变量名
         * @param {string} opt_contextId 环境id
         * @return {string}
         */
        get: function ( name, opt_contextId ) {
            var value,
                priv;
                
            if ( 'string' == typeof opt_contextId ) { 
                priv = privateContext[ opt_contextId ];
                value = priv[ name ];
            }
            
            if ( er._util.hasValue( value ) ) {
                return value;
            }
            
            value = publicContext[ name ];
            if ( er._util.hasValue( value ) ) {
                return value;
            }
    
            return null;
        }
    };
}();
