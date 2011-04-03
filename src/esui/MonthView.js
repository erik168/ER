/*
 * esui (ECOM Simple UI)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    ui/MonthView.js
 * desc:    日历月份显示单元
 * author:  erik, zhaolei
 * date:    $Date$
 */

/**
 * 日历月份显示单元
 * 
 * @param {Object} options 控件初始化参数
 */
ui.MonthView = function (options) {
	this.__initOptions(options);
	this._type = "month";
	
    this.now = this.now || new Date();

    var viewBase = this.value || ui.config.now || this.now;
	this.year = parseInt(this.year, 10) || viewBase.getFullYear();
	this.month = parseInt(this.month, 10) || viewBase.getMonth();
};

ui.MonthView.prototype = {
    /**
     * 日期的模板
     * @private
     */
    _tplItem: '<td year="{1}" month="{2}" date="{0}" class="{4}" style="{5}" id="{3}" onmouseover="{6}" onmouseout="{7}" onclick="{8}">{0}</td>',
	
    /**
     * 日期表格头的模板
     * @private
     */
    _tplHead: '<table border="0" cellpadding="0" cellspacing="0" class="{0}"><thead><tr>',

	/**
	 * 标题显示配置
	 */
	TITLE_WORDS: ['一', '二', '三', '四', '五', '六', '日'],
	
	/**
	 * 设置当前显示的月份日期
	 * 
	 * @public
	 * @param {Date} view 当前显示的月份日期
	 */
	setView: function (view) {
        this.month = view.getMonth();
        this.year = view.getFullYear();
        this.render();   
	},
	
	/**
	 * 绘制控件
     *
     * @public
	 */
	render: function (main) {
        ui.Base.render.call(this, main);
	    var el = this._main;
	    if (el) {
	        el.innerHTML = this._getHtml();
	        this.select(this.value);
	    }
    },
    
    /**
     * 将控件添加到某个dom元素中
     * 
     * @param {HTMLElement} wrap 目标dom
     */
    appendTo: function (wrap) {
        if (!this._main) {
            var main = document.createElement('div');
            wrap.appendChild(main);
            this.render(main);
        }
    },
    
    /**
     * 获取控件的html
     * 
     * @private
     * @return {string}
     */
    _getHtml: function () {
        var me = this,
            html        = [ui._format(me._tplHead, me.__getClass('main'))],
            index       = 0,
            year        = me.year,
            month       = me.month,
            repeater    = new Date(year, month, 1),
            nextMonth   = new Date(year, month + 1, 1),
            begin       = 1 - (repeater.getDay() + 6) % 7,
            titles      = me.TITLE_WORDS,
            tLen        = titles.length,
            tIndex,
            virtual,
            overClass   = me.__getClass('over'),
            virClass    = me.__getClass('item-virtual'),
            itemClass   = me.__getClass('item'),
            currentClass,
            customClass,
            overHandler = "baidu.addClass(this, '" + overClass + "')",
            outHandler  = "baidu.removeClass(this, '" + overClass + "')";
        
        // 绘制表头
        for (tIndex = 0; tIndex < tLen; tIndex++) {
            html.push('<td class="' + me.__getClass('title') + '">' + titles[tIndex] + '</td>');
        }
        html.push('</tr></thead><tbody><tr>')        
        repeater.setDate(begin);
        
        // 绘制表体
        while (nextMonth - repeater > 0 || index % 7 !== 0) {
            if (begin > 0 && index % 7 === 0) {
                html.push('</tr><tr>');
            }
            
            virtual = (repeater.getMonth() != month);

            // 构建date的css class
            currentClass = itemClass;
            customClass = me._getCustomDateValue('customClass', repeater);
            virtual && (currentClass += ' ' + virClass);
            customClass && (currentClass += ' ' + customClass);

            html.push(ui._format
                (me._tplItem, 
                    repeater.getDate(),
                    repeater.getFullYear(),
                    repeater.getMonth(),
                    me._getItemId(repeater),
                    currentClass,
                    me._getCustomDateValue('customStyle', repeater),
                    (virtual ? '' : overHandler),
                    (virtual ? '' : outHandler),
                    (virtual ? '' : me.__getStrRef() + "._selectByItem(this)")
                ));
                          
            repeater = new Date(year, month, ++begin);
            index ++;
        }
               
        html.push('</tr></tbody></table>');
        return html.join('');
    },
    
    /**
     * 获取日期的用户自定义属性值
     * 
     * @private
     * @param {string} name 属性名
     * @param {Date} date 日期
     * @return {string}
     */
    _getCustomDateValue: function (name, date) {
        var value = this[name];
        var valueType = typeof value;
        
        switch (valueType) {
        case 'string':
            return value;
            break
        case 'function':
            return value.call(this, date) || '';
            break
        }
        
        return '';
    },

    /**
     * 通过item的dom元素选择日期
     * 
     * @private
     * @param {HTMLElement} item dom元素td
     */
    _selectByItem: function (item) {
        var date = item.getAttribute('date'),
            month = item.getAttribute('month'),
            year = item.getAttribute('year');
            
        this._change(new Date(year, month, date));
    },
    
    onchange: new Function(),
    
    /**
     * 选择当前日期
     * 
     * @private
     * @param {Date} date 当前日期
     */
    _change: function (date) {
        if (!date) {
            return;
        }
        
        if (this.onchange(date) !== false) {
            this.select(date);
        }
    },
    
    /**
     * 选择日期
     * 
     * @public
     * @param {Date} date 要选择的日期
     */
    select: function (date) {
        if (date instanceof Date) {
            var me = this;
            
            me._resetSelected();
            me.value = date;
            me._paintSelected();
        }
    },

    /**
     * 清空选中的日期
     * 
     * @private
     */
    _resetSelected: function () {
        var me = this;

        if (me.value) {
            var item = baidu.g(me._getItemId(me.value));
            item && baidu.removeClass(item, me.__getClass('selected'));
            me.value = null;
        }
    },

    /**
     * 绘制选中的日期
     * 
     * @private
     */
    _paintSelected: function () {
        var me = this;

        if (me.value) {
            var date = me.value;
            var item = baidu.g(me._getItemId(date));
            item && baidu.addClass(item, me.__getClass('selected'));
        }
    },
    
    /**
     * 获取日期对应的dom元素item的id
     * 
     * @private
     * @param {Date} date 日期
     * @return {string}
     */
    _getItemId: function (date) {
        return this.__getId(date.getFullYear() 
                            + '-' + date.getMonth() 
                            + '-' + date.getDate());
    },
    
    /**
     * 获取当前选择的日期
     * 
     * @public
     * @return {Date}
     */
    getValue: function () {
        return this.value || null;
    }
};

ui.Base.derive(ui.MonthView);
