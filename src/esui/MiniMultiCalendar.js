/*
 * ESUI (Enterprise Simple UI)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    ui/MiniMultiCalendar.js
 * desc:    小型多日期选择器
 * author:  zhaolei, erik
 * date:    $Date: 2011-04-26 12:31:50 +0800 (二, 26  4 2011) $
 */

/**
 * 多日期选择器
 * 
 * @param {Object} options 控件初始化参数
 */
ui.MiniMultiCalendar = function (options) {
    this.__initOptions(options);
    
    // 类型声明，用于生成控件子dom的id和class
    this._type = 'mmcal';
    
    this.now = this.now || ui.config.NOW || new Date();
    this.__initOption('options', null, 'OPTIONS');
    
    // 初始化当前日期
    this.value = this.value || {
        begin: this.now,
        end: this.now
    };
};

ui.MiniMultiCalendar.prototype = {
    /**
     * 快捷项的模板
     * @private
     */
     _tplItem: '<span index="{0}" class="{1}" id="{2}"{4}>{3}</span>',

    /**
     * 比较两个日期是否同一天
     * 
     * @private
     * @param {Date} date1 日期
     * @param {Date} date2 日期
     * @return {boolean}
     */
    _isSameDate: function (date1, date2) {
		if ( date2 != "" && date1 != "" ) {
			if ( date1.getFullYear() == date2.getFullYear()
                 && date1.getMonth() == date2.getMonth()
                 && date1.getDate() == date2.getDate()
            ) {
				return true;
			}
		}

        return false;
    },
    
    /**
     * 获取选中的日期区间
     * 
     * @public
     * @return {Object}
     */
    getValue: function () {
        return this.value;
    },

    /**
     * 设置选中的日期区间
     * 
     * @public
     * @param {Object} value 日期区间
     */
    setValue: function ( value ) {
        this.value = value;
        this.render();
    },
    
    /**
     * 绘制控件
     * 
     * @public
     * @param {HTMLElement} main 控件元素
     */
    render: function (main) {
        var me = this;
        
        ui.Base.render.call(me, main);
        me._main.innerHTML = me._getHtml();
    },
    
    /**
     * 获取控件的html
     * 
     * @private
     * @return {string}
     */
    _getHtml: function () {
        var me = this,
            value = me.value,
            opList = me.options,
            len = opList.length, 
            idPrefix = me.__getId('option'),
            i, 
            opValue, 
            option,
            clazz, callStr,
            html = [];

       	me._currentName = '';
        if ( ui._hasValue( me._selectedIndex ) ) {
            me._currentName = opList[ me._selectedIndex ].name;
        } else {
            for ( i = 0; i < len; i++ ) {
                option = opList[ i ];
                opValue = option.getValue.call( me );

                if (me._isSameDate( value.begin, opValue.begin )
                    && me._isSameDate( value.end, opValue.end )
                ) {
                    me._selectedIndex = i;
                    me._currentName = option.name;
                    break;
                }
            }
        }
        
        for ( i = 0; i < len; i++ ) {
            option = opList[i];
            opValue = option.getValue.call(me);
            clazz = me.__getClass('option');
            callStr = ' onclick="' + me.__getStrCall("_selectByIndex", i) + '"';
            
            if ( i == me._selectedIndex ) {
                clazz = clazz + ' ' + me.__getClass('option-selected');
                callStr = '';
            }
            
            html.push(
                ui._format(me._tplItem,
                    i,
                    clazz,
                    idPrefix + i,
                    option.name,
                    callStr));
        }	

        return html.join('&nbsp;|&nbsp;');
    },

    onchange: new Function(),
    
    /**
     * 根据索引选取日期
     * 
     * @private
     * @param {number} index 
     */
    _selectByIndex: function (index) {
		var opList = this.options, 
            item,
            value;

        if (index < 0 || index >= opList.length) {
            return;
        }
        
        item = opList[index];
        value = item.getValue.call(this);
        
        if ( this.onchange(value, item.name, index) !== false ) {
            this.selectByIndex(index);
        }
    },
    
    /**
     * 选取日期区间
     * 
     * @public
     * @param {Object} value 日期区间对象
     */
    select: function (value) {
        this._selectedIndex = null;
        this.value = value;
        this.render();
    },
    
    /**
     * 按快捷项index选取日期区间
     * 
     * @public
     * @param {number} index 快捷项index
     */
    selectByIndex: function (index) {
        var opList = this.options, 
            item = opList[index];

        if (index < 0 || index >= opList.length) {
            return;
        }

        this._selectedIndex = index;
        this.value = item.getValue.call(this);
        this.render();
    },
    
    /**
     * 获取快捷方式的名称
     * 
     * @public
     * @param {Object} opt_value 日期区间值
     * @return {string}
     */
    getName: function ( opt_value ) {
        if ( opt_value ) {
            var items = this.options;
            var i, item, value;
            var len = items.length;

            for ( i = 0; i < len; i++ ) {
                item = items[ i ];
                value = item.getValue.call( this );
                if ( this._isSameDate( value.begin, opt_value.begin )
                     && this._isSameDate( value.end, opt_value.end )
                ) {
                    return item.name;
                }
            }

            return '';
        }

        return this._currentName;
    }
};

