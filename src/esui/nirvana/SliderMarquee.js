/**
 * Nirvana UI
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    nirvana/SliderMarquee.js
 * desc:    滑动跑马灯UI控件
 * author:  wangzhishou
 * date:    $Date: 2011-02-05 12:09:24 +0800 (六, 05  2 2011) $
 */

/**
 * 滑动跑马灯UI控件
 * 
 * @param {Object}
 *            options 参数
 */
nirvanaUI.SliderMarquee = function(options) {
    // 初始化事件
    this.__initOptions(options);

    // 类型声明，用于生成控件子dom的id和class
    this._type = 'SliderMarquee';
    
    this.datasource = this.datasource || [];
    this.currentScenceNumber = 1;
};

nirvanaUI.SliderMarquee.prototype = {
    /**
     * 模板片段
     * @private
     */
    _tplItem : '<li><a href="#" title="{0}">{1}</a></li>',

    /**
     * 关键词选中事件
     */
    ontextclick : new Function(),

    /**
     * 渲染控件
     *
     * @public
     */
    render : function(main) {
        var me = this;
        ui.Base.render.call(me, main, true);

        if (me.isshow) {
            var ul = me._main.getElementsByTagName("ul");
            var data = me.datasource;
            var html = [];
            var item;
            var i, len;
            for (i = 0, len = data.length; i < len; i++) {
                item = data[i];
                html.push(
                    ui._format(
                        me._tplItem, 
                        item, 
                        item
                    ));
            }
            ul[0].innerHTML = html.join('');
            me._init();
        } else {
            me._main.style.display = "none";
        }
    },

    /**
     * 初始化
     *
     * @private
     */
    _init : function() {
        this.setDefaultHeightLight(this.keywordSelected);
        this.fixedWidth();
        this.setBtnStatus();
        this.bindLink();
    },

    /**
     * 设置默认第一个高亮
     * @var String keyword 要高亮的关键词
     */
    setDefaultHeightLight : function(keyword) {
        var me = this;
        if (keyword) {
            /**
            var link = baidu.G(me.getId()).getElementsByTagName("a");
            var keyword = link[0].innerHTML;
             */
            me.heightLight(keyword);
        }
    },

    /**
     * 设置前进后退按钮状态
     */
    setBtnStatus : function() {
        var me = this;
        var div = baidu.g(me.__getId()).getElementsByTagName("div");
        var link = div[2].getElementsByTagName("a");
        if (this.currentScenceNumber == 1) {
            link[0].className = "prev";
            if (this.currentScenceNumber < this.scenceNumer) {
                link[1].className = "next-active";
            } else {
                link[1].className = "next";
            }
        } else if (this.currentScenceNumber > 1) {
            link[0].className = "prev-active";
            if (this.currentScenceNumber < this.scenceNumer) {
                link[1].className = "next-active";
            } else {
                link[1].className = "next";
            }
        } else if (this.scenceNumer == this.currentScenceNumber) {
            link[1].className = "next";
        }
    },

    /**
     * 初始化宽度
     */
    fixedWidth : function() {
        var me = this;
        var div = baidu.G(me.__getId()).getElementsByTagName("div");
        var ul = baidu.G(me.__getId()).getElementsByTagName("ul");
        var li = ul[0].getElementsByTagName("li");
        var w = 0;
        for ( var i = 0, n = li.length; i < n; i++) {
            w = w + parseInt(li[i].offsetWidth, 10);
        }
        this.fullWidth = w;
        this.scenceWidth = div[1].offsetWidth;
        this.scenceNumer = Math.ceil(this.fullWidth / this.scenceWidth);
        this.fullWidth = this.scenceNumer * this.scenceWidth;
        ul[0].style.width = this.fullWidth + "px";
    },

    /**
     * 元素X轴滚动到某个位置
     */
    scrollBy : function(offset) {
        var me = this;
        var div = baidu.g(me.__getId()).getElementsByTagName("div");
        div[1].scrollLeft = Math.round(offset);
    },

    /**
     * 自动滚动到相应位置
     */
    autoPosition : function() {
        var offset = this.scenceWidth * (this.currentScenceNumber - 1);
        this.scrollBy(offset);
        this.setBtnStatus();
    },

    /**
     * 给a链接挂载事件
     */
    bindLink : function() {
        var me = this;
        var link = baidu.g(me.__getId()).getElementsByTagName("a");
        for ( var i = 0, n = link.length; i < n; i++) {
            var elm = link[i];
            if (elm.className.indexOf('prev') > -1
                || elm.className.indexOf('next') > -1
            ) {
                elm.onclick = me.onBtnClick();
            } else {
                elm.onclick = me.onTextSelect();
            }
        }
    },

    /**
     * 文字选中事件处理控制器
     */
    onTextSelect : function() {
        var me = this;
        return function(e) {
            e = e || window.event;
            baidu.event.preventDefault(e);
            var keyword = this.innerHTML;
            me.onTextClick(keyword);
        };
    },

    /**
     * 按钮点击事件处理控制器
     */
    onBtnClick : function() {
        var me = this;
        return function(e) {
            e = e || window.event;
            baidu.event.preventDefault(e);
            this.blur();
            if (this.className.indexOf('next') > -1) {
                me.currentScenceNumber = Math.min(me.currentScenceNumber + 1,
                        me.scenceNumer);
            } else {
                me.currentScenceNumber = Math
                        .max(me.currentScenceNumber - 1, 1);
            }
            me.autoPosition();
        };
    },

    /**
     * 根据关键词, 高亮关键词
     */
    heightLight : function(keyword) {
        var me = this;
        var div = baidu.g(me.__getId()).getElementsByTagName("div");
        var link = div[1].getElementsByTagName("a");
        var clazz = "heightlight";
        var txt;
        var item;
        var i, n;

        for (i = 0, n = link.length; i < n; i++) {
            item = link[i];
            txt = item.innerHTML;

            if (baidu.string.decodeHTML(keyword) == txt) {
                baidu.addClass(item, clazz);
            } else {
                baidu.removeClass(item, clazz);
            }
        }
    }
};

ui.Base.derive(nirvanaUI.SliderMarquee);
ui.util.register('SliderMarquee', nirvanaUI.SliderMarquee);
