/*
 * esui (ECOM Simple UI)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    ui/MultiCalendar.js
 * desc:    多日期选择器
 * author:  erik, zhaolei
 * date:    $Date$
 */

/**
 * 多日期选择器
 * 
 * @param {Object} options 控件初始化参数
 */
ui.MultiCalendar = function (options) {
    // 类型声明，用于生成控件子dom的id和class
    this._type = 'mcal';
    this.__initOptions(options);
    this._controlMap = {};

    // 初始化当前日期
    this.now = this.now || ui.config.now || new Date();
    var now = this.now;

    // 初始化当前选中日期
    this.value = this.value || {
        begin: now,
        end: now
    };
    
    // 初始化可选择的日期
    this.__initOption('range', null, 'RANGE');

    // 初始化显示的日期
    this.view = {
        begin: new Date(this.value.begin),
        end: new Date(this.value.end)
    };

    // 声明日期格式
    this.__initOption('dateFormat', null, 'DATE_FORMAT');
    
    // 声明按钮文字
    this.__initOption('okText', null, 'OK_TEXT');
    this.__initOption('cancelText', null, 'CANCEL_TEXT');

    // 声明浮动层侧边的说明
    this.__initOption('beginSideTitle', null, 'BEGIN_SIDE_TITLE');
    this.__initOption('endSideTitle', null, 'END_SIDE_TITLE');
};

ui.MultiCalendar.OK_TEXT = '确定';
ui.MultiCalendar.CANCEL_TEXT = '取消';
ui.MultiCalendar.BEGIN_SIDE_TITLE = '开始日期'
ui.MultiCalendar.END_SIDE_TITLE = '结束日期';
ui.MultiCalendar.DATE_FORMAT = 'yyyy-MM-dd';
ui.MultiCalendar.RANGE = {
    begin: new Date(2001, 8, 3),
    end: new Date(2046, 10, 4)
};

