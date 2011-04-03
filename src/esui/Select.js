/*
 * esui (ECOM Simple UI)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    ui/Select.js
 * desc:    下拉选择框
 * author:  erik, zhaolei, linzhifeng
 * date:    $Date$
 */


/**
 * 下拉选择框控件
 * 
 * @param {Object} options 参数
 */
ui.Select = function(options) {
    this.__initOptions(options);
    this._type = 'select';
    this._controlMap = {};
   
    this.__initOption('maxItem', null, 'MAX_ITEM');
    this.__initOption('emptyText', null, 'EMPTY_TEXT');
    this.emptyLabel = ui._format(this._tplLabel,  this.__getClass('text-def'), this.emptyText);
    
    this.datasource = this.datasource || [];
    this.index = -1;
};

ui.Select.EMPTY_TEXT = '请选择';
ui.Select.MAX_ITEM = 8;  // 浮动层最大选项设置，超出则浮动层出现滚动条

ui.Select.prototype = {
    // 主体部分模板
    _tplMain: '<div id="{0}" class="{1}" value="" style="width:{3}px"><nobr>{2}</nobr></div><div class="{4}" arrow="1"></div>',
    
    // 无选择时主区域显示的内容
    _tplLabel: '<span class="{0}">{1}</span>',

    /**
     * 获取主体部分HTML
     * 
     * @return {string}
     */
    _getMainHtml: function() {
        var me = this;
        
        return ui._format(me._tplMain,
                            me.__getId('text'),
                            me.__getClass('text'),
                            me.staticText || me.emptyLabel,
                            me.width - 20,
                            me.__getClass('arrow')
            );
    },
    
    /**
     * 将控件添加到某个dom元素中
     * 
     * @param {HTMLElement} wrap 目标dom
     */
    appendTo: function (wrap) {
        if (this._main) {
            return;
        }

        var main = document.createElement('div');
        wrap.appendChild(main);
        this.render(main);
    },
    
    /**
     * 绘制控件
     * 
     * @param {HTMLElement} main 外部容器
     */
    render: function(main) {
        var me = this,
            value = me.value;

        if ( !me._isRender ) {
            ui.Base.render.call(me, main, true);

            me.formName     = main.getAttribute('name');
            main.innerHTML  = me._getMainHtml();
            main.onclick    = me._getMainClickHandler();

            me._isRender = 1;
        }
        
        main = me._main;
        if ( !main ) {
            return;
        }

        me.width && (main.style.width = me.width + 'px');

        me._renderLayer();
        me.setValue(value);

        me.setReadOnly ( !!me.readOnly );
        me.disable( !!me.disabled );
    },
    
    /**
     * 绘制下拉列表
     *
     * @private
     */
    _renderLayer: function() {
        var me = this,
            layerId = me.__getId('layer'),
            layer = me.getLayer(),
            layerMain,
            layerMainWidth,
            len = me.datasource.length,
            maxItem = me.maxItem,
            itemHeight;
        
        if (!layer) {
            layer = ui.util.create('Layer', {
                    id      : layerId,
                    autoHide: 'click',
                    retype  : 'select-layer'
                });
            layer.appendTo();
            me._controlMap['layer'] = layer;
            layer.onhide = me._getLayerHideHandler();
        }
        
        
        layerMain = layer.getMain();
        layerMain.style.width   = 'auto';
        layerMain.style.height  = 'auto';
        layerMain.innerHTML     = me._getLayerHtml();
        layerMainWidth          = layerMain.offsetWidth;

        if (len > maxItem) {
            itemHeight = layerMain.firstChild.offsetHeight;
            layerMain.style.height = maxItem * (itemHeight + 1) + 'px';
            layerMainWidth += 17;
        }

        if (layerMainWidth < me.width) {
            layer.setWidth(me.width);
        } else {
            layer.setWidth(layerMainWidth);
        }
        
        // TODO:页面resize的时候需要调整浮动层的位置
    },
    
    /**
     * 获取浮动层关闭的handler
     * 
     * @private
     * @return {Function}
     */
    _getLayerHideHandler: function () {
        var me = this;
        return function () {
            me.removeState('active');
        };
    },

    // Layer中每个选项的模板
    _tplItem: '<div id="{0}" {10} class="{1}" index="{2}" value="{3}" dis="{4}" onmouseover="{6}" onmouseout="{7}" onclick="{8}">{9}<nobr>{5}</nobr></div>',
    
    // Item中图标层的模板
    _tplIcon: '<span class="{0}"></span>',
    
    /**
     * 获取下拉列表层的HTML
     * 
     * @return {string}
     */
    _getLayerHtml: function () {
        var me = this,
            datasource = me.datasource,
            i = 0,
            len = datasource.length,
            html = [],
            strRef = me.__getStrRef(),
            basicClass = me.__getClass('item'),
            itemClass,
            dis,
            item,
            iconClass,
            iconHtml,
            titleTip;

        for (; i < len; i++) {
            itemClass = basicClass;
            dis = 0;
            item = datasource[i];
            iconHtml = '';
            titleTip = '';
            
            // 初始化icon的HTML
            if (item.icon) {
                iconClass = me.__getClass('icon-' + item.icon);
                iconHtml = ui._format(me._tplIcon, iconClass);
            }
            
            // 初始化基础样式
            if (item.style) {
                itemClass += ' ' + basicClass + '-' + item.style;
            }
            
            // 初始化不可选中的项
            if (item.disabled) {
                dis = 1;
                itemClass += ' ' + basicClass + '-disabled'; 
            }
            
            // 初始化选中样式
            if (item.value == me.value) {
                itemClass += ' ' + me.__getClass('item-selected')
            }
            if (me.titleTip) {
                titleTip = 'title="' + item.name + iconHtml + '"';
            }
            
            html.push(
                ui._format(me._tplItem,
                    me.__getId('item') + i,
                    itemClass,
                    i,
                    item.value,
                    dis,
                    item.name,
                    strRef + '._itemOverHandler(this)',
                    strRef + '._itemOutHandler(this)',
                    strRef + '._itemClickHandler(this)',
                    iconHtml,
                    titleTip
                    ));
        }
        
        return html.join('');
    },
    
    /**
     * 设置控件为readOnly
     * 
     * @public
     * @param {boolean} readOnly
     */
    setReadOnly: function (readOnly) {
        this.readOnly = readOnly = !!readOnly;
        readOnly ? this.setState('readonly') : this.removeState('readonly');
    },
    
    /**
     * 获取主区域点击的事件handler
     * 
     * @private
     * @return {Function}
     */
    _getMainClickHandler: function () {
        var me = this;
        return function (e) {
            e = e || window.event;
            var tar = e.srcElement || e.target;
            if (!me.readOnly && !me.getState('disabled')) {
                if (tar.getAttribute('arrow') || me.onmainclick() !== false) {
                    me.getLayer()._preventHide();
                    me.toggleLayer();
                }
            }
        };
    },

    onmainclick: new Function(),

    /**
     * 显示层
     * 
     * @public
     */
    showLayer: function() {
        var me = this,
            main                = me._main,
            mainPos             = baidu.dom.getPosition(main),
            layer               = me.getLayer(),
            layerMain           = layer.getMain(),
            layerOffsetHeight   = layerMain.offsetHeight,
            mainOffsetHeight    = main.offsetHeight,
            pageVHeight         = baidu.page.getViewHeight(),
            layerVHeight        = mainPos.top
                                    + mainOffsetHeight 
                                    + layerOffsetHeight 
                                    - baidu.page.getScrollTop(),
            layerTop;

        if (pageVHeight > layerVHeight) {
            layerTop = mainPos.top + mainOffsetHeight - 1;
        } else {
            layerTop = mainPos.top - layerOffsetHeight + 1;
        }
        
        layer.show(mainPos.left, layerTop);
        me.setState('active');
    },
    
    /**
     * 隐藏层
     * 
     * @public
     */
    hideLayer: function() {
        this.getLayer().hide();
        this.removeState('active');
    },
    
    /**
     * 显示|隐藏 层
     * 
     * @public
     */
    toggleLayer: function() {
        var me = this;
        if (me.getLayer().isShow()) {
            me.hideLayer();
        } else {
            me.showLayer();
        }
    },
    
    /**
     * 获取layer的控件对象
     * 
     * @return {Object}
     */
    getLayer: function() {
        return this._controlMap['layer'];
    },
    
    /**
     * 获取ComboBox当前选项部分的DOM元素
     * 
     * @return {HTMLElement}
     */
    _getCur: function() {
        return baidu.g(this.__getId('text'));
    },
    
    /**
     * 获取当前选中的值
     * 
     * @param {number} opt_index 获取第n个数据的value
     * @return {string}
     */
    getValue: function(opt_index) {
        var value,
            datasource = this.datasource;

        if (typeof opt_index == 'number') {
            opt_index < datasource.length && (value = datasource[opt_index].value);
        } else {
            value = this.value;
        }

        if (ui._hasValue(value)) {
            return value;
        }

        return null;
    },
    
    /**
     * 设置数据来源
     * 
     * @public
     * @param {Array} datasource 列表数据源
     */
    setDataSource: function (datasource) {
        this.datasource = datasource || this.datasource;
    },
    
    /**
     * 根据值选择选项
     *
     * @public
     * @param {string} value 值
     */
    setValue: function(value) {
        var me = this,
            layer = me.getLayer().getMain(),
            items = layer.getElementsByTagName('div'),
            len,
            i,
            item;
        
        for (i = 0, len = items.length; i < len; i++) {
            item = items[i].getAttribute('value');
            if (item == value) {
                me.selectByIndex(i);
                return;
            }
        }
        
        me.value = null;
        me.index = -1;
        me.selectByIndex(-1);
    },
    
    /**
     * 根据索引选择选项
     * 
     * @public
     * @param {number} index 选项的索引序号
     * @param {boolean} isDispatch 是否发送事件
     */
    selectByIndex: function (index, isDispatch) {
        var selected = this.datasource[index],
            value;
            
        if (!selected) {
            value = null;
        } else {
            value = selected.value;
        }
        

        this.index = index;
        this.value = value;
        
        if (isDispatch === true && this.onchange(value, selected) === false) {
            return;
        }
        
        this._repaint();
    },
    
    onchange: new Function(),

    /**
     * 重绘控件
     * 
     * @private
     */
    _repaint: function () {
        var selected = this.datasource[this.index],
            word = this.staticText || (selected ? selected.name : this.emptyLabel),
            el = this._getCur();
            
        el.title = word;
        el.innerHTML = '<nobr>' + word + '</nobr>';
        
        this._repaintLayer();
    },
    
    /**
     * 重绘选项列表层
     * 
     */
    _repaintLayer: function () {
        var me = this,
            index = me.index,
            first = me.getLayer().getMain().firstChild,
            selectedClass = me.__getClass('item-selected');
            
        while (first) {
            if (first.getAttribute('index') == index) {
                baidu.addClass(first, selectedClass);
            } else {
                baidu.removeClass(first, selectedClass);
            }
            first = first.nextSibling;
        }
    },
    
    /**
     * 选项点击事件
     * 
     * @private
     * @param {HTMLElement} item 选项
     */
    _itemClickHandler: function (item) {
        var index = item.getAttribute('index');
        var disabled = item.getAttribute('dis');

        if (disabled == 1) {
            return;
        }

        this.hideLayer();
        this.selectByIndex(parseInt(index, 10), true);
    },

    /**
     * 选项移上事件
     * 
     * @private
     * @param {HTMLElement} item 选项
     */
    _itemOverHandler: function (item) {
        if (item.getAttribute('dis') == 1) {
            return;
        }
        
        var index = item.getAttribute('index');
        baidu.addClass(this.__getId('item') + index, this.__getClass('item-hover'));
    },
    
    /**
     * 选项移开事件
     * 
     * @private
     * @param {HTMLElement} item 选项
     */
    _itemOutHandler: function (item) {
        var index = item.getAttribute('index');
        baidu.removeClass(this.__getId('item') + index, this.__getClass('item-hover'));
    },
    
    /**
     * 设置为disabled
     * 
     * @public
     */
    disable: function (disabled) {
        this.hideLayer();
        if (disabled) {
            this.setState('disabled');
        } else {
            this.removeState('disabled');
        }
    },
    
    /**
     * 释放控件
     * 
     * @public
     */
    dispose: function () {
        var me = this;
        
        me.onchange = null;
        me._main.onclick = null;
        ui.Base.dispose.call(me);
    }
};

ui.BaseInput.derive(ui.Select);
