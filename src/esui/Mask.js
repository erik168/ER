/*
 * esui (ECOM Simple UI)
 * Copyright 2010 Baidu Inc. All rights reserved.
 *
 * path:    ui/Mask.js
 * desc:    页面遮盖控件
 * author:  zhaolei, erik, linzhifeng
 * date:    $Date$
 */

/**
 * 页面遮盖控件
 */
ui.Mask = (function() {
    var maskClass = 'ui-mask';
    var idPrefix = 'ctrlMask';

    /**
     * 遮盖层初始化
     *
     * @private
     */
    function init(level) {
        var id = idPrefix + level,
		    el = document.createElement('div');
        
        el.id = id;
        document.body.appendChild(el);
    }

    /**
     * 重新绘制遮盖层的位置
     *
     * @private
     * @param {HTMLElement} mask 遮盖层元素.
     */
    function repaintMask(mask) {
        var width = Math.max(
                        document.documentElement.clientWidth,
                        Math.max(
                            document.body.scrollWidth,
                            document.documentElement.scrollWidth)),
            height = Math.max(
                        document.documentElement.clientHeight,
                        Math.max(
                            document.body.scrollHeight,
                            document.documentElement.scrollHeight));

        mask.style.width = width + 'px';
        mask.style.height = height + 'px';
    }

    /**
     * 页面大小发生变化的事件处理器
     *
     * @private
     */
    function getResizeHandler(level) {
        return function () {
		    repaintMask(getMask(level));
        };
    }

    /**
     * 获取遮盖层dom元素
     *
     * @private
     * @return {HTMLElement} 获取到的Mask元素节点.
     */
    function getMask(level) {
        var id = idPrefix + level;
        var mask = baidu.g(id);

        if (!mask) {
            init(level);
        }

        return baidu.g(id);
    }
	
    var resizeHandlerMap = {};
    return {
        /**
         * 显示遮盖层
         */
        'show': function(level, type) {
            level = level || '0';
            var mask = getMask(level),
                clazz = [];
            
            clazz.push(maskClass);
            clazz.push(maskClass + '-level-' + level);
			if (type) {
                clazz.push(maskClass + '-' + type);
            }
            
            repaintMask(mask);

            mask.className = clazz.join(' ');
            mask.style.display = 'block';

            var resizeHandler = getResizeHandler(level);
            resizeHandlerMap[level] = resizeHandler;
			baidu.on(window, 'resize', resizeHandler);            
        },

        /**
         * 隐藏遮盖层
         */
        'hide': function (level) {
            level = level || '0';
			var mask = getMask(level);
            if ('undefined' != typeof mask) {
                mask.style.display = 'none';

                var resizeHandler = resizeHandlerMap[level];
				baidu.un(window, 'resize', resizeHandler);
            }
        }
    };
})();

