/*
 * ESUI (Enterprise Simple UI)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    esui/Select.js
 * desc:    下拉选择框
 * author:  erik, zhaolei, linzhifeng
 */

///import esui.InputControl;
///import esui.Layer;
///import baidu.lang.inherits;

/**
 * 下拉选择框控件
 * 
 * @param {Object} options 参数
 */
esui.Select = function ( options ) {
    // 类型声明，用于生成控件子dom的id和class
    this._type = 'select';
   
    // 标识鼠标事件触发自动状态转换
    this._autoState = 1;
    
    esui.InputControl.call( this, options );

    // 参数初始化
    this.__initOption( 'maxItem', null, 'MAX_ITEM' );
    this.__initOption( 'emptyText', null, 'EMPTY_TEXT' );
    this.emptyLabel = esui.util.format(
        this._tplLabel,  
        this.__getClass('text-def'), 
        this.emptyText );
    
    this.datasource = this.datasource || [];
};

esui.Select.EMPTY_TEXT = '请选择'; // 选项为空时主区域显示文字
esui.Select.MAX_ITEM   = 8;        // 浮动层最大选项设置，超出则浮动层出现滚动条

esui.Select.prototype = {
    /**
     * 设置控件为禁用
     * 
     * @public
     */
    disable: function () {
        this.hideLayer();
        esui.InputControl.prototype.disable.call( this );
    },
    
    /**
     * 设置控件为可用
     * 
     * @public
     */
    enable: function () {
        this.hideLayer();
        esui.InputControl.prototype.enable.call( this );
    },
    
    /**
     * 绘制控件
     * 
     * @public
     * @param {HTMLElement} main 外部容器
     */
    render: function() {
        var me = this,
            main = me.main,
            value = me.value;

        if ( !me._isRendered ) {
            esui.InputControl.prototype.render.call( me );

            main.innerHTML  = me._getMainHtml();
            main.onclick    = me._getMainClickHandler();

            me._isRendered = 1;
        }
        
        // 绘制浮动层
        me._renderLayer();
        
        me.width && ( main.style.width = me.width + 'px' );
        if ( !me.value && esui.util.hasValue( me.selectedIndex ) ) {
            me.setSelectedIndex( me.selectedIndex );
        } else {
            me.setValue( value );
        }
        
        me.setReadOnly ( !!me.readOnly );
        me.setDisabled( !!me.disabled );
    },
    
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
        
        return esui.util.format(
            me._tplMain,
            me.__getId( 'text' ),
            me.__getClass( 'text' ),
            me.staticText || me.emptyLabel,
            me.width - 20,
            me.__getClass( 'arrow' )
        );
    },

    /**
     * 绘制下拉列表
     *
     * @private
     */
    _renderLayer: function() {
        var me      = this,
            layerId = me.__getId( 'layer' ),
            layer   = me.getLayer(),
            len     = me.datasource.length,
            maxItem = me.maxItem,
            layerMain,
            layerMainWidth,
            itemHeight;
        
        if ( !layer ) {
            layer = esui.util.create( 'Layer', {
                    id      : layerId,
                    autoHide: 'click',
                    retype  : me._type,
                    partName: 'layer',
                    skin    : me.skin
                } );
            layer.appendTo();
            me._controlMap[ 'layer' ] = layer;
            layer.onhide = me._getLayerHideHandler();
        }
        
        
        layerMain = layer.main;
        layerMain.style.width   = 'auto';
        layerMain.style.height  = 'auto';
        layerMain.innerHTML     = me._getLayerHtml();
        layerMainWidth          = layerMain.offsetWidth;

        if ( len > maxItem ) {
            itemHeight = layerMain.firstChild.offsetHeight;
            layerMain.style.height = maxItem * ( itemHeight + 1 ) + 'px';
            layerMainWidth += 17;
        }

        if ( layerMainWidth < me.width ) {
            layer.setWidth( me.width );
        } else {
            layer.setWidth( layerMainWidth );
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
            me.removeState( 'active' );
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
        var me          = this,
            datasource  = me.datasource,
            i           = 0,
            len         = datasource.length,
            html        = [],
            strRef      = me.__getStrRef(),
            basicClass  = me.__getClass( 'item' ),
            itemClass,
            dis,
            item,
            iconClass,
            iconHtml,
            titleTip;

        for ( ; i < len; i++ ) {
            itemClass   = basicClass;
            dis         = 0;
            item        = datasource[ i ];
            iconHtml    = '';
            titleTip    = '';
            
            // 初始化icon的HTML
            if ( item.icon ) {
                iconClass = me.__getClass( 'icon-' + item.icon );
                iconHtml = esui.util.format( me._tplIcon, iconClass );
            }
            
            // 初始化基础样式
            if ( item.style ) {
                itemClass += ' ' + basicClass + '-' + item.style;
            }
            
            // 初始化不可选中的项
            if ( item.disabled ) {
                dis = 1;
                itemClass += ' ' + basicClass + '-disabled'; 
            }
            
            // 初始化选中样式
            if ( item.value == me.value ) {
                itemClass += ' ' + me.__getClass( 'item-selected' )
            }
            if ( me.titleTip ) {
                titleTip = 'title="' + item.name + iconHtml + '"';
            }
            
            html.push(
                esui.util.format(me._tplItem,
                    me.__getId( 'item' ) + i,
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
                ) );
        }
        
        return html.join( '' );
    },
    
    /**
     * 设置控件为readOnly
     * 
     * @public
     * @param {boolean} readOnly
     */
    setReadOnly: function ( readOnly ) {
        this.readOnly = readOnly = !!readOnly;
        readOnly ? this.addState( 'readonly' ) : this.removeState( 'readonly' );
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
            e = e || window.event;
            var tar = e.srcElement || e.target;

            if ( !me.readOnly && !me.isDisabled() ) {
                if ( tar.getAttribute( 'arrow' ) || me.onmainclick() !== false ) {
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
            main                = me.main,
            mainPos             = baidu.dom.getPosition( main ),
            layer               = me.getLayer(),
            layerMain           = layer.main,
            layerOffsetHeight   = layerMain.offsetHeight,
            mainOffsetHeight    = main.offsetHeight,
            pageVHeight         = baidu.page.getViewHeight(),
            layerVHeight        = mainPos.top
                                    + mainOffsetHeight 
                                    + layerOffsetHeight 
                                    - baidu.page.getScrollTop(),
            layerTop;

        if ( pageVHeight > layerVHeight ) {
            layerTop = mainPos.top + mainOffsetHeight - 1;
        } else {
            layerTop = mainPos.top - layerOffsetHeight + 1;
        }
        
        layer.show( mainPos.left, layerTop );
        me.addState( 'active' );
    },
    
    /**
     * 隐藏层
     * 
     * @public
     */
    hideLayer: function() {
        this.getLayer().hide();
        this.removeState( 'active' );
    },
    
    /**
     * 显示|隐藏 层
     * 
     * @public
     */
    toggleLayer: function() {
        var me = this;
        if ( me.getLayer().isShow() ) {
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
        return this._controlMap[ 'layer' ];
    },
    
    /**
     * 获取ComboBox当前选项部分的DOM元素
     * 
     * @return {HTMLElement}
     */
    _getCur: function() {
        return baidu.g( this.__getId( 'text' ) );
    },
    
    /**
     * 获取当前选中的值
     * 
     * @public
     * @return {string}
     */
    getValue: function() {
        if ( esui.util.hasValue( this.value ) ) {
            return String( this.value );
        }

        return '';
    },
    
    /**
     * 根据值选择选项
     *
     * @public
     * @param {string} value 值
     */
    setValue: function( value ) {
        var me = this,
            layer = me.getLayer().main,
            items = layer.getElementsByTagName( 'div' ),
            len,
            i,
            item;

        if ( esui.util.hasValue( value ) ) {
            for ( i = 0, len = items.length; i < len; i++ ) {
                item = items[ i ].getAttribute( 'value' );
                if ( item == value ) {
                    me.setSelectedIndex( i );
                    return;
                }
            }
        }
        
        me.value = null;
        me.setSelectedIndex( -1 );
    },
    
    /**
     * 根据索引选择选项
     * 
     * @public
     * @param {number} index 选项的索引序号
     * @param {boolean} opt_isDispatch 是否发送事件
     */
    setSelectedIndex: function ( index, opt_isDispatch ) {
        var selected = this.datasource[ index ],
            value;
            
        if ( !selected ) {
            value = null;
        } else {
            value = selected.value;
        }
        
        if (
            opt_isDispatch === true 
            && this.onchange( value, selected ) === false
        ) {
            return;
        }

        this.selectedIndex = index;
        this.value = value;
                
        this._repaint();
    },
    
    onchange: new Function(),

    /**
     * 重绘控件
     * 
     * @private
     */
    _repaint: function () {
        var selected = this.datasource[ this.selectedIndex ],
            word = this.staticText || ( selected ? selected.name : this.emptyLabel ),
            titleTip = this.staticText || ( selected ? selected.name : this.emptyText ),
            el = this._getCur();
            
        if ( this.titleTip ) {
            el.title = titleTip;    
        }
        el.innerHTML = '<nobr>' + word + '</nobr>';
        
        this._repaintLayer();
    },
    
    /**
     * 重绘选项列表层
     * 
     * @private
     */
    _repaintLayer: function () {
        var me              = this,
            index           = me.selectedIndex,
            walker          = me.getLayer().main.firstChild,
            selectedClass   = me.__getClass( 'item-selected' );
            
        while ( walker ) {
            if ( walker.getAttribute( 'index' ) == index ) {
                baidu.addClass( walker, selectedClass );
            } else {
                baidu.removeClass( walker, selectedClass );
            }

            walker = walker.nextSibling;
        }
    },
    
    /**
     * 选项点击事件
     * 
     * @private
     * @param {HTMLElement} item 选项
     */
    _itemClickHandler: function ( item ) {
        var index = parseInt( item.getAttribute( 'index' ), 10 );
        var disabled = item.getAttribute( 'dis' );

        if ( disabled == 1 ) {
            return;
        }

        this.hideLayer();
        this.setSelectedIndex( index, index != this.selectedIndex );
    },

    /**
     * 选项移上事件
     * 
     * @private
     * @param {HTMLElement} item 选项
     */
    _itemOverHandler: function ( item ) {
        if ( item.getAttribute( 'dis' ) == 1 ) {
            return;
        }
        
        var index = item.getAttribute( 'index' );
        baidu.addClass( 
            this.__getId( 'item' ) + index, 
            this.__getClass( 'item-hover' ) );
    },
    
    /**
     * 选项移开事件
     * 
     * @private
     * @param {HTMLElement} item 选项
     */
    _itemOutHandler: function ( item ) {
        var index = item.getAttribute( 'index' );
        baidu.removeClass(
            this.__getId( 'item' ) + index, 
            this.__getClass( 'item-hover' ) );
    },
    
    /**
     * 释放控件
     * 
     * @private
     */
    __dispose: function () {
        this.onchange = null;
        esui.InputControl.prototype.__dispose.call( this );
    }
};

baidu.inherits( esui.Select, esui.InputControl );
