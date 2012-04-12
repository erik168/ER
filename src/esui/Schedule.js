/*
 * ESUI (Enterprise Simple UI)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    esui/Schedule.js
 * desc:    日程控件
 * author:  chenjincai, erik
 */
 
///import esui.InputControl;
///import baidu.lang.inherits;
///import baidu.dom.hasClass;
///import baidu.dom.addClass;
///import baidu.dom.removeClass;

/**
 * 日程控件
 *
 * @param {Object} options 控件初始化参数
 */
esui.Schedule = function ( options ) {
    // 类型声明，用于生成控件子dom的id和class
    this._type = 'schedule';
    
    // 标识鼠标事件触发自动状态转换
    this._autoState = 0;

    esui.InputControl.call( this, options );
    
    // 初始化视图的值
    this._initValue();

    this.__initOption('helpSelected', null, 'HELP_SELECTED');
    this.__initOption('help', null, 'HELP');
    this.__initOption('dayWords', null, 'DAY_WORDS');
    this.__initOption('shortcut', null, 'SHORTCUT');
}

esui.Schedule.HELP_SELECTED = '投放时间段';
esui.Schedule.HELP = '暂停时间段';
esui.Schedule.DAY_WORDS = [
    '星期一',
    '星期二',
    '星期三',
    '星期四',
    '星期五',
    '星期六',
    '星期日'
];

esui.Schedule.SHORTCUT = function () {
    /**
     * @inner
     */
    function selectByDayStates( dayStates ) {
        var begin = 0;
        var end   = Math.min( dayStates.length, 7 );
        var checkbox;

        for ( ; begin < end; begin++ ) {
            checkbox = baidu.g( this.__getId( 'lineState' + begin ) );
            checkbox.checked = !!dayStates[ begin ];
            this._dayClick( checkbox, true );
        }
    }

    return [
        {
            text: '全部时间',
            func: function () {
                selectByDayStates.call( this, [1,1,1,1,1,1,1] );
                this._refreshView(this);
            }
        },
        {
            text: '工作日',
            func: function () {
                selectByDayStates.call( this, [1,1,1,1,1,0,0] );
                this._refreshView(this);
            }
        },
        {
            text: '周末',
            func: function () {
                selectByDayStates.call( this, [0,0,0,0,0,1,1] );
                this._refreshView(this);
            }
        }
    ];
}();

