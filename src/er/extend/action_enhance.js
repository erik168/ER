/*
 * ER (Enterprise RIA)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    er/extend/actionEnhance.js
 * desc:    Action增强包，提供额外的Action操作功能
 * author:  erik
 */

///import er.extend;
///import er.Action;
///import er._util;

er.extend.actionEnhance = (function () {
    /**
     * 状态保持器
     * 
     * @inner
     * @desc
     *      状态保持器能根据path保持相关Context狀態
     */
    var stateHolder_ = (function () {
        var stateMap = {};

        return {
            /**
             * 获取状态
             * 
             * @public
             * @param {string} path 状态名
             * @return {Object}
             */
            'get': function ( path ) {
                return stateMap[ path ] || null;
            },
            
            /**
             * 设置状态
             * 
             * @public
             * @param {string} key 状态名
             * @param {Object} state 状态對象
             */
            'set': function ( path, state ) {
                stateMap[ path ] = state;
            }
        };
    })();
    
    var enhance = {
        /**
         * 从model中获取请求参数字符串
         * 用于参数自动拼接
         * 
         * @protected
         * @param {Object} opt_queryMap 参数表
         * @return {string}
         */
        getQueryStringByModel: function ( opt_queryMap ) {
            var queryMap = opt_queryMap || this.MODEL_QUERY_MAP;
            return this.model.getQueryString( queryMap );
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
            
            // 自动组装state    
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
            
            er.locator.redirect( this.arg.path + '~' + buffer.join('&'), { enforce: true } );
        },

        /**
         * 重新载入action
         *
         * @protected
         */
        reload: function () {
            this.leave();
            this.enter( this.arg );
        },

        /**
         * 重置状态值
         * 
         * @protected
         * @param {string} opt_name 需要重置的状态名，不提供时重置所有状态
         */
        resetState: function ( opt_name ) {
            var stateMap = this.STATE_MAP || {};
            var defValue;
            
            if ( !opt_name ) {
                for ( opt_name in stateMap ) {
                    this.model.set( opt_name, stateMap[ opt_name ] );
                }
            } else {
                defValue = stateMap[ opt_name ];

                if ( er._util.hasValue( defValue ) ) {
                    this.model.set( opt_name, defValue );
                }
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
            er.locator.redirect( referer );
        },
        
        /**
         * model加载前的内部行为，实现状态保持
         *
         * @protected
         * @override
         */  
        __beforeloadmodel: function () {
            var arg         = this.arg;
            var path        = arg.path;
            var queryMap    = arg.queryMap;
            var stateMap    = this.STATE_MAP || {};
            var stateSaved  = stateHolder_.get( path ) || {};
            var ignoreState = this.IGNORE_STATE || (queryMap && queryMap.ignoreState);

            var key, value;
            var state = {};
            
            // 状态恢复与保存
            if ( !ignoreState ) {
                for ( key in stateMap ) {
                    value = queryMap[ key ];
                    if ( !er._util.hasValue( value ) ) {
                        value = stateSaved[ key ];

                        if ( !er._util.hasValue( value ) ) {
                            value = stateMap[ key ];
                        }
                    }

                    state[ key ] = value;
                    this.model.set( key, value );
                }

                stateHolder_.set( path, state );
            }

            this.__fireEvent( 'beforeloadmodel' );
        }
    };

    er.Action.extend( enhance );
    return enhance;
})();
