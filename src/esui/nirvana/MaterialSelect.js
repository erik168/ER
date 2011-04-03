/*
 * Nirvana UI
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    nirvana/MaterialSelect.js
 * desc:    组合搜索控件
 * author:  zhouyu
 * date:    2010/12/31
 */

nirvanaUI.MaterialSelect = function (options) {
    this.__initOptions(options);
    this._type = 'materialselect';
	
	this.userid = nirvana.env.USER_ID;
	this.username = nirvana.env.USER_NAME;
	//数组中按顺序写出层级名，目前包括[user,plan,unit,keyword,idea],以后再扩展folder等
	this.level = this.level || ["user"]; 
	
	this.levelFunc = {
		"user" : this.renderPlanList(),
		"plan" : this.renderUnitList(),
		"unit" : this.renderMatList(),
		"keyword" : null,
		"idea" : null
	};
};

nirvanaUI.MaterialSelect.prototype = {
	/**
	 * 渲染控件
	 * @param {Object} main
	 */
	render: function(main){
		var me = this;
		if (main && main.tagName != 'DIV') {
			return;
		}
		
		ui.Base.render.call(me, main, true);

		me.addWords = me.addWords || [];
		me.renderLevelOption();
		me.renderSearchOption();
		me.renderTableOption();
		me.interval = setInterval(me.renderSelectCombo(), 100);
		me.isRender = true;
	},
	
	
	/**
	 * 初始化level层级参数，每次都从第一层开始
	 */
	renderLevelOption: function(){
		var me = this;
		if (me.form == "material") {
			me.materialLevel = {
				material: [{
					level: 0,
					id: 0,
					word: me.username,
					click: me.renderPlanList()
				}]
			};
		}
		else 
			if (me.form == "avatar") {
				me.materialLevel = {
					material: [{
						level: 0,
						id: 1,
						word: me.username,
						click: me.renderFolderList()
					}]
				};
			}
		if (me.isRender) {
			me.selectCombo.materialLevel = me.materialLevel;
			me.selectCombo.level.material = me.materialLevel.material;
		//	me.selectCombo.level.currentLevel = 0;
		//	me.selectCombo.level.sumLevel = 1;
		}
	},
	
	
	/**
	 * 初始化搜索组合控件参数，每次render输入框的值都必须为空
	 */
	renderSearchOption: function(){
		var me = this;
		me.searchOption = {};
		if (me.isRender) {
			me.selectCombo.search.setValue("");
		}
	},
	
	/**
	 * 初始化tableOption
	 */
	renderTableOption: function(){
		var me = this;
		var last = false,
			classname = "";
		if (me.level.length == 1 || me.level.length == 2) {
			last = true;
		}
		var dataTable = {
			"fields": [{
				content: me.setTableFields(last),
				stable: false,
				title: '',
				width: 300
			}],
			"noTitle": true,
			"noDataHtml": "暂无数据",
			"width": 370,
			"height": 300
		};
		
		if (!me.tableOption) {
			me.tableOption = dataTable;
		}
		else {
			for(var item in dataTable){
				if(!me.tableOption[item]){
					me.tableOption[item] = dataTable[item];
				}
			}
		}
		me.getPlanList(0);
		
		//如果是repaint，则需要重新设置selectCombo.table对象的fields
		if (me.isRender) {
			me.selectCombo.table.fields = dataTable.fields; 
		}
	},
	
	
	/**
	 * 设置table的fields参数
	 * @param {Object} last
	 */
	setTableFields: function(last){
		var me = this;
		if (last) {
			var lastlevel = 'lastlevel="y"';
		}
		else {
			var lastlevel = 'lastlevel="n"';
		}
		return function(item){
					var disabled = "",
						classname = "",
						isAdd = false;
					
					if(last){
						isAdd = me.isWordAdded(item.id);
						//最后一个层级，用于区分样式
						classname = ' class = "' + me.__getClass("lastlevel"); 
						//用于区分点击样式
						if(isAdd !== false && isAdd !== -1){
							classname = classname + ' ' + 
										me.selectCombo.__getClass("disabled"); 
						}
						classname += '"';
					}
					return '<a id="' + item.id + '" ' + lastlevel + classname + '>' + item.name + '</a>';
				};
	},
	
	
	/**
	 * 渲染基层控件
	 */
	renderSelectCombo: function(){
		var me = this;
		return function(){
		    
			if (me.selectCombo) {
				me.selectCombo.render(me.main);
				clearInterval(me.interval);
				
			}
		}
	},
	
	
	/**
	 * 创建基层控件对象
	 */
	createSelectCombo: function(){
		var option = {
			"id": this.__getId("materialSelect"),
			"materialLevel": this.materialLevel,
			"searchOption": this.searchOption,
			"tableOption": this.tableOption,
			"onclose" : this.onclose,
			close: true
		};
		
		if (this.height) {
			option.height = this.height;
		}
		if (this.width) {
			option.width = this.width;
		}
		
		this.selectCombo = ui.util.create("SelectCombo", option);
		
		this.selectCombo.onAddLeft = this.addLeft();
		this.selectCombo.onToNextLevel = this.ToNextLevel();
		this.selectCombo.onsearch = this.search();
		this.selectCombo.onLevelChange = this.levelChange();
	},
	
	/**
	 * 物料是否已添加
	 * @param {Object} id
	 */
	isWordAdded: function(id){
		var me = this;
		for (var i = 0, l = me.addWords.length; i < l; i++) {
			if(me.addWords[i].id == id){
				return i;
			}
		}
		return false;
	},
	
	/**
	 * 删除已添加物料
	 * @param {Object} id
	 */
	removeAddedWord: function(id){
		var me = this;
		var index = me.isWordAdded(id);
		if(index != -1){
			return me.addWords.splice(index, 1);
		}
		return false;
	},
	
	/**
	 * 重新获取计划列表的datasource
	 */
	renderPlanList: function(){
		var me = this;
		return function(userid){
			me.getPlanList(1);
		}
	},
	
	/**
	 * 重新获取单元列表的datasource
	 * @param {Object} planid
	 */
	renderUnitList: function(){
		var me = this;
		return function(planid){
			me.getUnitList(planid);
		}
	},
	
	
	/**
	 * 重新获取关键词或创意列表的datasource
	 * @param {Object} unitid
	 */
	renderMatList: function(){
		var me = this;
		return function(unitid){
			if(baidu.array.indexOf(me.level,"keyword") != -1){
				me.getKeywordList(unitid);
			}else if(baidu.array.indexOf(me.level,"idea") != -1){
				me.getIdeaList(unitid);
			}
		}
	},
	
	/**
	 * 获取计划列表
	 */
	getPlanList: function(type){
		var me = this;
		fbs.plan.getNameList({
			callback:function(data){
				var planlist = [];
				var datalist = data.data.listData;
				var len = datalist.length;
				for (var i = 0; i < len; i++) {
					planlist[planlist.length] = {
						id : datalist[i].planid,
						name : baidu.encodeHTML(datalist[i].planname)
					}
				}
				if(!me.selectCombo){
					me.tableOption.datasource = planlist;
					me.createSelectCombo();
				}else{
					me.selectCombo.table.datasource = planlist;
					if(type == 1){
						me.reset();
					}
					
				}
			}
		});
		
	},
	
	
	/**
	 * 获取单元列表
	 */
	getUnitList: function(planid){
		var me = this;
		fbs.unit.getNameList({
			condition: {
				planid: [planid]
			},
	//		planid : planid,
			callback : function(data){
				var unitlist =[];
				var datalist = data.data.listData;
				var len = datalist.length;
				for (var i = 0; i < len; i++) {
					unitlist[unitlist.length] = {
						id : datalist[i].unitid,
						name : baidu.encodeHTML(datalist[i].unitname)
					}
				}
				me.selectCombo.table.datasource = unitlist;
				me.reset();
			}
		});
	},
	
	
	/**
	 * 获取关键词列表
	 */
	getKeywordList: function(unitid){
		var me = this;
		fbs.keyword.getNameList({
			condition: {
				unitid: [unitid]
			},
		//	unitid : unitid,
			callback : function(data){
				var kwlist =[];
				var datalist = data.data.listData;
				var len = datalist.length;
				for (var i = 0; i < len; i++) {
					kwlist[kwlist.length] = {
						id : datalist[i].winfoid,
						name : baidu.encodeHTML(datalist[i].showword)
					}
				}
				me.selectCombo.table.datasource = kwlist;
				me.reset();
			}
		});
	},
	
	
	/**
	 * 获取创意列表
	 */
	getIdeaList: function(unitid){
		var me = this;
		fbs.idea.getNameList({
			condition: {
				unitid: [unitid]
			},
		//	unitid : unitid,
			callback : function(data){
				var Idealist =[];
				var datalist = data.data.listData;
				var len = datalist.length;
				for (var i = 0; i < len; i++) {
					Idealist[Idealist.length] = {
						id : datalist[i].ideaid,
						name : baidu.encodeHTML(datalist[i].title) 
					}
				}
				me.selectCombo.table.datasource = Idealist;
				me.reset();
			}
		});
	},
	
	reset: function(){
		var me = this,
			selectcombo = me.selectCombo;
		selectcombo.search.setValue("");
		selectcombo.level.material = selectcombo.materialLevel.material;
	//	selectcombo.level.currentLevel = +selectcombo.level.currentLevel + 1;
	//	selectcombo.level.sumLevel += 1;
		selectcombo.setLevel();
		selectcombo.setTable();
		selectcombo.tableOption.datasource = selectcombo.table.datasource;
	},
	
	
	
	/**
	 * 将数据添加到左侧
	 */
	addLeft: function(){
		var me = this;
		return function(option){
			if (me.onAddLeft(option) !== false) {
				me.addWords[me.addWords.length] = option;
				return true;
			}
			else {
				return false;
			}
		}
	},
	
	onAddLeft: new Function,
	
	/**
	 * 到下一层级，重新构造level和table数据
	 */
	ToNextLevel: function(){
		var me = this;
		return function(option){
			var mat = me.selectCombo.materialLevel.material,
				currentLevel = mat.length,
				id = option.id,
				name = option.name,
				last = false;
			mat[currentLevel] = {
				level : currentLevel,
				id : id,
				word : name,
				click : me.levelFunc[me.level[currentLevel]]
			};
			
			if (currentLevel == me.level.length - 2) {
				last = true;
			}
			me.selectCombo.table.fields[0].content = me.setTableFields(last);
			
			me.levelFunc[me.level[currentLevel]](id);
		}
	},
	
	
	levelChange: function(){
		var me = this;
		return function(level){
			var last = false;
				
			if (level == me.level.length - 2) {
				last = true;
			}
			me.selectCombo.table.fields[0].content = me.setTableFields(last);
			return true;
		}
	},
	
	/**
	 * 根据condition筛选结果
	 */
	search: function(){
		var me = this;
		return function(condition){
			var value = baidu.encodeHTML(condition.search),
				data = me.selectCombo.tableOption.datasource,
				len = data.length;
			var tmp = [];
			for (var i = 0; i < len; i++) {
				if (data[i].name.indexOf(value) != -1) {
					tmp[tmp.length] = data[i];
				}
			}
			me.selectCombo.table.datasource = tmp;
			me.setNoTable();
		}
	},
	
	setNoTable: function(){
		var me = this;
		me.selectCombo.table.noDataHtml = "<span class='" + me.__getClass("noResult") + "'>抱歉，没有结果！</span>";
	},
	
	/**
	 * 设置层级
	 * @param {Object} level
	 */
	setLevel: function(level){
		this.level = level || this.level;
	},
	
	
	/**
	 * 还原
	 * @param {Object} id
	 */
	recover: function(id){
		var me = this;
		if (me.onRecover(id) !== false) {
			me.removeAddedWord(id);
			me.selectCombo.recover("id", id);
		}
	},
	
	onRecover: new Function,
	
	
	/**
	 * 重绘控件
	 */
	repaint: new Function()
};

ui.Base.derive(nirvanaUI.MaterialSelect);
ui.util.register('MaterialSelect', nirvanaUI.MaterialSelect);
