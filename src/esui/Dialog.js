/*
 * ESUI (Enterprise Simple UI)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    esui/Dialog.js
 * desc:    对话框控件
 * author:  zhaolei, erik, linzhifeng
 */

///import esui.Popup;
///import baidu.lang.inherits;
///import baidu.dom.draggable;
///import baidu.event.on;
///import baidu.event.un;

/**
 * 对话框控件
 * 
 * @param {Object} options 控件初始化参数
 */
esui.Dialog = function ( options ) {
    // 类型声明，用于生成控件子dom的id和class
    this._type = 'dialog';
    
    esui.Popup.call( this, options );
    
    // 初始化关闭按钮参数
    this.__initOption('closeButton', null, 'CLOSE_BUTTON');
};

esui.Dialog.prototype = {
    /**
     * 对话框主体和尾部的html模板
     * @private
     */
    _tplBF: '<div class="{1}" id="{0}">{2}</div>',
    
    /**
     * 对话框头部的html模板
     * @private
     */
    _tplHead: '<div id="{0}" class="{1}"><div id="{2}" class="{3}" onmouseover="{6}" onmouseout="{7}">{4}</div>{5}</div>',
    
    /**
     * 关闭按钮的html模板
     * @private
     */
    _tplClose: '<div ui="type:Button;id:{0};skin:layerclose"></div>',
    
    /**
     * 绘制对话框
     * 
     * @public
     */
    render: function () {
        var me      = this,
            layer   = me.getLayer(),
            layerControl,
            main,
            closeBtn;
        
        // 避免重复创建    
        if ( layer ) {
            return;
        }
        
        layer = me.createLayer(document.body);
        
        // 写入结构
        main = layer.main;
        main.innerHTML = me._getHeadHtml()
                            + me._getBFHtml( 'body' )
                            + me._getBFHtml( 'foot' );

        // 初始化关闭按钮
        layerControl = esui.util.init( main );
        closeBtn     = layerControl[ me.__getId( 'close' ) ];
        if ( closeBtn ) {
            layer._controlMap.close = closeBtn;
            closeBtn.onclick = me._getCloseHandler();
        }
    },
    
    createLayer: function (there) {
        var me = this;
        var layer = me._controlMap.layer = esui.util.create( 'Layer', {
            id      : me.__getId('layer'),
            retype  : me._type,
            skin    : me.skin + (me.dragable ? ' dragable' : ''),
            width   : me.width
        } );
        layer.appendTo(there);
        return layer;
    },
    
    /** 
     * dialog只允许在body下。重置appendTo方法
     *
     * @public
     */ 
    appendTo: function () {
        this.render();
    },

    /**
     * 设置内容
     *
     * @public
     * @param {string} content 要设置的内容，支持html.
     */
    setContent: function ( content ) {
        this.content = content;
        var body = this.getBody();
        if (body) {
        	body.innerHTML = content;
	        setTimeout(this._resizeHandler, 0);
        }
    },

    /** 
     * dialog不需要创建main，方法置空
     *
     * @private
     */
    __createMain: function () {},
    
    /**
     * 获取对话框头部的html
     * 
     * @private
     * @return {string}
     */
    _getHeadHtml: function () {
        var me      = this,
            head    = 'head',
            title   = 'title';
        
        return esui.util.format(
            me._tplHead,
            me.__getId( head ),
            me.__getClass( head ),
            me.__getId( title ),
            me.__getClass( title ),
            me.title,
            (!me.closeButton  ? '' :
                esui.util.format(
                    me._tplClose,
                    me.__getId( 'close' )
            ) ),
            me.__getStrCall( '_headOver' ),
            me.__getStrCall( '_headOut' )
        );                            
    },
    
    /**
     * 获取对话框主体和腿部的html
     * 
     * @private
     * @param {string type 类型 body|foot
     * @return {string}
     */
    _getBFHtml: function ( type ) {
        var me = this;
        return esui.util.format(
            me._tplBF,
            me.__getId( type ),
            me.__getClass( type ),
            type == 'body' ? me.content : ''
        );
    },
    
    /**
     * 获取对话框主体的dom元素
     * 
     * @public
     * @return {HTMLElement}
     */
    getBody: function () {
        return baidu.g( this.__getId( 'body' ) );
    },
    
    /**
     * 获取对话框头部dom元素
     *
     * @public
     * @return {HTMLElement}
     */
    getHead: function () {
        return baidu.g( this.__getId( 'head' ) );
    },

    /**
     * 获取对话框腿部的dom元素
     * 
     * @public
     * @return {HTMLElement}
     */
    getFoot: function () {
        return baidu.g( this.__getId( 'foot' ) );
    },
    
    /**
     * 鼠标移上表头的handler
     * 
     * @private
     */
    _headOver: function () {
        baidu.addClass(
            this.getHead(), 
            this.__getClass( 'head-hover' ) );
    },
    
    /**
     * 鼠标移出表头的handler
     * 
     * @private
     */
    _headOut: function () {
        baidu.removeClass(
            this.getHead(), 
            this.__getClass( 'head-hover' ) );
    }
};

baidu.inherits( esui.Dialog, esui.Popup );

