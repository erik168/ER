/*
 * ER (Enterprise RIA)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    extends/EnhanceAction.js
 * desc:    Action增强包，提供额外的Action操作功能
 * author:  erik
 */

///import er.Action;
///import er._util;

(function () {
    er.Action.extend( {
        /**
         * 从context中获取请求参数字符串
         * 用于参数自动拼接
         * 
         * @protected
         * @param {Object} opt_queryMap 参数表
         * @return {string}
         */
        getQueryByModel: function ( opt_queryMap ) {
            var queryMap = opt_queryMap || this.CONTEXT_QUERY_MAP,
                buffer   = [],
                value,
                key;
                
            if ( queryMap ) {
                for ( key in queryMap ) {
                    value = this.model.get( queryMap[ key ] );
                    if ( er._util.hasValue( value ) ) {
                        buffer.push( key + '=' + encodeURIComponent( value ) );
                    }
                }
                
                return buffer.join( '&' );
            }
            
            return '';
        },
        
        /**
         * 刷新当前action页面
         * 
         * @protected
         * @param {Object} opt_extraMap 额外参数表,(KV)queryName/contextName
         */
        refresh: function ( opt_extraMap ) {
            opt_extraMap = opt_extraMap || {};
            var key, 
                cxtKey,
                path     = this.arg.path,
                stateMap = this.STATE_MAP,
                buffer   = [],
                value;
            
            // 自动组装state对应的context    
            for ( key in stateMap ) {
                value = this.model.get( key );
                if ( !er._util.hasValue( value ) ) {
                    value = '';
                }
                buffer.push( key + '=' + encodeURIComponent( value ) );
            }
            
            // 额外参数表的组装  
            for ( key in opt_extraMap ) {
                cxtKey = opt_extraMap[ key ];
                if ( typeof cxtKey == 'string' ) {
                    value = this.model.get( cxtKey );
                    if ( !er._util.hasValue( value ) ) {
                        value = '';
                    }
                    
                    buffer.push( key + '=' + encodeURIComponent( value ) );
                }
            }
            
            buffer.push( '_r=' + er._util.getUID() );
            er.locator.redirect( '~' + buffer.join('&') );
        },

        /**
         * 重置状态值
         * 
         * @protected
         * @param {string} opt_name 需要重置的状态名，不提供时重置所有状态
         */
        resetState: function ( opt_name ) {
            var stateMap = this.STATE_MAP;
            
            if ( !opt_name ) {
                for ( opt_name in stateMap ) {
                    this.setContext( opt_name, stateMap[ opt_name ] );
                }
            } else {
                this.setContext( opt_name, stateMap[ opt_name ] );
            }
        },
        
        /**
         * 返回上一个location
         * 
         * @protected
         */
        back: function () {
            var arg = this.arg,
                referer = arg && arg.referer;
                
            if ( arg.type != 'main' ) {
                return;
            }
            
            // 沿路返回或返回配置的location
            if ( !referer || this.USE_BACK_LOCATION ) {
                referer = this.BACK_LOCATION;
            }
            locator_.redirect( referer );
        }
    } );
})();
