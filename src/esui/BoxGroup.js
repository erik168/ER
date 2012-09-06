/*
 * ESUI (Enterprise Simple UI)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    esui/BoxGroup.js
 * desc:    选项组类
 * author:  zhaolei, erik
 */

///import esui.util;

/**
 * 选项组
 * 
 * @class
 * @description 
 *      该对象不往DOM上画东西，只做一些全选、反选、取值的事情
 * 
 * @param {Object} options 参数
 */
esui.BoxGroup = function( options ) {
    this.name     = options.name;
    this.type     = options.type;
    this.control  = options.control;
};

esui.BoxGroup.prototype = {
    /**
     * 获取选项组选中的值
     * 
     * @public
     * @return {string}
     */
    getValue: function() {
        var me      = this,
            boxs    = me.getBoxList(),
            len     = boxs.length,
            re      = [],
            i       = 0,
            box;
        
        for ( ; i < len; i++ ) {
            box = boxs[ i ];
            if ( box.isChecked() ) {
                re.push( box.getValue() );
            }
        }
        
        return re.join( ',' );
    },
    
    /**
     * 对选项组下所有选项进行全选
     * 
     * @public
     * @description 
     *      仅多选控件可用
     */
    selectAll: function() {
        if ( this.type != 'checkbox' ) {
            return;
        }

        var boxs    = this.getBoxList(),
            len     = boxs.length,
            i       = 0;
        
        for ( ; i < len; i++ ) {
            boxs[i].setChecked( true );
        }
    },
    
    /**
     * 对选项组下所有选项进行按值选中
     * 
     * @public
     * @param {Array} values
     */
    selectByValues: function(values) {
        var boxes   = this.getBoxList(),
            len     = boxes.length,
            i       = 0,
            box,
            v       = 0,
            vLen    = values.length;
        
        for ( i = 0 ; i < len; i++ ) {
            box = boxes[i];
            box.setChecked(false);
            value = box.getValue();
            for ( v = 0 ; v < vLen; v++) {
                if (value == values[v]) {
                    box.setChecked(true);
                    break;
                }
            }
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
        if ( this.type != 'checkbox' ) {
            return;
        }

        var boxs    = this.getBoxList(),
            len     = boxs.length,
            i       = 0,
            box;

        for ( ; i < len; i++ ) {
            box = boxs[ i ];
            box.setChecked( !box.isChecked() );
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
            name    = me.name,
            type    = me.type,
            result  = [],
            parent  = me.control.main,
            els,
            i,
            el,
            len,
            control;
        
        while ( parent 
                && parent.tagName != 'FORM' 
                && parent != document.body 
        ) {
            parent = parent.parentNode;
        }

        els = parent.getElementsByTagName( 'input' );
        len = els.length;
        for ( i = 0; i < len; i++ ) {
            el = els[ i ];
            control = esui.util.getControlByDom( el );
           
            if (control 
                && control instanceof esui.BoxControl
                && control.getType() == type 
                && control.name == name
            ) {
                result.push( control );
            }
        }
        
        return result;
    }
};
