/*
 * ER (Enterprise RIA)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    er/template.js
 * desc:    简易的、基于html注释的模板支持
 * author:  erik, mytharcher
 * example:
 * <!-- target: targetName -->
 * <div>html fragment</div>
 * 
 * <!-- target: targetName2( master = masterName ) -->
 * <!-- content: header -->
 * title
 * <!-- content: content -->
 * <ul>
 *     <!-- for: ${list} as ${item} -->
 *         <li>${item}         
 *     <!-- /for -->
 * </ul>
 *
 * <!-- master: masterName -->
 * <div class="header">
 *     <!-- contentplaceholder: header -->
 * </div>
 * <div class="content">
 *     <!-- contentplaceholder: content -->
 * </div>
 * 
 */

///import er.config;
///import er.init;
///import baidu.string.encodeHTML;
///import baidu.string.trim;

/**
 * 简易的模板解析器
 */
er.template = function () {
    /**
     * 随手写了个栈
     *
     * @inner
     */
    function Stack() {
        this.container = [];
        this.index = -1;
    }

    Stack.prototype = {
        /**
         * 获取栈顶元素
         *
         * @return {Any}
         */
        current: function () {
            return this.container[ this.index ];
        },

        /**
         * 入栈
         *
         * @param {Any} elem
         */
        push: function ( elem ) {
            this.container[ ++this.index ] = elem;
        },

        /**
         * 出栈
         *
         * @return {Any}
         */
        pop: function () {
            if ( this.index < 0 ) {
                return null;
            }

            var elem = this.container[ this.index ];
            this.container.length = this.index--;

            return elem;
        },

        /**
         * 获取栈底元素
         *
         * @return {Any}
         */
        bottom: function () {
            return this.container[ 0 ];
        }
    };

    /**
     * 随手写了个数组作为buffer
     *
     * @inner
     */
    function ArrayBuffer() {
        this.raw = [];
        this.idx = 0;
    }

    ArrayBuffer.prototype = {
        /**
         * 添加元素到数组末端
         *
         * @param {Any} elem 添加项
         */
        push: function ( elem ) {
            this.raw[ this.idx++ ] = elem;
        },

        /**
         * 添加多个元素到数组末端
         */
        pushMore: function () {
            for ( var i = 0, l = arguments.length; i < l; i++ ) {
                this.push( arguments[ i ] );
            }
        },

        /**
         * 连接数组项
         *
         * @param {string} split 分隔串
         * @return {string}
         */
        join: function ( split ) {
            return this.raw.join( split );
        },

        /**
         * 获取源数组
         *
         * @return {Array}
         */
        getRaw: function () {
            return this.raw;
        }
    };

    /**
     * 随手写了个节点迭代器
     *
     * @inner
     * @param {Array} stream 节点流
     */
    function NodeIterator( stream ) {
        this.stream = stream;
        this.index  = 0;
    }

    NodeIterator.prototype = {
        /**
         * 下一节点
         *
         * @return {Object}
         */
        next: function () {
            return this.stream[ ++this.index ];
        },

        /**
         * 上一节点
         *
         * @return {Object}
         */
        prev: function () {
            return this.stream[ --this.index ];
        },

        /**
         * 当前节点
         *
         * @return {Object}
         */
        current: function () {
            return this.stream[ this.index ];
        }
    };

    function Scope( parent ) {
        this.context = {};
        this.parent  = parent;
    }

    Scope.prototype = {
        get: function ( name ) {
            var value = this.context[ name ];
            if ( !er._util.hasValue( value ) && this.parent ) {
                return this.parent.get( name );
            }

            if ( er._util.hasValue( value ) ) {
                return value;
            }

            return null;
        },

        set: function ( name, value ) {
            this.context[ name ] = value;
        }
    };

    // 节点类型声明
    var TYPE = {
        TEXT               : 1,
        TARGET             : 2,
        MASTER             : 3,
        IMPORT             : 4,
        CONTENT            : 5,
        CONTENTPLACEHOLDER : 6,
        FOR                : 7,
        IF                 : 8,
        ELIF               : 9,
        ELSE               : 10
    };

    // 命令注释规则
    var COMMENT_RULE = /^\s*(\/)?([a-z]+)(.*)$/i;
    
    // 属性规则
    var PROP_RULE = /^\s*([0-9a-z_]+)\s*=\s*([0-9a-z_]+)\s*$/i;
    
    // FOR标签规则
    var FOR_RULE = /^\s*:\s*\$\{([0-9a-z_.\[\]]+)\}\s+as\s+\$\{([0-9a-z_]+)\}\s*(,\s*\$\{([0-9a-z_]+)\})?\s*$/i;
    
    // IF和ELIF标签规则
    var IF_RULE = /^\s*:([>=<!0-9a-z$\{\}\[\]\(\):\s'"\.\|&_]+)\s*$/i;

    // 普通命令标签规则
    var TAG_RULE = /^\s*:\s*([a-z0-9_]+)\s*(?:\(([^)]+)\))?\s*$/i;

    // 条件表达式规则
    var CONDEXPR_RULE = /\s*(\!=?=?|\|\||&&|>=?|<=?|===?|['"\(\)]|\$\{[^\}]+\}|\-?[0-9]+(\.[0-9]+)?)/;

    // target和master存储容器
    var masterContainer = {};
    var targetContainer = {};

    // 过滤器
    var filterContainer = {
        'html': function ( source ) {
            return baidu.string.encodeHTML( source );
        },
        
        'url': function ( source ) {
            return encodeURIComponent( source );
        }
    };

    // 自动加载状态位
    var isLoaded;

    /**
     * 节点分析，返回节点流
     *
     * @inner
     * @return {Array}
     */
    function nodeAnalyse( source ) {
        var COMMENT_BEGIN = '<!--';
        var COMMENT_END   = '-->';
        
        var i;
        var len;
        var str;
        var strLen;
        var commentText;
        var nodeType;
        var nodeContent;
        var node;
        var propList;
        var propLen;

        // text节点内容缓冲区，用于合并多text
        var textBuf = new ArrayBuffer;

        // node结果流
        var nodeStream = new ArrayBuffer;    
        
        // 对source以 <!-- 进行split
        var texts = source.split( COMMENT_BEGIN );
        if ( texts[ 0 ] === '' ) {
            texts.shift();
        }

        /**
         * 将缓冲区中的text节点内容写入
         *
         * @inner
         */
        function flushTextBuf() {
            nodeStream.push( {
                type: TYPE.TEXT,
                text: textBuf.join( '' )
            } );
            textBuf = new ArrayBuffer;
        }

        /**
         * 抛出标签不合法错误
         *
         * @inner
         */
        function throwInvalid( type, text ) {
            throw type + ' is invalid: ' + text;
        }

        /**
         * 注释作为普通注释文本写入流，不具有特殊含义
         *
         * @inner
         */
        function beCommentText( text ) {
            textBuf.pushMore( COMMENT_BEGIN, text, COMMENT_END );
        }

        // 开始第一阶段解析，生成strStream
        for ( i = 0, len = texts.length; i < len; i++ ) {
            // 对 <!-- 进行split的结果
            // 进行 --> split
            // 如果split数组长度为2
            // 则0项为注释内容，1项为正常html内容
            str    = texts[ i ].split( COMMENT_END );
            strLen = str.length;

            if ( strLen == 2 || i > 0 ) {
                if ( strLen == 2 ) {
                    commentText = str[ 0 ];
                    if ( COMMENT_RULE.test( commentText ) ) {
                        // 将缓冲区中的text节点内容写入
                        flushTextBuf();
                        
                        // 节点类型分析
                        nodeType = RegExp.$2.toLowerCase();
                        nodeContent = RegExp.$3;
                        node = { type: TYPE[ nodeType.toUpperCase() ] };

                        if ( RegExp.$1 ) {
                            // 闭合节点解析
                            node.endTag = 1;
                            nodeStream.push( node );
                        } else {
                            switch ( nodeType ) {
                            case 'content':
                            case 'contentplaceholder':
                            case 'master':
                            case 'import':
                            case 'target':
                                if ( TAG_RULE.test( nodeContent ) ) {
                                    // 初始化id
                                    node.id = RegExp.$1;
                                
                                    // 初始化属性
                                    propList = RegExp.$2.split( /\s*,\s*/ );
                                    propLen = propList.length;
                                    while ( propLen-- ) {
                                        if ( PROP_RULE.test( propList[ propLen ] ) ) {
                                            node[ RegExp.$1 ] = RegExp.$2;
                                        }
                                    }
                                } else {
                                    throwInvalid( nodeType, commentText );
                                }

                                break;

                            case 'for':
                                if ( FOR_RULE.test( nodeContent ) ) {
                                    node.list  = RegExp.$1;
                                    node.item  = RegExp.$2;
                                    node.index = RegExp.$4;
                                } else {
                                    throwInvalid( nodeType, commentText );
                                }

                                break;

                            case 'if':
                            case 'elif':
                                if ( IF_RULE.test( RegExp.$3 ) ) {
                                    node.expr = condExpr.parse( RegExp.$1 );
                                } else {
                                    throwInvalid( nodeType, commentText );
                                }

                                break;

                            case 'else':
                                break;

                            default:
                                node = null;
                                beCommentText( commentText );
                            }

                            node && nodeStream.push( node );
                        }
                    } else {
                        // 不合规则的注释视为普通文本
                        beCommentText( commentText );
                    }

                    textBuf.push( str[ 1 ] );
                } else {
                    textBuf.push( str[ 0 ] );
                }
            }
        }
        
        
        flushTextBuf(); // 将缓冲区中的text节点内容写入
        return nodeStream.getRaw();
    }

    /**
     * 语法分析
     *
     * @inner
     * @param {Array} stream 构造单元流
     */
    var syntaxAnalyse = function () {
        var astParser = {};
        var targetCache;
        var masterCache;
        var analyseStack;
        var nodeIterator;

        /**
         * 弹出node
         *
         * @inner
         * @param {number} stopType 遇见则终止弹出的类型
         */
        function popNode( stopType ) {
            var current;

            while ( ( current = analyseStack.current() )
                    && current.type != stopType
            ) {
                analyseStack.pop();
            }

            return analyseStack.pop();
        }

        /**
         * 压入node
         *
         * @inner
         * @param {Object} node 节点
         */
        function pushNode( node ) {
            analyseStack.push( node );
        }

        /**
         * 获取错误提示信息
         *
         * @inner
         * @return {string}
         */
        function getError() {
            var node = analyseStack.bottom;
            return '[er template]' + node.type + ' ' + node.id 
                + ': unexpect ' + nodeIterator.current().type 
                + ' on ' + analyseStack.current().type;
        }

        /**
         * 根据类型解析抽象树
         *
         * @inner
         * @param {number} type 节点类型
         */
        function astParseByType( type ) {
            var parser = astParser[ type ];
            parser && parser();
        }

        /**
         * target解析
         *
         * @inner
         */
        astParser[ TYPE.TARGET ] = function () {
            var node = nodeIterator.current();
            node.block   = [];
            node.content = {};
            
            pushNode( node );
            targetCache[ node.id ] = node;

            while ( ( node = nodeIterator.next() ) )  {
                switch ( node.type ) {
                case TYPE.TARGET:
                case TYPE.MASTER:
                    popNode();
                    if ( !node.endTag ) {
                        nodeIterator.prev();
                    }
                    return;
                case TYPE.CONTENTPLACEHOLDER:
                case TYPE.ELSE:
                case TYPE.ELIF:
                    throw getError();
                default:
                    astParseByType( node.type );
                    break;
                }
            }
        };

        /**
         * master解析
         *
         * @inner
         */
        astParser[ TYPE.MASTER ] = function () {
            var node = nodeIterator.current();
            node.block = [];

            pushNode( node );
            masterCache[ node.id ] = node;

            while ( ( node = nodeIterator.next() ) )  {
                switch ( node.type ) {
                case TYPE.TARGET:
                case TYPE.MASTER:
                    popNode();
                    if ( !node.endTag ) {
                        nodeIterator.prev();
                    }
                    return;
                case TYPE.CONTENT:
                case TYPE.ELSE:
                case TYPE.ELIF:
                    throw getError();
                default:
                    astParseByType( node.type );
                    break;
                }
            }
        };

        /**
         * text解析
         *
         * @inner
         */
        astParser[ TYPE.TEXT ] = 

        /**
         * import解析
         *
         * @inner
         */
        astParser[ TYPE.IMPORT ] = 

        /**
         * contentplaceholder解析
         *
         * @inner
         */
        astParser[ TYPE.CONTENTPLACEHOLDER ] = function () {
            analyseStack.current().block.push( nodeIterator.current() );
        };

        /**
         * content解析
         *
         * @inner
         */
        astParser[ TYPE.CONTENT ] = function () {
            var node = nodeIterator.current();
            node.block = [];

            analyseStack.bottom().content[ node.id ] = node;
            pushNode( node );

            while ( ( node = nodeIterator.next() ) )  {
                if ( node.endTag ) {
                    if ( node.type == TYPE.CONTENT ) {
                        popNode( TYPE.CONTENT );
                    } else {
                        nodeIterator.prev();
                    }
                    return;
                }

                switch ( node.type ) {
                case TYPE.TARGET:
                case TYPE.MASTER:
                    popNode();
                    nodeIterator.prev();
                    return;
                case TYPE.CONTENTPLACEHOLDER:
                case TYPE.ELSE:
                case TYPE.ELIF:
                    throw getError();
                case TYPE.CONTENT:
                    popNode( TYPE.CONTENT );
                    nodeIterator.prev();
                    return;
                default:
                    astParseByType( node.type );
                    break;
                }
            }
        };

        /**
         * for解析
         *
         * @inner
         */
        astParser[ TYPE.FOR ] = function () {
            var node = nodeIterator.current();
            node.block = [];

            analyseStack.current().block.push( node );
            pushNode( node );

            while ( ( node = nodeIterator.next() ) )  {
                if ( node.endTag ) {
                    if ( node.type == TYPE.FOR ) {
                        popNode( TYPE.FOR );
                    } else {
                        nodeIterator.prev();
                    }
                    return;
                }

                switch ( node.type ) {
                case TYPE.TARGET:
                case TYPE.MASTER:
                    popNode();
                    nodeIterator.prev();
                    return;
                case TYPE.CONTENTPLACEHOLDER:
                case TYPE.CONTENT:
                case TYPE.ELSE:
                case TYPE.ELIF:
                    throw getError();
                default:
                    astParseByType( node.type );
                    break;
                }
            }
        };

        /**
         * if解析
         *
         * @inner
         */
        astParser[ TYPE.IF ] = function () {
            var node = nodeIterator.current();
            node.block = [];

            analyseStack.current().block.push( node );
            pushNode( node );

            while ( ( node = nodeIterator.next() ) ) {
                if ( node.endTag ) {
                    if ( node.type == TYPE.IF ) {
                        popNode( TYPE.IF );
                    } else {
                        nodeIterator.prev();
                    }
                    return;
                }

                switch ( node.type ) {
                case TYPE.TARGET:
                case TYPE.MASTER:
                    popNode();
                    nodeIterator.prev();
                    return;
                case TYPE.CONTENTPLACEHOLDER:
                case TYPE.CONTENT:
                    throw getError();
                default:
                    astParseByType( node.type );
                    break;
                }
            }
        };

        /**
         * elif解析
         *
         * @inner
         */
        astParser[ TYPE.ELIF ] = function () {
            var node = nodeIterator.current();
            node.type  = TYPE.IF;
            node.block = [];

            popNode( TYPE.IF )[ 'else' ] = node;
            pushNode( node );


            while ( ( node = nodeIterator.next() ) ) {
                if ( node.endTag ) {
                    nodeIterator.prev();
                    return;
                }

                switch ( node.type ) {
                case TYPE.TARGET:
                case TYPE.MASTER:
                    popNode();
                    nodeIterator.prev();
                    return;
                case TYPE.CONTENTPLACEHOLDER:
                case TYPE.CONTENT:
                    throw getError();
                case TYPE.ELIF:
                    nodeIterator.prev();
                    return;
                default:
                    astParseByType( node.type );
                    break;
                }
            }
        };

        /**
         * else解析
         *
         * @inner
         */
        astParser[ TYPE.ELSE ] = function () {
            var unit = nodeIterator.current();
            var node = analyseStack.current();
            var nodeType;

            while ( 1 ) {
                nodeType = node.type;
                if ( nodeType == TYPE.IF || nodeType == TYPE.ELIF ) {
                    node = {
                        type  : TYPE.ELSE,
                        block : []
                    };
                    analyseStack.current()[ 'else' ] = node;
                    break;
                }

                node = analyseStack.pop();
            }
            pushNode( node );

            while ( ( unit = nodeIterator.next() ) ) {
                if ( unit.endTag ) {
                    nodeIterator.prev();
                    return;
                }

                switch ( unit.type ) {
                case TYPE.TARGET:
                case TYPE.MASTER:
                    popNode();
                    nodeIterator.prev();
                    return;
                case TYPE.CONTENTPLACEHOLDER:
                case TYPE.CONTENT:
                case TYPE.ELSE:
                case TYPE.ELIF:
                    throw getError();
                default:
                    astParseByType( unit.type );
                    break;
                }
            }
        };

        return function ( stream ) {
            var unit;
            var key;
            var target;
            var master;
            var content;
            var block;
            var masterBlock;
            var i, len, item;

            // 初始化解析用到的环境
            nodeIterator = new NodeIterator( stream );
            targetCache  = {};
            masterCache  = {};
            analyseStack = new Stack;

            // 解析node流成抽象树结构
            while ( ( unit = nodeIterator.current() ) ) {
                switch ( unit.type ) {
                case TYPE.TARGET:
                case TYPE.MASTER:
                    astParser[ unit.type ]();
                    break;
                default:
                    nodeIterator.next();
                }
            }

            // 将master从临时结果转移到container
            for ( key in masterCache ) {
                if ( masterContainer[ key ] ) {
                    throw 'master "' + key + '" is exist!'
                }

                masterContainer[ key ] = masterCache[ key ];
            }

            // 链接 target 和 master
            // 将target从临时结果转移到container
            for ( key in targetCache ) {
                if ( targetContainer[ key ] ) {
                    throw 'target "' + key + '" is exist!'
                }

                target = targetCache[ key ];
                master = target.master;
                targetContainer[ key ] = target;
                
                if ( master ) {
                    block = [];
                    target.block = block;

                    master = masterContainer[ master ];
                    if ( !master ) {
                        continue;
                    }
                    masterBlock = master.block;
                    
                    for ( i = 0, len = masterBlock.length; i < len; i++ ) {
                        item = masterBlock[ i ];

                        switch ( item.type ) {
                        case TYPE.CONTENTPLACEHOLDER:
                            content = target.content[ item.id ];
                            if ( content ) {
                                Array.prototype.push.apply( block, content.block );
                            }
                            break;
                        default:
                            block.push( item );
                        }
                    }
                }
            }

            // 释放解析所需的公共环境
            targetCache = null;
            masterCache = null;
            nodeIterator = null;
            analyseStack = null;  
        };
    }();
    
    /**
     * 条件表达式解析和执行
     *
     * @inner
     */
    var condExpr = function () {
        // 表达式类型
        var EXPR_T = {
            or       : 1,
            and      : 2,
            relation : 3,
            unary    : 4,
            string   : 5,
            number   : 6,
            variable : 7,
            punc     : 8
        };

        return {
            /**
             * 解析条件表达式
             *
             * @inner
             * @param {string} source 表达式源
             */
            parse: function ( source ) {
                source = baidu.string.trim( source );
                var arr;
                var str;
                var expr;
                var src = source;
                var stream = [];

                // 分析表达式token流
                while ( source ) {
                    // 匹配一个含义块
                    arr = CONDEXPR_RULE.exec( source );
                    if ( !arr ) {
                        throw "conditional expression invalid: " + src;
                    }

                    // 更新未解析的源
                    source = source.slice( arr[ 0 ].length );
                    str    = arr[ 1 ];

                    if ( str.indexOf( '$' ) == 0 ) {
                        stream.push( {
                            type : EXPR_T.variable,
                            text : str.slice( 2, str.length - 1 )
                        } );
                    } else if ( /^[0-9-]/.test( str ) ) {
                        stream.push( {
                            type : EXPR_T.number,
                            text : str
                        } );
                    } else {

                        switch ( str ) {
                        case "'":
                        case '"':
                            var strBuf = [str];
                            var cha;
                            var index = 0;

                            while ( 1 ) {
                                cha = source.charAt( index++ );
                                if ( cha == str ) {
                                    strBuf.push( str );
                                    source = source.slice( index );
                                    break;
                                }

                                strBuf.push( cha );
                            }
                            stream.push( { 
                                type : EXPR_T.string, 
                                text : strBuf.join( '' ) 
                            } );
                            break;
                        default:
                            stream.push( {
                                type : EXPR_T.punc,
                                text : str
                            } );
                            break;
                        }
                    }
                }

                // 分析表达式结构
                expr = orExpr( new NodeIterator( stream ) );
                return expr;
            },

            /**
             * 运行条件表达式
             *
             * @inner
             * @param {Object} expr 条件表达式
             * @param {Scope} scope scope
             * @return {boolean}
             */
            exec: execCondExpr
        };

        /**
         * 解析or表达式
         *
         * @inner
         * @param {NodeIterator} iterator token迭代器
         * @description
         * orExpression:
         *     andExpression
         *     andExpression || orExpression
         */
        function orExpr( iterator ) {
            var expr = andExpr( iterator );
            var oper;
            if ( ( oper = iterator.current() ) && oper.text == '||' ) {
                iterator.next();
                expr = {
                    type  : EXPR_T.or, 
                    expr1 : expr, 
                    expr2 : orExpr( iterator ) 
                };
            }

            return expr;
        }

        /**
         * 解析and表达式
         *
         * @inner
         * @param {NodeIterator} iterator token迭代器
         * @description
         * andExpression:
         *     relationalExpression
         *     relationalExpression || andExpression
         */
        function andExpr( iterator ) {
            var expr = relationExpr( iterator );
            var oper;
            if ( ( oper = iterator.current() ) && oper.text == '&&' ) {
                iterator.next();
                expr = {
                    type  : EXPR_T.and, 
                    expr1 : expr, 
                    expr2 : andExpr( iterator )
                };
            }

            return expr;
        }

        /**
         * 解析relational表达式
         *
         * @inner
         * @param {NodeIterator} iterator token迭代器
         * @description
         * relationalExpression:
         *     unaryExpression
         *     unaryExpression > unaryExpression
         *     unaryExpression >= unaryExpression
         *     unaryExpression < unaryExpression
         *     unaryExpression <= unaryExpression
         *     unaryExpression == unaryExpression
         *     unaryExpression != unaryExpression
         *     unaryExpression === unaryExpression
         *     unaryExpression !== unaryExpression
         */
        function relationExpr( iterator ) {
            var expr = unaryExpr( iterator );
            var oper;
            if ( ( oper = iterator.current() ) && /^[><=]+$/.test( oper.text ) ) {
                iterator.next();
                expr = {
                    type  : EXPR_T.relation, 
                    expr1 : expr, 
                    expr2 : unaryExpr( iterator ), 
                    oper  : oper.text
                };
            }

            return expr;
        }

        /**
         * 解析unary表达式
         *
         * @inner
         * @param {NodeIterator} iterator token迭代器
         * @description
         * unaryExpression:
         *     primaryExpr
         *     !primaryExpr
         */
        function unaryExpr( iterator ) {
            if ( iterator.current().text == '!' ) {
                iterator.next();
                return {
                    type : EXPR_T.unary,
                    oper : '!',
                    expr : primaryExpr( iterator )
                };
            }
            
            return primaryExpr( iterator );
        }

        /**
         * 解析primary表达式
         *
         * @inner
         * @param {NodeIterator} iterator token迭代器
         * @description
         * primaryExpression:
         *     string
         *     number
         *     ( orExpression )
         */
        function primaryExpr( iterator ) {
            var expr = iterator.current();
            if ( expr.text == '(' ) {
                iterator.next();
                expr = orExpr( iterator );
            }
            
            iterator.next();
            return expr;
        }

        /**
         * 运行relational表达式
         *
         * @inner
         * @param {Object} expr relational表达式
         * @param {Scope} scope scope
         * @return {boolean}
         */
        function execRelationExpr( expr, scope ) {
            var result1 = execCondExpr( expr.expr1, scope );
            var result2 = execCondExpr( expr.expr2, scope );

            switch( expr.oper ) {
            case '=='  : return result1 == result2;
            case '===' : return result1 === result2;
            case '>'   : return result1 > result2;
            case '<'   : return result1 < result2;
            case '>='  : return result1 >= result2;
            case '<='  : return result1 <= result2;
            case '!='  : return result1 != result2;
            case '!==' : return result1 !== result2;
            }
        }

        /**
         * 运行条件表达式
         *
         * @inner
         * @param {Object} expr 条件表达式
         * @param {Scope} scope scope
         * @return {Any}
         */
        function execCondExpr( expr, scope ) {
            switch ( expr.type ) {
            case EXPR_T.or:
                return execCondExpr( expr.expr1, scope ) 
                       || execCondExpr( expr.expr2, scope );
            case EXPR_T.and:
                return execCondExpr( expr.expr1, scope ) 
                       && execCondExpr( expr.expr2, scope );
            case EXPR_T.unary:
                return !execCondExpr( expr.expr, scope );
            case EXPR_T.relation:
                return execRelationExpr( expr, scope );
            case EXPR_T.string:
            case EXPR_T.number:
                return eval( expr.text );
            case EXPR_T.variable:
                return getVariableValue( scope, expr.text );
            }
        }
    }();

 
    /**
     * 解析模板变量的值
     * 
     * @inner
     * @param {string} scope 
     * @param {string} varName 变量名
     * @param {string} opt_filterName 过滤器名
     * @return {string}
     */
    function getVariableValue( scope, varName, opt_filterName ) {
        var typeRule = /:([a-z]+)$/i;
        var match    = varName.match( typeRule );
        var value    = '';
        var i, len;
        var variable, propName, propLen;

        varName = varName.replace( typeRule, '' );
        if ( match && match.length > 1 ) {
            value = getVariableValueByType( varName, match[1] );
        } else {
            varName  = varName.split( /[\.\[]/ );
            variable = scope.get( varName[ 0 ] );
            varName.shift();

            for ( i = 0, len = varName.length; i < len; i++ ) {
                if ( !er._util.hasValue( variable ) ) {
                    break;
                }

                propName = varName[ i ].replace( /\]$/, '' );
                propLen  = propName.length;
                if ( /^(['"])/.test( propName ) 
                     && propName.lastIndexOf( RegExp.$1 ) == --propLen
                ) {
                    propName = propName.slice( 1, propLen );
                }

                variable = variable[ propName ];
            }

            if ( er._util.hasValue( variable ) ) {
                value = variable;
            }
        }
        
        // 过滤处理
        if ( opt_filterName ) {
            opt_filterName = filterContainer[ opt_filterName.substr( 1 ) ];
            opt_filterName && ( value = opt_filterName( value ) );
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
    function getVariableValueByType( varName, type ) {
        var packs           = varName.split( '.' ),
            len             = packs.length - 1,
            topPackageName  = packs.shift(),
            win             = window,
            objOnDef        = er._util.getConfig( 'DEFAULT_PACKAGE' ),
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
     * 获取target的内容
     *
     * @inner
     * @param {string} name target的名称
     * @return {string}
     */
    function getTargetContent( name ) {
        try {
            var target = getTarget( name );
            return getContent( target ) || '';
        } catch ( ex ) {
            return '';
        }
    }

    /**
     * 获取target
     *
     * @inner
     * @param {string} name target的名称
     * @return {Object}
     */
    function getTarget( name ) {
        var target = targetContainer[ name ];
        if ( !target ) {
            throw 'target "' + name + '" is not exist!';
        }

        if ( target.type != TYPE.TARGET ) {
            throw 'target "' + name + '" is invalid!';
        }

        return target;
    }

    /**
     * 获取节点的内容
     *
     * @inner
     * @param {Object} node 节点
     * @return {string}
     */
    function getContent( node ) {
        var block   = node.block;
        var content = [];
        var item, i, len;

        for ( i = 0, len = block.length; i < len; i++ ) {
            item = block[ i ];

            if ( item.block ) {
                content.push( getContent( item ) );
            } else if ( item.type == TYPE.IMPORT ) {
                content.push( getTargetContent( item.id ) );
            } else {
                content.push( item.text || '' );
            }
        }

        return content.join( '' );
    }

    /**
     * 替换模板变量的值
     * 
     * @inner
     * @param {string} text 替换文本源
     * @param {Scope} scope 
     * @return {string}
     */
    function replaceVariable( text, scope ) {
        return text.replace(
                /\$\{([.:a-z0-9\[\]'"_]+)\s*(\|[a-z]+)?\s*\}/ig,
                function ( $0, $1, $2 ) {
                    return getVariableValue( scope, $1, $2  );
                });
    }

    /**
     * 执行target
     * 
     * @inner
     * @param {Object} target 要执行的target
     * @param {Scope} scope
     */
    function exec( target, scope ) {
        var result = [];
        var block = target.block;
        
        var stat, i, len;
        var forScope, forList, forI, forLen, forItem, forIndex;
        var ifValid;

        
        for ( i = 0, len = block.length; i < len; i++ ) {
            stat = block[ i ];

            switch ( stat.type ) {
            case TYPE.TEXT:
                result.push( replaceVariable( stat.text, scope ) ) ;
                break;

            case TYPE.IMPORT:
                result.push( execImport( stat, scope ) );
                break;

            case TYPE.FOR:
                forScope = new Scope( scope );
                forList  = scope.get( stat.list );
                forItem  = stat.item;
                forIndex = stat.index;
                for ( forI = 0, forLen = forList.length; forI < forLen; forI++ ) {
                    forScope.set( forItem, forList[ forI ] );
                    forIndex && forScope.set( forIndex, forI );
                    result.push( exec( stat, forScope ) );
                }
                break;

            case TYPE.IF:
                ifValid = condExpr.exec( stat.expr, scope );
                while ( !ifValid ) {
                    stat = stat[ 'else' ];
                    if ( !stat ) {
                        break;
                    }
                    ifValid = !stat.expr || condExpr.exec( stat.expr, scope );
                }

                stat && result.push( exec( stat, scope ) );
                break;
            }
        }

        return result.join( '' );
    }

    /**
     * 执行import
     * 
     * @inner
     * @param {Object} importStat import对象
     * @param {Scope} scope
     */
    function execImport( importStat, scope ) {
        var target = getTarget( importStat.id );
        return exec( target, scope );
    }

    /**
     * 解析模板
     *
     * @inner
     * @param {string} source 模板源
     */
    function parse( source ) {
        var stream = nodeAnalyse( source );
        syntaxAnalyse( stream );
    }
    
    /**
     * 合并模板与数据
     * 
     * @inner
     * @param {HTMLElement} output  要输出到的容器元素
     * @param {string}      tplName 模板名
     * @param {string}      opt_privateContextId 私用context环境的id
     */
    function merge( output, tplName, opt_privateContextId ) {
        var html = '';
        var target;
        var scope = {
            get: function ( name ) {
                return er.context.get( name, { 
                    contextId: opt_privateContextId 
                } );
            }
        };

        if ( output ) {
            try {
                target = getTarget( tplName );
                html = exec( target, scope );
            } catch ( ex ) { }

            output.innerHTML = html;
        }
    }

    /**
     * 加载模板
     *
     * @inner
     */
    function load() {
        er.init.stop();

        var list    = er._util.getConfig( 'TEMPLATE_LIST' ),
            len     = list instanceof Array && list.length,
            tplBuf  = [],
            i       = 0;
            
        if ( len && !isLoaded ) {
            isLoaded = 1;
            loadTemplate();
        } else {
            er.init.start();
        }
        
        /**
         * 加载模板成功的回调函数
         * 
         * @inner
         * @param {Object} xhr
         */
        function successCallback( xhr ) {
            tplBuf.push( xhr.responseText );
            loadedCallback();
        }
        
        /**
         * 每条模板加载完毕的处理函数
         * 
         * @inner
         */
        function loadedCallback() {
            i++;
            
            if ( i >= len ) {
                er.template.parse( tplBuf.join( '\n' ) );
                er.init.start();
            } else {
                loadTemplate();
            }
        }
        
        /**
         * 加载模板
         * 
         * @inner
         */
        function loadTemplate() {
            baidu.ajax.request( list[ i ], {
                'method'   : 'get',
                'onsuccess': successCallback,
                'onfailure': loadedCallback
            });
        }
    }

    er.init.addIniter( load, 0 );

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
        merge: merge
    };
}();
