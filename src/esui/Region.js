/*
 * ESUI (Enterprise Simple UI)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    esui/Region.js
 * desc:    地域选择控件
 * author:  zhouyu, erik
 */

///import esui.InputControl;
///import esui.Select;
///import baidu.lang.inherits;
///import baidu.object.clone;

/**
 * 地域选择控件
 *
 * @param {Object} options 控件初始化参数
 */
esui.Region = function ( options ) {
    // 类型声明，用于生成控件子dom的id和class
    this._type = 'region';
    
    // 标识鼠标事件触发自动状态转换
    this._autoState = 0;

    esui.InputControl.call( this, options );


    this._initDatasource( this.datasource );
    
    // 初始化mode
    if ( this.mode != 'single' ) {
        this.mode = 'multi';
    }

    // 初始化value
    var valueAsRaw = this.valueAsRaw || this.value;
    if ( this.mode == 'multi' ) {
        if ( typeof valueAsRaw == 'string' ) {
            valueAsRaw = valueAsRaw.split( ',' );
        } else if ( !( valueAsRaw instanceof Array ) ) {
            valueAsRaw = [];
        }
    }
    this.valueAsRaw =  valueAsRaw;
};

 
esui.Region.prototype = {
    /**
     * 渲染控件
     *
     * @public
     */
    render: function () {
        if ( !this._isRendered ) {
            esui.InputControl.prototype.render.call( this );

            switch ( this.mode ) {
            case 'multi':
                this._initMulti();
                break;
            case 'single':
                this._initSingle();
                break;
            }
            
            this._isRendered = 1;
        }
    },
    
    /**
     * 获取当前选中的值
     * 
     * @public
     * @return {string}
     */
    getValue: function () {
        if ( this.mode == 'multi' ) {
            return this.valueAsRaw.join( ',' );
        }

        return this.valueAsRaw;
    },
    
    /**
     * 设置当前选中的值
     * 
     * @public
     * @param {string} value
     */
    setValue: function ( value ) {
        this.valueAsRaw = value;
        
        if ( this.mode == 'multi' ) {
            this._selectMulti( value.split( ',' ) );
        } else {
            this._controlMap.select.setValue( value );
        }
    },

    /**
     * 设置控件的禁用状态
     * 
     * @public
     * @param {boolean} disabled 是否禁用
     */
    setDisabled: function ( disabled ) {
        disabled = !!disabled;
        if ( this.mode == 'multi' ) {
            var cbs = this.main.getElementsByTagName( 'input' );
            var cbsLen = cbs.length;
            var cb;

            while ( cbsLen-- ) {
                cb = cbs[ cbsLen ];
                if ( cb.type == 'checkbox' ) {
                    cb.disabled = disabled;
                }
            }

            this._updateMulti();
        } else {
            this._controlMap.select.setDisabled( disabled );
        }

        this[ disabled ? 'addState' : 'removeState' ]( 'disabled' );
        this.disabled = disabled;
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
     * 多选地域初始化
     * 
     * @private
     */
    _initMulti: function () {
        var data    = this.datasource;
        var len     = data.length;
        var html    = [];
        var i;
        
        for ( i = 0; i < len; i++ ) {
            html.push( this._getOptionHtml( data[ i ], 0 ) );
        }

        this.main.innerHTML = html.join( '' );
        this._selectMulti( this.valueAsRaw );
    },
    
    /**
     * 选中地域（多选）
     * 
     * @private
     * @param {Array} valueAsRaw
     */
    _selectMulti: function ( valueAsRaw ) {
        this.valueAsRaw = valueAsRaw;

        var len = valueAsRaw.length;
        var map = {};
        var key;
        while ( len -- ) {
            map[ valueAsRaw[ len ] ] = 1;
        }

        for ( key in this._dataMap ) {
            this._getOption( key ).checked = ( key in map );
        }

        this._updateMulti();
    },
    
    /**
     * 更新多选地域的视图和选中值
     * 
     * @private
     */
    _updateMulti: function ( data, dontResetValue ) {
        data = data || {children: this.datasource};
        if ( !dontResetValue ) {
            this.valueAsRaw = [];
        }

        var children = data.children;
        var len      = children instanceof Array && children.length;
        var i;
        var item;
        var isChecked = true;
        var isItemChecked;
        var checkbox = data.id && this._getOption( data.id );

        if ( len ) {
            for ( i = 0; i < len; i++ ) {
                isItemChecked = this._updateMulti( children[ i ], 1 );
                isChecked = isChecked && isItemChecked;
            }

            checkbox && ( checkbox.checked = isChecked );
            return isChecked;
        } else {
            isChecked = checkbox.checked;
            isChecked && this.valueAsRaw.push( data.id );
            return isChecked;
        }
    },
    
    /**
     * 多选选项的html模板
     *
     * @private
     */
    _tplOption: '<dt class="{3}"><input type="checkbox" value="{0}" optionId="{0}" id="{2}" onclick="{4}" level="{5}"><label for="{2}">{1}</label></dt>',
    
    /**
     * 获取选项的html
     *
     * @private
     * @param {Object} data 选项数据
     * @param {number} level 选项层级
     * @return {string}
     */
    _getOptionHtml: function ( data, level ) {
        var id              = data.id;
        var optionClass     = [];
        var bodyClass       = this.__getClass( 'option-body' );
        var childrenClass   = this.__getClass( 'option-children' );
        var html            = [];
        var children        = data.children;
        var len             = children instanceof Array && children.length;
        var i;
        
        optionClass.push(
            this.__getClass( 'option' ),
            this.__getClass( 'option-' + id ),
            this.__getClass( 'option-level' + level )
        );

        html.push(
            '<dl class="' + optionClass.join(' ') + '">',
            esui.util.format(
                this._tplOption,
                id,
                data.text,
                this.__getId( 'option_' + id ),
                bodyClass,
                this.__getStrRef() + '._optionClick(this)',
                level
            ) );
        
        if ( len ) {
            html.push( '<dd class="' + childrenClass + '">' );
            for ( i = 0; i < len; i++ ) {
                html.push( this._getOptionHtml( children[ i ], level + 1 ) );
            }
            html.push( '</dd>' );
        }
        html.push( '</dl>' );
        
        return html.join( '' );
    },
    
    /**
     * 多选选项点击的handler
     *
     * @private
     * @param {HTMLInputElement} dom 选项checkbox的dom
     */
    _optionClick: function ( dom, dontRefreshView ) {
        var id          = dom.getAttribute( 'optionId' );
        var data        = this._dataMap[ id ];
        var isChecked   = dom.checked;
        var children    = data.children;
        var len         = children instanceof Array && children.length;
        var item;
        var checkbox;
        
        if ( len ) {
            while ( len-- ) {
                item = children[ len ];
                checkbox = this._getOption( item.id );
                checkbox.checked = isChecked;
                this._optionClick( checkbox, 1 );
            }
        }

        if ( !dontRefreshView ) {
            this._updateMulti();
        }
    },
    
    /**
     * 获取多选选项的checkbox
     *
     * @private
     * @param {string} id 选项标识
     * @return {HTMLInputElement}
     */
    _getOption: function ( id ) {
        return baidu.g( this.__getId( 'option_' + id ) );
    },
    
    /**
     * 初始化数据源
     *
     * @private
     */
    _initDatasource: function ( data ) {
        this.datasource = data || esui.Region.REGION_LIST;
        this._dataMap   = {};
        data = this.datasource;
        walker.call( this, data, {children: data} );

        function walker( data, parent ) {
            var len = data instanceof Array && data.length;
            var i;
            var item;
            
            if ( !len ) {
                return;
            }

            for ( i = 0; i < len; i++ ) {
                item = baidu.object.clone( data[ i ] );
                item.parent = parent;
                this._dataMap[ item.id ] = item;
                walker.call( this, item.children, item );
            }
        }
    },

    /**
     * 单选地域初始化
     *
     * @private
     */
    _initSingle: function () {
        var me = this;
        var options = {
            id          : me.__getId( "region" ),
            datasource  : me._singleDataAdapter(),
            value       : me.valueAsRaw,
            width       : 100
        };
        var sinSelect = esui.util.create( "Select", options );
        sinSelect.appendTo( me.main );
        sinSelect.onchange = me._getSelectChangeHandler();

        me._controlMap.select = sinSelect;
    },
    
    /**
     * 单选模式Select的change handler
     *
     * @private
     * @return {Function}
     */
    _getSelectChangeHandler: function () {
        var me = this;
        return function ( value ) {
            me.valueAsRaw = me.value = value;
        };
    },

    /**
     * 单选模式的数据格式适配器
     *
     * @private
     * @return {Array}
     */
    _singleDataAdapter: function () {
        var result = [];
        walker( {children: this.datasource} );

        function walker( data ) {
            var children = data.children;
            var hasChild = !!children;
            var len, i;
            if ( data.id ) {
                result.push( {
                    name        : data.text, 
                    value       : data.id, 
                    disabled    : hasChild
                } );
            }

            if ( hasChild ) {
                for ( i = 0, len = children.length; i < len; i++ ) {
                    walker( children[ i ] );
                }
            }
        }

        return result;
    }
} 

baidu.inherits( esui.Region, esui.InputControl );


/**
 * 默认地域配置
 *
 * @static
 */
esui.Region.REGION_LIST = [
    {
        id: 'China',
        text: '中国地区',
        children: [
            {
                id: "North",
                text: "华北地区",
                children: [
                    {id: "1", text: "北京"},
                    {id: "3", text: "天津"},
                    {id: "13", text: "河北"},
                    {id: "26", text: "山西"},
                    {id: "22", text: "内蒙古"}
                ]
            },
            {
                id: "NorthEast",
                text: "东北地区",
                children: [
                    {id: "21", text: "辽宁"},
                    {id: "18", text: "吉林"},
                    {id: "15", text: "黑龙江"}
                ]
            },
            {
                id: "East",
                text: "华东地区",
                children: [
                    {id: "2", text: "上海"},
                    {id: "19", text: "江苏"},
                    {id: "32", text: "浙江"},
                    {id: "9", text: "安徽"},
                    {id: "5", text: "福建"},
                    {id: "20", text: "江西"},
                    {id: "25", text: "山东"}
                ]
            },
            {
                id: "Middle",
                text: "华中地区",
                children: [
                    {id: "14", text: "河南"},
                    {id: "16", text: "湖北"},
                    {id: "17", text: "湖南"}
                ]
            },
            {
                id: "South",
                text: "华南地区",
                children: [
                    {id: "4", text: "广东"},
                    {id: "8", text: "海南"},
                    {id: "12", text: "广西"}
                ]
            },
            {
                id: "SouthWest",
                text: "西南地区",
                children: [
                    {id: "33", text: "重庆"},
                    {id: "28", text: "四川"},
                    {id: "10", text: "贵州"},
                    {id: "31", text: "云南"},
                    {id: "29", text: "西藏"}
                ]
            },
            {
                id: "NorthWest",
                text: "西北地区",
                children: [
                    {id: "27", text: "陕西"},
                    {id: "11", text: "甘肃"},
                    {id: "24", text: "青海"},
                    {id: "23", text: "宁夏"},
                    {id: "30", text: "新疆"}
                ]
            },
            {
                id: "Other",
                text: "其他地区",
                children: [
                    {id: "34", text: "香港"},
                    {id: "36", text: "澳门"},
                    {id: "35", text: "台湾"}
                ]
            }
        ]
    },
    {
        id: 'Abroad',
        text: '国外',
        children: [
            {id: '7', text: '日本'},
            {id: '37', text: '其他国家'}
        ]
    }
];
