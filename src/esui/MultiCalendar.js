/*
 * ESUI (Enterprise Simple UI)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    esui/MultiCalendar.js
 * desc:    多日期选择器
 * author:  erik, zhaolei
 */

///import esui.InputControl;
///import esui.Layer;
///import esui.MonthView;
///import esui.Select;
///import esui.Button;
///import esui.MiniMultiCalendar;
///import baidu.lang.inherits;
///import baidu.date.format;
///import baidu.date.parse;

/**
 * 多日期选择器
 * 
 * @param {Object} options 控件初始化参数
 */
esui.MultiCalendar = function ( options ) {
    // 类型声明，用于生成控件子dom的id和class
    this._type = 'mcal';

    // 标识鼠标事件触发自动状态转换
    this._autoState = 1;
    
    esui.InputControl.call( this, options );

    // 声明日期格式
    this.__initOption( 'dateFormat', null, 'DATE_FORMAT' );
    this.__initOption( 'valueFormat', null, 'VALUE_FORMAT' );
    
    // 声明按钮文字
    this.__initOption( 'okText', null, 'OK_TEXT' );
    this.__initOption( 'cancelText', null, 'CANCEL_TEXT' );

    // 声明浮动层侧边的说明
    this.__initOption( 'beginSideTitle', null, 'BEGIN_SIDE_TITLE' );
    this.__initOption( 'endSideTitle', null, 'END_SIDE_TITLE' );

    // 初始化当前日期
    this.now = this.now || esui.config.NOW || new Date();
    var now = this.now;
    
    // 初始化value与valueAsObject
    var valueAsObject, valueSplits;
    if ( this.value ) {
        valueSplits = this.value.split( ',' ); 
        if ( valueSplits.length == 2 ) {
            valueAsObject = {
                begin   : baidu.date.parse( valueSplits[ 0 ] ),
                end     : baidu.date.parse( valueSplits[ 1 ] )
            };
        }
    }

    if ( valueAsObject ) {
        this.valueAsObject = valueAsObject;
    } else {
        this.valueAsObject = this.valueAsObject || {
            begin   : new Date( now ),
            end     : new Date( now )
        };
    }
    
    // 初始化可选择的日期
    this.__initOption( 'range', null, 'RANGE' );

    // 初始化显示的日期
    this.view = {
        begin   : new Date( this.valueAsObject.begin ),
        end     : new Date( this.valueAsObject.end )
    };
};

esui.MultiCalendar.OK_TEXT          = '确定';
esui.MultiCalendar.CANCEL_TEXT      = '取消';
esui.MultiCalendar.BEGIN_SIDE_TITLE = '开始日期'
esui.MultiCalendar.END_SIDE_TITLE   = '结束日期';
esui.MultiCalendar.DATE_FORMAT      = 'yyyy-MM-dd';
esui.MultiCalendar.VALUE_FORMAT     = 'yyyy-MM-dd';
esui.MultiCalendar.RANGE = {
    begin: new Date(2001, 8, 3),
    end: new Date(2046, 10, 4)
};

