/*
 * esui (ECOM Simple UI)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    esui/Tip.js
 * desc:    提示控件
 * author:  linzhifeng, erik
 */

///import esui.Control;
///import esui.Layer;
///import esui.Button;
///import baidu.lang.inherits;
///import baidu.event.on;
///import baidu.event.un;
///import baidu.dom.getPosition;

/**
 * 提示控件
 */
esui.Tip = function () {
    var LAYER_ID = '__TipLayer',
        TITLE_ID = '__TipLayerTitle',
        CLOSE_ID = '__TipLayerClose',
        ARROW_ID = '__TipLayerArrow',
        BODY_ID  = '__TipLayerBody',
        
        TITLE_CLASS = 'ui-tip-title',
        BODY_CLASS  = 'ui-tip-body',
        ARROW_CLASS = 'ui-tip-arrow',
        
        _layer,
        _isShow,
        _hideTimeout,
        _isInit;

    /**
     * 隐藏提示区
     *
     * @inner
     */
    function _hide() {
        _layer.hide();
        _isShow = false;
        
        var layerMain = _layer.main;
        layerMain.onmouseover = null;
        layerMain.onmouseout  = null;
    }
    
    /**
     * 阻止提示区隐藏
     *
     * @inner
     */
    function _preventHide() {
        if ( _hideTimeout ) {
            clearTimeout( _hideTimeout );
            _hideTimeout = null;
        }
    }
    
    /**
     * 声明Tip的Class
     *
     * @class
     * @public
     */
    function Control( options ) {
        // 类型声明，用于生成控件子dom的id和class
        this._type = 'tip-entrance';
        
        // 标识鼠标事件触发自动状态转换
        this._autoState = 0;
        
        esui.Control.call( this, options );
        
        // 提示层的行为模式，over|click|auto
        this.mode = this.mode || 'over';

        if ( this.hideDelay ) {
            this.hideDelay = parseInt( this.hideDelay, 10 );
        }
        if ( this.disabled ) {
            this.addState( 'disabled', 1 );
        }
    }
    
    Control.prototype = {
        /**
         * 渲染控件
         *
         * @public
         */
        render: function () {
            var me = this;
            var mode = me.mode;
            var main = me.main;
            var showFunc = me._getDoShow();

            if ( !me._isRendered ) {
                esui.Control.prototype.render.call( me );
                
                switch ( mode )
                {
                case 'over':
                case 'click':
                    if ( mode == 'over' ) {
                        main.onmouseover = showFunc;
                    } else {
                        main.onclick = showFunc;
                        main.style.cursor = 'pointer';
                    }
                    main.onmouseout = me._getOutHandler();
                    break;
                case 'auto':
                    showFunc();
                    break;
                }
                
                me._isRendered = 1;
            }
        },
        
        /**
         * 获取显示提示区域的handler
         *
         * @private
         */
        _getDoShow: function () {
            var me = this;

            return function () {
                // 判断tip的可用性
                if ( me.isDisabled() ) {
                    return;
                }
                
                // 构造提示的title和content
                var title   = me.title;
                var content = me.content;
                if ( typeof title == 'function' ) {
                    title = title.call( me );
                }
                if ( typeof content == 'function' ) {
                    content = content.call( me );
                }
                
                // 显示tip
                _show( me.main, {
                    title       : title,
                    content     : content,
                    arrow       : me.arrow,
                    hideDelay   : me.hideDelay,
                    mode        : me.mode
                } );
            };
        },
        
        /**
         * 获取鼠标移出的handler
         *
         * @private
         */
        _getOutHandler: function () {
            var me = this;

            return function () {
                Control.hide( me.hideDelay );
            };
        }
    };
    
    // 从控件基类派生
    baidu.inherits( Control, esui.Control );
    
    /**
     * 显示提示
     *
     * @inner
     * @param {HTMLElement} entrance 入口元素
     * @param {Object}      tipInfo 提示信息
     */
    function _show( entrance, tipInfo ) {
        if ( !tipInfo || !entrance ) {
            return;
        }

        !_isInit && Control._init();
        
        // 阻止浮动层的隐藏
        if ( _isShow ) {
            _preventHide();
        }
        
        // 填入标题与内容
        baidu.g( BODY_ID ).innerHTML = tipInfo.content;
        var title = tipInfo.title;
        if ( title ) {
            baidu.g( TITLE_ID ).innerHTML = title;
            baidu.show( TITLE_ID );
        } else {
            baidu.hide( TITLE_ID );
        }
        
        // 预初始化各种变量
        var arrow       = tipInfo.arrow, // 1|tr|rt|rb|br|bl|lb|lt|tl
            closeBtn    = tipInfo.closeButton,
            pos         = baidu.dom.getPosition( entrance ),
            mainLeft    = pos.left,
            mainTop     = pos.top,
            mainWidth   = entrance.offsetWidth,
            mainHeight  = entrance.offsetHeight,
            viewWidth   = baidu.page.getViewWidth(),
            viewHeight  = baidu.page.getViewHeight(),
            scrollLeft  = baidu.page.getScrollLeft(),
            scrollTop   = baidu.page.getScrollTop(),
            layerMain   = _layer.main,
            closeMain   = esui.util.get( CLOSE_ID ).main,
            layerWidth  = layerMain.offsetWidth,
            layerHeight = layerMain.offsetHeight,
            offsetX     = 5,
            offsetY     = 0,
            temp        = 0,
            arrowClass  = ARROW_CLASS,
            layerLeft,
            layerTop,
            tLeft,
            tRight,
            tTop,
            tBottom,
            lLeft,
            lRight,
            lTop,
            lBottom;
        
        if ( !esui.util.hasValue( arrow ) ) {
            arrow = Control.ARROW;
        }

        if ( !esui.util.hasValue( closeBtn ) ) {
            closeBtn = Control.CLOSE_BUTTON;
        }

        closeMain.style.display = closeBtn ? '' : 'none';

        if ( arrow ) {
            temp    = 1;
            arrow   = String( arrow ).toLowerCase();
            offsetX = 20;
            offsetY = 14;
            tLeft   = mainLeft + mainWidth - offsetX;
            tRight  = mainLeft + offsetX - layerWidth;
            tTop    = mainTop + mainHeight + offsetY;
            tBottom = mainTop - offsetY - layerHeight;
            lLeft   = mainLeft + mainWidth + offsetX;
            lTop    = mainTop + mainHeight - offsetY;
            lBottom = mainTop + offsetY - layerHeight;
            lRight  = mainLeft - offsetX - layerWidth;

            // 计算手工设置arrow时的位置
            switch ( arrow ) {
            case 'tr':
                layerLeft = tRight;
                layerTop = tTop;
                break;
            case 'tl':
                layerLeft = tLeft;
                layerTop = tTop;
                break;
            case 'bl':
                layerLeft = tLeft;
                layerTop = tBottom;
                break;
            case 'br':
                layerLeft = tRight;
                layerTop = tBottom;
                break;
            case 'lt':
                layerLeft = lLeft;
                layerTop = lTop;
                break;
            case 'lb':
                layerLeft = lLeft;
                layerTop = lBottom;
                break;
            case 'rb':
                layerLeft = lRight;
                layerTop = lBottom;
                break;
            case 'rt':
                layerLeft = lRight;
                layerTop = lTop;
                break;
            default:
                temp = 0;
                offsetX = - offsetX;
                break;
            }
        } 
        
        // 计算自适应的位置
        if ( !temp ) {
            layerTop = mainTop + mainHeight + offsetY;
            arrow && ( arrow = 't' );
            if ( layerTop + layerHeight > viewHeight + scrollTop ) {
                if ( ( temp = mainTop - offsetY - layerHeight ) > 0 ) {
                    layerTop = temp;
                    arrow && ( arrow = 'b' );
                }
            }

            layerLeft = mainLeft + mainWidth + offsetX;
            arrow && ( arrow += 'l' );
            if ( layerLeft + layerWidth > viewWidth + scrollLeft ) {
                if ( ( temp = mainLeft - offsetX - layerWidth ) > 0 ) {
                    layerLeft = temp;
                    arrow && ( arrow = arrow.substr( 0, 1 ) + 'r' );
                }
            }
        }
    
        arrow && ( arrowClass += ' ' + ARROW_CLASS + '-' + arrow );
        baidu.g( ARROW_ID ).className = arrowClass;
        
        // 绑定浮出层行为
        if ( tipInfo.mode != 'auto' ) {
            layerMain.onmouseover = _preventHide;
            layerMain.onmouseout = _getHider( tipInfo.hideDelay );
        }

        // 显示提示层
        _isShow = true;
        _layer.show( layerLeft, layerTop );
    };
    
    /**
     * 隐藏提示
     *
     * @static
     * @public
     * @param {number} delay 延迟隐藏时间
     */
    Control.hide = function ( delay ) {
        delay = delay || Control.HIDE_DELAY;
        _hideTimeout = setTimeout( _hide, delay );
    };
    
    Control.HIDE_DELAY = 300;
    
    /**
     * 显示提示
     *
     * @static
     * @public
     * @param {HTMLElement} entrance 入口元素
     * @param {Object}      tipInfo 提示信息
     */
    Control.show = _show;

    /**
     * 获取隐藏提示的函数
     *
     * @inner
     * @param {number} delay 延迟隐藏时间
     */
    function _getHider( delay ) {
        return function () {
            Control.hide( delay );
        };
    }
    
    /**
     * 初始化提示层
     *
     * @static
     * @private
     */
    Control._init = function () {
        if ( _isInit ) {
            return;
        }

        _isInit = 1;
        _layer = esui.util.create( 'Layer', {
                id      : LAYER_ID,
                retype  : 'tip',
                width   : 300
            } );
        _layer.appendTo();

        var layerMain = _layer.main,
            title = document.createElement( 'h3' ),
            body  = document.createElement( 'div' ),
            arrow = document.createElement( 'div' ),
            close = esui.util.create( 'Button', {
                id      : CLOSE_ID,
                skin    : 'layerclose'
            } );

        // 初始化提示标题
        title.id        = TITLE_ID;
        title.className = TITLE_CLASS;
        layerMain.appendChild( title );
        
        // 初始化提示体
        body.id         = BODY_ID;
        body.className  = BODY_CLASS;
        layerMain.appendChild( body );
        
        // 初始化箭头
        arrow.id = ARROW_ID;
        arrow.className = ARROW_CLASS;
        layerMain.appendChild(arrow);
        
        // 初始化关闭按钮
        close.appendTo( layerMain );
        close.onclick = _hide;
    };

    Control.ARROW = 0;
    Control.CLOSE_BUTTON = 0;
    return Control;
}();

baidu.on( window, 'load', esui.Tip._init );
