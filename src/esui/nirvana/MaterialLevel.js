/*
 * Nirvana UI
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    nirvana/MaterialLevel.js
 * desc:    物料层级控件
 * author:  zhouyu
 * date:    2010/12/23
 */
/**
 * 物料层级
 * 
 * @param {Object} options 控件初始化参数
 * 
 * material:
 * [
 * {
 *  level:0,
 *  id : id,
 *  type :type // 计划？单元？...
 *  word:"字面",
 *  click:Fun
 * },
 *...
 * ],
 * space://间隔符
 */
nirvanaUI.MaterialLevel = function (options) {
    this.__initOptions(options);
    this._type = 'materiallevel';
    
    this.material = this.material || [{
        level:0,
        word:"",
        click: function() {
            alert("让你懒，烦死你！");
        }
    }];
//    this.sumLevel = this.material.length;
//    this.currentLevel = (this.sumLevel - 1) || 0;
    this.space = this.space || ">>";
    
};

nirvanaUI.MaterialLevel.prototype = {
    /**
     * 渲染控件
     * @param {Object} main 挂载控件的DOM
     */
    render: function(main){
        var me = this;
        
        if (main) {
            ui.Base.render.call(me, main, true);
        }
        me._main.innerHTML = me.getMainHtml();
        me._main.onclick = me.clickHandler();
    },
    
    /**
     * 填充html
     */
    getMainHtml: function(){
        var me = this,
            mat,level,word,title,
            threshLen = 14,
            html = [],
            id = "",
            type = "",
            tempClass,
            len = me.material.length;

        for (var i = 0; i < len; i++) {
            mat = me.material[i];
            level = mat.level;
            
            title = escapeQuote(mat.word);
            word = baidu.string.decodeHTML(mat.word); //从table中传过来的值经过encode编码
            
            if (baidu.string.getByteLength(word) > threshLen) {
                word = baidu.string.subByte(word, threshLen) + "..";
            }
            word = baidu.string.encodeHTML(word);
            
            id = mat.id ? " id = " + mat.id : '';
            type = mat.type ? " type = " + mat.type : '';

            if (i != 0) {
                html.push('&nbsp;<span class="' + me.__getClass("space") + '">' + me.space + '</span>&nbsp;');
            }
            if (i == level) {
                switch(level){
                case 0:
                    html.push('<i>账户:</i>');
                    break;
                
                case 1:
                    html.push('<i>计划:</i>');
                    break;
                
                case 2:
                    html.push('<i>单元:</i>');
                    break;
                }
                
                tempClass = me.__getClass("lastword");
                if (i != len - 1) {
                    tempClass = me.__getClass("word");
                }
                html.push(
                    '<span level="',
                    level + '"' + id + type,
                    ' class="' + tempClass,
                    '" title="' + title + '">',
                    word + '</span>');
            } else {
                alert("出错啦！！！");
            }
        }
        return html.join("");
    },
    
    /**
     * 获取当前层级
     */
    getLevel: function(){
        return this.material.length;
    },
    
    /**
     * 增加层级
     * @param {Object} mat
     */
    add: function(mat){
        var me = this;
    //    me.currentLevel += 1;
    //    me.sumLevel += 1;
        me.material.push(mat);
        me.render();
    },
    
    onselect: new Function(),
    
    /**
     * 点击事件
     */
    clickHandler: function(){
        var me = this;
        return function(){
            var e = window.event || arguments[0],
                target = e.target || e.srcElement;

            while(target && target.id != me.main.id){
                if (baidu.dom.hasClass(target, me.__getClass("word"))) {
                    var level = target.getAttribute("level"), 
                        id = target.getAttribute("id");

                    if (id) {
                        me.changeLevel(level, id);
                    }
                    else {
                        me.changeLevel(level);
                    }
                    return;
                }
                else {
                    target = target.parentNode;
                }
            }
        }
    },
    
    
    changeLevel: function(level,id){
        var me = this;
    //    me.currentLevel = level;
        var len = me.material.length,
            click = me.material[level]["click"],
            start = +level + 1,
            num = len -(+level) -1;
        me.material.splice(start,num);
    //    me.sumLevel = +me.currentLevel + 1;
    //    me.material.length = me.sumLevel;
        me.render();
        if(click){
            if (id) {
                click(id);
            }
            else {
                click();
            }
        }
        me.onselect(level);
    },
    
    dispose: function(){
        if (this._main) {
            this._main.onclick = null;
        }

        ui.Base.dispose.call(this);
    }
};

ui.Base.derive(nirvanaUI.MaterialLevel);
ui.util.register('MaterialLevel', nirvanaUI.MaterialLevel);
