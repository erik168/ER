/*
 * Nirvana UI
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    nirvana/SearchCombo.js
 * desc:    组合搜索控件
 * author:  zhouyu
 * date:    2010/12/22
 */

nirvanaUI.SearchCombo = function (options) {
    this.__initOptions(options);
    this._type = 'searchcombo';
	
	var id = this.id;

	//searchState 状态选择框的option值
	this.hasState = this.searchState ? true : false;
	this.searchState = this.searchState || {};
	if (!this.searchState.id) {
		this.searchState.id = id + 'state';
	}
    
	//是否有精确查询复选框(this.precise:{name,title,value})
	this.hasPrecise = !!this.precise;

	//输入框参数（默认值、宽度等）
	this.inputOption = this.inputOption || {width:200,height:22};
	if (!this.inputOption.id) {
		this.inputOption.id = id + "search";
	}	

	//查询按钮参数（皮肤、宽度等）
	this.buttonOption = this.buttonOption || {};
	if(!this.buttonOption.id){
		this.buttonOption.id = id + "button";
	}
	
	this._controlMap = {
		"state": ui.util.create('Select', this.searchState),
		"search" : ui.util.create('TextInput',this.inputOption),
		"button" : ui.util.create('Button',this.buttonOption),
		"precise" : ui.util.create('CheckBox',{'id': id + 'precise'})
	};
	
	this.renderFun = {
		"state": this.renderState(),
		"search" : this.renderSearch(),
		"button" : this.renderButton(),
		"precise" : this.renderPrecise()
	};
};

nirvanaUI.SearchCombo.prototype = {

	buttonHtml: '查询',
	
	preciseHtml: '精确查询',
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
			me.renderParts();
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
		for (var item in this._controlMap) {
			this.renderFun[item](this._controlMap[item]);
		}
	},
	
	/**
	 * 渲染状态选择框
	 */
	renderState: function(){
		var me = this;
		return function(uiObj){
			if (me.hasState) {
				state = document.createElement('div');
				me._main.appendChild(state);
				uiObj.render(state);
			}
		};
	},
	
	/**
	 * 渲染选择输入框
	 */
	renderSearch: function(){
		var me = this;
		return function(uiObj){
			var search = document.createElement('input');
			search.setAttribute('type', 'text');
			me._main.appendChild(search);
			uiObj.render(search);
			search.onkeyup = me.keyupHandler();
		};
	},
	
	/**
	 * 渲染查询按钮
	 */
	renderButton: function(){
		var me = this;
		return function(uiObj){
			var button = document.createElement('div');
			button.innerHTML = me.buttonHtml;
			me._main.appendChild(button);
			uiObj.render(button);
			uiObj.onclick = me.clickHandler();
		};
	},
	
	/**
	 * 渲染精确查询复选框
	 */
	renderPrecise: function(){
		var me = this;
		return function(uiObj){
			if (me.hasPrecise) {
				var precise = document.createElement('input');
				    precise.type = 'checkbox';
				for (var i in me.precise) {
					precise.setAttribute(i, me.precise[i]);
				}
				me._main.appendChild(precise);
				uiObj.render(precise);
			}
		};
	},
	
	onclick: new Function(),
	
	
	/**
	 * 处理按钮点击事件（开始查询）
	 */
	clickHandler: function(){
		var me = this;
		return function(){
			var condition = me.getValue();
			me.onclick(condition);
		}
	},
	
	
	/**
	 * 处理回车事件（开始查询）
	 */
	keyupHandler: function(){
		var me = this;
		return function(){
			var e = window.event || arguments[0];
			if (e.keyCode == 13) { //回车筛选
				var condition = me.getValue();
				me.onclick(condition);
			}
		}
	},
	
	
	/**
	 * 获取组合搜索值
	 */
	getValue: function(){
		var me = this;
		var condition = {};
		condition.search = baidu.trim(me._controlMap["search"].getValue());
		if(me.hasState){
			 condition.state = me._controlMap["state"].getValue();
		}
		if(me.hasPrecise){
			 condition.precise = me._controlMap["precise"].getChecked();
		}

		return condition;
	},
	
	
	/**
	 * 为输入框设置某个值
	 * @param {Object} value 需要设置的值
	 */
	setValue: function(value){
		this._controlMap["search"].setValue(value);
	},
	
	/**
	 * 重绘控件
	 */
	repaint: new Function(),
	
	/**
	 * 释放
	 */
	dispose: function(){
        this._controlMap["button"].onclick = null;
		ui.Base.dispose.call(this);
	}
};

ui.Base.derive(nirvanaUI.SearchCombo);
ui.util.register('SearchCombo', nirvanaUI.SearchCombo);
