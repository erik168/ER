/*
 * ESUI (Enterprise Simple UI)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    ui/Calendar.js
 * desc:    单日期选择器
 * author:  zhaolei, erik
 */

///import esui.InputControl;
///import esui.Layer;
///import esui.MonthView;
///import esui.Select;
///import esui.Button;
///import baidu.lang.inherits;
///import baidu.date.format;
///import baidu.date.parse;
///import baidu.dom.getPosition;
///import baidu.page.getWidth;

/**
 * 单日期选择器
 * 
 * @param {Object} options 控件初始化参数
 */
esui.Calendar = function (options) {
    // 类型声明，用于生成控件子dom的id和class
    this._type = 'cal';

    
    // 标识鼠标事件触发自动状态转换
    this._autoState = 1;

    esui.InputControl.call( this, options );

    // 初始化显示日期的年月
    this.now = this.now || esui.config.NOW || new Date();
    var now = this.now;
    now = this.now = new Date(
        now.getFullYear(), 
        now.getMonth(), 
        now.getDate()
    );

    // 日期格式化方式初始化
    this.__initOption( 'dateFormat', null, 'DATE_FORMAT' );
    this.__initOption( 'valueFormat', null, 'VALUE_FORMAT' );
    this.__initOption( 'range', null, 'RANGE' );

    // 初始化value与valueAsDate
    var valueAsDate;
    if ( this.value ) {
        valueAsDate = baidu.date.parse( this.value );
    }

    if ( valueAsDate ) {
        this.valueAsDate = valueAsDate;
    } else {
        this.valueAsDate = this.valueAsDate || new Date( now.getTime() );
    }
   
    
    valueAsDate = this.valueAsDate;
    this.month = parseInt( this.month, 10 );
    if ( isNaN( this.month ) ) {
        this.month = valueAsDate.getMonth();
    }
    this.year  = parseInt( this.year, 10 ) || valueAsDate.getFullYear();
};

esui.Calendar.DATE_FORMAT = 'yyyy-MM-dd';
esui.Calendar.VALUE_FORMAT = 'yyyy-MM-dd';
esui.Calendar.RANGE = {
    begin: new Date(2001, 8, 3),
    end: new Date(2046, 10, 4)
};