esui.Schedule.prototype = {
    /**
     * 设置控件的禁用状态
     * 
     * @public
     * @param {boolean} disabled 是否禁用
     */
    setDisabled: function ( disabled ) {
        disabled = !!disabled;
        var stateName = 'disabled';
        var shortcut;
        var bodyHead;
        var i;
        
        this.disabled = disabled;
        if ( disabled ) {
            this.addState( stateName );
        } else {
            this.removeState( stateName );
        }

        disabled = this.getState( stateName );
        shortcut = baidu.g( this.__getId('shortcut') );
        bodyHead = baidu.g( this.__getId('BodyHead') );
        bodyHead.style.display = shortcut.style.display = disabled ? 'none' : '';
        
        for ( i = 0; i < 7; i++ ) {
            baidu.g( this.__getId('lineState' + i) ).disabled = disabled;
        }
    },
    
    /**
     * 设置控件为禁用
     * 
     * @public
     */
    disable: function () {
        this.setDisabled( true );
    },

    /**
     * 设置控件为可用
     * 
     * @public
     */
    enable: function () {
        this.setDisabled( false );
    },
    
    /**
     * 获取选中的时间(数组格式)
     * 
     * @public
     * @return {Array}
     */
    getValueAsArray: function () {
        return this.valueAsArray;
    },
    
    /**
     * 获取选中的时间(字符串格式)
     * 
     * @public
     * @return {string}
     */
    getValue: function () {
        var value = [];
        var valueAsArray = this.valueAsArray;
        var i, j;

        for ( i = 0; i < 7; i++ ) {
            for ( j = 0; j < 24; j++ ) {
                value.push( valueAsArray[ i ][ j ] );
            }
        }

        return value.join( ',' );
    },

    /**
     * 设置选中的时间(数组格式)
     * 
     * @public
     * @param {Array} valueAsArray
     */
    setValueAsArray: function ( valueAsArray ) {
        // 做了不靠谱的简单判断
        if ( valueAsArray instanceof Array 
             && valueAsArray.length == 7
        ) {
            this.valueAsArray = valueAsArray;
            this._refreshView();
        }
    },

    /**
     * 设置选中的时间(字符串格式)
     * 
     * @public
     * @param {string} value
     */
    setValue: function ( value ) {
        var valueAsArray = this._parseValue( value );
        valueAsArray && this.setValueAsArray( valueAsArray );
    },

    /**
     * 渲染控件
     * 
     * @public
     * @param {Object} main 控件挂载的DOM
     */
    render: function () {
        if ( !this.isRendered ) {
            esui.InputControl.prototype.render.call( this );

            this.main.innerHTML = 
                esui.util.format(
                    this._tpl,
                    this.__getClass( 'head' ),
                    this.__getClass( 'body' ),
                    this.__getClass( 'help' ),
                    this.__getClass( 'help-selected' ),
                    this.__getClass( 'help-unselected' ),
                    this.__getClass( 'help-text' ),
                    this.__getClass( 'shortcut' ),
                    this.__getId( 'body' ),
                    this.helpSelected,
                    this.help,
                    this.__getId( 'shortcut' ),
                    this._getShortcutHtml()
                );
            this._initBody();
        }

        this.isRendered = 1;
        this.setDisabled( this.disabled );
        this._refreshView();
    },

    /**
     * 控件主体html模板
     *
     * @private
     */
    _tpl: '<div class="{0}">'
                + '<div class="{2}">'
                    + '<div class="{3}"></div>'
                    + '<div class="{5}">{8}</div>'
                    + '<div class="{4}"></div>'
                    + '<div class="{5}">{9}</div>'
                + '</div>'
                + '<div class="{6}" id="{10}">{11}</div>'
            + '</div>'
        + '<div class="{1}" id="{7}"></div>',
    
    /**
     * 初始化视图的值
     * 
     * @private
     */
    _initValue: function () {
        var value        = this._parseValue( this.value );
        var valueAsArray = this.valueAsArray;
        var i;
        var j;
        var lineValue;

        if ( value ) {
            valueAsArray = value;
        } else if ( !this.valueAsArray ) {
            valueAsArray = [];
            for ( i = 0; i < 7; i++ ) {
                lineValue = [];
                valueAsArray.push( lineValue );
                
                for ( j = 0; j < 24; j++ ) {
                    lineValue.push( 0 );
                }
            }
        }

        this.valueAsArray = valueAsArray;
    },

    /**
     * 将字符串类型的值解析成数组形式
     * 
     * @private
     * @param {string} value
     * @return {Array}
     */
    _parseValue: function ( value ) {
        value = (value || '').split( ',' );

        var valueAsArray = null;
        var i;

        if ( value.length == 24 * 7 ) {
            valueAsArray = [];
            for ( i = 0; i < 7; i++ ) {
                valueAsArray.push( value.slice( i * 24, (i + 1) * 24 ) );
            }
        }

        return valueAsArray;
    },
    
    /**
     * 获取快捷选择区域的html
     *
     * @private
     * @return {string}
     */
    _getShortcutHtml: function () {
        var html        = [];
        var shortcuts   = this.shortcut;
        var len         = shortcuts.length;
        var separation  = '&nbsp;|&nbsp;';
        var clazz       = this.__getClass( 'shortcut-item' );
        var tpl         = '<span class="{0}" onclick="{2}">{1}</span>';
        var i, shortcut;

        for (i = 0; i < len; i++) {
            shortcut = shortcuts[i];
            html.push(
                esui.util.format(
                    tpl,
                    clazz,
                    shortcut.text,
                    this.__getStrCall( '_doShortcut', i )
                ) );
        }
        return html.join( separation );
    },
    
    /**
     * 执行快捷选择的功能
     *
     * @private
     * @param {number} index 快捷选项索引
     */
    _doShortcut: function ( index ) {
        var func = this.shortcut[ index ].func;
        typeof func == 'function' && func.call( this );
    },
    
    /**
     * 初始化控件主体
     *
     * @private
     */
    _initBody: function () {
        var ref          = this.__getStrRef();
        var dayWords     = this.dayWords;
        var html         = [];
        var lineClass    = this.__getClass( 'line' );
        var dayClass     = this.__getClass( 'day' );
        var segClass     = this.__getClass( 'seg' );
        var timeClass    = this.__getClass( 'time' );
        var timeHClass   = this.__getClass( 'timehead' )
        var lineMidHtml  = '</div><div class="' + segClass + '">';
        var headItemTpl  = '<div class="' + timeHClass + '" onmouseover="{2}" onmouseout="{3}" onclick="{4}" time="{1}" id="{0}">&nbsp;</div>';
        var lineEndHtml  = '</div></div>';
        var lineBeginTpl = '<div class="' + lineClass + '" id="{0}">'
                                + '<div class="' + dayClass + '">'
                                + '<input type="checkbox" id="{1}" value="{2}" onclick="{3}">'
                                + '<label for="{1}">{4}</label>';
        var timeTpl = '<div class="' + timeClass + '" onmouseover="{3}" onmouseout="{4}" onclick="{5}" time="{2}" day="{1}" timeitem="1" id="{0}">{2}</div>';

        // 拼装html：头部time列表 
        html.push( '<div class="' + lineClass + '" id="' 
                   , this.__getId( 'BodyHead' ) + '">'
                   , '<div class="' + dayClass + '">&nbsp;'
                   , lineMidHtml );

        for ( j = 0; j < 24; j++ ) {
            if ( j > 0 && j % 6 == 0 ) {
                html.push( lineMidHtml );
            }

            html.push(
                esui.util.format(
                    headItemTpl,
                    this.__getId( 'TimeHead' + j ),
                    j,
                    ref + '._timeHeadOverOut(this,1)',
                    ref + '._timeHeadOverOut(this)',
                    ref + "._timeHeadClick(this)"
                ));
        }
        html.push( lineEndHtml );

        // 拼装html：时间体列表 
        for ( i = 0; i < 7; i++ ) {
            html.push(
                esui.util.format(
                    lineBeginTpl,
                    this.__getId( 'line' + i ),
                    this.__getId( 'lineState' + i ),
                    i,
                    ref + '._dayClick(this)',
                    dayWords[ i ]
                ),
                lineMidHtml
            );
                      
            for ( j = 0; j < 24; j++ ) {
                if ( j > 0 && j % 6 == 0 ) {
                    html.push( lineMidHtml );
                }

                html.push(
                    esui.util.format(
                        timeTpl,
                        this.__getId( 'time_' + i + '_' + j ),
                        i,
                        j,
                        ref + '._timeOverOut(this,1)',
                        ref + '._timeOverOut(this)',
                        ref + "._timeClick(this)"
                    )
                );
            }

            html.push( lineEndHtml );
        }
        
        // html写入
        baidu.g( this.__getId( 'body' ) ).innerHTML = html.join('');
    },
    
    /**
     * “时间”移入移出的处理函数
     *
     * @private
     * @param {HTMLElement} dom 时间的dom元素
     * @param {booleam}     isOver 是否鼠标移入
     */
    _timeOverOut: function ( dom, isOver ) {
        var clazz = this.__getClass( 'time-hover' );
        if ( isOver ) {
            baidu.addClass( dom, clazz );
        } else {
            baidu.removeClass( dom, clazz );
        }
    },
    
    /**
     * “时间头部”移入移出的处理函数
     *
     * @private
     * @param {HTMLElement} dom 头部的dom元素
     * @param {booleam}     isOver 是否鼠标移入
     */
    _timeHeadOverOut: function ( dom, isOver ) {
        var clazz = this.__getClass( 'timehead-hover' );
        if ( isOver ) {
            baidu.addClass( dom, clazz );
        } else {
            baidu.removeClass( dom, clazz );
        }
    },
    
    /**
     * 点击“时间”的处理函数
     *
     * @private
     * @param {HTMLElement} dom 时间的dom元素
     */
    _timeClick: function ( dom ) {
        if ( this.isDisabled() ) {
            return;
        }
        
        var day  = parseInt( dom.getAttribute( 'day' ), 10 ),
            time = parseInt( dom.getAttribute( 'time' ), 10 ),
            isSelected = !baidu.dom.hasClass(
                            dom, 
                            this.__getClass( 'time-selected' ));
        
        this._selectTime( day, time, isSelected );
    },
    
    /**
     * 点击“时间头部”的处理函数
     *
     * @private
     * @param {HTMLElement} dom 头部的dom元素
     */
    _timeHeadClick: function ( dom ) {
        var isSelected = !baidu.dom.hasClass(
                            dom, 
                            this.__getClass( 'timehead-active' ) ),
            time = parseInt( dom.getAttribute( 'time' ), 10 ),
            div;
        
        for ( i = 0; i < 7; i++ ) {
            div = baidu.g( this.__getId('time_' + i + '_' + time) );
            this._selectTime(
                parseInt( div.getAttribute('day'), 10 ), 
                time, 
                isSelected, 
                true
            );
        }           
        
        this._refreshView();
    },
    
    /**
     * 点击“星期”的处理函数
     *
     * @private
     * @param {HTMLElement} dom 星期的checkbox元素
     * @param {boolean}     dontRefresh 是否禁止视图刷新
     */
    _dayClick: function ( dom, dontRefresh ) {
        var me          = this,
            isSelected  = dom.checked,
            divs        = dom.parentNode.parentNode.getElementsByTagName( 'div' ),
            len         = divs.length, div;

        while ( len-- ) {
            div = divs[ len ];
            if ( this._isTimeDom( div ) ) {
                this._selectTime(
                    parseInt( div.getAttribute( 'day' ), 10),
                    parseInt( div.getAttribute( 'time' ), 10),
                    isSelected,
                    true
                );
            }
        }
        
        if ( !dontRefresh ) {
            me._refreshView();
        }
    },

    /**
     * 刷新weektime选择器的视图
     * 
     * @private
     */
    _refreshView: function () {
        var me          = this;
        var disabled    = me.isDisabled();
        var valueAsArr  = me.valueAsArray;
        var headStates  = [];
        var activeHeadClass = me.__getClass( 'timehead-active' );
        var selectedClass   = me.__getClass( 'time-selected' );
        var head    = baidu.g( me.__getId( 'BodyHead' ) ).getElementsByTagName( 'div' );
        var divs    = baidu.g( me.__getId( 'body' ) ).getElementsByTagName( 'div' );
        var divLen  = divs.length;
        var div;
        var divMatch;
        var headDiv;
        var i, j;
        var count = 0;
        var lineValue, lineActive, lineCb;
        var lineEl, lineDivs, time, temp;

        // 初始化头部状态表
        for ( i = 0; i < 24; i++ ) {
            headStates.push( 1 );
        }
        
        // 遍历头部状态
        for ( i = 0; i < 7; i++ ) {
            lineEl      = baidu.g( me.__getId( 'line' + i ) );
            lineDivs    = lineEl.getElementsByTagName( 'div' );
            j           = lineDivs.length;

            while ( j-- ) {
                time = lineDivs[ j ];
                if ( me._isTimeDom( time ) ) {
                    time = parseInt( time.getAttribute( 'time' ), 10 );
                    temp = valueAsArr[ i ][ time ];
                    if ( !temp || temp == '0' ) {
                        headStates[ time ] = 0;
                    }
                }
            }
        }
        
        // 刷新time头部状态
        j = head.length;
        while ( j-- ) {
            div = head[ j ];
            divMatch = /TimeHead([0-9]+)$/.exec( div.id );
            if ( divMatch && divMatch.length == 2 ) {
                if ( headStates[ parseInt( divMatch[ 1 ], 10 ) ] ) {
                    baidu.addClass( div, activeHeadClass );
                } else {
                    baidu.removeClass( div, activeHeadClass );
                }
            }
        }

        // 刷新时间项状态
        while ( divLen-- ) {
            div = divs[ divLen ];
            divMatch = /time_([0-9]+)_([0-9]+)$/.exec( div.id );
            if ( divMatch && divMatch.length == 3 ) {
                time = valueAsArr[ parseInt( divMatch[ 1 ], 10 ) ][ parseInt( divMatch[ 2 ], 10 ) ];
                if ( time && time != '0' ) {
                    baidu.addClass( div, selectedClass );
                } else {
                    baidu.removeClass( div, selectedClass );
                }
            }
        }

        // 刷新checkbox状态
        for ( i = 0; i < 7; i++ ) {
            lineValue = valueAsArr[ i ];
            lineActive = true;
            
            for ( j = 0; j < 24; j++ ) {
                if ( !lineValue[ j ] || lineValue[ j ] == '0' ) {
                    lineActive = false;
                } else {
                    count++;
                }
            }
            
            baidu.g( me.__getId( 'lineState' + i ) ).checked = lineActive;
        }
    },
    

    /**
     * 选中时间
     * 
     * @private
     * @param {Object} day 星期
     * @param {Object} time 时间
     * @param {Object} isSelected 是否选中
     * @param {Object} noRrefresh 是否不刷新视图
     */
    _selectTime: function ( day, time, isSelected, noRrefresh ) {
        var value = this.valueAsArray;
        value[ day ][ time ] = ( isSelected ? 1 : 0 );
        
        if ( !noRrefresh ) {
            this._refreshView();
        }
    },
    
    /**
     * 判断dom元素是否时间元素
     * 
     * @private
     * @param {HTMLElement} dom
     */
    _isTimeDom: function ( dom ) {
        return !!dom.getAttribute( 'timeitem' );
    }
}

baidu.inherits( esui.Schedule, esui.InputControl );
