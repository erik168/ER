/*
 * ESUI (Enterprise Simple UI)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    ui/Dialog.js
 * desc:    对话框控件
 * author:  zhaolei, erik, linzhifeng
 * date:    $Date$
 */

/**
 * 对话框控件
 * 
 * @param {Object} options 控件初始化参数
 */
ui.Dialog = function (options) {
    this.__initOptions(options);
    this._type = 'dialog';
    this._controlMap = {};
    
    // 初始化自动定位参数
    this.__initOption('autoPosition', null, 'AUTO_POSITION');
    
    // 初始化可拖拽参数
    this.__initOption('dragable', null, 'DRAGABLE');

    // 初始化关闭按钮参数
    this.__initOption('closeButton', null, 'CLOSE_BUTTON')
    
    // 初始化宽度
    this.__initOption('width', null, 'WIDTH');

    // 初始化距离顶端的高度
    this.__initOption('top', null, 'TOP');

    this._resizeHandler = this._getResizeHandler();
};

ui.Dialog.prototype = {    
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
     * 显示对话框
     * 
     * @public
     */
    show: function () {
        var mask = this.mask;
        var main;
        if (!this.getLayer()) {
            this.render();            
        }

        main = this.getLayer().getMain();

        // 浮动层自动定位功能初始化
        if ( this.autoPosition ) {
            baidu.on(window, 'resize', this._resizeHandler);
        }
        
        this._resizeHandler(); 

        // 拖拽功能初始化
        if ( this.dragable ) {
            baidu.dom.draggable(main, {handler:this.getHead()});
        }        
        
        // 如果mask不是object，则会隐式装箱
        // 装箱后的Object不具有level和type属性
        // 相当于未传参数
        mask && ui.Mask.show(mask.level, mask.type);
        
        this._isShow = true;
    },
    
    /**
     * 隐藏对话框
     * 
     * @public
     */
    hide: function () {
        if ( this._isShow ) {
            if ( this.autoPosition ) {
                baidu.un(window, 'resize', this._resizeHandler);
            }
            
            this.getLayer().hide();
            this.mask && ui.Mask.hide(this.mask.level);
        }

        this._isShow = 0;
    },
    
    /**
     * 获取浮出层控件对象
     * 
     * @public
     * @return {ui.Layer}
     */
    getLayer: function () {
        return this._controlMap.layer;
    },

    /**
     * 设置标题文字
     * 
     * @public
     * @param {string} html 要设置的文字，支持html
     */
    setTitle: function (html) {
        var el = baidu.g(this.__getId('title'));
        if (el) {
            el.innerHTML = html;
        }
        this.title = html;
    },

    /**
     * 设置内容
     *
     * @public
     * @param {string} content 要设置的内容，支持html.
     */
    setContent: function (content) {
        this.content = content;
        var body = this.getBody();
        body && (body.innerHTML = content);
    },

    
    /**
     * 获取页面resize的事件handler
     * 
     * @private
     * @return {Function}
     */
    _getResizeHandler: function () {
        var me = this;
            
        return function () {
            var layer = me.getLayer(),
                main = layer.getMain(),
                left = me.left,
                top = me.top; 
            
            !left 
                && (left = (baidu.page.getViewWidth() - main.offsetWidth) / 2);
            top += baidu.page.getScrollTop();
            
            if (left < 0) {
                left = 0;
            }

            if (top < 0) {
                top = 0;
            }
            
            layer.show(left, top);
        };
    },
    
    /**
     * 获取关闭按钮的点击handler
     *
     * @private
     * @return {Function}
     */
    _getCloseHandler: function () {
        var me = this;
        return function () {
            me.onhide();
            me.hide();
        };
    },
    
    onhide: new Function(),
        
    /**
     * 绘制对话框
     * 
     * @public
     */
    render: function () {
        var me = this,
            layer = me.getLayer(),
            layerControl,
            main,
            closeBtn;
        
        // 避免重复创建    
        if (layer) {
            return;
        }
        
        layer = ui.util.create('Layer', {
                id      : me.__getId('layer'),
                retype  : me._type,
                skin    : me.dragable ? 'dragable' : '',
                width   : me.width
            });
        layer.appendTo();
        me._controlMap.layer = layer;
        
        
        // 写入结构
        main = layer.getMain();
        main.innerHTML = me._getHeadHtml()
                            + me._getBFHtml('body')
                            + me._getBFHtml('foot');

        // 初始化关闭按钮
        layerControl = ui.util.init(main);
        closeBtn = layerControl[me.__getId('close')];
        if (closeBtn) {
            layer._controlMap.close = closeBtn;
            closeBtn.onclick = me._getCloseHandler();
        }
    },
    
    /**
     * 获取对话框头部的html
     * 
     * @private
     * @return {string}
     */
    _getHeadHtml: function () {
        var me = this,
            head = 'head',
            title = 'title';
        
        return ui._format(me._tplHead,
                          me.__getId(head),
                          me.__getClass(head),
                          me.__getId(title),
                          me.__getClass(title),
                          me.title,
                          (!me.closeButton  ? '' :
                              ui._format(me._tplClose,
                                         me.__getId('close'))),
                          me.__getStrCall('_headOver'),
                          me.__getStrCall('_headOut'))                            
    },
    
    /**
     * 获取对话框主体和腿部的html
     * 
     * @private
     * @param {string type 类型 body|foot
     * @return {string}
     */
    _getBFHtml: function (type) {
        var me = this;
        return ui._format(me._tplBF,
                          me.__getId(type),
                          me.__getClass(type),
                          type == 'body' ? me.content : '');
    },
    
    /**
     * 获取对话框主体的dom元素
     * 
     * @public
     * @return {HTMLElement}
     */
    getBody: function () {
        return baidu.g(this.__getId('body'));
    },
    
    /**
     * 获取对话框头部dom元素
     *
     * @public
     * @return {HTMLElement}
     */
    getHead: function () {
        return baidu.g(this.__getId('head'));
    },

    /**
     * 获取对话框腿部的dom元素
     * 
     * @public
     * @return {HTMLElement}
     */
    getFoot: function () {
        return baidu.g(this.__getId('foot'));
    },
    
    /**
     * 鼠标移上表头的handler
     * 
     * @private
     */
    _headOver: function () {
        baidu.addClass(this.getHead(), 
                       this.__getClass('head-hover'));
    },
    
    /**
     * 鼠标移出表头的handler
     * 
     * @private
     */
    _headOut: function () {
        baidu.removeClass(this.getHead(), 
                          this.__getClass('head-hover'));
    },

    /**
     * 释放控件
     * 
     * @public
     */
    dispose: function () {
        if (this.autoPosition) {
            baidu.un(window, 'resize', this._resizeHandler);
        }
        this._resizeHandler = null;

        ui.Base.dispose.call(this);
    }
};

