/*
 * ER (Enterprise RIA)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    er/permission.js
 * desc:    权限管理器
 * author:  erik
 */

///import er;
    
/**
 * 权限管理器
 * 
 * @desc
 *      权限管理器为页面提供了是否允许访问的权限控制，也能通过isAllow方法判断是否拥有权限。
 */
er.permission = function () {
    var permissible = {};
    
    return {
        /**
         * 初始化权限数据
         * 
         * @public
         * @param {Object} data 权限数据
         */
        init: function ( data ) {
            var key, item;

            for ( key in data ) {
                item = data[ key ];

                if ( 'object' == typeof item ) {
                    er.permission.init( item );
                } else if ( item ) {
                    permissible[ key ] = item;
                }
            }
        },
        
        /**
         * 判断是否拥有权限
         * 
         * @public
         * @param {string} name 权限名
         * @return {boolean}
         */
        isAllow: function ( name ) {
            return !!permissible[ name ];
        }
    };
}();