esui.MultiCalendar.prototype = {
    /**
     * 绘制控件
     * 
     * @public
     */
    render: function () {
        var me = this;
        var main = this.main;
        
        if ( !me._isRendered ) {
            esui.InputControl.prototype.render.call( me );

            main.innerHTML = me._getMainHtml();
            main.onclick = me._getMainClickHandler();
            me._renderLayer();
            me._isRendered = 1;
        }

        me.setValueAsObject( me.valueAsObject );
    },
    
    
    /**
     * 获取当前选取的日期（{begin:Date,end:Date}类型）
     * 
     * @public
     * @return {Object}
     */
    getValueAsObject: function () {
        return this.valueAsObject || null;
    },

    /**
     * 获取当前选取的日期（字符串类型）
     * 
     * @public
     * @return {string}
     */
    getValue: function () {
        var valueAsObj  = this.valueAsObject;
        var format      = this.valueFormat;
        var begin, end;

        if ( valueAsObj
             && ( begin = valueAsObj.begin )
             && ( end = valueAsObj.end )
        ) {
            return baidu.date.format( begin, format )
                    + ','
                    + baidu.date.format( end, format );
        }

        return '';
    },
    
    /**
     * 设置当前选取的日期
     * 
     * @public
     * @param {Object} obj 日期区间（{begin:Date,end:Date}类型）
     */
    setValueAsObject: function ( obj ) {
        if ( obj && obj.begin && obj.end ) {
            this.valueAsObject = obj;
            this._controlMap.shortcut.setValueAsObject( obj );
            this._repaintMain( obj );
        }
    },
    
    /**
     * 设置当前选取的日期（字符串类型）
     * 
     * @public
     * @param {string} value
     */
    setValue: function ( value ) {
        value = value.split( ',' );
        if ( value.length == 2 ) {
            var begin = baidu.date.parse( value[ 0 ] );
            var end = baidu.date.parse( value[ 1 ] );

            if ( begin && end ) {
                this.setValueAsObject( {
                    begin   : begin,
                    end     : end
                } );
            }
        }
    },

    /**
     * 主显示区域的模板
     * @private
     */
    _tplMain: '<span id="{3}" class="{4}" style="display:none"></span><span id="{0}" class="{1}"></span><div class="{2}" arrow="1"></div>',

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
            
        function getValue( type ) {
            return me._controlMap[ type + 'monthview' ].getValueAsDate();
        }
        
        return function () {
            var begin  = getValue( 'begin' ),
                end    = getValue( 'end' ),
                dvalue = end - begin, 
                valueAsObject;

            if ( dvalue > 0 ) {
                valueAsObject = {
                    'begin': begin,
                    'end': end
                };
            } else {
                valueAsObject = {
                    'begin': end,
                    'end': begin
                };
            }
            
            if ( me.onchange( valueAsObject, me.getShortcutText( valueAsObject ) ) !== false ) {
                me.valueAsObject = valueAsObject;

                me._controlMap.shortcut.setValueAsObject( valueAsObject );
                me._repaintMain( valueAsObject );
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
        return function ( date ) {
            if ( !me._isInRange( date ) ) {
                return this.__getClass( 'item-out' );
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
    _getCalChangeHandler: function ( type ) {
        var me = this;

        return function ( date ) {
            if ( !me._isInRange( date ) ) {
                return false;
            }

            me.tempValue[ type ] = date;
            var title = baidu.g( me.__getId( type + 'title' ) );
            title.innerHTML = baidu.date.format( date, me.dateFormat );
        };
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
        var end   = this.range.end;

        if ( ( begin && date - begin < 0 ) 
             || ( end && end - date < 0 )
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
    _repaintMain: function ( valueAsObject, shortcutText ) {
        var scText = shortcutText || this.getShortcutText( valueAsObject );
        var scEl   = baidu.g( this.__getId( 'shortcuttext' ) );

        baidu.g( this.__getId( 'text' ) ).innerHTML = this.getValueText( valueAsObject );
        scText && ( scEl.innerHTML = scText );
        scEl.style.display = scText ? '' : 'none';
    },
    
    /**
     * 重新绘制浮动层侧边栏的显示内容
     * 
     * @private
     * @param {string} type 侧边栏类型，begin|end
     */
    _repaintSide: function ( type ) {
        var me          = this,
            range       = me.range,
            view        = me.view[ type ],
            year        = view.getFullYear(),
            month       = view.getMonth(),
            valueAsDate = me.tempValue[ type ],
            cal         = me._controlMap[ type + 'monthview' ],
            monthSelect = me._controlMap[ type + 'month' ],
            rangeBegin  = range.begin.getFullYear() * 12 + range.begin.getMonth(),
            rangeEnd    = range.end.getFullYear() * 12 + range.end.getMonth(),
            viewMonth   = view.getFullYear() * 12 + view.getMonth(),
            titleEl     = baidu.g( me.__getId( type + 'title' ) );
        
        monthSelect.datasource = me._getMonthOptions( year );
        monthSelect.render();
        if ( rangeBegin - viewMonth > 0 ) {
            month += ( rangeBegin - viewMonth );
        } else if ( viewMonth - rangeEnd > 0 ) {
            month -= ( viewMonth - rangeEnd );
        }
        monthSelect.setValue( month );
        view.setMonth( month );

        me._controlMap[ type + 'year' ].setValue( year );
        me._controlMap[ type + 'prevmonth' ].setDisabled( ( rangeBegin >= viewMonth ) );
        me._controlMap[ type + 'nextmonth' ].setDisabled( ( rangeEnd <= viewMonth ) );
        
        titleEl.innerHTML = baidu.date.format( valueAsDate, me.dateFormat );

        // 绘制日历部件
        cal.setValueAsDate( valueAsDate );
        cal.setView( view );
    },

    /**
     * 获取控件的html
     * 
     * @private
     * @return {string}
     */
    _getMainHtml: function () {
        var me      = this,
            show    = 'text',
            showsc  = 'shortcuttext';

        return esui.util.format(
            me._tplMain,
            me.__getId( show ),
            me.__getClass( show ),
            me.__getClass( 'arrow' ),
            me.__getId( showsc ),
            me.__getClass( showsc )
        );
    },

    /**
     * 获取浮动层侧边栏的html
     * 
     * @private
     * @param {string} type 侧边栏类型,begin|end
     * @return {string}
     */
    _getLayerSideHtml: function ( type ) {
        var me = this;

        return esui.util.format(
            me._tplSide, 
            me.__getClass( type ),
            me.__getClass( 'side-title' ),
            me.__getId( type + 'title' ),
            me.__getId( type + 'monthview' ),
            me.__getClass( 'side-func' ),
            me.__getId( type + 'prevmonth' ),
            me.__getId( type + 'nextmonth' ),
            me.__getId( type + 'year' ),
            me.__getId( type + 'month' ),
            me[ type + 'SideTitle' ]
        );
    },

    /**
     * 绘制浮动层
     * 
     * @private
     */
    _renderLayer: function () {
        var me = this,
            layerId = me.__getId( 'layer' ),
            layer = esui.util.create( 'Layer' , 
                {
                    id       : layerId,
                    autoHide : 'click',
                    retype   : me._type,
                    partName : 'layer',
                    skin     : me.skin
                } );
        
        me._controlMap.layer = layer;
        layer.appendTo();
        layer.onhide = me._getLayerHideHandler();
        layer.main.innerHTML = esui.util.format(
            me._tplLayer,
            me.__getId( 'shortcut' ),
            me.__getClass( 'body' ),
            me.__getClass( 'foot' ),
            me.__getId( 'ok' ),
            me.__getId( 'cancel' ),
            me._getLayerSideHtml( 'begin' ),
            me._getLayerSideHtml( 'end' ),
            me.okText,
            me.cancelText,
            me.__getId( 'close' ) 
        );

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
            me.removeState( 'active' );
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
            valueAsObj  = this.valueAsObject,
            controlMap;
        
        // 构造附加属性
        uiProp[beginMV] = {valueAsDate:valueAsObj.begin, customClass:mvCustomClz};
        uiProp[endMV]   = {valueAsDate:valueAsObj.end, customClass:mvCustomClz};
        uiProp[beginM]  = {datasource:this._getMonthOptions(beginYear),value:beginMonth};
        uiProp[endM]    = {datasource:this._getMonthOptions(endYear),value:endMonth};
        uiProp[beginY]  = {datasource:yearDs,value:beginYear};
        uiProp[endY]    = {datasource:yearDs,value:endYear};
        uiProp[shortcut]= {options: this.shortcutOptions, valueAsObject: valueAsObj};

        // 初始化控件
        controlMap  = esui.util.init( layer.main, uiProp );
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

        this._controlMap['ok']              = ok;
        this._controlMap['cancel']          = cancel;
        this._controlMap['close']           = close;
        this._controlMap['beginmonthview']  = beginMV;
        this._controlMap['endmonthview']    = endMV;
        this._controlMap['beginmonth']      = beginM;
        this._controlMap['endmonth']        = endM;
        this._controlMap['beginyear']       = beginY;
        this._controlMap['endyear']         = endY;
        this._controlMap['beginprevmonth']  = beginPM;
        this._controlMap['endprevmonth']    = endPM;
        this._controlMap['beginnextmonth']  = beginNM;
        this._controlMap['endnextmonth']    = endNM;
        this._controlMap['shortcut']        = shortcut;

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

        return function ( valueAsObject, shortcutText ) {
            if ( me.onchange( valueAsObject, shortcutText ) !== false ) {
                me.valueAsObject = valueAsObject;
                me._repaintMain( valueAsObject, shortcutText );
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
    _getYearChangeHandler: function ( type ) {
        var me = this;

        return function ( year ) {
            var view = me.view[ type ],
                month = view.getMonth();

            me._repaintMonthView( type, year, month );
            me.getLayer()._preventHide();
        };
    },
    
    /**
     * 获取月份切换的handler
     * 
     * @private
     * @return {Function}
     */
    _getMonthChangeHandler: function ( type ) {
        var me = this;

        return function ( month ) {
            var view = me.view[ type ],
                year = view.getFullYear();

            me._repaintMonthView( type, year, month );
            me.getLayer()._preventHide();
        };
    },
    
    /**
     * 获取月份前进按钮的handler
     * 
     * @private
     * @return {Function}
     */
    _getPrevMonthHandler: function ( type ) {
        var me = this;

        return function () {
            var view = me.view[ type ];
            
            view.setMonth( view.getMonth() - 1 )
            me._repaintMonthView( type, view.getFullYear(), view.getMonth() );
        };
    },
    
    /**
     * 获取月份后退按钮的handler
     * 
     * @private
     * @return {Function}
     */
    _getNextMonthHandler: function ( type ) {
        var me = this;

        return function () {
            var view = me.view[ type ];
            
            view.setMonth(view.getMonth() + 1)
            me._repaintMonthView( type, view.getFullYear(), view.getMonth() );
        };
    },

    /**
     * 获取可选择的年列表
     * 
     * @private
     * @return {Array}
     */
    _getYearOptions: function () {
        var range   = this.range,
            ds      = [],
            i       = range.begin.getFullYear(),
            end     = range.end.getFullYear();

        for ( ; i <= end; i++) {
            ds.push( {name: i, value:i} );
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
    _getMonthOptions: function ( year ) {
        var range   = this.range,
            ds      = [],
            i       = 0,
            len     = 11;
        
        if ( year == range.begin.getFullYear() ) {
            i = range.begin.getMonth();
        } 
        
        if ( year == range.end.getFullYear() ) {
            len = range.end.getMonth();
        }

        for ( ; i <= len; i++ ) {
            ds.push( {
                name: (i + 1), 
                value:i
            } );
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
    _repaintMonthView: function ( type, year, month ) {
        this.view[ type ] = new Date( year, month, 1 );
        this._repaintSide( type );
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
            pos         = baidu.dom.getPosition( main ),
            pageWidth   = baidu.page.getWidth(),
            layer       = me.getLayer(),
            layerWidth  = layer.main.offsetWidth,
            value       = me.valueAsObject,
            layerTop    = pos.top + main.offsetHeight - 1,
            layerLeft;

        // 创建临时日期存储变量
        me.tempValue = {
            'begin' : new Date( value.begin ),
            'end'   : new Date( value.end )
        };
        
        // 更新浮动层显示的日期
        me.view = {
            'begin' : new Date( value.begin ),
            'end'   : new Date( value.end )
        };
        
        me._repaintLayer();

        if ( pageWidth < ( pos.left + layerWidth ) ) {
            layerLeft = pos.left + main.offsetWidth - layerWidth;
        } else {
            layerLeft = pos.left;
        }
        layer.show( layerLeft, layerTop );
        this.addState( 'active' );
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
     * 重新绘制layer
     * 
     * @private
     */
    _repaintLayer: function () {  
        //this._controlMap['shortcut'].select(this.value);
        this._repaintSide( 'begin' );
        this._repaintSide( 'end' );
    },

    /**
     * 获取当前日期区间的显示字符
     * 
     * @public
     * @param {Object} opt_valueAsObject 日期区间
     * @return {string}
     */
    getValueText: function ( opt_valueAsObject ) {
        var valueAsObj  = opt_valueAsObject || this.getValueAsObject();
        var begin       = valueAsObj.begin;
        var end         = valueAsObj.end;
        var format      = this.dateFormat;
        var formatter   = baidu.date.format;
        var shortcut    = this._controlMap[ 'shortcut' ];
            
        if ( begin && end ) {
            return formatter( begin, format ) 
                    + " 至 " 
                    + formatter( end, format );
        }
        
        return '';
    },
    
    /**
     * 获取当前日期区间的快捷显示字符
     * 
     * @public
     * @param {Object} opt_valueAsObject 日期区间
     * @return {string}
     */
    getShortcutText: function ( opt_valueAsObject ) {
        var valueAsObject   = opt_valueAsObject || this.getValue();
        var shortcut        = this._controlMap.shortcut;

        if ( valueAsObject.begin && valueAsObject.end ) {
            return shortcut.getName( opt_valueAsObject ? valueAsObject : null );
        }
        
        return '';
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


baidu.inherits( esui.MultiCalendar, esui.InputControl );
