/*
 * ER (Enterprise RIA)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    er/AbstractAction.js
 * desc:    Action的抽象类
 * author:  erik
 */

///import er.IAction;
///import er.context;
///import er.Model;
///import er.View;
///import er._util;
///import baidu.lang.inherits;

er.AbstractAction = function () {

    function AbstractAction_() {}

    // Action的基础功能
    AbstractAction_.prototype = {
        /**
         * 生命周期阶段声明
         */
        LIFECYCLE_PHASE: {
            'enter'             : 1,
            'leave'             : 1,
            'entercomplete'     : 1,
            'beforeloadmodel'   : 1,
            'afterloadmodel'    : 1,
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
            var viewClazz;
            var templateName;
           
            // 保存arg    
            this.arg = arg; 
            
            // 初始化guid
            if ( !this.guid ) {
                this.guid = arg._contextId;
            }

            // 初始化model
            if ( !this.hasOwnProperty( 'model' ) ) {
                this.model = new (this.model || new er.Model())();
                this.model.construct( {
                    guid    : this.guid,
                    action  : this
                } );
            }

            // 初始化视图生成器
            if ( !this.hasOwnProperty( 'view' ) ) {
                templateName = this.template || this.view || '';
                if ( typeof templateName == 'function' ) {
                    templateName = templateName.call( this );
                }
                
                viewClazz = this.view;
                if ( !viewClazz || !( viewClazz.prototype instanceof er.View ) ) {
                    viewClazz = new er.View;
                }

                this.view = new viewClazz();
                this.view.construct( {
                    target      : arg.domId,
                    template    : templateName,
                    model       : this.model
                } );
            }

            this.__moveOntoPhase( 'enter' );
            
            // 将query装填入model
            for ( key in queryMap ) {
                this.model.set( key, queryMap[ key ] );
            }

            // 初始化context
            this.__moveOntoPhase( 'beforeloadmodel' );
            this.model.load( callback );      
            
            /**
             * 初始化context后的回调，用于绘制主区域或重绘控件
             * 
             * @inner
             */
            function callback() {
                me.__moveOntoPhase( 'afterloadmodel' );
                if ( arg.refresh ) {
                    me.__moveOntoPhase( 'beforerepaint' );
                    me.view.repaint();
                    me.__moveOntoPhase( 'afterrepaint' );
                } else {
                    me.__moveOntoPhase( 'beforerender' );
                    me.view.render();
                    me.__moveOntoPhase( 'afterrender' );
                }
                me.__moveOntoPhase( 'entercomplete' );
            }
        },
        
        /**
         * 获取参数
         * 
         * @param {string} name 参数名
         * @return {string}
         */
        getQuery: function ( name ) {
            var queryMap = this.arg.queryMap || {};
            return queryMap[ name ] || '';
        },

        /**
         * 离开当前action
         * 
         * @protected
         */
        leave: function () {
            this.__moveOntoPhase( 'leave' );
            this.dispose();
        },
        
        /**
         * 执行离开时的清理动作
         * 
         * @protected
         */
        dispose: function () {
            // 释放model
            this.model.dispose();
            delete this.model;
            
            // 清空视图
            this.view.clear();
            delete this.view;
        }
    };

    baidu.inherits( AbstractAction_, er.IAction );
    return AbstractAction_;

}();