ui.Base.derive(ui.Dialog);

ui.Dialog.TOP = 100;
ui.Dialog.WIDTH = 400;
ui.Dialog.CLOSE_BUTTON = 1;
ui.Dialog.OK_TEXT = '确定';
ui.Dialog.CANCEL_TEXT = '取消';

ui.Dialog._increment = function () {
    var i = 0;
    return function () {
        return i++;
    };
}();

/**
 * alert dialog
 */
ui.Dialog.alert = (function () {
    var dialogPrefix = '__DialogAlert';
    var buttonPrefix = '__DialogAlertOk';

    /**
     * 获取按钮点击的处理函数
     * 
     * @private
     * @param {Function} onok 用户定义的确定按钮点击函数
     * @return {Function}
     */
    function getBtnClickHandler(onok, id) {
        return function() {
            var dialog = ui.get(dialogPrefix + id);
            var isFunc = (typeof onok == 'function');

            if ((isFunc && onok(dialog) !== false) || !isFunc) {
                dialog.hide();

                ui.util.dispose(buttonPrefix + id);
                ui.util.dispose(dialog.id);
                
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
    function show (args) {
        if (!args) {
            return;
        }
        
        var index   = ui.Dialog._increment();
        var title   = args.title || '';
        var content = args.content || '';
        var type    = args.type || 'warning';
        var onok    = args.onok;
        var tpl     = '<div class="ui-dialog-icon ui-dialog-icon-{0}"></div><div class="ui-dialog-text">{1}</div>';
        var dialog  = ui.util.create('Dialog', 
                                  {
                                      id: dialogPrefix + index,
                                      closeButton: 0,
                                      title:'', 
                                      width:440,
                                      mask: {level: 3 || args.level}
                                  });
        var button  = ui.util.create('Button', 
                                  {
                                      id: buttonPrefix + index,
                                      skin:'em',
                                      content: ui.Dialog.OK_TEXT
                                  });
        
        dialog.show();
        dialog.setTitle(title);
        dialog.getBody().innerHTML = ui._format(tpl, type, content);
        button.onclick = getBtnClickHandler(onok, index);
        button.appendTo(dialog.getFoot()); 
    }

    return show;
})();

/**
 * confirm dialog
 */
ui.Dialog.confirm = (function () {
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
    function getBtnClickHandler(eventHandler, id) {
        return function(){
            var dialog = ui.get(dialogPrefix + id);
            var isFunc = (typeof eventHandler == 'function');

            if ((isFunc && eventHandler(dialog) !== false) || !isFunc) {
                dialog.hide();

                ui.util.dispose(okPrefix + id);
                ui.util.dispose(cancelPrefix + id);
                ui.util.dispose(dialog.id);
                
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
    function show (args) {
        if (!args) {
            return;
        }
        
        var index       = ui.Dialog._increment();
        var title       = args.title || '';
        var content     = args.content || '';
        var oncancel    = args.oncancel;
        var type        = args.type || 'warning';
        var onok        = args.onok;
        var tpl = '<div class="ui-dialog-icon ui-dialog-icon-{0}"></div><div class="ui-dialog-text">{1}</div>';
        var dialog = ui.util.create('Dialog', 
                                  {
                                      id: dialogPrefix + index,
                                      closeButton: 0,
                                      title:'', 
                                      width:440,
                                      mask: {level: 3 || args.level}
                                  });
                                  
        var okBtn = ui.util.create('Button', 
                                  {
                                      id: okPrefix + index,
                                      skin:'em',
                                      content: ui.Dialog.OK_TEXT
                                  });
                                  
        var cancelBtn = ui.util.create('Button', 
                                  {
                                      id: cancelPrefix + index,
                                      content: ui.Dialog.CANCEL_TEXT
                                  });
        dialog.show();
        dialog.setTitle(title);
        dialog.getBody().innerHTML = ui._format(tpl, type, content);
        
        var foot = dialog.getFoot();
        okBtn.appendTo(foot);
        cancelBtn.appendTo(foot);

        
        okBtn.onclick = getBtnClickHandler(onok, index);
        cancelBtn.onclick = getBtnClickHandler(oncancel, index);
    }
    
    return show;
})();


