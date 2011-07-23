/*
 * ESUI (Enterprise Simple UI)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    esui/util.js
 * desc:    控件实用方法
 * author:  erik
 */

///import esui.config;
///import esui.Control;
///import baidu.event.on;
    
/**
 * UI组件功能库
 *
 * @static
 * @private
 */
esui.util = function () {
    var container    = {};
    var componentMap = {};
    var guid         = 0;

    return {
        /**
         * 初始化控件渲染
         * 
         * @public
         * @param {HTMLElement} opt_wrap 渲染的区域容器元素
         * @param {Object}      opt_propMap 控件附加属性值
         * @param {Function}    opt_attrReplacer 属性替换函数
         * @return {Object} 控件集合
         */
        init: function ( opt_wrap, opt_propMap, opt_attrReplacer ) {
            opt_propMap = opt_propMap || {};
            
            // 容器为空的判断
            opt_wrap = opt_wrap || document.body;
            
            var elements = opt_wrap.getElementsByTagName( '*' );
            var uiAttr = esui.config.UI_ATTRIBUTE || 'ui';
            var realEls = [];
            var attrs, attrStr, attrArr, attrArrLen;
            var attr, attrValue, attrItem, extraAttrMap;
            var i, len, key, el, uis = {};
            
            // 把dom元素存储到临时数组中
            // 控件渲染的过程会导致elements的改变
            for ( i = 0, len = elements.length; i < len; i++ ) {
                realEls.push( elements[ i ] );
            }
            
            // 循环解析自定义的ui属性并渲染控件
            // <div ui="type:UIType;id:uiId;..."></div>
            for ( i = 0, len = realEls.length; i < len; i++ ) {
                el = realEls[ i ];
                attrStr = el.getAttribute( uiAttr );
                
                if ( attrStr ) {
                    // 解析ui属性
                    attrs       = {};
                    attrArr     = attrStr.split(';');
                    attrArrLen  = attrArr.length;

                    while ( attrArrLen-- ) {
                        // 判断属性是否为空
                        attrItem = attrArr[ attrArrLen ];
                        if ( !attrItem ) {
                            continue;
                        } 
                        
                        // 获取属性
                        attrSegment = attrItem.split( ':' );
                        attr        = attrSegment[ 0 ];
                        attrValue   = attrSegment[ 1 ];
                        attrs[attr] = attrValue;
                    }
                    
                    // 主元素参数初始化
                    attrs.main = el;

                    // 创建并渲染控件
                    var objId = attrs[ 'id' ];
                    if ( !objId ) {
                        objId = esui.util.getGUID();
                        attrs[ 'id' ] = objId;
                    }
                    
                    extraAttrMap = opt_propMap[ objId ];
                    
                    // 将附加属性注入
                    for ( key in extraAttrMap ) {
                        attrs[ key ] = attrs[ key ] || extraAttrMap[ key ];
                    }
                    
                    // 解析属性替换
                    if ( 'function' == typeof opt_attrReplacer ) {
                        opt_attrReplacer( attrs );
                    }
                    
                    // 渲染控件
                    uis[ objId ] = esui.util.create( attrs[ 'type' ], attrs );
                    el.setAttribute( uiAttr, '' );
                }
            }
            
            return uis;
        },
        
        /**
         * 获取控件对象
         * 
         * @public
         * @param {string} id 控件id
         * @return {esui.Control}
         */
        get: function ( id ) {
            return container[ id ] || null;
        },

        /**
         * 创建控件对象
         * 
         * @public
         * @param {string} type 控件类型
         * @param {Object} options 控件初始化参数
         * @return {esui.Control} 创建的控件对象
         */
        create: function ( type, options ) {
            options = options || {};

            var uiClazz = componentMap[ type ] || esui[ type ],
                id      = options.id,
                uiObj   = null;

            if ( id && uiClazz ) {
                uiObj = new uiClazz( options ); 
                if ( options.main ) {
                    uiObj.render();
                }
            }
            
            return uiObj;
        },

        /**
         * 销毁控件
         * 
         * @public
         * @param {esui.Control|string} ctrl 控件或控件id
         */
        dispose: function ( ctrl ) {
            if ( ctrl ) {
                var control = ctrl;
                if ( typeof ctrl == 'string' ) {
                    control = container[ ctrl ];
                }
                
                if ( control && control instanceof esui.Control ) {
                    id = control.id;
                    control.__dispose();
                    delete container[ id ];
                }
            } else {
                for ( var key in container ) {
                    esui.util.dispose( key );
                }
            }
        },
        
        /**
         * 注册控件
         * 
         * @public
         * @param {string} name 控件名
         * @param {Function} component 控件类
         */
        register: function ( name, component ) {
            componentMap[ name ] = component;
        },

        validate : new Function(),
        
        /**
         * 寻找dom元素所对应的控件
         * 
         * @public
         * @param {HTMLElement} dom dom元素
         * @return {esui.Control}
         */
        getControlByDom: function ( dom ) {
            if ( !dom ) {
                return;
            }
            
            var controlId;
            if ( ( controlId = dom.getAttribute( 'data-control' ) ) ) {
                return esui.util.get( controlId );
            }

            return null;
        },

        /**
         * 寻找dom元素下的控件集合
         * 
         * @public
         * @param {HTMLElement} container 要查找的容器元素
         * @return {Array}
         */
        getControlsByContainer: function ( container ) {
            var els = container.getElementsByTagName( '*' );
            var len = els.length;
            var controlName;
            var result = [];
                
            while ( len-- ) {
                controlName = els[ len ].getAttribute( 'data-control' );
                if ( controlName ) {
                    result.push( esui.util.get( controlName ) );
                }
            }
            
            return result;
        },
        
        /**
         * 改变Input控件的disable状态
         * 
         * @public
         * @param {HTMLElement} container 容器元素
         * @param {boolean} disabled disable状态
         */
        setDisabledByContainer: function ( container, disabled ) {
            var controlMap = esui.util.getControlMapByContainer( container );
            var key, control;
                
            for ( key in controlMap ) {
                control = controlMap[ key ];
                if ( control instanceof esui.Control ) {
                    control.setDisabled( disabled );
                }
            }
            
            return controlMap;
        },
        
        /**
         * 构造控件
         *
         * @public
         * @param {ecui.Control} control 控件实例
         */
        construct: function ( control ) {
            container[ control.id ] = control;
            control.__construct();
        },

        /**
         * 判断值不为空(null|undefined)
         * 
         * @public
         * @param {Any} value
         * @param {boolean}
         */
        hasValue: function ( value ) {
            return typeof value != 'undefined' && value !== null;
        },
        
        /**
         * 字符串格式化
         * 
         * @public
         * @param {string} source 原字符串
         * @param {Object|Array} opts 参数
         * @param {string}
         */
        format: function (source, opts) {
            source = String(source);
            
            if ( 'undefined' != typeof opts ) {
                if ( '[object Object]' == Object.prototype.toString.call( opts ) ) {
                    return source.replace( /\$\{(.+?)\}/g,
                        function ( match, key ) {
                            var replacer = opts[ key ];
                            if ( 'function' == typeof replacer ) {
                                replacer = replacer( key );
                            }

                            return ( 'undefined' == typeof replacer ? '' : replacer );
                        });

                } else {
                    var data = Array.prototype.slice.call(arguments, 1);
                    var len = data.length;

                    return source.replace( /\{(\d+)\}/g,
                        function ( match, index ) {
                            index = parseInt( index, 10 );
                            return ( index >= len ? match : data[index] );
                        });
                }
            }
            
            return source;
        },
        
        /**
         * 获取唯一id
         *
         * @public
         * @return {string}
         */
        getGUID: function () {
            return '_innerui_' + ( guid++ );
        }
    };
}();

// 窗口关闭时，释放所有控件
baidu.on( window, 'unload', function () {
    esui.util.dispose();
} );

