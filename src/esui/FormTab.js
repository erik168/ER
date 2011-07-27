/*
 * ESUI (Enterprise Simple UI)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    esui/FormTab.js
 * desc:    表单Tab控件
 * author:  zhaolei, erik
 */


///import esui.Control;
///import baidu.lang.inherits;

/**
 * 表单Tab控件
 *
 * @constructor
 * @param {object} options 构造的选项.
 */
esui.FormTab = function ( options ) {
    this.disableHidden = 1;

    esui.Control.call( this, options );
    
    this.__initOption( 'autoDisabled', null, 'AUTO_DISABLED' );
    this.tabs = this.datasource || this.tabs || [];
};

esui.FormTab.AUTO_DISABLED = 1;

esui.FormTab.prototype = {
    /**
     * 初始化FormTab
     *
     * @public
     */
    init: function () {
        var me = this;
        this.activeIndex = this.activeIndex || 0;
        if ( !me.isInited ) {
            me._initEvent();
            me.isInited = 1;
        }
        
        setTimeout( function () {
                me.setActiveIndex( me.activeIndex );
            }, 0 );
    },

    render: function () {
        this.init();
    },

    __createMain: function () {
        return null;
    },
    
    /**
     * 初始化FormTab的行为
     *
     * @private
     */
    _initEvent: function () {
        var tabs = this.tabs;
        var len  = tabs.length;
        var i;
        var tab;
        var radio;
        
        for ( i = 0; i < len; i++ ) {
            tab   = tabs[ i ];
            radio = tab.radio;
            if ( radio ) {
                radio = esui.util.get( radio );
                radio && ( radio.onclick = this._getRadioClickHandler( i ) );
            }
        }
    },
    
    _getRadioClickHandler: function ( index ) {
        var me = this;
        return function () {
            return me._select( index );
        };
    },
    
    /**
     * 选择标签
     * 
     * @private
     * @param {number} index 标签序号
     */
    _select: function ( index ) {
        if ( this.onchange( index, this.tabs[ index ] ) !== false ) {
            this.setActiveIndex( index );
            return;
        }

        return false;
    },
    
    /**
     * 选择活动标签
     * 
     * @public
     * @param {number} index 标签序号
     */
    setActiveIndex: function( index ) {
        var tabs = this.tabs;
        var len = tabs.length;

        if ( index >= 0 && index < len ) {
            esui.util.get( tabs[ index ].radio ).setChecked( true );
            this.activeIndex = index;
        }

        this._resetPanel();
    },
    
    onchange: new Function(),
    
    /**
     * 重置tab对应的panel的显示隐藏状态
     * 
     * @private
     */
    _resetPanel: function () {
        var tabs = this.tabs;
        var len  = tabs.length;
        var i;
        var tab;
        var panel;
        var radio;
        var checked;

        for ( i = 0; i < len; i++ ) {
            tab     = tabs[ i ];
            radio   = tab.radio;
            panel   = tab.panel;
            panel   = panel && baidu.g( panel );

            if ( radio && panel ) {
                radio = esui.util.get( radio );
                if ( radio ) {
                    checked = radio.isChecked();

                    this.autoDisabled 
                        && esui.util.setDisabledByContainer( panel, !checked );
                    panel.style.display = checked ? '' : 'none';
                }
            }
        }
    }
};

baidu.inherits( esui.FormTab, esui.Control );
