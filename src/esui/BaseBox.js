/*
 * esui (ECOM Simple UI)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    ui/BaseBox.js
 * desc:    选择框控件基类
 * author:  zhaolei, erik
 * date:    $Date$
 */

/**
 * 选择框控件基类
 * 
 * @description 不直接使用，供CheckBox和Radio继承
 * @param {Object} options 控件初始化参数
 */
ui.BaseBox = new Function();

ui.BaseBox.prototype = {
    '__ui-input-box__': 1,
    onclick: new Function(),
    
    /**
     * 获取控件类型，checkbox|radio
     * 
     * @public
     * @return {string}
     */
    getType: function () {
        return this._type;
    },

    /**
     * 设置选中状态
     * 
     * @public
     * @param {boolean} stat 状态
     */
    setChecked: function (stat) {
        this._main.checked = !!stat;
    },
    
    /**
     * 获取选中状态
     * 
     * @public
     * @return {boolean}
     */
    getChecked: function() {
        return this._main.checked;
    },
    
    /**
     * 设置box的不可用状态
     * 
     * @public
     */
    disable: function (disabled) {
        disabled = !!disabled;
        this._main.disabled = disabled;
        this.disabled = disabled;

        if (disabled) {
            this.setState('disabled');
        } else {
            this.removeState('disabled');
        }
    },
    
    /**
     * 将box设置为只读
     * 
     * @public
     */
    readOnly: function (readOnly) {
        this._main.disabled = readOnly;
        readOnly ? this.setState('readonly') : this.removeState('readonly');
    },
    
    /**
     * 获取分组
     * 
     * @public
     * @return {BoxGroup}
     */
    getGroup: function() {
        return new ui.BaseBox.Group({
                                group: this.formName, 
                                type: this._type
                            });
    },
    
    /**
     * 设置值
     * 
     * @public
     * @param {string} value
     */
    setValue: function(value) {
        this._main.setAttribute('value', value);
    },
    
    /**
     * 获取值
     * 
     * @public
     * @return {string}
     */
    getValue: function() {
        return this._main.getAttribute('value') || 'on';
    },
    
    /**
     * 渲染控件
     *
     * @public
     * @param {Object} main 控件挂载的DOM
     */
    render: function (main) {
        var me      = this,
            data    = me.datasource,
            dataType = typeof data,
            title,
            label,
            value;
        
        // 执行未初始化时的初始化
        if ( !me._isRender ) {
            if ( !main 
                 || main.tagName != me._wrapTag 
                 || main.getAttribute('type') != me._wrapType
            ) {
                return;
            }
            
            if ( !me.formName ) {
                me.formName = main.getAttribute('name');
            }
            
            ui.Base.render.call(me, main, true);
            main.onclick = me._getHandlerClick();

            // 插入点击相关的label
            title = main.title || me.getValue();
            if (title) {
                label = document.createElement('label');
                label.innerHTML = title;
                label.className = me.__getClass('label');
                baidu.setAttr(label, 'for', me.__getId());
                baidu.dom.insertAfter(label, main);
            }
        }
        
        // 重绘部分，设置checked和value
        if (me._main) {
            main            = me._main;

            me.disable ( !!me.disabled );
            me.value && me.setValue(me.value);
            value = me.getValue();

            if (dataType == 'string' || dataType == 'number') {
                me.setChecked(data == value);
            } else if (data instanceof Array) {
                me.setChecked(baidu.array.contains(data, value));
            }
            
            me._isRender = 1;
        }
    },
    
    /**
     * 获取click事件handler
     *
     * @protected
     */
    _getHandlerClick: function() {
        var me = this;
        return function (e) {
            if (!me.getState('disabled')) {
                me.onclick();
            }
        };
    },
    
    /**
     * 释放控件
     * 
     * @public
     */
    dispose: function () {
        if (this._main){
            this._main.onclick = null;
        }

        this.onclick = null;
        ui.Base.dispose.call(this);
    }
};

/**
 * 选项组
 * 
 * @description 
 *      该对象不往DOM上画东西，只做一些全选、反选、取值的事情
 * 
 * @param {Object} options 参数
 */
ui.BaseBox.Group = function(options) {
    this.group = options.group;
    this.type = options.type;
};

ui.BaseBox.Group.prototype = {
    /**
     * 获取选项组选中的值
     * 
     * @return {Array}
     */
    getValue: function() {
        var me      = this,
            boxs    = me.getBoxList(),
            len     = boxs.length,
            re      = [],
            i       = 0,
            box;
        
        for (; i < len; i++) {
            box = boxs[i];
            if (box.getChecked()) {
                re.push(box.getValue());
            }
        }
        
        return re;
    },
    
    /**
     * 对选项组下所有选项进行全选
     * 
     * @public
     * @description 
     *      仅多选控件可用
     */
    selectAll: function() {
        var me      = this,
            boxs    = me.getBoxList(),
            len     = boxs.length,
            i       = 0;
        
        if (me.type != 'checkbox') {
            return;
        }

        for (; i < len; i++) {
            boxs[i].setChecked(true);
        }
    },
    
    /**
     * 对选项组下所有选项进行反选
     * 
     * @public
     * @description 
     *      仅多选控件可用
     */
    selectInverse: function() {
        var me      = this,
            boxs    = me.getBoxList(),
            len     = boxs.length,
            i       = 0,
            box;
        
        if (me.type != 'checkbox') {
            return;
        }

        for (; i < len; i++) {
            var box = boxs[i];
            box.setChecked(!box.getChecked());
        }
    },
    
    /**
     * 获取选项组下的DOM元素列表
     * 
     * @public
     * @return {Array}
     */
    getBoxList: function() {
        var me      = this,
            group   = me.group,
            type    = me.type,
            els     = document.getElementsByTagName('INPUT'),
            len     = els.length,
            result  = [],
            i,
            el,
            control;
        
        for (i = 0; i < len; i++) {
            el = els[i],
            control = ui.util.getControlByDom(el);
           
            if (control 
                && control.getType 
                && control.getType() == type 
                && control.formName == group
            ) {
                result.push(control);
            }
        }
        
        return result;
    }
};
