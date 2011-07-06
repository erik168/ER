/*
 * ER (Enterprise RIA)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    er/AbstractAction.js
 * desc:    Action的抽象类
 * author:  erik
 */

///import er.IAction;
///import er.template;
///import er.context;
///import baidu.lang.inherits;

er.AbstractAction = function () {
    
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

    function AbstractAction_() {}

    // Action的基础功能
    AbstractAction_.prototype = {
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
         * 生命周期阶段声明
         */
        LIFECYCLE_PHASE: {
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
         * 进入阶段
         *
         * @private
         * @param {string} phase 阶段名
         */
        __moveOntoPhase: function ( phase ) {
            if ( this.LIFECYCLE_PHASE[ phase ] ) {
                this._phase = phase;
                this[ '__' + phase ] && this[ '__' + phase ].call( this );
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
         * 进入当前action
         * 
         * @protected
         * @param {Object} arg 进入的参数
         * @desc
         *      render与repaint时都从enter入口，只有path离开才leave
         *      来易来，去难去……
         */
        enter: function ( arg ) {
            arg = arg || {};

            var me = this;
            var queryMap = arg.queryMap || {};
            var key;
           
            // 保存arg    
            me.arg = arg; 
            
            this.__moveOntoPhase( 'enter' );
            
            // 重置会话上下文
            me._contextId = me._contextId || arg._contextId;
            er.context.addPrivate( me._contextId );
            
            // 将query装填入context
            for ( key in queryMap ) {
                me.setContext( key, queryMap[ key ] );
            }

            // 初始化context
            me.__moveOntoPhase( 'beforeinitcontext' );
            me.initContext( callback );
            
            /**
             * 初始化context后的回调，用于绘制主区域或重绘控件
             * 
             * @inner
             */
            function callback() {
                me.__moveOntoPhase( 'afterinitcontext' );
                if ( arg.refresh ) {
                    me.__moveOntoPhase( 'beforerepaint' );
                    me.repaint();
                    me.__moveOntoPhase( 'afterrepaint' );
                } else {
                    me.__moveOntoPhase( 'beforerender' );
                    me.render();
                    me.__moveOntoPhase( 'afterrender' );
                }
                me.__moveOntoPhase( 'entercomplete' );
            }
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
                initerMap   = me.CONTEXT_INITER_MAP,
                initerList  = [],
                i           = -1,
                len         = 0,
                key;
            
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
             * @inner
             */
            function repeatCallback() {
                i++;
                
                if ( i < len ) {
                    initerMap[ initerList[ i ] ].call( me, repeatCallback );
                } else {
                    callback();
                }
            }
        }
    };

    baidu.inherits( AbstractAction_, er.IAction );
    return AbstractAction_;

}();