esui.Calendar.prototype = {
    /**
     * 绘制控件
     * 
     * @public
     * @param {HTMLElement} main 控件的容器元素
     */
    render: function () {
        var me = this;
        var main = me.main;
        
        if ( !me._isRendered ) {
            esui.InputControl.prototype.render.call( me );

            // 初始化主区域
            main.innerHTML = me._getMainHtml();
            main.onclick = me._getMainClickHandler();

            // 创建日历部件的控件对象
            me._renderLayer();

            me._isRendered = 1;
        }
        
        me.setValueAsDate( me.valueAsDate );
    },
   
    /**
     * 获取当前选取的日期(字符串表示)
     * 
     * @public
     * @return {string}
     */
    getValue: function () {
        if ( this.valueAsDate ) {
            return baidu.date.format( this.valueAsDate, this.valueFormat );
        }

        return '';
    },
    
    /**
     * 设置当前选取的日期
     * 
     * @public
     * @param {string} value 选取的日期(字符串表示)
     */
    setValue: function ( value ) {
        var valueAsDate = baidu.date.parse( value );
        valueAsDate && ( this.setValueAsDate( valueAsDate ) );
    },
    
    /**
     * 获取当前选取的日期对象
     * 
     * @public
     * @return {Date}
     */
    getValueAsDate: function () {
        return this.valueAsDate || null;
    },

    /**
     * 设置当前选取的日期
     * 
     * @public
     * @param {Date} valueAsDate 选取的日期
     */
    setValueAsDate: function ( valueAsDate ) {
        if ( !valueAsDate ) {
            return;
        }

        var me = this;
        me.valueAsDate = valueAsDate;
        
        me.getLayer()._controlMap.monthview.setValueAsDate( valueAsDate );
        me.month = valueAsDate.getMonth();
        me.year  = valueAsDate.getFullYear();
        me._repaintMonthView();
        baidu.g( me.__getId('text') ).innerHTML = baidu.date.format( valueAsDate, me.dateFormat );
    },
    
    /**
     * 获取主区域点击的事件handler
     * 
     * @private
     * @return {Function}
     */
    _getMainClickHandler: function () {
        var me = this;

        return function ( e ) {
            if ( !me.isDisabled() ) {
                me.getLayer()._preventHide();
                me.toggleLayer();
            }
        };
    },

     
    /**
     * 显示|隐藏 浮动层
     * 
     * @public
     */
    toggleLayer: function () {
        var me = this;

        if ( this.getLayer().isShow() ) {
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
        this.removeState( 'active' );
    },
    
    /**
     * 显示浮动层
     * 
     * @public
     */
    showLayer: function () {
        var me = this,
            main        = me.main,
            pos         = baidu.dom.getPosition(main),
            pageWidth   = baidu.page.getWidth(),
            layer       = me.getLayer(),
            layerWidth  = layer.main.offsetWidth,
            layerTop    = pos.top + main.offsetHeight,
            layerLeft;

        if ( pageWidth < ( pos.left + layerWidth ) ) {
            layerLeft = pos.left + main.offsetWidth - layerWidth;
        } else {
            layerLeft = pos.left;
        }

        layer.show( layerLeft, layerTop );
        this.addState( 'active' );
    },

    /**
     * 获取控件的html
     * 
     * @private
     * @return {string}
     */
    _getMainHtml: function () {
        var me    = this,
            input = 'text',
            date  = me.getValueAsDate();

        return esui.util.format( 
            me._tplMain,
            me.__getId( input ),
            me.__getClass( input ),
            me.__getClass( 'arrow' ),
            baidu.date.format( date, me.dateFormat ) 
        );
    },
    
    /**
     * 主显示区域的html
     * @private
     */
    _tplMain: '<div class="{1}" id="{0}">{3}</div><div class="{2}"></div>',
    
    /**
     * 浮动层html模板
     * @private
     */
    _tplLayer: '<div class="{0}"><table><tr>'
                    + '<td width="40" align="left"><div ui="type:Button;id:{1};skin:back"></div></td>'
                    + '<td><div ui="type:Select;id:{3};width:55"</td>'
                    + '<td><div ui="type:Select;id:{4};width:40"</td>'
                    + '<td width="40" align="right"><div ui="type:Button;id:{2};skin:forward"></div></td>'
                + '</tr></table></div><div ui="id:{5};type:MonthView"></div>',

    
    /**
     * 绘制浮动层
     * 
     * @private
     */
    _renderLayer: function () {
        var me = this,
            layerId = me.__getId( 'layer' ),
            layer   = esui.util.create( 'Layer', {
                    id      : layerId,
                    autoHide: 'click',
                    retype  : me._type,
                    partName: 'layer',
                    skin    : me.skin
                } );
        
        me._controlMap.layer = layer;
        layer.appendTo();
        layer.onhide = me._getLayerHideHandler();
        
        layer.main.innerHTML = esui.util.format(
            me._tplLayer,
            me.__getClass( 'layer-head' ),
            me.__getId( 'prevmonth' ),
            me.__getId( 'nextmonth' ),
            me.__getId( 'year' ),
            me.__getId( 'month' ),
            me.__getId( 'monthview' )
        );
        
        me._initLayerUI();
    },
    
    /**
     * 初始化浮动层上的子ui组件
     *
     * @private
     */
    _initLayerUI: function () {
        var prevMonth = this.__getId( 'prevmonth' );
        var nextMonth = this.__getId( 'nextmonth' );
        var year      = this.__getId( 'year' );
        var month     = this.__getId( 'month' );
        var monthView = this.__getId( 'monthview' );
        
        var layer        = this.getLayer();
        var uiProp       = {};
        var layerCtrlMap = layer._controlMap;
        var controlMap;
        

        uiProp[ monthView ] = {
            valueAsDate: this.valueAsDate, 
            customClass: this._getMVCustomClass()
        };
        uiProp[ month ] = {
            datasource: this._getMonthOptions( this.year ), 
            value: this.month
        };
        uiProp[ year ] = {
            datasource: this._getYearOptions(), 
            value: this.year
        };
        
        controlMap  = esui.util.init( layer.main, uiProp );
        prevMonth   = controlMap[ prevMonth ];
        nextMonth   = controlMap[ nextMonth ];
        year        = controlMap[ year ];
        month       = controlMap[ month ];
        monthView   = controlMap[ monthView ];

        layerCtrlMap.prevMonth  = prevMonth;
        layerCtrlMap.nextMonth  = nextMonth;
        layerCtrlMap.year       = year;
        layerCtrlMap.month      = month;
        layerCtrlMap.monthview  = monthView;

        year.onchange       = this._getYearChangeHandler();
        month.onchange      = this._getMonthChangeHandler();
        nextMonth.onclick   = this._getMonthNexter();
        prevMonth.onclick   = this._getMonthPrever();
        monthView.onchange  = this._getMVChangeHandler();
    },
    
    /**
     * 判断日期是否属于允许的区间中
     * 
     * @private
     * @param {Date} date
     * @return {boolean}
     */
    _isInRange: function ( date ) {
        var begin = this.range.begin;
        var end = this.range.end;

        if ( ( begin && date - begin < 0 ) 
             || ( end && end - date < 0 )
        ) {
            return false;
        }

        return true;
    },
    
    /**
     * 获取日历区域点击选择的handler
     *
     * @private
     * @return {Function}
     */
    _getMVChangeHandler: function () {
        var me = this;

        return function ( date ) {
            if ( !me._isInRange( date ) ) {
                return false;
            }

            if ( me.onchange( date ) !== false ) {
                me.value = date;
                me.hideLayer();

                var textEl = baidu.g( me.__getId( 'text' ) );
                textEl.innerHTML = baidu.date.format( date, me.dateFormat );
            } else {
                return false;
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
        return function ( date ) {
            if ( !me._isInRange( date ) ) {
                return this.__getClass( 'item-out' );
            }

            return '';
        };
    },

    /**
     * 获取“下一个月”按钮点击的handler
     *
     * @private
     * @return {Function}
     */
    _getMonthNexter: function () {
        var me = this;
        return function () {
            me._repaintMonthView( me.year, me.month + 1 );
        };
    },
    
    /**
     * 获取“上一个月”按钮点击的handler
     *
     * @private
     * @return {Function}
     */
    _getMonthPrever: function () {
        var me = this;
        return function () {
            me._repaintMonthView( me.year, me.month - 1 );
        };
    },

    /**
     * 获取年份切换的handler
     * 
     * @private
     * @return {Function}
     */
    _getYearChangeHandler: function () {
        var me = this;

        return function ( year ) {
            me.year = year;

            me._repaintMonthView( year, me.month );
            me.getLayer()._preventHide();
        };
    },
     
    /**
     * 获取月份切换的handler
     * 
     * @private
     * @return {Function}
     */
    _getMonthChangeHandler: function () {
        var me = this;

        return function ( month ) {
            me._repaintMonthView( me.year, month );
            me.getLayer()._preventHide();
        };
    },
    
    /**
     * 获取浮动层元素
     * 
     * @public
     * @return {HTMLElement}
     */
    getLayer: function () {
        return this._controlMap.layer;
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
            me.removeState( 'active' );
        };
    },
    
    /**
     * 获取可选择的年列表
     * 
     * @private
     * @return {Array}
     */
    _getYearOptions: function () {
        var range  = this.range,
            result = [],
            end    = range.end.getFullYear(),
            i      = range.begin.getFullYear();

        for ( ; i <= end; i++ ) {
            result.push( {
                name  : i, 
                value : i
            } );
        }

        return result;
    },

    /**
     * 获取可选择的月列表
     * 
     * @private
     * @param {number} year 选中的年
     * @return {Array}
     */
    _getMonthOptions: function ( year ) {
        var range   = this.range,
            result  = [],
            i       = 0,
            len     = 11;
        
        if ( year == range.begin.getFullYear() ) {
            i = range.begin.getMonth();
        } 
        
        if ( year == range.end.getFullYear() ) {
            len = range.end.getMonth();
        }

        for ( ; i <= len; i++) {
            result.push( {
                name: (i + 1), 
                value: i
            });
        }

        return result;
    },
    
    /**
     * 绘制浮动层内的日历部件
     * 
     * @private
     */
    _repaintMonthView: function ( year, month ) {
        if ( !esui.util.hasValue( year ) ) {
            year = this.year;
        }
        if ( !esui.util.hasValue( month ) ) {
            month = this.month;
        }

        var me = this,
            range       = me.range,
            view        = new Date(year, month, 1),
            layer       = me.getLayer(),
            layerCM     = layer._controlMap,
            cal         = layerCM.monthview,
            rangeBegin  = range.begin.getFullYear() * 12 + range.begin.getMonth(),
            rangeEnd    = range.end.getFullYear() * 12 + range.end.getMonth(),
            viewMonth   = year * 12 + month,
            monthSelect = layerCM.month;
        
        month = view.getMonth();
        if ( rangeBegin - viewMonth > 0 ) {
            month += ( rangeBegin - viewMonth );
        } else if ( viewMonth - rangeEnd > 0 ) {
            month -= ( viewMonth - rangeEnd );
        }
        view.setMonth( month );
        me.month = view.getMonth();
        me.year  = view.getFullYear();
        
        monthSelect.datasource = me._getMonthOptions( me.year );
        monthSelect.render();
        monthSelect.setValue( me.month );
        
        layerCM.year.setValue( me.year );
        layerCM.prevMonth.setDisabled( ( rangeBegin >= viewMonth ) );
        layerCM.nextMonth.setDisabled( ( rangeEnd <= viewMonth ) );
        
        // 绘制日历部件
        cal.setView( view );
    },
    
    /**
     * 释放控件
     * 
     * @protected
     */
    __dispose: function () {
        this.onchange = null;
        esui.InputControl.prototype.__dispose.call( this );
    }
};

baidu.inherits( esui.Calendar, esui.InputControl );
