/*
 * ER (Enterprise RIA)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    extends/UIAction.js
 * desc:    Action扩展，提供UI组件相关功能
 * author:  erik
 */

///import er.Action;

/**
 * er框架用于控件操作的适配层
 */
er.UIAdapter = {
    /**
     * 初始化一个dom内部的所有控件
     * 
     * @param {HTMLElement} wrap
     * @param {Object} propMap
     * @param {string} privateContextId
     * @return {Object} 
     */
    init: function (wrap, propMap, privateContextId) {
        var referMap = {}, k, main, refer, uiMap;

        function attrReplacer( attrMap ) {
            var key;
            var attrValue;
            var refer = [];
            referMap[attrMap.id] = refer;

            for (key in attrMap) {
                attrValue = attrMap[key];
                if (typeof attrValue == 'string' && attrValue.indexOf('*') === 0) {
                    attrMap[key] = er.context.get(attrValue.substr(1), privateContextId);
                    refer.push(key + ':' + attrValue);
                }
            }
        }
        
        uiMap = ui.util.init(wrap, propMap, attrReplacer);
        for (k in uiMap) {
            main = uiMap[k] && uiMap[k].getMain();
            refer = referMap[k];
            if (main && refer) {
                main.setAttribute('ctxrefer', refer.join(';'))
            }
        }

        return uiMap;
    },
    
    /**
     * 释放控件
     *     
     * @param {Object} key
     */
    dispose: function (key) {
        ui.util.dispose(key);
    },
    
    /**
     * 验证控件
     * 
     * @param {Object} control
     * @return {boolean}
     */
    validate: function (control) {
        return control.validate();
    },
    
    /**
     * 验证控件并返回错误
     * 
     * @param {Object} formCtrl
     * @param {Object} errorMessage
     */
    validateError: function (formCtrl, errorMessage) {
        formCtrl.errorMessage = errorMessage;
        ui.util.validate(formCtrl, 'backendError');
        formCtrl.errorMessage = null;
    },
    
    /**
     * 是否表单控件
     * 
     * @param {Object} control
     * @return {boolean}
     */
    isForm: function (control) {
        return control && control['__ui-input__'];
    },
    
    /**
     * 是否Radio或CheckBox
     * 
     * @param {Object} control
     * @return {boolean}
     */
    isInputBox: function (control) {
        return control && control['__ui-input-box__'];
    },

    /**
     * 控件是否disabled状态
     * 
     * @param {Object} control
     * @return {boolean}
     */
    isDisabled: function (control) {
        return control.getState('disabled');
    },
    
    /**
     * 控件是否只读
     * 
     * @param {Object} control
     * @return {boolean}
     */
    isReadOnly: function (control) {
        return control.getState('readonly');
    }, 
    
    /**
     * 获取表单控件的表单名
     * 
     * @param {Object} control
     */
    getFormName: function (control) {
        return control.formName;
    },
    
    /**
     * 重新注入控件所需数据，通常repaint前用
     * 
     * @param {Object} control
     * @param {string} privateContextId
     */
    injectData: function (control, privateContextId) {
        var main = control.getMain();
        if (!main) {
            return;
        }

        var refer = main.getAttribute('ctxrefer'),
            i,
            len,
            attrSeg,
            refers;
            
        if (!refer) {
            return;
        }
            
        refers = refer.split(';');
        for (i = 0, len = refers.length; i < len; i++) {
            attrSeg = refers[i].split(':');
            control[attrSeg[0]] = er.context.get(attrSeg[1].substr(1), privateContextId);
        }
    },
    
    /**
     * 重绘控件
     * 
     * @param {Object} control
     */
    repaint: function (control) {
        control.render(control.getMain(), false);
    },
    
    /**
     * 设置form控件的disable状态
     * 
     * @param {Object} control
     * @param {boolean} disabled
     */
    disable: function (control, disabled) {
        if (er.UIAdapter.isForm(control)) {
            control.disable(disabled);
        }
    }
};

