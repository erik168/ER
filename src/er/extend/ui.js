/*
 * ER (Enterprise RIA)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    er/extend/ui.js
 * desc:    UI扩展
 * author:  erik
 */

///import er.extend;
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
            var dataControl = {};
            var controlData = {};
            var contextId   = this.model.getGUID();;

            function attrReplacer( attrMap ) {
                var key;
                var attrValue;
                var dataName;
                var controlId = attrMap.id;

                for ( key in attrMap ) {
                    attrValue = attrMap[ key ];
                    if ( typeof attrValue == 'string' && attrValue.indexOf('*') === 0 ) {
                        dataName = attrValue.substr( 1 );

                        // 存储数据的控件引用
                        !dataControl[ dataName ] && ( dataControl[ dataName ] = [] );
                        dataControl[ dataName ].push( controlId + ':' + key );

                        // 存储控件的数据引用
                        !controlData[ controlId ] && ( controlData[ controlId ] = [] );
                        controlData[ controlId ].push( key + ':' + dataName );

                        attrMap[ key ] = er.context.get( dataName, { contextId: contextId } );
                    }
                }
            }
            
            this._dataControl = dataControl;
            this._controlData = controlData;
            this._controlMap = uiExtend.adapter.init(
                baidu.g( this.target ), 
                this.UI_PROP, 
                attrReplacer
            );
            //console.log(
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
            var refer;
            var referTmp;
            var referName;
            var referRef;
            var i;
            var len;
            var uiAdapter = uiExtend.adapter;
            var ctrlData  = this._controlData;
           
            for ( key in opt_controlMap ) {
                control = opt_controlMap[ key ];
                refer = ctrlData[ key ];

                if ( control && refer ) {
                    // 重新灌入数据
                    for ( i = 0, len = refer.length; i < len ; i++ ) {
                        referTmp = refer[ i ].split( ':' );
                        uiAdapter.setControlAttribute( 
                            control, 
                            referTmp[ 0 ],
                            this.model.get( referTmp[ 1 ] )
                        );
                    }
                    
                    // 重绘控件
                    uiAdapter.repaint( control );     
                }
            }
        },

        /**
         * 根据Model重绘视图
         *
         * @public
         * @param {string} name model数据的名称
         * @param {Any} value model新数据的值
         */
        repaintByModel: function ( name, value ) {
            var controls  = this._dataControl[ name ];
            var uiAdapter = uiExtend.adapter;
            var temp;
            var i;
            var len;
            var control;

            if ( controls ) {
                for ( i = 0, len = controls.length; i < len; i++ ) {
                    temp = controls[ i ].split( ':' );
                    control = uiAdapter.get( temp[ 0 ] );
                    uiAdapter.setControlAttribute( 
                        control, 
                        temp[ 1 ],
                        value
                    );

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
                
            // 统计input控件列表
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
            uiExtend.adapter.uninit( this._controlMap );
            this._controlMap = null;
            this._dataControl = null;
            this._controlData = null;
            er.View.prototype.clear.call( this );
        }
    } );

    er.Action.extend( {
        MODEL_SILENCE: true,

        /**
         * 移除model数据变化的监听器
         *
         * @protected
         */
        __removeModelChangeListener: function () {
            if ( this._modelChangeListener && this.model ) {
                this.model.removeChangeListener( this._modelChangeListener );
            }
        },
        
        /**
         * 添加model数据变化的监听器
         *
         * @protected
         */
        __addModelChangeListener: function () {
            if ( this.MODEL_SILENCE ) {
                return;
            }

            if ( !this._modelChangeListener ) {
                this._modelChangeListener = this.__getModelChangeListener();
            }

            this.model.addChangeListener( this._modelChangeListener );
        },
        
        /**
         * 获取model数据变化的监听器
         *
         * @protected
         * @return {Function}
         */
        __getModelChangeListener: function () {
            var me = this;

            return function ( eventArg ) {
                me.view.repaintByModel( eventArg.name, eventArg.newValue );
            };
        },

        /**
         * enter时的内部行为
         *
         * @protected
         */ 
        __enter: function () {
            this.__removeModelChangeListener();
            this.__fireEvent( 'enter' );
        },
        
        /**
         * enter完成的内部行为
         *
         * @protected
         */
        __entercomplete: function () {
            this.__fireEvent( 'entercomplete' );
            this.__addModelChangeListener();
        },

        /**
         * leave的内部行为
         *
         * @protected
         */
        __leave: function () {
            this.__fireEvent( 'leave' );
            this.__removeModelChangeListener();
        }
    } );

    var adapter = {
        /**
         * 初始化一个dom内部的所有控件
         * 
         * @virtual
         * @param {HTMLElement} wrap
         * @param {Object}      propMap
         * @param {Function}    attrReplacer
         * @return {Object} 
         */
        init: function ( wrap, propMap, attrReplacer ) {
            return esui.init( wrap, propMap, attrReplacer );
        },
        
        /**
         * 释放控件集合。通常用于释放init的返回控件集合
         * 
         * @virtual
         * @param {Object} controlMap 要释放的控件集合
         */
        uninit: function ( controlMap ) {
            if ( controlMap ) {
                for ( var key in controlMap ) {
                    uiExtend.adapter.dispose( key );
                    delete controlMap[ key ];
                }
            }
        },

        /**
         * 根据id获取控件
         * 
         * @virtual
         * @param {string} id
         * @return {Control} 
         */
        get: function ( id ) {
            return esui.get( id );
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
         * @param {Object} input
         * @return {boolean}
         */
        validate: function ( input ) {
            if ( input instanceof esui.InputControl ) {
                return input.validate();
            }

            return true;
        },
        
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
         * 设置控件所需属性
         * 
         * @virtual
         * @param {Object} control
         * @param {string} name
         * @param {Any} value
         */
        setControlAttribute: function ( control, name, value ) { 
            control[ name ] = value;
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
