/*
 * ESUI (Enterprise Simple UI)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    ui/TextLine.js
 * desc:    带行号的文本输入框控件
 * author:  zhouyu, erik
 * date:    $Date: 2011-04-05 15:57:33 +0800 (二, 05  4 2011) $
 */

ui.TextLine = function (options) {
    this.__initOptions(options);
    this._type = "textline";
    this.number = 1;
    
    this._controlMap = {};
    this._lineId = this.__getId('line');
    this._textId = this.__getId('text');
};

ui.TextLine.prototype = {
    _tpl: '<div id="{0}" class="{2}">1</div><textarea ui="type:TextInput;id:{1}"></textarea>',
    
    /**
     * 渲染控件
     *
     * @public
     * @param {Object} main 控件挂载的DOM
     */
    render: function(main){
        var me = this;

        if (!me._isRender) {
            ui.Base.render.call(me, main);
            
            me._renderMain();
            me._refreshLine();
            me._bindEvent();
            me._isRender = 1;

            // 绘制宽高
            me.width && (main.style.width = me.width + 'px');
            me.height && (main.style.height = me.height + 'px');
        }
        
        if ( me._isRender ) {
            me._controlMap.text.setValue(me.value);
        }
    },
    
    /**
     * 绑定事件
     *
     * @private
     */
    _bindEvent: function(){
        var me = this;

        var text = me._controlMap.text;
        text.onchange = me._getLineRefresher();
        text.getMain().onscroll = me._getScrollReseter();

        me._lineEl.onscroll = me._getScrollLineReseter();
    },
    
    /**
     * 获取number行滚动条位置的重置器
     *
     * @private
     * @return {Function}
     */
    _getScrollLineReseter: function () {
        var me = this;
        return function () {
            me._resetScrollByLine();
        };
    },

    /**
     * 获取滚动条位置的重置器
     *
     * @private
     * @return {Function}
     */
    _getScrollReseter: function () {
        var me = this;
        return function () {
            me._resetScroll();
        };
    },
    
    /**
     * 获取行刷新的handler
     *
     * @private
     * @return {Function}
     */
    _getLineRefresher: function () {
        var me = this;
        return function(){
            me._refreshLine();
        };
    },
    
    /**
     * 绘制主区域
     *
     * @private
     */
    _renderMain: function(){
        var me = this;
        var main = me._main;
        var lineId = me._lineId;
        var textId = me._textId;

        var propMap = {};
        propMap[textId] = {
            width: me.width - 24,
            height: me.height - 1,
            value: me.value
        };

        main.innerHTML = ui._format(
                            me._tpl, 
                            lineId, 
                            textId,
                            me.__getClass('line')
                        );
        me._controlMap.text = ui.util.init(main, propMap)[textId];
        me._lineEl = baidu.g(lineId);
        me._lineEl.style.height = me.height + "px";
    },
    
    /**
     * 重置行号，增加内容和keyup时可调用
     *
     * @private
     */
    _refreshLine: function(){
        var me = this;
        var html = [];
        var i;
        var num = me._controlMap['text']
                    .getValue()
                    .split("\n")
                    .length;

        if (num != me.number) {
            me.number = num;
            for (i = 1; i < num + 1; i++) {
                html.push(i);
            }
            me._lineEl.innerHTML = html.join("<br />");
        }
        me._resetScroll();
    },
    
    
    /**
     * 滚动文本输入框
     */
    _resetScroll: function(){
        var me = this;
        me._lineEl.scrollTop = me._controlMap.text.getMain().scrollTop;
    },
    
    /**
     * 滚动数字区域
     */
    _resetScrollByLine: function(){
        var me = this;
        me._controlMap.text.getMain().scrollTop = me._lineEl.scrollTop;
    },
    
    /**
     * 增加内容
     *
     * @public
     * @param {Array} lines
     */
    addLines: function (lines) {
        var me = this;
        var text = me._controlMap.text;
        var content = lines.join('\n');
        var value = me.getValue();

        if (value.lenght > 0) {
            content = value + '\n' + content;
        }

        text.setValue(content);
        me._refreshLine();
    },
    
    /**
     * 设置内容字符串形式
     *
     * @public
     * @param {string} value
     */
    setValue: function (value) {
        var text = this._controlMap.text;
        text.setValue(value);
    },
    
    /**
     * 获取内容字符串形式
     *
     * @public
     * @return {string}
     */
    getValue: function() {
        var text = this._controlMap.text;
        return baidu.trim(text.getValue().replace(/\r/g, ''));
    },
     
    /**
     * 获取内容数组形式,去重并去除空串内容
     *
     * @public
     * @return {Array}
     */
    getValueItems: function(){
        var items = this.getValue().split('\n');
        var len = items.length;
        var i;
        var value;
        var container = {};
        var result = [];

        for (i = 0; i < len; i++) {
            value = baidu.trim(items[i]);
            if (value.length === 0 || container[value]) {
                continue;
            }
            container[value] = 1;
            result.push(value);
        }

        return result;
    },
    
    /**
     * 释放
     * 
     * @public
     */
    dispose: function () {
        this._lineEl.onscroll = null;
        this._lineEl = null;

        ui.Base.dispose.call(this);
    }
}

ui.BaseInput.derive(ui.TextLine);
