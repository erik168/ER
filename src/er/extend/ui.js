/*
 * ER (Enterprise RIA)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    er/extend/ui.js
 * desc:    UI扩展
 * author:  erik
 */

///import er.context;
///import er.Action;
///import er.View;

er.extend.ui = function () {
    var uiExtend = {};

    // 视图扩展
    er.View.extend( {
        /**
         * 渲染视图
         *
         * @public
         */
        render: function () {
            er.View.prototype.render.call( this );
            this._controlMap = uiExtend.adapter.init(
                baidu.g( this.target ), 
                this.UI_PROP_MAP, 
                this.model.getGUID()
            );
        },
        
        /**
         * 重绘视图
         *
         * @public
         * @param {Object} opt_controlMap 要重绘的控件集合，默认重绘所有控件
         */
        repaint: function ( opt_controlMap ) {
            opt_controlMap = opt_controlMap || this._controlMap;
        
            var key;
            var control;
            var uiAdapter = uiExtend.adapter;
           
            for ( key in opt_controlMap ) {
                control = opt_controlMap[ key ];
                if ( control ) {
                    // 重新灌入数据
                    uiAdapter.injectData( control, this.model.getGUID() );
                    
                    // 重绘控件
                    uiAdapter.repaint( control );     
                }
            }
        },

        /**
         * 获取表单控件列表
         * 
         * @public
         * @return {Array}
         */
        getInputList: function () {
            var controlMap = this._controlMap,
                inputList  = [],
                key, control;
                
            // 统计form控件列表
            for ( key in controlMap ) {
                control = controlMap[ key ];
                if ( uiExtend.adapter.isInput( control ) ) {
                    inputList.push( control );
                }
            }
            
            return inputList;
        },
        
        /**
         * 清空视图
         *
         * @public
         */
        clear: function () {
            var controlMap = this._controlMap;

            if ( controlMap ) {
                for ( key in controlMap ) {
                    uiExtend.adapter.dispose( key );
                    delete controlMap[ key ];
                }
            }
            
            this._controlMap = null;
            er.View.prototype.clear.call( this );
        }
    } );

    var adapter = {
        /**
         * 初始化一个dom内部的所有控件
         * 
         * @virtual
         * @param {HTMLElement} wrap
         * @param {Object} propMap
         * @param {string} privateContextId
         * @return {Object} 
         */
        init: function ( wrap, propMap, privateContextId ) { 
            var referMap = {}, k, main, refer, uiMap;

            function attrReplacer( attrMap ) {
                var key;
                var attrValue;
                var refer = [];
                referMap[ attrMap.id ] = refer;

                for ( key in attrMap ) {
                    attrValue = attrMap[ key ];
                    if ( typeof attrValue == 'string' && attrValue.indexOf('*') === 0 ) {
                        attrMap[ key ] = er.context.get( attrValue.substr(1), privateContextId );
                        refer.push( key + ':' + attrValue );
                    }
                }
            }
            
            uiMap = esui.init( wrap, propMap, attrReplacer );
            for ( k in uiMap ) {
                main = uiMap[ k ] && uiMap[ k ].main;
                refer = referMap[ k ];
                if ( main && refer ) {
                    main.setAttribute( 'ctxrefer', refer.join( ';' ) );
                }
            }

            return uiMap;
        },
        
        /**
         * 释放控件
         *     
         * @virtual
         * @param {Object} key
         */
        dispose: function ( key ) { 
            esui.dispose( key );
        },
        
        /**
         * 验证控件
         * 
         * @virtual
         * @param {Object} control
         * @return {boolean}
         */
        validate: function ( control ) { },
        
        /**
         * 验证控件并返回错误
         * 
         * @virtual
         * @param {Object} inputCtrl
         * @param {Object} errorMessage
         */
        validateError: function ( inputCtrl, errorMessage ) { },
        
        /**
         * 是否表单控件
         * 
         * @virtual
         * @param {Object} control
         * @return {boolean}
         */
        isInput: function ( control ) { 
            return control instanceof esui.InputControl;
        },
        
        /**
         * 是否Radio或CheckBox
         * 
         * @virtual
         * @param {Object} control
         * @return {boolean}
         */
        isInputBox: function ( control ) { 
            return control instanceof esui.BoxControl;
        },

        /**
         * 控件是否禁用
         * 
         * @virtual
         * @param {Object} control
         * @return {boolean}
         */
        isDisabled: function ( control ) { 
            if ( control ) {
                return control.isDisabled();
            }

            return false;
        },
        
        /**
         * 控件是否只读
         * 
         * @virtual
         * @param {Object} control
         * @return {boolean}
         */
        isReadOnly: function ( control ) { 
            return control.isReadOnly();
        }, 
        
        /**
         * 获取表单控件的表单名
         * 
         * @virtual
         * @param {Object} control
         */
        getInputName: function ( control ) { 
            return control.getName();
        },
        
        /**
         * 重新注入控件所需数据，通常repaint前用
         * 
         * @virtual
         * @param {Object} control
         * @param {string} privateContextId
         */
        injectData: function ( control, privateContextId ) { 
            var main = control.main;
            if ( !main ) {
                return;
            }

            var refer = main.getAttribute( 'ctxrefer' ),
                i,
                len,
                attrSeg,
                refers;
                
            if ( !refer ) {
                return;
            }
                
            refers = refer.split( ';' );
            for ( i = 0, len = refers.length; i < len; i++ ) {
                attrSeg = refers[ i ].split(':');
                control[ attrSeg[ 0 ] ] = er.context.get( attrSeg[1].substr(1), privateContextId );
            }
        },
        
        /**
         * 重绘控件
         * 
         * @virtual
         * @param {Object} control
         */
        repaint: function ( control ) { 
            control.render();
        },
        
        /**
         * 设置控件为禁用
         * 
         * @virtual
         * @param {Object} control
         */
        disable: function ( control ) { 
            control.disable();
        },
        
        /**
         * 设置控件为可用
         * 
         * @virtual
         * @param {Object} control
         */
        enable: function ( control ) { 
            control.enable();
        }
    };

    uiExtend.adapter = adapter;
    return uiExtend;
    
}();



