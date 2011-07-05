/*
 * ER (Enterprise RIA)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    er/Action.js
 * desc:    Action的构造器
 * author:  erik
 */

///import er.IAction;
///import er.template;
///import baidu.lang.inherits;
///import baidu.object.extend;

er.Action = function () {
    /**
     * 状态保持器
     * 
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

    
    
    /**
     * 绘制Action的函数
     * 
     * @inner
     * @desc
     *      挂接到ActionBase中，因为重复挂接而声明在外部
     */
    function renderAction_() {
        var me   = this,
            arg  = me.arg,
            dom  = baidu.g( arg.domId ),
            view = me.VIEW;
        
        // 获取view
        switch ( typeof view ) {
        case 'object':
            view = view[ arg.type ];
            break;
        case 'function':
            view = view.call( me );
            break;
        default:
            view = String( view );
            break;
        }
        
        er.template.merge( dom, view, me._contextId );
    }
    
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
    var Action_ = function ( obj, opt_name ) {
        var construct = arguments.callee;
        var superClazz = opt_name ? ( ActionBaseX_[ opt_name ] || construct ) : construct;
        
        var clazz = new Function();
        clazz.prototype = obj;
        baidu.inherits( clazz, superClazz );
        return clazz;
    };

    // Action的基础功能
    Action_.prototype = {
        /**
         * 进入当前action
         * 
         * @protected
         * @desc
         *      render与repaint时都从enter入口，只有path离开才leave
         *      来易来，去难去……
         * @param {Object} arg 进入的参数
         */
        enter: function ( arg ) {
            var me = this;
           
            arg = arg || {};
            // 保存argMap    
            me.arg = arg; 
            
            this.__fireEvent( 'enter' );
            
            // 重置会话上下文
            me._contextId = me._contextId || arg._contextId;
            er.context.addPrivate( me._contextId );
            
            // 初始化context
            me.__beforeinitcontext();
            me.initContext( callback );
            
            /**
             * 初始化context后的回调，用于绘制主区域或重绘控件
             * 
             * @inner
             */
            function callback() {
                me.__afterinitcontext();
                if ( arg.refresh ) {
                    me.__beforerepaint();
                    me.repaint();
                    me.__afterrepaint();
                } else {
                    me.__beforerender();
                    me.render();
                    me.__afterrender();
                }
                me.__entercomplete();
            }
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
         * context初始化完成后的内部行为
         *
         * @protected
         */      
        __afterinitcontext: function () {
            this.__fireEvent( 'afterinitcontext' );
        },

        /**
         * context初始化前的内部行为
         *
         * @protected
         */      
        __beforeinitcontext: function () {
            this.__fireEvent( 'beforeinitcontext' );
        },

        /**
         * enter完成的内部行为
         *
         * @protected
         */
        __entercomplete: function () {
            this.__fireEvent( 'entercomplete' );
        },

        RESERVE_EVENT: {
            'enter'             : 1,
            'leave'             : 1,
            'entercomplete'     : 1,
            'beforeinitcontext' : 1,
            'afterinitcontext'  : 1,
            'beforerender'      : 1,
            'afterrender'       : 1,
            'beforerepaint'     : 1,
            'afterrepaint'      : 1
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
            if ( this.RESERVE_EVENT[ type ] ) {
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

            if ( this.RESERVE_EVENT[ type ] ) {
                eventHandler = Action_[ 'on' + type ];
                if ( typeof eventHandler == 'function' ) {
                    eventHandler.call( this, eventArg );
                }
            }
        },
        
        /**
         * 初始化context
         * 
         * @prtected
         * @param {Object} argMap 初始化的参数
         * @param {Function} callback 初始化完成的回调函数
         */
        initContext: function ( callback ) {
            var me          = this,
                arg         = me.arg,
                path        = arg.path,
                queryMap    = arg.queryMap,
                ignoreState = me.IGNORE_STATE || (queryMap && queryMap.ignoreState),
                initerMap   = me.CONTEXT_INITER_MAP,
                initerList  = [],
                i           = -1,
                len         = 0,
                currState   = {},
                stateSaved  = stateHolder_.get( path ) || {},
                stateMap    = me.STATE_MAP || {},
                key, stateValue;
            
            // 先将query中的key/value装入context
            for ( key in queryMap ) {
                me.setContext( key, queryMap[ key ] );
            }
            
            /**
             * 获取state值
             * 
             * @inner
             */
            function getState( key ) {
                if ( er._util.hasValue( queryMap[ key ] ) ) {
                    return queryMap[ key ];
                } else if ( !ignoreState && er._util.hasValue( stateSaved[ key ] ) ) {
                    return stateSaved[ key ];
                }
                return stateMap[ key ];
            }
            
            // 初始化状态相关的context 
            for ( key in stateMap ) {
                stateValue = getState( key );
                currState[ key ] = stateValue;
                me.setContext( key, stateValue );
            }
            
            // 保持状态写入
            !ignoreState && ( stateHolder_.set( path, currState ) );
            
            // 初始化context initer函数的列表
            for ( key in initerMap ) {
                initerList.push( key );
                len++;
            }
            
            // 开始初始化action指定的context
            repeatCallback();
            
            /**
             * Context初始化的回调函数
             * 
             * @private
             */
            function repeatCallback() {
                i++;
                
                if ( i < len ) {
                    initerMap[ initerList[ i ] ].call( me, repeatCallback );
                } else {
                    callback();
                }
            }
        },
        
        /**
         * 绘制当前action的显示
         * 
         * @protected
         * @param {HTMLElement} dom 绘制区域的dom元素
         */
        render: renderAction_,
        
        /**
         * 重新绘制当前action的显示
         * 
         * @protected
         */
        repaint: renderAction_,
        
        /**
         * action使用的设置context
         * 
         * @protected
         * @param {string} key context名
         * @param {Object} value
         */
        setContext: function ( key, value ) {
            er.context.set( key, value, this._contextId );
        },
        
        /**
         * 获取context，可获取action所处私有环境的context
         * 
         * @protected
         * @param {string} key context名
         */
        getContext: function ( key ) {
            return er.context.get( key, this._contextId );
        },
        
        /**
         * 从context中获取请求参数字符串
         * 用于参数自动拼接
         * 
         * @protected
         * @param {Object} opt_queryMap 参数表
         * @return {string}
         */
        getQueryByContext: function ( opt_queryMap ) {
            var queryMap = opt_queryMap || this.CONTEXT_QUERY_MAP,
                buffer   = [],
                value,
                key;
                
            if ( queryMap ) {
                for ( key in queryMap ) {
                    value = this.getContext( queryMap[ key ] );
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
                value = this.getContext( key );
                if ( !er._util.hasValue( value ) ) {
                    value = '';
                }
                buffer.push( key + '=' + encodeURIComponent( value ) );
            }
            
            // 额外参数表的组装  
            for ( key in opt_extraMap ) {
                cxtKey = opt_extraMap[ key ];
                if ( typeof cxtKey == 'string' ) {
                    value = this.getContext( cxtKey );
                    if ( !er._util.hasValue( value ) ) {
                        value = '';
                    }
                    
                    buffer.push( key + '=' + encodeURIComponent( value ) );
                }
            }
            
            buffer.push( '_r=' + er._util.getUID() );
            locator_.redirect( '~' + buffer.join('&') );
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
                for ( var key in stateMap ) {
                    this.setContext( key, stateMap[ key ] );
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
        },
        
        /**
         * 离开当前action
         * 
         * @protected
         */
        leave: function () {
            this.__fireEvent( 'leave' );
            
            this.dispose();
        },
        
        
        /**
         * 执行离开时的清理动作
         * 
         * @protected
         */
        dispose: function () {
            // 释放context
            er.context.removePrivate( this._contextId );
            
            // 清空主区域
            var dom = baidu.g( this.arg.domId );
            dom && ( dom.innerHTML = '' );
        }
    }; 

    // 实现IAction
    baidu.inherits( Action_, er.IAction );
    
    // 初始化Action扩展原型对象构造器
    ActionX_ = new Function();
    ActionX_.prototype = Action_.prototype;

    /**
     * 扩展Action的功能
     * 
     * @public
     * @param {Object} obj 扩展的功能对象
     * @param {string} opt_name 扩展别名，不提供则扩展默认Action
     */
    Action_.extend = function ( obj, opt_name ) {
        var key, 
            base = Action_.prototype;
        
        if ( opt_name ) {
            base = ActionBaseX_[ opt_name ];
            if ( !base ) {
                base = new Function();
                base.prototype = obj;
                baidu.inherits( base, Action_ );

                ActionBaseX_[ opt_name ] = base;
                return;
            }
            base = base.prototype;
        }
        
        for ( key in obj ) {
            base[ key ] = obj[ key ];
        }
    };
    
    return Action_;
}();
