/*
 * esui (ECOM Simple UI)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    ui/Label.js
 * desc:    标签显示控件
 * author:  erik, tongyao, yanjunyi
 * date:    $Date$
 */

/**
 * 标签显示控件
 * 
 * @param {Object} options 控件初始化参数
 */
ui.Label = function (options) {
    // 初始化参数
    this.__initOptions(options);
    
    // 类型声明，用于生成控件子dom的id和class
    this._type = 'label';
};

ui.Label.prototype = {
    /**
     * 渲染控件
     * 
     * @param {Object} main 控件挂载的DOM
     */
    render: function (main) {
        var me = this;
        
        ui.Base.render.call(me, main, true);
        
        main = me._main;
        if (main) {
            main.innerHTML = me.text;
            if (me.title) {
                main.setAttribute('title', me.title);
            }
        }
    }
};

ui.Base.derive(ui.Label);
