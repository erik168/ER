/*
 * Nirvana UI
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    nirvana/SelectedList.js
 * desc:    已经选择的对象列表
 * author:  chenjincai
 * date:    2010/12/14
 */
 
nirvanaUI.SelectList = function (options) {
    this.__initOptions(options);
    this._type = 'selectedlist';

    if (!ui._hasValue(this.autoState)) {
        this.autoState = true;
    }

    this._controlMap = {};
}

nirvanaUI.SelectList.prototype = {
    initData: function () {
        var me = this;
        var data = me.datasource, 
            i = 0, 
            len = data.length, 
            listDataHtml = [], 
            item, 
            itemHtml, 
            itemTip = {
                content:'', 
                tipClass: 'ui_list_del', 
                isDel: true
            };

        for(; i < len; i++){
            item = data[i];
            itemHtml = ui._format(
                '<a href="" extraid="{0}" onclick="return false;">{1}</a>', 
                item.id, 
                autoEllipseText(item.name, 250)
            );
            listDataHtml.push({
                classname   :'ui_list_icontxt', 
                html        : itemHtml, 
                tip         : itemTip, 
                autoState   : me.autoState
            }); 
        }
        me.content = listDataHtml;
    },
    
    tplMain : '<div id="{0}"></div><div class="{2}"><a id="{1}" href="javascript:void(0);">+添加对象</a></div>',
    
    render : function (main) {
        var me = this;
        var listId = me.__getId('selectedList');
        me.initData();

        if (!me._controlMap.selectedList) {
            selectedList = ui.util.create('List', {
                'id': listId,
                'skin': 'reminder',
                'content': me.content,
                'beforeDel': me.beforeDel,
                'ondelete': me.getDeleteHander() 
            });

            me._controlMap.selectedList = selectedList;
        }

        ui.Base.render.call(me, main);
        if (!me.formName) {
            me.formName = main.getAttribute('name');
        }
        me._main.innerHTML = me.getMainHtml();
        me.renderList();
        
        baidu.g('selectedObjNum').innerHTML = me.datasource.length;
        
        baidu.g(me.__getId('addObj')).onclick =  me.getAddObjHandler();
    },
    
    /**
     * 获取控件的html
     * 
     * @private
     * @return {string}
     * @modify by zhouyu
     */
    getMainHtml: function () {
        var me = this;
        return ui._format(me.tplMain,
                            me.__getId('selected'),
                            me.__getId('addObj'),
                            me.__getClass('addWrapper'));
    },
    
    getAddObjHandler : function () {
        var me = this;
        return function () {
            me.onaddclick();
        };
    },
    
    
    
    renderList : function () {
        var me = this;
        me._controlMap["selectedList"].render(
            baidu.g(
                me.__getId("selected")));
    },
    
    
    
    beforeDel : function () {
        return window.confirm('你确定要删除此条信息吗？');
    },
    
    getDeleteHander : function () {
        var me = this;
        return function (lineEl) {
            var link    = lineEl.getElementsByTagName('a')[0],
                objId   = link.getAttribute('extraid'),
                data    = me.datasource, 
                len     = data.length, 
                i       = 0, 
                item, 
                deleteFlag;
            
            for (; i < len; i++) {
                item = data[i];
                if (item.id == objId) {
                    deleteFlag = i;
                }
            }
            
            if (typeof deleteFlag  != 'undefined') {
                data.splice(deleteFlag, 1);
                baidu.dom.remove(lineEl);
                baidu.g('selectedObjNum').innerHTML = data.length;
                if (me.deleteHandler) {
                    me.deleteHandler(objId);
                }
            }
        }
    },
    
    getValue : function () {
        var me = this,
            data = me.datasource;
        return data;
    },
    
    addItem : function (item) {
        var me = this,
            data  = me.datasouce;
            
        data = data.push(item);
        me.render(me._main);
    },
    
    disableAddLink : function (disable) {
        var id = this.__getId('addObj');
        baidu.g(id).style.color = disable ? '#999': '';
    }
    
};


ui.BaseInput.derive(nirvanaUI.SelectList);
ui.util.register('SelectList', nirvanaUI.SelectList);