/**
 * 日期区间选项列表配置
 */
ui.MiniMultiCalendar.OPTIONS = [
    {
        name: '昨天',
        value: 0,
        getValue: function () {
            var yesterday = new Date(this.now.getTime());
            yesterday.setDate(yesterday.getDate() - 1);
            
            return {
                begin: yesterday,
                end: yesterday
            };
        }
    },
    {
        name: '最近7天',
        value: 1,
        getValue: function () {
            var begin = new Date(this.now.getTime()),
                end = new Date(this.now.getTime());
            
            end.setDate(end.getDate() - 1);
            begin.setDate(begin.getDate() - 7);
            
            return {
                begin:begin,
                end:end
            };
        }
    },
    {
        name: '上周',
        value: 2,
        getValue: function () {
            var now = this.now,
                begin = new Date(this.now.getTime()),
                end = new Date(this.now.getTime()),
                _wd = 1; //周一为第一天;
            
            if (begin.getDay() < _wd%7) {
                begin.setDate(begin.getDate() - 14 + _wd - begin.getDay());
            } else {
                begin.setDate(begin.getDate() - 7 - begin.getDay() + _wd % 7);
            }				
            begin.setHours(0,0,0,0);		
            end.setFullYear(begin.getFullYear(), begin.getMonth(), begin.getDate() + 6);
            end.setHours(0,0,0,0);
                             
            return {
                begin:begin,
                end:end
            };
        }
    },
    {
        name: '本月',
        value: 3,
        getValue: function () {
            var now = this.now,
                begin = new Date(this.now.getTime()),
                end = new Date(this.now.getTime());
            begin.setDate(1);
            
            return {
                begin:begin,
                end:end
            };
        }
    },
    {
        name: '上个月',
        value: 4,
        getValue: function () {
            var now = this.now,
                begin = new Date(now.getFullYear(), now.getMonth() - 1, 1),
                end = new Date(now.getFullYear(), now.getMonth(), 1);
            end.setDate(end.getDate() - 1);
            
            return {
                begin:begin,
                end:end
            };
        }
    },
    {
        name: '上个季度',
        value: 5,
        getValue: function () {
            var now = this.now,
                begin = new Date(now.getFullYear(), now.getMonth() - now.getMonth()%3 - 3, 1),
                end = new Date(now.getFullYear(), now.getMonth() - now.getMonth()%3, 1);
            end.setDate(end.getDate() - 1);
            
            return {
                begin:begin,
                end:end
            };
        }
    }
];

ui.Base.derive(ui.MiniMultiCalendar);