ui.MultiCalendar.prototype = {
    /**
     * 主显示区域的模板
     * @private
     */
    _tplMain: '<span id="{0}" class="{1}">{2}</span><div class="{3}" arrow="1"></div>',

    /**
     * 浮动层html模板
     * @private
     */
    _tplLayer: '<div ui="id:{0};type:MiniMultiCalendar"></div>'
                + '<div class="{1}">{5}{6}</div>'
                + '<div class="{2}"><div ui="type:Button;id:{3};skin:em">{7}</div><div ui="type:Button;id:{4}">{8}</div></div>'
                + '<div ui="type:Button;id:{9};skin:layerclose"></div>',
    
    /**
     * 浮动层单侧html模板
     * @private
     */
    _tplSide: '<div class="{0}">'
                + '<div class="{1}"><b>{9}</b><span id="{2}"></span></div>'
                + '<div class="{4}"><table><tr>'
                    + '<td width="40" align="left"><div ui="type:Button;id:{5};skin:back"></div></td>'
                    + '<td><div ui="type:Select;id:{7};width:55"</td>'
                    + '<td><div ui="type:Select;id:{8};width:40"</td>'
                    + '<td width="40" align="right"><div ui="type:Button;id:{6};skin:forward"></div></td>'
                + '</tr></table></div><div ui="id:{3};type:MonthView"></div></div>',
    
    /**
     * 绘制控件
     * 
     * @public
     * @param {HTMLElement} main 控件元素
     */
    render: function (main) {
        var me = this;
        if (main && main.tagName != 'DIV') {
            return;
        }
        
        ui.Base.render.call(me, main, true);
        if (!me._isRender) {
            me._main.innerHTML = me._getMainHtml();
            me._main.onclick = me._getMainClickHandler();
            me._renderLayer();
            me._isRender = 1;
        }

        me.setValue(me.value);
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
            if (!me.getState('disabled')) {
                me.getLayer()._preventHide();
                me.toggleLayer();
            }
        };
    },

    /**
     * 获取取消按钮的点击handler
     * 
     * @private
     * @return {Function}
     */
    _getCancelHandler: function () {
        var me = this;
        return function () {
            me.hideLayer();
        };
    },
    
    /**
     * 获取确定按钮的点击handler
     * 
     * @private
     * @return {Function}
     */
    _getOkHandler: function () {
        var me = this,
            parse = baidu.date.parse;
            
        function getValue(type) {
            return me._controlMap[type + 'monthview'].getValue();
        }
        
        return function () {
            var begin = getValue('begin'),
                end = getValue('end'),
                dvalue = end - begin, 
                value,
                valueText;

            if (dvalue > 0) {
                value = {
                    'begin': begin,
                    'end': end
                };
            } else {
                value = {
                    'begin': end,
                    'end': begin
                };
            }
            
            valueText = me.getValueText(value);
            if (me.onchange(value, valueText) !== false) {
                me.value = value;
                me._repaintMain(valueText);
                me.hideLayer();
            }
        };
    },
    
    onchange: new Function(),
    
    /**
     * 获取日历选择的自定义样式生成器
     * 
     * @private
     * @return {Function}
     */
    _getMVCustomClass: function () {
        var me = this;
        return function (date) {
            if (!me._isInRange(date)) {
                return this.__getClass('item-out');
            }

            return '';
        };
    },

    /**
     * 获取日历选择的事件handler
     * 
     * @private
     * @return {Function}
     */
    _getCalChangeHandler: function (type) {
        var me = this;

        return function (date) {
            if (!me._isInRange(date)) {
                return false;
            }

            me.tempValue[type] = date;
            me._controlMap['shortcut'].select(me.tempValue);
            baidu.g(me.__getId(type + 'title')).innerHTML = baidu.date.format(date, me.dateFormat);
        };
    },
    
    /**
     * 判断日期是否属于允许的区间中
     * 
     * @private
     * @param {Date} date
     * @return {boolean}
     */
    _isInRange: function (date) {
        var begin = this.range.begin;
        var end = this.range.end;

        if ((begin && date - begin < 0) 
            || (end && end - date < 0)
        ) {
            return false;
        }

        return true;
    },

    /**
     * 重新绘制main区域
     * 
     * @private
     */
    _repaintMain: function (text) {
        baidu.g(this.__getId('text')).innerHTML = text || this.getValueText();
    },
    
    /**
     * 重新绘制浮动层侧边栏的显示内容
     * 
     * @private
     * @param {string} type 侧边栏类型，begin|end
     */
    _repaintSide: function (type) {
        var me = this,
            range = me.range,
            view  = me.view[type],
            year  = view.getFullYear(),
            month = view.getMonth(),
            value = me.tempValue[type],
            cal   = me._controlMap[type + 'monthview'],
            rangeBegin = range.begin.getFullYear() * 12 + range.begin.getMonth(),
            rangeEnd   = range.end.getFullYear() * 12 + range.end.getMonth(),
            viewMonth  = view.getFullYear() * 12 + view.getMonth(),
            monthSelect = me._controlMap[type + 'month'];
        
        monthSelect.datasource = me._getMonthOptions(year);
        monthSelect.render();
        if (rangeBegin - viewMonth > 0) {
            month += (rangeBegin - viewMonth);
        } else if (viewMonth - rangeEnd > 0) {
            month -= (viewMonth - rangeEnd);
        }
        monthSelect.setValue(month);
        view.setMonth(month);

        me._controlMap[type + 'year'].setValue(year);
        me._controlMap[type + 'prevmonth'].disable((rangeBegin >= viewMonth));
        me._controlMap[type + 'nextmonth'].disable((rangeEnd <= viewMonth));
        
        baidu.g(me.__getId(type + 'title')).innerHTML = baidu.date.format(value, me.dateFormat);

        // 绘制日历部件
        cal.value = value;
        cal.setView(view);
    },

    /**
     * 获取控件的html
     * 
     * @private
     * @return {string}
     */
    _getMainHtml: function () {
        var me = this,
            show = 'text';

        return ui._format(me._tplMain,
                    me.__getId(show),
                    me.__getClass(show),
                    me.getValueText(),
                    me.__getClass('arrow'));
    },

    /**
     * 获取浮动层侧边栏的html
     * 
     * @private
     * @param {string} type 侧边栏类型,begin|end
     * @return {string}
     */
    _getLayerSideHtml: function (type) {
        var me = this;

        return ui._format(me._tplSide, 
                    me.__getClass(type),
                    me.__getClass('side-title'),
                    me.__getId(type + 'title'),
                    me.__getId(type + 'monthview'),
                    me.__getClass('side-func'),
                    me.__getId(type + 'prevmonth'),
                    me.__getId(type + 'nextmonth'),
                    me.__getId(type + 'year'),
                    me.__getId(type + 'month'),
                    me[type + 'SideTitle']);
    },

    /**
     * 绘制浮动层
     * 
     * @private
     */
    _renderLayer: function () {
        var me = this,
            layerId = me.__getId('layer'),
            layer = ui.util.create('Layer', 
                {
                    id      : layerId,
                    autoHide: 'click',
                    retype  : 'mcal-layer'
                });
        
        me._controlMap['layer'] = layer;
        layer.appendTo();
        layer.onhide = me._getLayerHideHandler();
        layer._main.innerHTML = ui._format(me._tplLayer,
            me.__getId('shortcut'),
            me.__getClass('body'),
            me.__getClass('foot'),
            me.__getId('ok'),
            me.__getId('cancel'),
            me._getLayerSideHtml('begin'),
            me._getLayerSideHtml('end'),
            me.okText,
            me.cancelText,
            me.__getId('close'));

        me._initLayerUI();
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
    
    /**
     * 初始化浮动层的ui子控件
     * 
     * @private
     */
    _initLayerUI: function () {
        // 绘制子控件
        var layer       = this.getLayer(),
            ok          = this.__getId('ok'),
            cancel      = this.__getId('cancel'),
            close       = this.__getId('close'),
            beginM      = this.__getId('beginmonth'),
            endM        = this.__getId('endmonth'),
            beginY      = this.__getId('beginyear'),
            endY        = this.__getId('endyear'),
            beginPM     = this.__getId('beginprevmonth'),
            endPM       = this.__getId('endprevmonth'), 
            beginNM     = this.__getId('beginnextmonth'), 
            endNM       = this.__getId('endnextmonth'),
            beginMV     = this.__getId('beginmonthview'),
            endMV       = this.__getId('endmonthview'),
            shortcut    = this.__getId('shortcut'),
            uiProp      = {},
            view        = this.view,
            beginView   = view.begin,
            endView     = view.end,
            beginYear   = beginView.getFullYear(),
            endYear     = endView.getFullYear(),
            beginMonth  = beginView.getMonth(),
            endMonth    = endView.getMonth(),
            yearDs      = this._getYearOptions(),
            mvCustomClz = this._getMVCustomClass(),
            controlMap;
        
        // 构造附加属性
        uiProp[beginMV] = {value:this.value.begin, customClass:mvCustomClz};
        uiProp[endMV]   = {value:this.value.end, customClass:mvCustomClz};
        uiProp[beginM]  = {datasource:this._getMonthOptions(beginYear),value:beginMonth};
        uiProp[endM]    = {datasource:this._getMonthOptions(endYear),value:endMonth};
        uiProp[beginY]  = {datasource:yearDs,value:beginYear};
        uiProp[endY]    = {datasource:yearDs,value:endYear};

        // 初始化控件
        controlMap  = ui.util.init(layer._main, uiProp);
        ok      = controlMap[ok];
        cancel  = controlMap[cancel];
        close   = controlMap[close];
        beginM  = controlMap[beginM];
        endM    = controlMap[endM];
        beginY  = controlMap[beginY];
        endY    = controlMap[endY];
        beginPM = controlMap[beginPM];
        endPM   = controlMap[endPM];
        beginNM = controlMap[beginNM];
        endNM   = controlMap[endNM];
        beginMV = controlMap[beginMV];
        endMV   = controlMap[endMV];
        shortcut = controlMap[shortcut];

        this._controlMap['ok'] = ok;
        this._controlMap['cancel'] = cancel;
        this._controlMap['close'] = close;
        this._controlMap['beginmonthview'] = beginMV;
        this._controlMap['endmonthview'] = endMV;
        this._controlMap['beginmonth'] = beginM;
        this._controlMap['endmonth'] = endM;
        this._controlMap['beginyear'] = beginY;
        this._controlMap['endyear'] = endY;
        this._controlMap['beginprevmonth'] = beginPM;
        this._controlMap['endprevmonth'] = endPM;
        this._controlMap['beginnextmonth'] = beginNM;
        this._controlMap['endnextmonth'] = endNM;
        this._controlMap['shortcut'] = shortcut;

        ok.onclick = this._getOkHandler();
        close.onclick = cancel.onclick = this._getCancelHandler();
        beginY.onchange = this._getYearChangeHandler('begin');
        endY.onchange   = this._getYearChangeHandler('end');
        beginM.onchange = this._getMonthChangeHandler('begin');
        endM.onchange   = this._getMonthChangeHandler('end');
        beginPM.onclick = this._getPrevMonthHandler('begin');
        endPM.onclick   = this._getPrevMonthHandler('end');
        beginNM.onclick = this._getNextMonthHandler('begin');
        endNM.onclick   = this._getNextMonthHandler('end');
        beginMV.onchange = this._getCalChangeHandler('begin');
        endMV.onchange = this._getCalChangeHandler('end');
        shortcut.onchange = this._getShortcutChangeHandler();
    },
    
    /**
     * 获取选择快捷选项的handler
     * 
     * @private
     * @return {Function}
     */
    _getShortcutChangeHandler: function () {
        var me = this;

        return function (value, name) {
            if ( me.onchange( value, name ) !== false) {
                me.value = value;
                me._repaintMain(name);
                me.hideLayer();
            }
        };
    },
    
    /**
     * 获取年份切换的handler
     * 
     * @private
     * @return {Function}
     */
    _getYearChangeHandler: function (type) {
        var me = this;

        return function (year) {
            var view = me.view[type],
                month = view.getMonth();

            me._repaintMonthView(type, year, month);
            me.getLayer()._preventHide();
        };
    },
    
    /**
     * 获取月份切换的handler
     * 
     * @private
     * @return {Function}
     */
    _getMonthChangeHandler: function (type) {
        var me = this;

        return function (month) {
            var view = me.view[type],
                year = view.getFullYear();

            me._repaintMonthView(type, year, month);
            me.getLayer()._preventHide();
        };
    },
    
    /**
     * 获取月份前进按钮的handler
     * 
     * @private
     * @return {Function}
     */
    _getPrevMonthHandler: function (type) {
        var me = this;

        return function () {
            var view = me.view[type];
            
            view.setMonth(view.getMonth() - 1)
            me._repaintMonthView(type, view.getFullYear(), view.getMonth());
        };
    },
    
    /**
     * 获取月份后退按钮的handler
     * 
     * @private
     * @return {Function}
     */
    _getNextMonthHandler: function (type) {
        var me = this;

        return function () {
            var view = me.view[type];
            
            view.setMonth(view.getMonth() + 1)
            me._repaintMonthView(type, view.getFullYear(), view.getMonth());
        };
    },

    /**
     * 获取可选择的年列表
     * 
     * @private
     * @return {Array}
     */
    _getYearOptions: function () {
        var range = this.range,
            ds = [],
            i,
            end = range.end.getFullYear();

        for (i = range.begin.getFullYear(); i <= end; i++) {
            ds.push({name: i, value:i});
        }

        return ds;
    },

    /**
     * 获取可选择的月列表
     * 
     * @private
     * @param {number} year 选中的年
     * @return {Array}
     */
    _getMonthOptions: function (year) {
        var range = this.range,
            ds = [],
            i = 0,
            len = 11;
        
        if (year == range.begin.getFullYear()) {
            i = range.begin.getMonth();
        } else if (year == range.end.getFullYear()) {
            len = range.end.getMonth();
        }

        for (; i <= len; i++) {
            ds.push({name: (i + 1), value:i});
        }

        return ds;
    },
    
    /**
     * 重新绘制日期显示
     * 
     * @private
     * @param {string} type 侧边栏类型,begin|end
     * @param {number} year 年份
     * @param {number} month 月份
     */
    _repaintMonthView: function (type, year, month) {
        this.view[type] = new Date(year, month, 1);
        this._repaintSide(type);
    },
    
    /**
     * 显示|隐藏 浮动层
     * 
     * @public
     */
    toggleLayer: function () {
        var me = this;
        if (this.getLayer().isShow()) {
            me.hideLayer();
        } else {
            me.showLayer();
        }
    },
    
    /**
     * 隐藏浮动层
     * 
     * @public
     */
    hideLayer: function () {
        this.getLayer().hide();
        this.removeState('active');
    },
    
    /**
     * 显示浮动层
     * 
     * @public
     */
    showLayer: function () {
        var me = this,
            main        = me._main,
            pos         = baidu.dom.getPosition(main),
            pageWidth   = baidu.page.getWidth(),
            layer       = me.getLayer(),
            layerWidth  = layer._main.offsetWidth,
            value       = me.value,
            layerTop    = pos.top + main.offsetHeight - 1,
            layerLeft;

        // 创建临时日期存储变量
        me.tempValue = {
            'begin': new Date(value.begin),
            'end': new Date(value.end)
        };
        
        // 更新浮动层显示的日期
        me.view = {
            'begin': new Date(value.begin),
            'end': new Date(value.end)
        };
        
        me._repaintLayer();

        if (pageWidth < (pos.left + layerWidth)) {
            layerLeft = pos.left + main.offsetWidth - layerWidth;
        } else {
            layerLeft = pos.left;
        }
        layer.show(layerLeft, layerTop);
        this.setState('active');
    },
    
    /**
     * 获取浮动层元素
     * 
     * @public
     * @return {HTMLElement}
     */
    getLayer: function () {
        return this._controlMap['layer'];
    },

    /**
     * 重新绘制layer
     * 
     * @private
     */
    _repaintLayer: function () {  
        this._controlMap['shortcut'].select(this.value);
        this._repaintSide('begin');
        this._repaintSide('end');
    },

    /**
     * 获取当前选中日期区间的显示字符
     * 
     * @public
     * @return {string}
     */
    getValueText: function (value) {
        value = value || this.getValue();
        var begin = value.begin,
            end   = value.end,
            format    = this.dateFormat,
            formatter = baidu.date.format,
            shortcut = this._controlMap['shortcut'];
            
        if (begin && end) {
            return (shortcut && shortcut.getName()) 
                        || formatter(begin, format) 
                            + " 至 " 
                            + formatter(end, format);
        }
        
        return '';
    },
    
    /**
     * 获取当前选取的日期
     * 
     * @public
     * @return {string}
     */
    getValue: function () {
        return this.value;
    },
    
    /**
     * 设置当前选取的日期
     * 
     * @public
     * @param {Date} date 选取的日期
     */
    setValue: function (date) {
        if (date && date.begin && date.end) {
            this.value = date;
            this._controlMap.shortcut.setValue(date);
            this._repaintMain();
        }
    },
    
    /**
     * 释放控件
     * 
     * @protected
     */
    dispose: function () {
        this.onchange = null;
        ui.Base.dispose.call(this);
    }
};

ui.Base.derive(ui.MultiCalendar);