esui.Dialog.TOP             = 100;
esui.Dialog.WIDTH           = 400;
esui.Dialog.CLOSE_BUTTON    = 1;
esui.Dialog.OK_TEXT         = '确定';
esui.Dialog.CANCEL_TEXT     = '取消';

esui.Dialog._increment = function () {
    var i = 0;
    return function () {
        return i++;
    };
}();

/**
 * alert dialog
 */
esui.Dialog.alert = (function () {
    var dialogPrefix = '__DialogAlert';
    var buttonPrefix = '__DialogAlertOk';

    /**
     * 获取按钮点击的处理函数
     * 
     * @private
     * @param {Function} onok 用户定义的确定按钮点击函数
     * @return {Function}
     */
    function getBtnClickHandler( onok, id ) {
        return function() {
            var dialog = esui.util.get( dialogPrefix + id );
            var isFunc = ( typeof onok == 'function' );

            if ( ( isFunc && onok( dialog ) !== false ) 
                 || !isFunc
            ) {
                dialog.hide();

                esui.util.dispose( buttonPrefix + id );
                esui.util.dispose( dialog.id );
                
                dialog = null;
            }
        };
    }
    
    /**
     * 显示alert
     * 
     * @public
     * @param {Object} args alert对话框的参数
     * @config {string} title 显示标题
     * @config {string} content 显示的文字内容
     * @config {Function} onok 点击确定按钮的行为，默认为关闭提示框
     */
    function show ( args ) {
        if ( !args ) {
            return;
        }
        
        var index   = esui.Dialog._increment();
        var title   = args.title || '';
        var content = args.content || '';
        var type    = args.type || 'warning';
        var onok    = args.onok;
        var tpl     = '<div class="ui-dialog-icon ui-dialog-icon-{0}"></div><div class="ui-dialog-text">{1}</div>';
        var dialog  = esui.util.create('Dialog', 
                                  {
                                      id            : dialogPrefix + index,
                                      closeButton   : 0,
                                      title         : '', 
                                      width         : 440,
                                      mask          : {level: 3 || args.level}
                                  });
        var button  = esui.util.create('Button', 
                                  {
                                      id        : buttonPrefix + index,
                                      skin      : 'em',
                                      content   : esui.Dialog.OK_TEXT
                                  });
        
        dialog.show();
        dialog.setTitle( title );
        dialog.getBody().innerHTML = esui.util.format( tpl, type, content );
        button.onclick = getBtnClickHandler( onok, index );
        button.appendTo( dialog.getFoot() ); 
    }

    return show;
})();

/**
 * confirm dialog
 */
esui.Dialog.confirm = (function () {
    var dialogPrefix    = '__DialogConfirm';
    var okPrefix        = '__DialogConfirmOk';
    var cancelPrefix    = '__DialogConfirmCancel';

    /**
     * 获取按钮点击的处理函数
     * 
     * @private
     * @param {Function} eventHandler 用户定义的按钮点击函数
     * @return {Functioin}
     */
    function getBtnClickHandler( eventHandler, id ) {
        return function(){
            var dialog = esui.util.get( dialogPrefix + id );
            var isFunc = (typeof eventHandler == 'function');

            if ( (isFunc && eventHandler( dialog ) !== false ) 
                 || !isFunc 
            ) {
                dialog.hide();

                esui.util.dispose( okPrefix + id );
                esui.util.dispose( cancelPrefix + id );
                esui.util.dispose( dialog.id );
                
                dialog = null;
            }
        };
    }
    
    /**
     * 显示confirm
     * 
     * @public
     * @param {Object} args alert对话框的参数
     * @config {string} title 显示标题
     * @config {string} content 显示的文字内容
     * @config {Function} onok 点击确定按钮的行为，默认为关闭提示框
     * @config {Function} oncancel 点击取消按钮的行为，默认为关闭提示框
     */
    function show ( args ) {
        if ( !args ) {
            return;
        }
        
        var index       = esui.Dialog._increment();
        var title       = args.title || '';
        var content     = args.content || '';
        var oncancel    = args.oncancel;
        var type        = args.type || 'warning';
        var onok        = args.onok;
        var tpl = '<div class="ui-dialog-icon ui-dialog-icon-{0}"></div><div class="ui-dialog-text">{1}</div>';
        var dialog = esui.util.create('Dialog', 
                                  {
                                      id            : dialogPrefix + index,
                                      closeButton   : 0,
                                      title         :'', 
                                      width         :440,
                                      mask          : {level: 3 || args.level}
                                  });
                                  
        var okBtn = esui.util.create('Button', 
                                  {
                                      id        : okPrefix + index,
                                      skin      :'em',
                                      content   : esui.Dialog.OK_TEXT
                                  });
                                  
        var cancelBtn = esui.util.create('Button', 
                                  {
                                      id        : cancelPrefix + index,
                                      content   : esui.Dialog.CANCEL_TEXT
                                  });
        dialog.show();
        dialog.setTitle( title );
        dialog.getBody().innerHTML = esui.util.format( tpl, type, content );
        
        var foot = dialog.getFoot();
        okBtn.appendTo( foot );
        cancelBtn.appendTo( foot );

        
        okBtn.onclick = getBtnClickHandler( onok, index );
        cancelBtn.onclick = getBtnClickHandler( oncancel, index );
    }
    
    return show;
})();


