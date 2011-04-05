/*
 * ESUI (Enterprise Simple UI)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    ui/FormTab.js
 * desc:    表单Tab控件
 * author:  zhaolei, erik
 * date:    $Date: 2011-04-05 15:57:33 +0800 (二, 05  4 2011) $
 */

/**
 * 表单Tab控件
 *
 * @constructor
 * @param {object} options 构造的选项.
 */
ui.FormTab = function (options) {
    this.__initOptions(options);
    this.disableHidden = 1;
    
    this.__initOption('autoDisabled', null, 'AUTO_DISABLED');
    this.tabs = this.datasource || this.tabs || [];
};

ui.FormTab.prototype = {
    /**
     * 初始化FormTab
     *
     * @public
     */
    init: function() {
        var me = this;
        if (!me.isInited) {
            me._initEvent();
            me.isInited = 1;
        }
        
        setTimeout(function () {
                me._resetPanel();
            }, 
        0);
    },
    
    /**
     * 初始化FormTab的行为
     *
     * @private
     */
    _initEvent: function () {
        var tabs = this.tabs;
        var len = tabs.length;
        var i;
        var tab;
        var radio;
        
        for (i = 0; i < len; i++) {
            tab = tabs[i];
            radio = tab.radio;
            if (radio) {
                radio = ui.get(radio);
                radio && (radio.onclick = this._getRadioClickHandler(i));
            }
        }
    },
    
    _getRadioClickHandler: function (index) {
        var me = this;
        return function () {
            return me._select(index);
        };
    },
    
    /**
     * 选择标签
     * 
     * @private
     * @param {number} index 标签序号
     */
    _select: function (index) {
        if (this.onchange(index, this.tabs[index]) !== false) {
            this.activeIndex = index;
            this._resetPanel();
            return;
        }

        return false;
    },
    
    onchange: new Function(),
    
    /**
     * 重置tab对应的panel的显示隐藏状态
     * 
     * @private
     */
    _resetPanel: function () {
        var tabs = this.tabs;
        var len = tabs.length;
        var i;
        var tab;
        var panel;
        var radio;
        var checked;

        for (i = 0; i < len; i++) {
            tab = tabs[i];
            radio = tab.radio;
            panel = tab.panel;
            panel = panel && baidu.g(panel);

            if (radio && panel) {
                radio = ui.get(radio);
                if (radio) {
                    checked = radio.getChecked();

                    this.autoDisabled 
                        && ui.util.disableFormByContainer(panel, !checked);
                    panel.style.display = checked ? '' : 'none';
                }
            }
        }
    },

    /**
     * 释放控件
     * 
     * @public
     */
    dispose: function () {
    	var me = this;   
    	ui.Base.dispose.call(me);
    }
};

ui.FormTab.AUTO_DISABLED = 1;
ui.Base.derive(ui.FormTab);
