/*
 * er(ecom ria)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    er/extends/UIAction.js
 * desc:    action扩展，提供UI组件相关功能
 * author:  erik
 */

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
