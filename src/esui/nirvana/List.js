/*
 * Nirvana UI
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    nirvana/List.js
 * desc:    列表操作控件
 * author:  zhouyu
 * date:    $Date: 2011-01-31 22:52:25 +0800 (一, 31  1 2011) $
 */

/**
 * 
 * 列表操作控件
 * 
 * 注意： 列表中的内容可以传入html标签，以便控制内容的样式，故需要转义的内容必须在控件外做处理
 * 
 * @param {Object} options  options 控件初始化参数(content)
 */
nirvanaUI.List = function (options) {
    this.__initOptions(options);
    this._type = 'list';

	this.key = "value";//value的默认键值
};

nirvanaUI.List.prototype = {
	tplList: '<div autostate={2}  class="{0}"{6}>' +
				'<div>{1}</div>' +
				'<div class="{3}" isdel={4}>{5}</div>' +
			 '</div>',

	tplNoTipList: '<div autostate={2}  class="{0}"{3}>' +
					'<div>{1}</div>' +
			 	  '</div>',
	/**
	 * 渲染控件
	 * @param {Object} main 控件挂载的DOM
	 */
	render: function(main){
        var me = this;
        var len = me.content ? me.content.length : 0;
        var html = [];
        ui.Base.render.call(me, main, false);
        if (len > 0) {
            for (var i = 0; i < len; i++) {
                html.push(me.formatHtml(me.content[i]));
            }
        }
        this._main.innerHTML += html.join("");
        me.bindEvent();
        me.isRendered = true;
	},
	
	/**
	 * 格式化一行内容
	 * @param {Object} line 要增加的内容
	 * line结构：
	 * {
	 *  classname:单行样式
	 *  html：要填充的内容
	 *  key:键名，默认为"value"
	 *  value:键值
	 *  tip:内容后的提示语
	 *  	{
	 *  		content:提示内容
	 *  		tipClass:提示语的样式
	 *  		isDel:是否在tip上绑定点击删除节点事件
	 *  	}
	 *  autoState:是否在mouseover和mouseout时切换样式
	 * }
	 */
	formatHtml: function(line){
		var me = this;
		var lineHtml = "";
		var keyValue = "";
		if (typeof(line.value) != "undefined") {
			var key = line.key ? line.key : me.key;
			keyValue = " " + key + "=" + line.value;
		}
		if (line.tip) {
			lineHtml = ui._format(me.tplList, 
								line.classname || '', 
								line.html, 
								line.autoState || false,
								line.tip.tipClass || '', 
								line.tip.isDel || false, 
								line.tip.content || '',
								keyValue
								);
		}
		else{
			lineHtml = ui._format(me.tplNoTipList, 
								line.classname || '', 
								line.html, 
								line.autoState || false,
								keyValue
								);
		}
		return lineHtml;
	},
	
	
	/**
	 * 增加一行内容 
	 * @param {Object} line 要增加的内容
	 */
	add: function(line){
		this._main.innerHTML += this.formatHtml(line);
	},
	
	
	/**
	 * 获取单行value值
	 * @param {Object} target 单行对象
	 * @param {Object} key value键名
	 */
	getItemValue: function(target, key) {
		key = key || this.key;
		return target.getAttribute(key);
	},
	
	
	/**
	 * 获取list中所有对象的value值
	 * @param {Object} key value键名
	 */
	getValue: function(key){
		var me = this,
			main = me._main,
			key = key || me.key,
			children = main.childNodes;

		var value = [];
		for(var i = 0,l = children.length; i < l ; i++){
			value.push(children[i].getAttribute(key));
		}
		return value;
	},
	
	ondelete: new Function(),
	
	/**
	 * 绑定事件
	 */
	bindEvent: function(){
        var main = this._main;
		main.onmouseover = this.mouseoverhandler();
		main.onmouseout = this.mouseouthandler();
		main.onclick = this.clickhandler();
	},
	
	/**
	 * 鼠标经过切换样式
	 */
	mouseoverhandler: function(){
		var me = this;
		return function(){
			var event = window.event || arguments[0], 
                target = event.srcElement || event.target;
			
			while (target && target.id != me._main.id) {
				if (target.getAttribute("autostate") == 'true') {
                    baidu.addClass(target, me.__getClass('line_over'));
					break;
				}
				else {
					target = target.parentNode;
				}
			}
		};
	},
	
	/**
	 * 鼠标离开移除切换样式
	 */
	mouseouthandler: function(){
		var me = this;
		return function(){
			var event = window.event || arguments[0], 
                target = event.srcElement || event.target;
			
			while (target && target.id != me._main.id) {
				if (target.getAttribute("autostate")  == 'true') {
                    if (baidu.dom.hasClass(target, me.__getClass('line_over'))) {
                        baidu.removeClass(target, me.__getClass('line_over'));
					}
					break;
				}
				else {
					target = target.parentNode;
				}
			}
		}
	},
	
	/**
	 * 删除一行内容
	 */
	clickhandler: function(){
		var me = this;
		return function(){
			var event = window.event || arguments[0], 
                target = event.srcElement || event.target;
			
			while (target && target.id != me._main.id) {
				if (target.getAttribute("isdel")) {
					var parent = target.parentNode;
					if (me.ondelete(parent)) {
						me.main.removeChild(parent);
					}
					break;
				}
				else {
					target = target.parentNode;
				}
			}
		}
	},
	
	/**
     * 释放
     * 
     */
    dispose: function () {
		var main = this._main;
		main.onmouseover = null;
		main.onmouseout = null;
		main.onclick = null;
        ui.Base.dispose.call(this);
    }
}

ui.Base.derive(nirvanaUI.List);
ui.util.register('List', nirvanaUI.List);