er.Action.extend({
    /**
     * 绘制当前action的显示
     * 
     * @protected
     */
    render: function () {
        var me = this;
        
        er.Action.prototype.render.call(me);
        me._controlMap = er.UIAdapter.init(baidu.g(me.arg.domId), me.UI_PROP_MAP, me._contextId);
    },
    
    /**
     * 重新绘制当前action的显示
     * 
     * @protected
     */
    repaint: function (controlMap) {
        controlMap = controlMap || this._controlMap;
        
        var key, 
            control,
            uiAdapter = er.UIAdapter;
       
        for (key in controlMap) {
            control = controlMap[key];
            if (!control) {
                continue;
            }
            
            uiAdapter.injectData(control, this._contextId);  // 重新灌入数据
            uiAdapter.repaint(control);     // 重绘控件
        }
    },
    
    /**
     * 获取表单控件列表
     * 
     * @protected
     * @return {Array}
     */
    getFormList: function () {
        var controlMap = this._controlMap,
            formList = [],
            key, control;
            
        // 统计form控件列表
        for (key in controlMap) {
            control = controlMap[key];
            if (er.UIAdapter.isForm(control)) {
                formList.push(control);
            }
        }
        
        return formList;
    },
        
    /**
     * 获取表单的请求参数字符串
     * 用于参数自动拼接
     * 
     * @protected
     * @param {Object} opt_queryMap 参数表
     * @param {Object} opt_formList 控件数组
     * @return {string}
     */
    getQueryByForm: function (opt_queryMap, opt_formList) {
        var queryMap = opt_queryMap || this.FORM_QUERY_MAP || {},
            formList = opt_formList || this.getFormList(),
            finished = {},
            i, len, 
            control, formName, 
            value, queryString,
            uiAdapter = er.UIAdapter,
            queryBuf = [];
        
        for (i = 0, len = formList.length; i < len; i++) {
            control = formList[i];
            formName = uiAdapter.getFormName(control);

            if (uiAdapter.isForm(control) && !uiAdapter.isDisabled(control)) {
                    
                if (formName) {
                    // 已拼接的参数不重复拼接
                    if (finished[formName]) {
                        continue;
                    }
                    
                    // 记录拼接状态
                    finished[formName] = 1;
                    
                    // 读取参数名映射
                    formName = queryMap[formName] || formName;
                    
                    // 获取form值
                    if (uiAdapter.isInputBox(control)) {
                        value = control.getGroup().getValue().join(',');
                    } else if ('function' == typeof control.getQueryValue) {
                        value = control.getQueryValue();
                    } else {
                        value = control.getValue();
                    }
                    
                    // 拼接参数
                    queryBuf.push(formName + '=' + encodeURIComponent(value));
                } else if ('function' == typeof control.getQueryString) {
                    // 拼接参数
                    queryString = control.getQueryString();
                    if ('string' == typeof queryString) {
                        queryBuf.push(queryString);
                    }
                }
            }
        }
        
        // 拼接action给与的额外参数
        if ('function' == typeof this.getExtraQueryByForm) {
            queryString = this.getExtraQueryByForm();
            if ('string' == typeof queryString) {
                queryBuf.push(queryString);
            }
        }
        
        return queryBuf.join('&');
    },
    
    /**
     * 验证表单控件的值是否合法
     * 
     * @protected
     * @param {Object} opt_formList 控件数组
     * @return {boolean}
     */
    validateForm: function (opt_formList) {
        var isValid = true,
            formList = opt_formList || this.getFormList(),
            uiAdapter = er.UIAdapter,
            i, len, control;
            
        for (i = 0, len = formList.length; i < len; i++) {
            control = formList[i];
            if (uiAdapter.isDisabled(control) || uiAdapter.isReadOnly(control)) {
                continue;
            }
            
            if (!uiAdapter.validate(control)) {
                isValid = false;
            }
        }
        
        return isValid;
    },
    
    /**
     * 完成提交数据
     * 
     * @protected
     * return {Function}
     */
    getSubmitFinish: function () {
        var me = this;
            
        return function (data) {
            var formList = me.getFormList(),
                len = formList.length,
                i = 0,
                errorMap,
                formCtrl,
                errorMessage;
                
            // 当后端验证失败时
            // 处理后端验证结果
            if ( data.status != 0 ) {
                errorMap = data.message.field;
                
                for (; i < len; i++) {
                    formCtrl = formList[i];
                    errorMessage = errorMap[formCtrl.formName];
                    if (errorMessage) {
                        er.UIAdapter.validateError(formCtrl, errorMessage);
                    }
                }

                return;
            }
            
            // onsubmitfinished事件触发
            if (!me.onsubmitfinished || me.onsubmitfinished(data) !== false) {
                me.back();
            }
        };
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
        }
    },
    
    /**
     * 执行离开时的清理动作
     * 
     * @protected
     */
    dispose: function () {
        // 卸载现有组件
        var controlMap = this._controlMap;

        if (controlMap) {
            for (key in controlMap) {
                er.UIAdapter.dispose(key);
                delete controlMap[key];
            }
        }
        
        er.Action.prototype.dispose.call(this);
    }
});
