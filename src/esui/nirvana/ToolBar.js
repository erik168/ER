/*
 * Nirvana UI
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    nirvana/ToolBar.js
 * desc:    工具栏控件
 * author:  zhouyu
 * date:    $Date: 2011-02-05 12:09:24 +0800 (六, 05  2 2011) $
 */
/**
 * 工具栏控件
 * @param {Object} options
 */
 nirvanaUI.ToolBar = function (options) {
    this.__initOptions(options);
    this._type = 'toolbar';

	this.scrolltop = 0;
	this.scrollleft = 0;
	this.offsetX = 0;
	this.offsetY = 0;
	this.intervalTime = 500;
	this.scrollTop = 0;
	this.scrollLeft = 0;
	this.task = null;
	this.status = 'hide';

	//框架搭好后修改，导航栏的高度和宽度
	this.navWidth = 980;
	this.navHeight = 55;
};

nirvanaUI.ToolBar.prototype = {
    /**
	 * 渲染控件
	 * @param {Object} main
	 */
	render: function(main){
		var me = this;
		if (!me.isRendered) {
			ui.Base.render.call(me, main, false);
			
            //工具栏的背景与定位可直接设置在ui_toolbar类中，其内容在context中使用按钮控件构造好以后直接传到工具栏控件中
			//这里不在控件中写入工具栏中的各项内容是为了方便以后系统中有类似fixed定位的元素可以使用
			me._main.innerHTML = me.datasource;
			if (baidu.ie && baidu.ie < 7) {
				me.offsetX = me.main.offsetTop;
				me.offsetY = me.main.offsetLeft;
				me.task = setInterval(me.relocate, me.intervalTime);
			}
            me.bindEvent();
			me.isRendered = true;
		}
	},
	
    _tplFloat: '<div class="{0}_head clearfix">'
	                + '<div class="ui_toolbar_rc_l"></div>'
	                + '<div class="ui_toolbar_rc_r"></div>'
	                + '<span class="{0}_head_title">{2}</span>'
	                + '<div ui="id:{1}ResetBtn;type:Button;">重置工具</div>'
	                + '<span class="{0}_head_minimize" id="{1}_minimize">最小化</span>'
                + '</div>'
                + '<div class="{0}_body_wrap">'
	                + '<div class="{0}_body" id="{1}_body"></div>'
                + '</div>',
	/**
	 * 创建一个浮出层DOM，指定id和classname
	 * @param {Object} toolsNameText
	 * @param {Object} id
	 * @param {Object} classname
	 */
	createFloat: function (toolsName, id, classname) {
		if (!baidu.g(id)) {
			var main = document.createElement('div'),
				navHeight = this.navHeight,
				toolsNameText = nirvana.config.LANG.TOOLS_NAME[toolsName];
				
			this.floatMain = main;

			main.id = id;
			classname = classname || "tools";
			baidu.addClass(main, classname);
			main.innerHTML = ui._format(this._tplFloat,
									    classname,
										id,
										toolsNameText);
			baidu.g('Tools').appendChild(main);
			
			er.UIAdapter.init(main);
			
			baidu.on(baidu.g(id + '_minimize'), 'click', function(){
				 ToolsModule.close();
				 return false;
			});
			
			ui.util.get(id + 'ResetBtn').onclick = function(){
				ToolsModule.reset(toolsName);
			};
			
			var resizeFunc = function(){
				var height = document.documentElement.clientHeight - 34 - navHeight,
					element = baidu.g(id + '_body');
				if (element.offsetHeight != height) {
					element.style.height = height + 'px';
				}
			};
			
			resizeFunc();
			setInterval(resizeFunc, 500);
			
			return true;
		}
		return false;
	},
	
	
	/**
	 * 打开/关闭浮动层
	 */
	showFloat: function(){
		var me = this;
		me.status = 'show';
		
		me.setMain(true);
		
		me.setToolFloat(true);
	
		
		//隐藏工具栏
		me.hide();
	},
	
	hideFloat : function(){
		var me = this;
		if(me.status == 'hide'){
			return;
		}
		me.status = 'hide';
		
		me.setMain(false);

		me.setToolFloat(false);
		
		//显示工具栏
		me.open();
		
	},
	
	
	setToolFloat: function(status){
		var me = this;
		if(!status){//关闭
			baidu.removeClass(me.floatMain,"tool_show");
		} else{//打开
			baidu.addClass(me.floatMain,"tool_show");
		}
	},
	
	/**
	 * 下层内容的隐藏与复现
	 */
	setMain: function(status){
		var me = this;
		if (status) {
			me.scrollTop = document.documentElement.scrollTop;
			me.scrollLeft = document.documentElement.scrollLeft;
			window.scrollTo(0, 0);
			//让scroll飞一会儿
			setTimeout(function(){
				document.documentElement.style.overflow = "hidden";
				baidu.g("Main").style.height = me.navHeight + "px";
				baidu.g("Main").style.width = me.navWidth + "px";
			}, 100);
			
		} else {
			document.documentElement.style.overflow = "";
			baidu.g("Main").style.height = "100%";
			baidu.g("Main").style.width = '';
			window.scrollTo(me.scrollLeft, me.scrollTop);
		}
	},
	
	/**
	 * 打开工具浮出层时隐藏工具栏
	 */
	hide: function(){
		var me = this;
		if (baidu.ie && baidu.ie < 7) {
			me._main.style.top = "-1000px";
			me._main.style.left = "-1000px";
		}else{
			me.setState("hide");
		}
	},
	
	/**
	 * 最小化工具浮出层时打开工具栏
	 */
	open: function(){
		var me = this;
		if (baidu.ie && baidu.ie < 7) {
			me._main.style.top = (me.scrolltop + me.offsetX) + "px";
			me._main.style.left = (me.scrollleft + me.offsetY) + "px";
		}else{
			me.removeState("hide");
		}
	},
	
	
	/**
	 * IE6下滚动条位置发生改变时重定位工具栏的位置
	 */
	relocate: function(){
		var me = this;
        var scrollTop = document.documentElement.scrollTop;
        var scrollLeft = document.documentElement.scrollLeft;

		if (me.scrolltop != scrollTop 
            || me.scrollleft != scrollLeft
        ) {
            me.scrolltop = scrollTop;
            me.scrollleft = scrollLeft;
            me._main.style.top = (me.scrolltop + me.offsetX) + "px";
            me._main.style.left = (me.scrollleft + me.offsetY) + "px";
        }
	},
	
	clickhandler : new Function(),
	
	bindEvent: function(){
		this._main.onclick = this.clickhandler;
	},
	
	/**
     * 释放
     * 
     */
    dispose: function () {
        if(this._main){
            this._main.onclick = null;
        }
		this.task && clearInterval(this.task);
		if(this.floatMain){
			document.body.removeChild(this.floatMain);
            this.floatMain = null;
		}
        ui.Base.dispose.call(this);
    }
}
ui.Base.derive(nirvanaUI.ToolBar);
ui.util.register('ToolBar', nirvanaUI.ToolBar);
