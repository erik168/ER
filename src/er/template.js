/*
 * ER (Enterprise RIA)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    er/template.js
 * desc:    简易的、基于html注释的模板支持
 * author:  erik, mytharcher
 */

///import er.config;
///import baidu.string.encodeHTML;

/**
 * 简易的模板解析器
 */
er.template = function () {
    var masterContainer = {},
        targetContainer = {},
        targetCache = {},

        // 过滤器
        filterContainer = {
            'html': function ( source ) {
                return baidu.string.encodeHTML( source );
            },
            
            'url': function ( source ) {
                return encodeURIComponent( source );
            }
        },
        isLoaded;

    /**
     * 解析模板变量的值
     * 
     * @inner
     * @param {string} varName 变量名
     * @param {string} filterName 过滤器名
     * @param {string} privateContextId 私用context环境的id
     * @return {string}
     */
    function parseVariable( varName, filterName, privateContextId ) {
        privateContextId = privateContextId || null;
        var match = varName.match( /:([a-z]+)$/ );
        var value = '';

        if ( match && match.length > 1 ) {
            value = parseVariableByType( varName.replace(/:[a-z]+$/i, ''), match[1] );
        } else {
            var variable = er.context.get( varName, { contextId: privateContextId } );
            if ( er._util.hasValue( variable ) ) {
                value = variable;
            }
        }
        
        // 过滤处理
        if ( filterName ) {
            filterName = filterContainer[ filterName.substr( 1 ) ];
            filterName && ( value = filterName( value ) );
        }

        return value;
    }
    
    /**
     * 解析带有类型的模板变量的值
     * 
     * @inner
     * @param {string} varName 变量名
     * @param {string} type 变量类型，暂时为lang|config
     * @return {string}
     */
    function parseVariableByType( varName, type ) {
        var packs           = varName.split('.'),
            len             = packs.length - 1,
            topPackageName  = packs.shift(),
            win             = window,
            objOnDef        = er._util.getConfig('DEFAULT_PACKAGE'),
            variable,
            objOnSelf,
            objOnBase;
        
        type = type.toLowerCase();

        // 多层示例假设: ${package.sub.test:lang}
        // 如果getConfig('DEFAULT_PACKAGE')的值为 "project"   
        // 查找对象:
        // project.package.sub.lang.test
        // package.sub.lang.test
        // lang.package.sub.test
        objOnDef && ( objOnDef = win[ objOnDef ] );               // object:project
        objOnSelf = win[ topPackageName ];                        // object:package
        objOnBase = win[ type ] && win[ type ][ topPackageName ]; // object:lang.package
        
        // 对于单层的值，如: ${test:lang}
        // 查找对象 project.lang.test 和 lang.test
        if ( len == 0 ) {
            objOnDef = objOnDef && objOnDef[ type ];
            return ( ( objOnDef && objOnDef[ topPackageName ] ) || objOnBase || '' );
        }
        
        objOnDef = objOnDef && objOnDef[ topPackageName ]; // object: project.package
        varName = packs.pop();
        len--;
        
        while ( len-- ) {
            variable = packs.shift();
            objOnDef = objOnDef && objOnDef[ variable ];
            objOnSelf = objOnSelf && objOnSelf[ variable ];
            objOnBase = objOnBase && objOnBase[ variable ];
        }
        
        objOnDef = objOnDef && objOnDef[ type ];    // object: project.package.sub.lang
        objOnSelf = objOnSelf && objOnSelf[ type ]; // object: package.sub.lang

        objOnDef = objOnDef && objOnDef[ varName ];    // object: project.package.sub.lang.test
        objOnSelf = objOnSelf && objOnSelf[ varName ]; // object: package.sub.lang.test
        objOnBase = objOnBase && objOnBase[ varName ]; // object: lang.package.sub.test

        if ( er._util.hasValue( objOnDef ) ) {
            return objOnDef;
        } else if ( er._util.hasValue( objOnSelf ) ) {
            return objOnSelf;
        } else if ( er._util.hasValue( objOnBase ) ) {
            return objOnBase;
        }
        
        return '';
    }
    
    /**
     * 获取节点对应的内容
     *
     * @inner
     * @param {Object} node 节点对象
     * @param {Object} target target节点对象，用于contentplaceholder替换
     * @return {string}
     */
    function getContent( node, opt_target ) {
        if ( node && typeof node == 'object' ) { 
            var list = node.content.slice(0);
            var len  = list instanceof Array && list.length;
            var segment;
            var temp;

            if ( len ) {
                while ( len-- ) {
                    segment = list[ len ];
                    
                    // 解析非文本节点
                    if ( typeof segment == 'object' ) {
                        temp = '';

                        switch ( segment.type ) {
                        // 解析import
                        case 'import':
                            temp = getTargetContent( segment.id );
                            break;

                        // 解析contentplaceholder
                        case 'contentplaceholder':
                            if ( opt_target ) {
                                temp = opt_target.contentMap[ segment.id ].content.join('');
                            }
                            break;
                        }

                        list[ len ] = temp;
                    }
                }
            }

            return list.join( '' );
        }

        return '';
    }
    
    /**
     * 获取target的内容
     *
     * @inner
     * @param {string} name target的名称
     * @return {string}
     */
    function getTargetContent( name ) {
        var targetStr = targetCache[ name ];
        var target;
        var len;
        var segment;
        var master;

        if ( targetStr ) {
            return targetStr;
        }

        target = targetContainer[ name ];
        if ( target ) {
            if ( target.master ) { 
                // target具有母版，以母版内容为解析源
                master = masterContainer[ target.master ];
                targetStr = getContent( master, target );
            } else { 
                // target不具有母版，则直接解析
                targetStr = getContent( target );
            }
            
            targetCache[ name ] = targetStr; // 缓存target内容结果
            return targetStr;
        }

        return '';
    }

    /**
     * 解析模板
     * 
     * @inner
     * @param {string} source 模板源
     */
    function parse( source ) {
        if ( typeof source != 'string' ) {
            return;
        }
        
        /**
         * 解析节点，如果是有含义的注释节点返回object
         *
         * @inner
         * @param {string} src 源字符串
         * @return {Object|string}
         */
        function parseNode( src ) {
            // 注释节点规则
            var rule = /^<!--\s*(\/)?(target|master|content|import|contentplaceholder)\s*(:\s*([a-z0-9_]+))?\s*(?:\(([^\)]+)\))?\s*-->$/i
            
            // 属性规则
            var propRule = /^\s*([0-9a-z_]+)\s*=\s*([0-9a-z_]+)\s*$/i;
            
            var node;
            var id;
            var propList;
            var propStr;
            var i, len;
            
            
            if ( rule.test( src ) ) {
                node = {};
                node.type = RegExp.$2.toLowerCase();
                
                if ( RegExp.$1 ) { 
                    // 结束标签不解析内容
                    node.endTag = 1;
                } else {
                    // 解析 ":id" 形式的id属性
                    id = RegExp.$4;
                    id && (node.id = id);
                    
                    // 解析 "(name=value,name2=value2)" 形式的其他属性
                    propStr = RegExp.$5;
                    if ( propStr ) {
                        propList = propStr.split(',');
                        for ( i = 0, len = propList.length; i < len; i++ ) {
                            if ( propRule.test( propList[ i ] ) ) {
                                node[ RegExp.$1.toLowerCase() ] = RegExp.$2;
                            }
                        }
                    }
                }

                return node;
            }
            
            // 无特殊含义字符串直接返回
            return src;
        } 

        var COMMENT_BEGIN = '<!--';
        var COMMENT_END = '-->';
        
        var len;

        var currentNode;        // 二次解析阶段的当前节点，可能为target或master
        var currentContent;     // 二次解析阶段的当前content节点

        var i;
        var str;
        var strLen;
        var node;

        // 一次解析阶段的结果字符串流，数组每项是text片段或comment片段
        var strStream = [];    
        
        // 一次解析阶段的结果指针，用于优化push的性能
        var strStreamPoint = 0; 
        
        // 对source以 <!-- 进行split
        var blocks = source.split( COMMENT_BEGIN );
        if ( blocks[0] === '' ) {
            blocks.shift();
        }
        len = blocks.length;
        
        // 开始第一阶段解析，生成strStream
        for ( i = 0; i < len; i++ ) {
            // 对 <!-- 进行split的结果
            // 进行 --> split
            // 如果split数组长度为2
            // 则0项为注释内容，1项为正常html内容
            str = blocks[ i ].split( COMMENT_END );
            strLen = str.length;

            if ( strLen == 2 || i > 0 ) {
                if ( strLen == 2 ) {
                    strStream[ strStreamPoint++ ] = COMMENT_BEGIN + str[ 0 ] + COMMENT_END;
                    strStream[ strStreamPoint++ ] = str[ 1 ];
                } else {
                    strStream[ strStreamPoint++ ] = str[ 0 ];
                }
            }
        }
        
        // 开始第二阶段解析
        // 将master和target分别存入container
        for ( i = 0; i < strStreamPoint; i++ ) {
            str = strStream[ i ];
            node = parseNode( str );

            switch ( typeof node ) {
            // 当parseNode结果为object时，针对node进行解析
            case 'object':
                switch ( node.type ) {
                case 'master':
                    currentNode = null;
                    currentContent = null;
                    if ( !node.endTag && node.id ) {
                        node.content = [];
                        currentNode = node;
                        masterContainer[ node.id ] = node;
                    }

                    break;

                case 'target':
                    currentNode = null;
                    currentContent = null;
                    if ( !node.endTag && node.id ) {
                        node.content = [];
                        if ( node.master ) {
                            node.contentMap = {};
                        }
                        currentNode = node;
                        targetContainer[ node.id ] = node;
                    }

                    break;

                case 'import':
                    if ( currentNode ) {
                        currentNode.content.push( node );
                    }

                    break;

                case 'content':
                    currentContent = null;

                    if ( 
                        !node.endTag 
                        && currentNode 
                        && currentNode.type == 'target' 
                    ) {
                        currentNode.content.push( node );
                        if ( node.id ) {
                            currentNode.contentMap[ node.id ] = node;
                        }
                        
                        node.content = [];
                        currentContent = node;
                    }
                    break;

                case 'contentplaceholder':
                    if ( currentNode && currentNode.type == 'master' ) {
                        currentNode.content.push( node );
                    }

                    break;
                }

                break;
            
            // 如果parseNode返回仍然为string
            // 将其填入当前正在解析的content或master或target中
            case 'string':
                if ( currentContent ) {
                    currentContent.content.push( str );
                } else if ( currentNode ) {
                    currentNode.content.push( str );
                }

                break;
            }
        }
    }

    // 返回暴露的方法
    return {
        /**
         * 添加过滤器
         * 
         * @public
         * @param {string} type 过滤器类型
         * @param {Function} filter 过滤器
         */
        addFilter: function ( type, filter ) {
            filterContainer[ type ] = filter;
        },

        /**
         * 获取指定模板target的HTML片段
         * 
         * @public
         * @param {string} name
         * @return {string}
         */
        get: getTargetContent,
        
        /**
         * 解析模板
         * 
         * @public
         * @param {string} source 模板源
         */
        parse: parse,
        
        /**
         * 合并模板与数据
         * 
         * @public
         * @param {HTMLElement} output  要输出到的容器元素
         * @param {string}      tplName 视图模板
         * @param {string}      opt_privateContextId 私用context环境的id
         */
        merge: function ( output, tplName, opt_privateContextId ) {
            if ( output ) {
                output.innerHTML = er.template.get( tplName ).replace(
                    /\$\{([.:a-z0-9_]+)\s*(\|[a-z]+)?\s*\}/ig,
                    function ( $0, $1, $2 ) {
                        return parseVariable( $1, $2, opt_privateContextId );
                    });
            }
        }
    };
}();