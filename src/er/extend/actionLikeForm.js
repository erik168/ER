/*
 * ER (Enterprise RIA)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    er/extend/actionLikeForm.js
 * desc:    Form功能的action扩展
 * author:  erik
 */

///import er.Action;
///import er.extend.ui;
///import er.extend.actionEnhance;

er.extend.actionLikeForm = function () {
    var uiExtend = er.extend.ui;
    
    var actionExt = {
        /**
         * 验证表单控件的值是否合法
         * 
         * @param {Object} opt_inputList 表单控件数组
         * @return {boolean}
         */
        validateForm: function ( opt_inputList ) {
            var isValid     = true,
                inputList   = opt_inputList || this.view.getInputList(),
                i, len, input;
                
            for ( i = 0, len = inputList.length; i < len; i++ ) {
                input = inputList[ i ];

                if ( uiAdapter.isDisabled( input ) ) {
                    continue;
                }
                
                if ( !uiAdapter.validate( input ) ) {
                    isValid = false;
                }
            }
            
            return isValid;
        },

        /**
         * 获取返回按钮的处理函数
         * 
         * @protected
         * return {Function}
         */
        getSubmitCancel: function () {
            var me = this;
            
            return function () {
                me.back();
            };
        },

        /**
         * 完成提交数据
         * 
         * @protected
         * return {Function}
         */
        getSubmitFinish: function () {
            var me = this;
                
            return function ( data ) {
                var inputList   = me.view.getInputList(),
                    len         = inputList.length,
                    i, input,
                    errorMap,
                    errorMessage;
                    
                // 当后端验证失败时
                // 处理后端验证结果
                if ( data.status != 0 ) {
                    errorMap = data.message.field;
                    
                    for ( i = 0; i < len; i++ ) {
                        input = inputList[ i ];
                        errorMessage = errorMap[ uiExtend.getInputName( input ) ];
                        if ( errorMessage ) {
                            uiExtend.validateError( input, errorMessage );
                        }
                    }

                    return;
                }
                
                // onsubmitfinished事件触发
                if ( !me.onsubmitfinished || me.onsubmitfinished( data ) !== false ) {
                    me.back();
                }
            };
        },

        /**
         * 获取表单的请求参数字符串
         * 用于参数自动拼接
         * 
         * @protected
         * @param {Object} opt_inputList 控件数组
         * @param {Object} opt_queryMap 参数表
         * @return {string}
         */
        getQueryByForm: function ( opt_inputList, opt_queryMap ) {
            var queryMap    = opt_queryMap || this.INPUT_QUERY_MAP || {},
                inputList   = opt_inputList || this.view.getInputList(),
                finished    = {},
                i, len, 
                input,
                inputName, 
                value,
                queryString,
                queryBuf = [];
            
            for ( i = 0, len = inputList.length; i < len; i++ ) {
                input = inputList[i];
                

                if ( uiExtend.isInput( input ) 
                     && !uiExtend.isDisabled( input )
                ) {
                    inputName = uiExtend.getInputName( input );

                    if ( inputName ) {
                        // 已拼接的参数不重复拼接
                        if ( finished[ inputName ] ) {
                            continue;
                        }
                        
                        // 记录拼接状态
                        finished[ inputName ] = 1;
                        
                        // 读取参数名映射
                        inputName = queryMap[ inputName ] || inputName;
                        
                        // 获取input值
                        if ( uiExtend.isInputBox( input ) ) {
                            value = input.getGroup().getValue().join(',');
                        } else {
                            value = input.getValue();
                        }
                        
                        // 拼接参数
                        queryBuf.push( inputName + '=' + encodeURIComponent( value ) );
                    } else if ( 'function' == typeof input.getQueryString ) {
                        // 拼接参数
                        queryString = input.getQueryString();
                        if ( 'string' == typeof queryString ) {
                            queryBuf.push( queryString );
                        }
                    }
                }
            }
            
            return queryBuf.join('&');
        }
    };

    er.Action.extend( actionExt );
    return actionExt;
}();

