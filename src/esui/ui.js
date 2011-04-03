/*
 * esui (ECOM Simple UI)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    ui/ui.js
 * desc:    ui控件基础
 * author:  erik
 * date:    2011/01/19
 */

/**
 * 声明ui namespace
 */
var ui = {
    config: {
        ELEMENT_TAG: 'ui'
    },

    dispose: function (id) {
        ui.util.dispose(id);
    },

    get: function (id) {
        return ui.util.get(id);
    },

    init: function (wrap) {
        return ui.util.init(wrap);
    }
};

ui._format = function (source, opts) {
    source = String(source);
    
    if ('undefined' != typeof opts) {
        if ('[object Object]' == Object.prototype.toString.call(opts)) {
            return source.replace(/\$\{(.+?)\}/g,
                function (match, key) {
                    var replacer = opts[key];
                    if ('function' == typeof replacer) {
                        replacer = replacer(key);
                    }
                    return ('undefined' == typeof replacer ? '' : replacer);
                });
        } else {
            var data = Array.prototype.slice.call(arguments, 1),
                len = data.length;
            return source.replace(/\{(\d+)\}/g,
                function (match, index) {
                    index = parseInt(index, 10);
                    return (index >= len ? match : data[index]);
                });
        }
    }
    
    return source;
};

ui._hasValue = function (value) {
    return typeof value != 'undefined' && value !== null;
};
    
/**
 * UI组件功能库
 */
ui.util = function () {
    var container = {},
        componentMap = {};
    
    var uid = 0;
    function getUID() {
        return '_innerui_' + (uid++);
    }
    
    /**
     * 初始化控件渲染
     * 
     * @public
     * @param {HTMLElement} wrap 渲染的区域容器元素
     * @param {Object} propMap 控件附加属性值
     * @param {Function} opt_attrReplacer 属性替换函数
     * @return {Object} 控件集合
     */
    function init(wrap, propMap, opt_attrReplacer) {
        propMap = propMap || {};
        
        // 容器为空的判断
        wrap = wrap || document.body;
        
        var elements = wrap.getElementsByTagName('*'),
            realEls = [],
            attrs, attrStr, attrArr, attrArrLen,
            attr, attrValue, attrItem, extraAttrMap,
            i, len, key, el, uis = {};
        
        // 把dom元素存储到临时数组中
        // 控件渲染的过程会导致elements的改变
        for (i = 0, len = elements.length; i < len; i++) {
            realEls.push(elements[i]);
        }
        
        // 循环解析自定义的ui属性并渲染控件
        // <div ui="type:UIType;id:uiId;..."></div>
        for (i = 0, len = realEls.length; i < len; i++) {
            el = realEls[i];
            attrStr = el.getAttribute(ui.config.ELEMENT_TAG || 'ui');
            
            if (attrStr) {
                // 解析ui属性
                attrs = {};
                attrArr = attrStr.split(';');
                attrArrLen = attrArr.length;

                while (attrArrLen--) {
                    // 判断属性是否为空
                    attrItem = attrArr[attrArrLen];
                    if (!attrItem) {
                        continue;
                    } 
                    
                    // 获取属性
                    attrSegment = attrItem.split(':');
                    attr = attrSegment[0];
                    attrValue = attrSegment[1];
                    attrs[attr] = attrValue;
                }
                
                // 创建并渲染控件
                var objId = attrs['id'];
                if ( !objId ) {
                    objId = getUID();
                    attrs['id'] = objId;
                }
                
                extraAttrMap = propMap[objId];
                
                // 将附加属性注入
                for (key in extraAttrMap) {
                    attrs[key] = attrs[key] || extraAttrMap[key];
                }
                
                // 解析属性替换
                if ( 'function' == typeof opt_attrReplacer ) {
                    opt_attrReplacer(attrs);
                }
                
                // 渲染控件
                uis[objId] = create(attrs['type'], attrs, el);
                el.setAttribute('ui', '');
            }
        }
        
        return uis;
    }
    
    /**
     * 获取控件对象
     * 
     * @public
     * @param {Object} id 控件id
     * @return {Object}
     */
    function get(id) {
        return container[id] || null;
    }
    
    /**
     * 创建控件对象
     * 
     * @public
     * @param {string} type 控件类型
     * @param {Object} options 控件初始化参数
     * @param {HTMLElement} main 控件主元素
     * @return {Object} 创建的控件对象
     */
    function create(type, options, main) {
        var uiClazz = componentMap[type] || ui[type],
            id = options.id,
            uiObj = null;

        if (id && uiClazz) {
            uiObj = new uiClazz(options); 
            if (main) {
                uiObj.render(main);
            }
            container[id] = uiObj;
        }
        
        return uiObj;
    }
    
    /**
     * 释放控件对象
     * 
     * @public
     * @param {string|Object} id 控件id
     */
    function dispose(id) {
        if (id) {
            var control = id;
            if (typeof id == 'string') {
                control = container[id];
            }
            
            if (control && control.__ui__) {
                id = control.id;
                control.dispose();
                delete container[id];
            }
        } else {
            for (var key in control) {
                dispose(key);
            }
        }
    }
    
    /**
     * 注册组件
     * 
     * @public
     * @param {string} name 组件名
     * @param {Function} component 组件
     */
    function register(name, component) {
        componentMap[name] = component;
    }
    
    return {
        init     : init,
        get      : get,
        create   : create,
        dispose  : dispose,
        register : register,
        validate : new Function(),
        
        /**
         * 寻找dom元素所对应的控件
         * 
         * @public
         * @param {HTMLElement} dom dom元素
         * @return {Object}
         */
        getControlByDom: function (dom) {
            if (!dom) {
                return;
            }
            
            var controlId;
            if ((controlId = dom.getAttribute('control'))) {
                return get(controlId);
            }

            return null;
        },

        /**
         * 寻找dom元素下的控件集合
         * 
         * @public
         * @param {HTMLElement} container 要查找的容器元素
         * @return {Object}
         */
        getControlMapByContainer: function (container) {
            var els = container.getElementsByTagName('*'),
                len = els.length,
                controlName,
                result = {};
                
            while (len--) {
                controlName = els[len].getAttribute('control');
                if (controlName) {
                    result[controlName] = ui.util.get(controlName);
                }
            }
            
            return result;
        },
        
        /**
         * 改变form控件的disable状态
         * 
         * @public
         * @param {HTMLElement} container 容器元素
         * @param {boolean} disabled disable状态
         */
        disableFormByContainer: function (container, disabled) {
            var controlMap = ui.util.getControlMapByContainer(container),
                key, control;
                
            for (var key in controlMap) {
                control = controlMap[key];
                if (control['__ui-input__'] && control.disable) {
                    control.disable(disabled);
                }
            }
            
            return controlMap;
        }
    };
}();

baidu.on(window, 'unload', function () {
    ui.util.dispose();
});

