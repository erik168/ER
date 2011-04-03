/*
 * er(ecom ria)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    er/UIAdapter.js
 * desc:    er框架用于控件操作的适配层
 * author:  erik
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



