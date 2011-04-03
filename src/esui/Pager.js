/*
 * esui (ECOM Simple UI)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    ui/Pager.js
 * desc:    分页控件
 * author:  zhaolei, erik, yanjunyi
 * date:    $Date: 2011-02-28 17:53:18 +0800 (一, 28  2 2011) $
 */

/**
 * @class ui.Pager
 * 页码组件
 * @extends ui.Base
 */

/**
 * 构造函数
 * @method constructor
 * @param {Object} options 控件初始化参数
 */
ui.Pager = function (options) {
    this.__initOptions(options);
    this._type = "pager";
	
	// Add by junyi @2011-01-24
    // 起始页码数字，即传给后端计算当前页码的偏移量，大多数系统第一页数据的页码索引为0，少数系统为1，即可在此配置，默认：0。
	this.startNumber = parseInt(this.startNumber, 10) || 0;
	
	this.__initOption('prevText', null, 'PREV_TEXT');
	this.__initOption('nextText', null, 'NEXT_TEXT');
	this.__initOption('omitText', null, 'OMIT_TEXT');
	
    this.showCount = parseInt(this.showCount, 10) || ui.Pager.SHOW_COUNT;
};

ui.Pager.SHOW_COUNT = 5;
ui.Pager.OMIT_TEXT = '…';
ui.Pager.NEXT_TEXT = '下一页<span class="ui-pager-icon"></span>';
ui.Pager.PREV_TEXT =  '<span class="ui-pager-icon"></span>上一页';

ui.Pager.prototype = {
	/**
	 * 获取当前页码
	 * 
	 * @public
	 * @return {string}
	 */
	getPage: function () {
		return this.page;
	},
	
    /**
     * 渲染控件
     * 
     * @protected
     * @param {HTMLElement} main 控件挂载的DOM
     */
    render: function (main) {
        var me = this;
        ui.Base.render.call(me, main, false);
        
        me.total = parseInt(me.total, 10) || 0;
    
        me.page = parseInt(me.page, 10) || 0;

        // 绘制内容部分
        this._renderPages();
    },
    
	/**
	 * @ignore
	 */
    _tplMain: '<ul>{0}</ul>',
	/**
	 * @ignore
	 */
    _tplItem: '<li onclick="{2}" onmouseover="{3}" onmouseout="{4}" class="{1}"><span>{0}</span></li>',
    
    /**
     * 绘制页码区
     * 
     * @private
     */
    _renderPages: function () {
        var me        = this,
            html      = [],
            total     = me.total,
			startNumber = this.startNumber,
            last      = total + startNumber - 1,
            page      = me.page + startNumber,// 恶心
            itemClass = me.__getClass('item'),
            disClass  = me.__getClass('disabled'),
			prevClass = me.__getClass('prev'),
			nextClass = me.__getClass('next'),
            omitWord  = me._getInfoHtml(me.omitText, me.__getClass('omit')),
            i, begin;
        
        if (total <= 0) {
            this._main.innerHTML = '';
            return;
        }
       		 
        // 计算起始页
        if (page < me.showCount - 1) {
            begin = 0;
        } else if (page > total - me.showCount) {
            begin = total - me.showCount;
        } else {
            begin = page - Math.floor(me.showCount / 2);
        }
        if (begin < 0) {
            begin = 0
        }
        
        // 绘制前一页的link
        if (page > 0) {
            html.push(me._getItemHtml(me.prevText,
									 prevClass,
                                     me.__getStrCall('select', page - 1)
                                     )
					  );
        } else {
            html.push(me._getInfoHtml(me.prevText, prevClass + ' ' + disClass));
        }
        
        // 绘制前缀
        if (begin > 0) {
            html.push(me._getItemHtml(1,
									 prevClass,
                                     this.__getStrCall('select', 0)
                                     ),
                      omitWord);
        }

        // 绘制中间的序号
        for (i = 0; i < me.showCount && begin + i < total; i++) {
            if (begin + i != page) {
            html.push(me._getItemHtml(1 + begin + i,
									 itemClass,
                                     me.__getStrCall('select', begin + i))
                      );
            } else {
                html.push(me._getInfoHtml(1 + begin + i, me.__getClass('selected')));
            }
        }
        
        // 绘制后缀
        if (begin < total - me.showCount) {
            html.push(omitWord,
                      me._getItemHtml(total,
					  				 itemClass,
                                     me.__getStrCall('select', last)
                                     )
                      );
        }
        
        
        // 绘制后一页的link
        if (page < last) {
            html.push(me._getItemHtml(me.nextText,
									 nextClass,
                                     me.__getStrCall('select', page + 1))
					  );
        } else {
            html.push(me._getInfoHtml(me.nextText, nextClass + ' ' + disClass));
        }
        
        this._main.innerHTML = ui._format( me._tplMain,
                                           html.join(''));
    },
    
	/**
	 * 生成单个页码元素的html内容
	 * @private
	 * 
	 * @param {String} sText
	 * @param {Strint} sClass
	 * @param {String} sClick
	 * 
	 * @return {String}
	 */
    _getItemHtml: function(sText, sClass, sClick) {
	    var me          = this,
	        strRef      = me.__getStrRef(),
	        itemOver    = strRef + '._itemOverHandler(this)',
	        itemOut     = strRef + '._itemOutHandler(this)';
	        return ui._format(me._tplItem,
	                            sText,
	                            sClass,
	                            sClick,
	                            itemOver,
	                            itemOut);
    },
	
	/**
	 * 生成单个不可点击的页码元素的html内容
	 * @private
	 * 
	 * @param {String} sText
	 * @param {Strint} sClass
	 * 
	 * @return {String}
	 */
	_getInfoHtml: function (sText, sClass) {
		return ui._format(this._tplItem, sText, sClass, '', '' ,'');
	},
    
	/**
	 * 点击页码的事件处理接口
	 * 
	 * @param {Number} page
	 * 
	 * @return {Boolean}
	 */
    onchange: new Function(),
    
    /**
     * 选择页码
     * 
     * @public
     * @param {number} page 选中页数
     */
    select: function (page) {
        if (this.onchange(page) !== false) {
            this.page = page;
            this._renderPages();
        }
    },
    
	/**
	 * @ignore
	 * @param {Object} item
	 */
    _itemOverHandler: function(item) {
        baidu.addClass(item, this.__getClass('hover'));
    },

	/**
	 * @ignore
	 * @param {Object} item
	 */
    _itemOutHandler: function(item) {
        baidu.removeClass(item, this.__getClass('hover'));
    }
};

ui.Base.derive(ui.Pager);
