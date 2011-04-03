/*
 * Nirvana UI
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    nirvana/SelectCombo.js
 * desc:    物料选择控件
 * author:  zhouyu
 * date:    2010/12/23
 */

/**
 * 物料选择控件
 * @param {Object} options
 */
nirvanaUI.SelectCombo = function (options) {
    this.__initOptions(options);
    this._type = 'selectcombo';
	
	this.width = this.width || 400;
	this.height = this.height || 500;
};

nirvanaUI.SelectCombo.prototype = {
	/**
	 * 绘制控件
	 * @public
	 * @param {HTMLElement} main 控件元素
	 */
	render: function(main){
		var me = this;
		if (main && main.tagName != 'DIV') {
			return;
		}
		
		if (!me.isRender) {
			ui.Base.render.call(me, main, true);
			if(me.width){
				me._main.style.width = me.width + "px";
			}
			if(me.height){
				me._main.style.height = me.height + "px";
				me._main.style.overflow = "auto";
			}
			me.renderParts();
			
			me.level.onselect = me.levelChangeHandler();
			me.search.onclick = me.searchHandler();
			if(me.page){
				me.page.onselect = me.pageChangeHandler();
			}
			if (me._main) {
                me._clickHandler = me.clickHandler();
				baidu.on(me.main, "click", me._clickHandler);
			}
			me.isRender = true;
		}
		else {
			me.repaint();
		}
	},
	
	/**
	 * 渲染各个组件
	 */
	renderParts: function(){
		var me = this;
		me.setLevel();
		me.setSearch();
		me.setTable();
		if(me.pageOption){
			me.setPage();
		}
		
		if(me.close){
			me.setClose();
		}
	},
	
	/**
	 * 渲染层级
	 */
	setLevel: function(){
		var me = this;
		if (!me.level) {
			var data = me.materialLevel || {};
			data.id = me.id + "level";
			me.level = ui.util.create('MaterialLevel', data);
		}
		levelId = me.level.__getId();
		var part = baidu.g(levelId);
			
		if(!part){
			part = document.createElement('div');
			part.id = levelId;
			me._main.appendChild(part);
		}
		me.level.render(part);
	},
	
	
	/**
	 * 渲染组合搜索
	 */
	setSearch: function(){
		var me = this;
		if (!me.search) {
			var data = me.searchOption || {};
			data.id = me.id + "search";
			me.search = ui.util.create('SearchCombo', data);
		}
		searchId = me.search.__getId();
		part = baidu.g(searchId);
		
		if (!part) {
			part = document.createElement('div');
			part.id = searchId;
			me._main.appendChild(part);
		}
		me.search.render(part);
	},
	
	/**
	 * 渲染table
	 */
	setTable: function(){
		var me = this;
		if (!me.table) {
			var data = me.tableOption || {};
			data.id = me.id + "table";
			me.table = ui.util.create('Table', data);
		}
		tableId = me.table.__getId();
		part = baidu.g(tableId);
		
		if (!part) {
			part = document.createElement('div');
			part.id = tableId;
			me._main.appendChild(part);
		}
		me.table.render(part);
		if (me.table.width) {
			me.table.main.style.width = me.table.width + "px";
		}
		if (me.table.height) {
			me.table.main.style.height = me.table.height + "px";
		}
		
	},
	
	/**
	 * 渲染页码
	 */
	setPage: function(){
		var me = this;
		if (!me.page) {
			var data = me.pageOption;
			data.id = me.id + "page";
			me.page = ui.util.create('Page', data);
		}
		pageId = me.page.__getId();
		part = baidu.g(pageId);
		
		if (!part) {
			part = document.createElement('div');
			part.id = pageId;
			me._main.appendChild(part);
		}
		me.page.render(part);
	},
	
	/**
	 * 渲染关闭按钮
	 */
	setClose: function(){
		var me = this,
			close = document.createElement('div');

		close.id = me.__getId("close");
		baidu.addClass(close, me.__getClass("close"));
		me._main.appendChild(close);
	},
	
	/**
	 * 控件的点击事件：关闭按钮点击事件、物料名点击事件（进入下一层级或者加入左侧选择框）
	 */
	clickHandler: function(){
		var me = this;
		return function(){
			var e = window.event || arguments[0],
				target = e.srcElement || e.target;

			while(target && target.id != me._main.id){
				if(target.id == me.__getId("close")){
					me.closeMe();
					return;
				}
				if (target.getAttribute("lastlevel") == "y" 
                    && !baidu.dom.hasClass(target, me.__getClass("disabled"))
                ) {
					me.addToLeft(target);
					return;
				} else if(target.getAttribute("lastlevel") == "n") {
					me.toNextLevel(target);
					return;
				}
				target = target.parentNode;
			}
		}
	},
	
	/**
	 * 关闭控件
	 */
	closeMe: function(){
		var me = this;
		me._main.style.top = "-10000px";
		me._main.style.left = "-10000px";
		if (me.onclose){
			me.onclose();
		}
	},
	
	/**
	 * 添加到左侧选择框
	 * @param {Object} tar 要添加的对象
	 */
	addToLeft: function(tar){
		var me = this,
			id = tar.getAttribute("id"),
			name = tar.innerHTML;
		var opt = {
			id: id,
			name: name
		};
		if (me.onAddLeft(opt) !== false){
			baidu.addClass(tar, me.__getClass("disabled"));
		}
	},
	
	/**
	 * 外部接口
	 * @param {Object} id 物料的id
	 */
	onAddLeft: new Function(), //将数据添加到左侧
	
	/**
	 * 数据从左侧选择框还原
	 * @param {Object} id
	 */
	recover: function(key,value){
		var me = this,
			table = me.table._main;

		//获取table下面所有a对象
		var links = $$.find("a", table).set;
	
		for (var i = 0, l = links.length; i < l; i++) {
			if (links[i].getAttribute(key) == value 
                && baidu.dom.hasClass(links[i],me.__getClass("disabled"))
            ){
				baidu.removeClass(links[i],me.__getClass("disabled"));
				break;
			}
		}
		
	},
	
	
	/**
	 * 点击进入到下一层级
	 * @param {Object} target 点击的对象
	 */
	toNextLevel: function(target){
		var me = this,
			id = target.getAttribute("id"),
			name = target.innerHTML;

		var opt = {
			id: id,
			name: name
		};
	/*	if(me.onToNextLevel(opt) !== false){
			me.search.setValue("");
			me.level.material = me.materialLevel.material;
			me.level.currentLevel = +me.level.currentLevel + 1;
			me.level.sumLevel += 1;
			me.setLevel();
			me.setTable();
			me.tableOption.datasource = me.table.datasource;
		}*/
		
		me.onToNextLevel(opt);
	},

	/**
	 * 外部接口
	 */
	onToNextLevel: new Function(),//重新构造level和table数据 
	
	/**
	 * 获取当前层级
	 */
	getLevel: function(){
		return this.level.getLevel();
	},
	
	/**
	 * 获取下一页页码
	 */
	getPage: function(){
		return this.page.getPage();
	},
	
	/**
	 * 层级改变事件处理
	 */
	levelChangeHandler: function(){
		var me = this;
		return function(level){
			me.search.setValue("");
			if (me.onLevelChange(level)) {
				me.setTable();
				me.tableOption.datasource = me.table.datasource;
			}
		};
	},
	
	/**
	 * 查询事件处理
	 */
	searchHandler: function(){
		var me = this;
		return function(condi){
			if (me.onsearch(condi) !== false) { //在onsearch接口中重设this.tableOption
				me.setTable();
			}
		};
	},
	
	/**
	 * 页码改变事件处理
	 */
	pageChangeHandler: function(){
		var me = this;
		return function(page){
			if(me.onPageChange(page) !== false){
				me.setTable();
				me.tableOption.datasource = me.table.datasource;
			}
		};
	},
	
	/**
	 * 外部接口
	 */
	onsearch: new Function(),//根据condition筛选结果
	
	onPageChange: new Function(), //翻页更新table数据
	
	/**
	 * 重绘控件
	 */
	repaint: function(){
		var me = this;
		me._main.style.top = 0;
		me._main.style.left = 0;
		me.renderParts(); 
	},
	
	/**
	 * 释放
	 */
	dispose: function(){
		var me = this;

		ui.Base.dispose.call(me);
		document.body.removeChild(baidu.g(me.__getId('level')));
		document.body.removeChild(baidu.g(me.__getId('search')));
		document.body.removeChild(baidu.g(me.__getId('table')));
		document.body.removeChild(baidu.g(me.__getId('page')));

		if (me.close){
			document.body.removeChild(baidu.g(me.__getId('close')));
		}
		if (me._main) {
			baidu.un(me._main, "click", me._clickHandler);
		}
	}
};

ui.Base.derive(nirvanaUI.SelectCombo);
ui.util.register('SelectCombo', nirvanaUI.SelectCombo);
