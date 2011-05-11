/*
 * ESUI (Enterprise Simple UI)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    ui/SideBar.js
 * desc:    左侧导航控件
 * author:  zhaolei, erik, linzhifeng
 */

/**
 * 左侧导航控件
 * @param {Object} options 控件初始化参数
 */
ui.SideBar = function (options) {
    this.__initOptions(options);
    this._type = "sidebar";

    this._controlMap = {};

    this.headHeight     = this.headHeight || 37;
    this.marginTop      = this.marginTop || 10;
    this.marginLeft     = this.marginLeft || 10;
    this.marginBottom   = this.marginBottom || 10;

    this.__initOption('autoDelay', null, 'AUTO_DELAY');
    this.__initOption('mode', null, 'MODE');

    this._autoTimer = 0;
    
    // TODO: 永久取消js实现的sidebar动画效果
    // this._motioning = false;
};

ui.SideBar.AUTO_DELAY = 200;    //自动隐藏和自动显示的延迟
ui.SideBar.MODE = 'fixed';      //初始化状态

ui.SideBar.prototype = {
    // TODO: 永久取消js实现的sidebar动画效果
    // motionStep      : 20,        //动态步伐
    // motionInterval  : 20,        //动态间隔
    
    /**
     * 初始化控制按钮
     *
     * @private
     */
    _initCtrlBtn: function () {
        var me = this;
        var main = me._main;
        var controlMap = me._controlMap;
        var btnAutoHide = ui.util.create('Button', {
            id: me.__getId('AutoHide'),
            skin: 'autohide'
        });
        var btnFixed = ui.util.create('Button', {
            id: me.__getId('Fixed'),
            skin: 'fixed'
        });
        
        // 将按钮append到sidebarbar
        btnAutoHide.appendTo(main);
        btnFixed.appendTo(main);
        
        // 持有控件引用
        controlMap.btnAutoHide = btnAutoHide;
        controlMap.btnFixed = btnFixed;
        
        // 挂载行为
        btnAutoHide.onclick = this._getAutoHideClickHandler();
        btnFixed.onclick = this._getFixedClickHandler();
        
        // 初始化按钮的显示
        this._setMode(this.mode);
    },
    
    onmodechange: new Function(),

    /**
     * 获取“固定”按钮的clickhandler
     *
     * @private
     * @return {Function}
     */
    _getFixedClickHandler: function () {
        var me = this;
        return function () {
            me._setMode('fixed');
            me.onmodechange(me.mode);
        };
    },
    
    /**
     * 获取“自动隐藏”按钮的clickhandler
     *
     * @private
     * @return {Function}
     */
    _getAutoHideClickHandler: function () {
        var me = this;
        return function () {
            me._setMode('autohide');
            me.onmodechange(me.mode);
            me._hide();
        };
    },
    
    /**
     * 设置sidebar的显示模式，autohide|fixed
     *
     * @private
     * @param {string} mode
     */
    _setMode: function (mode) {
        mode = mode.toLowerCase();
        var autoHideMain    = this._getAutoHideMain();
        var fixedMain       = this._getFixedMain();
        var neighbor        = this._getNeighbor();
        var neighborHideClass = this.__getClass('neighbor-hide');

        if (mode == 'fixed') {
            baidu.hide(fixedMain);
            baidu.show(autoHideMain);
        } else {
            baidu.show(fixedMain);
            baidu.hide(autoHideMain);
        }

        this.mode = mode;
        
        // 更新neighbor视图
        if ( this._isAutoHide() ) {
            baidu.addClass( neighbor, neighborHideClass );
        } else {
            baidu.removeClass( neighbor, neighborHideClass );
            this._hideMat();
        }

        this._repaintNeighbor();
    },
    
    /**
     * 判断当前是否自动隐藏模式
     *
     * @private
     * @return {boolean}
     */
    _isAutoHide: function () {
        return this.mode == 'autohide';
    },

    /**
     * 获取“固定”按钮的控件主元素
     *
     * @private
     * @return {HTMLElement}
     */
    _getFixedMain: function () {
        return this._controlMap.btnFixed.getMain();
    },
    
    /**
     * 获取“自动隐藏”按钮的控件主元素
     *
     * @private
     * @return {HTMLElement}
     */
    _getAutoHideMain: function () {
        return this._controlMap.btnAutoHide.getMain();
    },
    
    /**
     * 初始化内容区域
     *
     * @private
     * @return {HTMLElement}
     */
    _initContent: function () {
        var main = this._main;
        var head = baidu.dom.first(main);
        var body;
        
        if (head) {
            baidu.addClass(head, this.__getClass('head'));
            this._headEl = head;
            body = baidu.dom.next(head);
            
            if (body) {
                this._bodyEl = body;
                baidu.addClass(body, this.__getClass('body'));
            }
        }
    },
    
    /**
     * 缓存控件的核心数据
     *
     * @private
     */
    _caching: function () {
        var main = this._main;
        var parent = main.parentNode;
        var parentPos = baidu.dom.getPosition(parent);
        var pos = baidu.dom.getPosition(main)

        if ( !ui._hasValue(this._mOffsetTop) ) {
            this._mOffsetTop = pos.top - parentPos.top;
            this.top = pos.top;
            this.left = pos.left; 
        } else {
            this.top = parentPos.top + this._mOffsetTop;
        }
    },

    /**
     * 绘制控件
     * 
     * @public
     * @param {HTMLElement} main 控件主元素
     */
    render: function (main) {
        if (this._main) {
            return;
        }
        
        var me = this,
            pos;

        ui.Base.render.call(me, main);
        if (!me._isRender) {
            me._caching();
            
            // 给邻居元素添加控制样式的class
            baidu.addClass(me._getNeighbor(), me.__getClass('neighbor'));
            
            // 初始化控制按钮，内容区域，mat和minibar
            me._initCtrlBtn();
            me._initContent();
            me._renderMat();
            me._renderMiniBar();
            
            // 挂载resize和scorll的listener
            me.heightReseter = me._getHeightReseter();
            me.topReseter = me._getTopReseter();
            baidu.on(window, 'resize', me.heightReseter);
            baidu.on(window, 'scroll', me.topReseter);
            
            // 给主元素添加over和out的事件handler
            me._main.onmouseover = me._getMainOverHandler();
            me._main.onmouseout = me._getMainOutHandler();

            // 初始化高度和位置
            me._resetTop();
            me._resetHeight(); 
            
            // 初始化显示状态
            if ( me._isAutoHide() ) {
                me._hide();
            }

            me._isRender = 1;
        }
    },
    
    /**
     * 绘制mat区域
     * 
     * @private
     */
    _renderMat: function () {
        var mat = document.createElement( 'div' );
        mat.id = this.__getId( 'mat' );
        mat.className = this.__getClass( 'mat' );
        document.body.appendChild( mat );
    },

    /**
     * 刷新控件的显示
     *
     * @public
     */
    refreshView: function () {
        this._caching();
        this.heightReseter();
        this.topReseter();
    },

    /**
     * 获取主元素鼠标移入的handler
     *
     * @private
     * @return {Function}
     */
    _getMainOverHandler: function () {
        var me = this;

        return function(){        
            clearTimeout(me._autoTimer);
        };
    },

    /**
     * 获取主元素鼠标移出的handler
     *
     * @private
     * @return {Function}
     */
    _getMainOutHandler: function () {
        var me = this;

        return function ( event ) {
            if ( me._isAutoHide() ) {
                event = event || window.event;
                var tar = event.relatedTarget || event.toElement;
                if (!baidu.dom.contains(me._main, tar)) {
                    me._autoHideBar();                        
                }                                        
            }
        };
    },

    /**
     * 绘制minibar
     * 
     * @private
     */
    _renderMiniBar:function () {
        var me = this,
            div = document.createElement('div'),
            html = [];
        
        // 构建minibar的html
        // 以主sidebar的标题为标题
        me._headEl && html.push(
            '<div class="' 
            + me.__getClass('minibar-text') 
            + '">' + me._headEl.innerHTML 
            + '</div>');
        html.push('<div class="' + me.__getClass('minibar-arrow') + '"></div>');
        
        // 初始化minibar
        div.innerHTML = html.join('');
        div.id = me.__getId('MiniBar');
        div.className = me.__getClass('minibar');
        div.style.left = '-10000px';
        div.style.top = me.top + 'px';

        // 持有引用
        me._miniBar = div;
        
        // 挂载行为
        div.onmouseover = me._getMiniOverHandler();
        div.onmouseout = me._getMiniOutHandler();
        document.body.appendChild(div);
    },
    
    /**
     * 获取minibar鼠标移入的handler
     *
     * @private
     * @return {Function}
     */
    _getMiniOverHandler: function () {
        var me = this;
        return function () {            
            if (!baidu.dom.hasClass(this, me.__getClass('minibar-hover'))){
                baidu.addClass(this, me.__getClass('minibar-hover'));
                me._autoTimer = setTimeout(
                    function () {
                        me._hideMiniBar();
                    }, me.autoDelay);
            }
        };
    },
    
    /**
     * 获取minibar鼠标移出的handler
     *
     * @private
     * @return {Function}
     */
    _getMiniOutHandler: function () {
        var me = this;
        return function () {
            baidu.removeClass(this, me.__getClass('minibar-hover'));
            clearTimeout(me._autoTimer);
        };
    },

    /**
     * 重设控件高度
     * 
     * @private
     */
    _resetHeight: function () {
        var me          = this,
            page        = baidu.page,
            pos         = baidu.dom.getPosition(me._main),
            scrollTop   = page.getScrollTop(),
            height      = page.getViewHeight(),
            bodyHeight;

        if (height) {
            height = height - pos.top + scrollTop - me.marginTop;
        } else {
            height = 300;
        }   
        if (height < 0){
            height = 300;
        }
        
        bodyHeight = height - me.headHeight;
        this.bodyHeight = bodyHeight;
        this.height = height;

        me._getMat().style.height = height + me.marginTop * 2 + 'px';
        me._main.style.height = 
        me._miniBar.style.height = 
            height + 'px';

        me._bodyEl && (me._bodyEl.style.height = bodyHeight + 'px');

        this.onresize();
    },
    
    onresize: new Function(),

    /**
     * 获取重设控件高度的函数
     * 
     * @private
     * @return {Function}
     */
    _getHeightReseter: function () {
        var me = this;
        return function () {
            me._resetHeight();
        };
    },
    
    /**
     * 重设控件位置
     * 
     * @private
     * @return {Function}
     */
    _resetTop: function () {
        var me = this,
            marginTop = me.marginTop,
            scrollTop = baidu.page.getScrollTop(),
            main = me._main,
            mat = me._getMat(),
            mini = me._miniBar,
            top = me.top,
            mainTop, miniTop, 
            mainPos = 'absolute',
            miniPos = 'absolute';
        
        // 2x2的判断，真恶心
        if (baidu.ie && baidu.ie < 7) {
            if (scrollTop > top - marginTop) {
                mainTop = miniTop = scrollTop - top + me.top;
            } else {
                mainTop = miniTop = top;
                me._resetHeight();
            }
        } else {
            if (scrollTop > top - marginTop) {
                miniPos = mainPos = 'fixed';
                mainTop = miniTop = marginTop;    
            } else {
                mainTop = miniTop = top;
                me._resetHeight();
            }
        }
        
        mat.style.top = mainTop - me.marginTop + 'px';
        main.style.top = mainTop + 'px';
        mat.style.position = main.style.position = mainPos;
        mini.style.top = miniTop + 'px';
        mini.style.position = miniPos;
        setTimeout(function(){
            //移动过快时修补最后一次调整
            me._resetHeight();
        },200);            
    },
    
    /**
     * 获取重设控件位置的函数
     * 
     * @private
     * @return {Function}
     */
    _getTopReseter: function () {
        var me = this;
        return function () {
            me._resetTop();
        };
    },
    
    /**
     * 隐藏mat区域
     * 
     * @private
     */
    _hideMat: function () {
        this._getMat().style.left = '-10000px';
    },

    /**
     * 显示侧边导航
     * 
     * @private
     */
    _show: function () {
        var me = this,
            step = 0,
            endLeft = 10,
            startLeft = -220,
            minus = endLeft - startLeft,
            interval;
                
        /**
         * 完成显示侧边导航的动作
         * @inner
         */
        function finished() {
            me._getMat().style.left = 0;
            me._main.style.left = endLeft + 'px'; 
            // TODO: 永久取消js实现的sidebar动画效果
            // me._motioning = false;
            
            if (me._isAutoHide()){
                me._autoHideBar();                
            }
        }
        
        finished();
        return;
        
        // TODO: 永久取消js实现的sidebar动画效果
        /*
        me._motioning = true;        
        interval = setInterval(
            function () {
                step ++;
                
                if (step >= me.motionStep) {
                    clearInterval(interval);
                    finished();
                    return;
                }
                
                var pos = Math.floor(minus * me._tween(step));
                me._main.style.left = startLeft + pos + 'px';
            }, 
            me.motionInterval);  
        */
    },
        
    /**
     * 隐藏侧边导航
     *
     * @private
     */
    _hide: function () {
        var me = this,
            step = 0,
            endLeft = -220,
            startLeft = 10,
            minus = endLeft - startLeft,
            interval;
        
        finished();
        return;

        function finished(noMotion) {
            me._getMat().style.left = '-10000px';
            me._main.style.left = endLeft + 'px';
            //baidu.addClass(me._getNeighbor(), me.__getClass('neighbor-hide'));
            //me._repaintNeighbor();
            
            // TODO: 永久取消js实现的sidebar动画效果
            // me._motioning = false;
            me._showMiniBar(noMotion);
        };
        
        // TODO: 永久取消js实现的sidebar动画效果
        /*
        me._motioning = true;
        interval = setInterval(
            function () {
                step ++;
                
                if (step >= me.motionStep) {                    
                    clearInterval(interval);
                    finished();
                    return;
                }
                
                var pos = Math.floor(minus * me._tween(step));
                me._main.style.left = startLeft + pos + 'px';
            }, 
            me.motionInterval);        
        */
    },    
    
    /**
     * 自动隐藏
     * 
     * @private
     */
    _autoHideBar : function(){
        var me = this;
        clearTimeout(me._autoTimer);
        me._autoTimer = setTimeout(function () {
            var mPos = baidu.page.getMousePosition(),
                navPos = baidu.dom.getPosition(me._main);

            if (mPos.x > navPos.left + me._main.offsetWidth 
                || mPos.y < navPos.top 
                || mPos.y > navPos.top + me._main.offsetHight
            ) {
                me._hide();
            }            
        }, me.autoDelay);
    },
    
    /**
     * 显示缩小的bar
     * 
     * @private
     */
    _showMiniBar: function (noMotion) {
        var me = this,
            step = 0,
            endLeft = 0,
            startLeft = -30,
            minus = endLeft - startLeft,
            interval;
        
        if (noMotion) {
            finish();
            return;
        }

        /**
         * 完成显示minibar的动作
         * 
         * @inner
         */
        function finish() {
            me._miniBar.style.left = endLeft + 'px';

            // TODO: 永久取消js实现的sidebar动画效果
            // me._motioning = false;
        }
        
        finish();
        return;
        
        // TODO: 永久取消js实现的sidebar动画效果
        /*
        me._motioning = true;
        interval = setInterval(
            function () {
                step ++;
                
                if (step >= me.motionStep) {
                    clearInterval(interval);
                    finish();
                    return;
                }
                
                var pos = Math.floor(minus * me._tween(step));
                me._miniBar.style.left = startLeft + pos + 'px';
            }, 
            me.motionInterval);
        */
    },
    
    /**
     * 隐藏缩小的bar
     * 
     * @private
     * @param {Function} onComplete 完成的回调函数
     */
    _hideMiniBar: function () {
        var me = this,
            step = 0,
            endLeft = -30,
            startLeft = 0,
            minus = endLeft - startLeft,
            interval;  

        /**
         * 完成隐藏minibar的动作
         * @inner
         */
        function finished() {
            me._miniBar.style.left = endLeft + 'px';
            //baidu.removeClass(me._getNeighbor(), me.__getClass('neighbor-hide'));         
            //me._repaintNeighbor();
            
            // TODO: 永久取消js实现的sidebar动画效果
            // me._motioning = false;
            me._show();
        }

        finished();
        return;
        
        // TODO: 永久取消js实现的sidebar动画效果
        /*
        me._motioning = true;
        interval = setInterval(
            function () {
                step ++;
                
                if (step >= me.motionStep) {
                    clearInterval(interval);
                    finish();
                    return;
                }
                
                var pos = Math.floor(minus * me._tween(step));
                me._miniBar.style.left = startLeft + pos + 'px';
            }, 
            me.motionInterval);       
        */
    },

    /**
     * 重绘邻居元素
     * 
     * @private
     * @desc 重绘内部的控件
     */
    _repaintNeighbor: function () {
        var ctrlMap = ui.util.getControlMapByContainer(this._getNeighbor()),
            ctrl,
            key;
            
        for (key in ctrlMap) {
            ctrl = ctrlMap[key];
            if (ctrl.refreshView) {
                ctrl.refreshView();
            } else {
                ctrl.render();
            }
        }
    },
    
    /**
     * 获取邻居元素
     * 
     * @private
     * @return {HTMLElement}
     */
    _getNeighbor: function () {
        return baidu.dom.next(this._main);
    },
    
    /**
     * 获取mat元素
     * 
     * @private
     * @return {HTMLElement}
     */
    _getMat: function () {
        return baidu.g( this.__getId('mat') );
    },

    /**
     * 释放控件
     * 
     * @private
     */
    dispose: function () {
        var me = this;
        var mat = me._getMat();
            
        baidu.un(window, 'resize' ,me.heightReseter);
        baidu.un(window, 'scroll', me.topReseter);
        document.body.removeChild(me._miniBar);
        document.body.removeChild(mat);

        // 释放dom引用
        me._headEl = null;
        me._bodyEl = null;
        me._miniBar = null;

        ui.Base.dispose.call(me);
    }
    
    // TODO: 永久取消js实现的sidebar动画效果
    // ,
    /**
     * 动画函数
     * 
     * @private
     * @param {number} step 步数
     * @return {number} 完成百分比
     
    _tween : function(step) {
        return Math.pow(step/this.motionStep, 2);
    }
    */
};

ui.Base.derive(ui.SideBar);
