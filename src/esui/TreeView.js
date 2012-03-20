/*
 * ESUI (Enterprise Simple UI)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    esui/TreeView.js
 * desc:    树结构显示控件
 * author:  chenjincai, linzhifeng, erik
 */


///import esui.Control;
///import baidu.lang.inherits;

/**
 * 树状控件
 * 
 * @param {Object} options 控件初始化参数
 */
esui.TreeView = function ( options ) {
    // 类型声明，用于生成控件子dom的id和class
    this._type = 'treeview';

    // 标识鼠标事件触发自动状态转换
    this._autoState = 0;

    esui.Control.call( this, options );

    // 是否点击展开的参数初始化
    this.__initOption('clickExpand', null, 'CLICK_EXPAND');
    
    // 是否选中展开的参数初始化
    this.__initOption('expandSelected', null, 'EXPAND_SELECTED');
   
    // 是否收起状态参数初始化
    this.__initOption('collapsed', null, 'COLLAPSED');
    
    // id与节点数据的内部表
    this._dataMap = {};
};

esui.TreeView.COLLAPSED = 0;

// 配置点击是否展开
esui.TreeView.CLICK_EXPAND = 1;

// 配置是否展开选中的节点
esui.TreeView.EXPAND_SELECTED = 0;

esui.TreeView.prototype = {
    /**
     * 渲染控件
     *
     * @protected
     */ 
    render: function () {
        var me = this;
        
        if ( !me._isRendered ) {
            esui.Control.prototype.render.call( me );
            me.width && (me.main.style.width = me.width + 'px');
            me._isRendered = 1;
        }

        me.main.innerHTML = me._getMainHtml();
    },
    
    /**
     * 获取主区域的html
     *
     * @private
     * @return {string}
     */
    _getMainHtml: function () {
        return this._getNodeHtml( this.datasource, !!this.collapsed, 0 );
    },
    
    /**
     * 获取子节点的html
     *
     * @private
     * @param {Array}   children 子列表数据
     * @param {boolean} hideChildren 是否隐藏子列表
     * @param {number}  level 当前节点层级
     * @return {string}
     */
    _getChildsHtml: function ( children, hideChildren, level ) {
        var me = this,
            htmlArr = [],
            i,
            len;

        for ( i = 0, len = children.length; i < len; i++ ) {
            htmlArr.push(
                '<li>' 
                + me._getNodeHtml( children[i], hideChildren, level + 1 ) 
                + '</li>' );
        }

        return htmlArr.join( '' );
    },

    /**
     * 节点的html模板
     * 
     * @private
     */
    _tplNode: '<div type="{0}" value="{4}" id="{2}" class="{1}" isExpanded="{8}" '
                + 'level="{9}" onclick="{10}" onmouseover="{11}" onmouseout="{12}">'
                    + '<div class="{5}" onclick="{13}">&nbsp;</div>'
                    + '<div class="{6}">&nbsp;</div>'
                    + '<div class="{7}">{3}'
                + '</div></div>',
    
    /**
     * 获取节点的html
     *
     * @private
     * @param {Object}  dataItem 数据项
     * @param {boolean} hideChildren 是否隐藏子列表
     * @param {number}  level 节点层级
     * @return {string}
     */
    _getNodeHtml: function ( dataItem, hideChildren, level ) {
        var levelNum = level;
        level = this._getLevelTag( level );

        var me = this,
            type            = dataItem.type,
            children        = me.getChildren( dataItem ),
            hasChildren     = children && children.length > 0,
            itemId          = me.getItemId( dataItem ),
            typeClass       = me.__getClass( 'node-type' ),
            iconClass       = me.__getClass( 'node-icon' ),
            clazz           = me._getNodeClass( 'node', level ),
            childClazz      = me._getNodeClass( 'children', level ),
            nodeId          = me.__getId( 'node' + itemId ),
            itemHTML        = me.getItemHtml( dataItem ),
            ref             = me.__getStrRef(),    
            childDisplay    = '',
            _hideChildren   = hideChildren,
            nodeType,
            html;
        
        
        this._dataMap[ itemId ] = dataItem;

        // 节点基础类型解析
        if ( hasChildren ) {
            nodeType = 'branch';
        } else {
            nodeType = 'leaf';
        }
        clazz += ' ' + me.__getClass( 'node-' + nodeType );
        if ( level == 'root' ) {
            _hideChildren = false;
        }
        
        // 节点用户定义类型解析
        if ( type ) {
            typeClass += ' ' + me.__getClass( 'node-type-' + type );
        }
        
        // 根据子节点数据判断当前节点和子节点的显示状态
        if ( _hideChildren ) {
            if ( hasChildren ) {
                childDisplay = ' style="display:none";';
            }
        } else {
            clazz += ' ' + me.__getClass( 'node-expanded' );
        }

        html = esui.util.format(
                me._tplNode,
                nodeType,
                clazz,
                nodeId,
                itemHTML,
                itemId,
                iconClass,
                typeClass,
                me.__getClass( 'node-text' ),
                _hideChildren ? '' : '1',
                levelNum,
                ref + '._nodeClickHandler(this)',
                ref + '._nodeOverHandler(this)',
                ref + '._nodeOutHandler(this)',
                ref + '._iconClickHandler(this)'
            );
        
        // 构造子节点的html
        if ( hasChildren ) {
            html += esui.util.format(
                '<ul id="{2}" value="{4}" class="{3}"{1}>{0}</ul>',
                me.getChildrenHtml( children, hideChildren, levelNum ),
                childDisplay,
                me.__getId( 'children' + itemId ),
                childClazz,
                itemId
            );
        }

        return html;
    },
    
    /**
     * 获取节点的样式class
     *
     * @private
     * @param {string}  part 节点的部分，node|children
     * @param {number}  level 节点层级
     * @return {string}
     */
    _getNodeClass: function( part, level ) {
        return this.__getClass( part ) + ' ' 
               + this.__getClass( part + '-' + level );
    },
    
    /**
     * 获取节点层级的文本标识
     *
     * @private
     * @param {number} level 节点层级
     * @return {string}
     */
    _getLevelTag: function ( level ) {
        if ( level === 0 ) {
            level = 'root';
        } else {
            level = "level" + level;
        }

        return level;
    },

    /**
     * 节点mouseover的handler
     *
     * @private
     */
    _nodeOverHandler: function ( node ) {
        if ( this.isDisabled() ) {
            return;
        }

        baidu.addClass( node, this.__getClass( 'node-hover' ) );
    },
    
    /**
     * 节点mouseout的handler
     *
     * @private
     */
    _nodeOutHandler: function ( node ) {
        if ( this.isDisabled() ) {
            return;
        }

        baidu.removeClass( node, this.__getClass( 'node-hover' ) );
    },
    
    /**
     * 展开图标点击的handler
     *
     * @private
     */
    _iconClickHandler: function ( iconElement ) {
        if ( this.isDisabled() ) {
            return;
        }

        var node = iconElement.parentNode;
        this._toggle( node );
        this._isPreventClick = 1;
    },
    
    /**
     * 节点点击的handler
     *
     * @private
     */
    _nodeClickHandler: function ( node ) {
        if ( this.isDisabled() ) {
            return;
        }

        var value = node.getAttribute( 'value' ),
            item  = this._dataMap[ value ];
        
        if ( !this._isPreventClick 
             && this.onchange( value, item ) !== false
         ) {
            this.select( value );
            if ( this.expandSelected ) {
                !node.getAttribute( 'isExpanded' ) && this._expand( node );
            } else if ( this.clickExpand ) {
                this._toggle( node );
            }
        }

        this._isPreventClick = 0;
    },
    
    onchange: new Function(),
    
    /**
     * 选中节点
     * 
     * @public
     * @param {string} id 节点id
     */
    select: function ( id ) {
        if ( this._selected == id ) {
            return;
        }
        
        var selectedClass = this.__getClass( 'node-selected' ),
            selectedNode = baidu.g( this.__getId( 'node' + this._selected ) );
        
        // 移除现有选中节点的样式
        selectedNode && baidu.removeClass( selectedNode, selectedClass );

        // 选择节点
        this._selected = id;
        baidu.addClass( this.__getId( 'node' + id ), selectedClass );
    },

    /**
     * 折叠展开操作
     * 
     * @private
     * @param {HTMLElement} node
     */
    _toggle: function ( node ) {
        if ( node.getAttribute( 'isExpanded' ) ) {
            this._collapse( node );
        } else {
            this._expand( node );
        }
    },
    
    /**
     * 折叠操作
     * 
     * @private
     * @param {HTMLElement} node
     */
    _collapse: function ( node ) {
        var value = node.getAttribute( 'value' );

        if ( this.oncollapse( value ) !== false ) {
            this.collapse( value );
        }
    },
    
    /**
     * 展开操作
     * 
     * @private
     * @param {HTMLElement} node
     */
    _expand: function ( node ) {
        var value = node.getAttribute( 'value' );

        if ( this.onexpand( value ) !== false ) {
            this.expand( value );
        }
    },

    oncollapse: new Function(),
    onexpand: new Function(),

    /**
     * 展开操作
     * 
     * @public
     * @param {string} id
     */
    expand: function ( id ) {
        var node        = baidu.g( this.__getId( 'node' + id ) );
        var childWrap   = baidu.g( this.__getId( 'children' + id ) );

        if ( node ) {
            node.setAttribute( 'isExpanded', '1' );
            childWrap && (childWrap.style.display = '');
            baidu.addClass( node, this.__getClass( 'node-expanded' ) );
        }
    },
    
    /**
     * 折叠操作
     *
     * @public
     * @param {string} id
     */
    collapse: function ( id ) {
        var node        = baidu.g( this.__getId( 'node' + id ) );
        var childWrap   = baidu.g( this.__getId( 'children' + id ) );
        
        if ( node ) {
            node.setAttribute( 'isExpanded', '' );
            childWrap && (childWrap.style.display = 'none');
            baidu.removeClass( node, this.__getClass( 'node-expanded' ) );
        }
    },
    
    /**
     * 重绘节点本身
     *
     * @public
     * @param {Object} dataItem
     */
    repaintNodeText: function( dataItem ) {
        var me          = this,
            itemId      = me.getItemId( dataItem ),
            itemHtml    = me.getItemHtml( dataItem ),
            nodeEl      = baidu.g( me.__getId( 'node' + itemId ) );
        
        if ( itemHtml ){
            nodeEl.lastChild.innerHTML = itemHtml;
        }
    },

    /**
     * 重绘节点及其子树
     *
     * @public
     * @param {Object} dataItem
     */    
    repaintNode: function ( dataItem ) {
        var me          = this,
            itemId      = me.getItemId( dataItem ),
            children    = me.getChildren( dataItem ),
            nodeEl      = baidu.g( me.__getId( 'node' + itemId ) ),
            childrenId  = me.__getId( 'children' + itemId ),
            childrenEl  = baidu.g( childrenId ),
            leafClass   = me.__getClass( 'node-leaf' ),
            branchClass = me.__getClass( 'node-branch' ),
            level       = parseInt( nodeEl.getAttribute( 'level' ), 10 );
        
        // 刷新节点文字
        this.repaintNodeText( dataItem );
        
        // 绘制子节点
        if ( children instanceof Array && children.length ) {
            // 创建子节点容器元素
            if ( !childrenEl ) {
                childrenEl = document.createElement( 'ul' );
                childrenEl.id = childrenId;
                childrenEl.style.display = nodeEl.getAttribute( 'isExpanded' ) ? '' : 'none';
                childrenEl.className = me._getNodeClass( 'children', this._getLevelTag( level ) );
                nodeEl.parentNode.insertBefore( childrenEl, nodeEl.nextSibling );
            }

            childrenEl.innerHTML = me.getChildrenHtml( children, 1, level );
            baidu.addClass( nodeEl, branchClass );
            baidu.removeClass( nodeEl, leafClass );
            nodeEl.setAttribute( 'type', 'branch' );
        } else {
            baidu.removeClass( nodeEl, branchClass );
            baidu.addClass( nodeEl, leafClass );
            nodeEl.setAttribute( 'type', 'leaf' );
        }
    },

    /**
     * 获取单条节点的子节点html
     *
     * @public
     * @return {Array}
     */
    getChildrenHtml: function ( children, hideChildren, level ) {
        return this._getChildsHtml( children, hideChildren, level );
    },

    /**
     * 获取单条节点的子节点数据
     *
     * @public
     * @param {Object} item 当前节点的数据项
     * @return {Array}
     */
    getChildren: function ( item ) {
        return item.children || [];
    },

    /**
     * 获取单条节点的html
     *
     * @public
     * @param {Object} item 当前节点的数据项
     * @return {Array}
     */
    getItemHtml: function ( item ) {
        return item.text;
    },
    
    /**
     * 获取单条节点的唯一id
     *
     * @public
     * @param {Object} item 当前节点的数据项
     * @return {string}
     */
    getItemId: function ( item ) {
        if ( esui.util.hasValue( item.id ) ) {
            return item.id;
        }

        return esui.util.getGUID();
    }
}

baidu.inherits( esui.TreeView, esui.Control );
