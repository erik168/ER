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
 *     <!-- for: list as item -->
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
        get: function ( name ) {debugger;
            var value = this.context[ name ];
            if ( !er._util.hasValue( value ) && this.parent ) {
                return this.parent.get( name );
            }

            return value || null;
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
    var FOR_RULE = /^\s*:\s*\$\{([0-9a-z_.\[\]]+)\}\s+as\s+\$\{([0-9a-z_]+)\}\s*$/i;
    
    // IF和ELIF标签规则
    var IF_RULE = /^\s*:([>=<!0-9a-z$\{\}\[\]\(\):\s'"_]+)\s*$/i

    // 普通命令标签规则
    var TAG_RULE = /^\s*:\s*([a-z0-9_]+)\s*(?:\(([^)]+)\))?\s*$/i;

    var VAR_RULE = /^[a-z_][a-z0-9_]*(\.[a-z_][a-z0-9_]*|\[[a-z0-9_]+\])*(\|[a-z]+)?$/i;

    var CONDEXPR_RULE = /\s*(\!=?=?|\|\||&&|>=?|<=?|===?|['"\(\)]|\$\{[^\}]+\}|\-?[0-9]+(\.[0-9]+)?)/;


    var masterContainer = {};
    var targetContainer = {};
    var ilCache = {};
    var compileCache = {};

    // 过滤器
    var filterContainer = {
        'html': function ( source ) {
            return baidu.string.encodeHTML( source );
        },
        
        'url': function ( source ) {
            return encodeURIComponent( source );
        }
    };
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
        var unitType;
        var unit;
        var propList;
        var propLen;

        // text节点内容缓存
        var textBuf = new ArrayBuffer;

        // node结果流
        var unitStream = new ArrayBuffer;    
        
        // 对source以 <!-- 进行split
        var texts = source.split( COMMENT_BEGIN );
        if ( texts[ 0 ] === '' ) {
            texts.shift();
        }

        // 开始第一阶段解析，生成strStream
        for ( i = 0, len = texts.length; i < len; i++ ) {
            // 对 <!-- 进行split的结果
            // 进行 --> split
            // 如果split数组长度为2
            // 则0项为注释内容，1项为正常html内容
            str = texts[ i ].split( COMMENT_END );
            strLen = str.length;

            if ( strLen == 2 || i > 0 ) {
                if ( strLen == 2 ) {
                    commentText = str[ 0 ];
                    if ( COMMENT_RULE.test( commentText ) ) {
                        unitStream.push( {
                            type: TYPE.TEXT,
                            text: textBuf.join( '' )
                        } );
                        textBuf = new ArrayBuffer;
                        
                        unitType = RegExp.$2.toLowerCase();
                        unit = { type: TYPE[ unitType.toUpperCase() ] };
                        if ( RegExp.$1 ) {
                            unit.endTag = 1;
                            unitStream.push( unit );
                        } else {
                            switch ( unitType ) {
                            case 'content':
                            case 'contentplaceholder':
                            case 'master':
                            case 'import':
                            case 'target':
                                if ( TAG_RULE.test( RegExp.$3 ) ) {
                                    // 初始化id
                                    unit.id = RegExp.$1;
                                
                                    // 初始化属性
                                    propList = RegExp.$2.split( /\s*,\s*/ );
                                    propLen = propList.length;
                                    while ( propLen-- ) {
                                        if ( PROP_RULE.test( propList[ propLen ] ) ) {
                                            unit[ RegExp.$1 ] = RegExp.$2;
                                        }
                                    }
                                } else {
                                    throw 'id is invalid';
                                    //TODO: reset 2 text node?
                                }
                                unitStream.push( unit );
                                break;
                            case 'for':
                                if ( FOR_RULE.test( RegExp.$3 ) ) {
                                    unit.list = RegExp.$1;
                                    unit.item = RegExp.$2;
                                } else {
                                    debugger;
                                }

                                unitStream.push( unit );
                                break;
                            case 'if':
                            case 'elif':
                                if ( IF_RULE.test( RegExp.$3 ) ) {
                                    unit.expr = parseConditionalExpr( RegExp.$1 );
                                } else {
                                    debugger;
                                }

                                unitStream.push( unit );
                                break;
                            case 'else':
                                unitStream.push( unit );
                                break;
                            }
                        }
                    } else {
                        textBuf.push( COMMENT_BEGIN, commentText, COMMENT_END );
                    }

                    textBuf.push( str[ 1 ] );
                } else {
                    textBuf.push( str[ 0 ] );
                }
            }
        }
        
        unitStream.push( 
            {
                type: TYPE.TEXT,
                text: textBuf.join( '' )
            }
         );

        return unitStream.getRaw();
    }

    var targetCache;
    var masterCache;
    var analyseStack;
    var nodeStream;

    /**
     * 语法分析
     *
     * @inner
     * @param {Array} 构造单元流
     */
    function syntaxAnalyse( stream ) {
        var unit;
        var key;
        var target;
        var master;
        var content;
        var block;
        var masterBlock;
        var i, len, item;

        targetCache  = {};
        masterCache  = {};
        analyseStack = new Stack;

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
a.push( 'end ast:' + ((new Date) - now) )
        // copy master to container
        for ( key in masterCache ) {
            if ( masterContainer[ key ] ) {
                throw 'master "' + key + '" is exist!'
            }

            masterContainer[ key ] = masterCache[ key ];
        }
a.push( 'end master cache' + ((new Date) - now) );
        // link target's master and copy to container
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
        console.log( targetCache );
        //console.log( masterCache );
    }


    function execConditionalExpr( expr, scope ) {
        switch ( expr.type ) {
        case 'or':
            return execConditionalExpr( expr.expr1, scope ) || execConditionalExpr( expr.expr2, scope );
        case 'and':
            return execConditionalExpr( expr.expr1, scope ) && execConditionalExpr( expr.expr2, scope );;
        case 'unary':
            return !execConditionalExpr( expr.expr, scope );
        case 'relation':
            return execRelationExpr( expr, scope );
        case 'string':
            return eval( expr.content );
        case 'number':
            return eval( expr.content );
        case 'variable':
            return parseVariable( expr.content, null, scope )

        }
    }

    function execRelationExpr( expr, scope ) {
        var expr1 = execConditionalExpr( expr.expr1, scope );
        var expr2 = execConditionalExpr( expr.expr2, scope );
        switch( expr.oper.content ) {
        case '==':
            return expr1 == expr2;
        case '===':
            return expr1 === expr2;
        case '>':
            return expr1 > expr2;
        case '<':
            return expr1 < expr2;
        case '>=':
            return expr1 >= expr2;
        case '<=':
            return expr1 <= expr2;
        case '!=':
            return expr1 != expr2;
        case '!==':
            return expr1 !== expr2;
        }
    }

    function parseConditionalExpr( source ) {
        source = baidu.string.trim( source ); 
        var arr;
        var str;
        var stream = [];
        while ( source ) {
            arr = CONDEXPR_RULE.exec( source );
            if ( !arr ) {
                
                throw "fuck";
            }

            source = source.slice( arr[ 0 ].length );
            str = arr[ 1 ];
            if ( str.indexOf( '$' ) == 0 ) {
                stream.push( {
                    type: 'variable',
                    content: str.slice( 2, str.length - 1 )
                } );
                continue;
            } else if ( /^[0-9-]/.test( str ) ) {
                stream.push( {
                    type: 'number',
                    content: str
                } );
                continue;
            } 

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
                stream.push( { type: 'string', content: strBuf.join( '' ) } );
                break;
            default:
                stream.push( {
                    type: 'punc',
                    content: str
                } );
                break;
            }
        }

        var iterator = new NodeIterator( stream );
        return orExpr( iterator );
    }

    function orExpr( iterator ) {
        var expr = andExpr( iterator );
        var oper;
        if ( ( oper = iterator.next() ) && oper.content == '||' ) {
            expr = {type: 'or', expr1: expr, expr2: opExpr( iterator ) };
        }

        return expr;
    }

    function andExpr( iterator ) {
        var expr = relationExpr( iterator );
        var oper;
        if ( ( oper = iterator.next() ) && oper.content == '&&' ) {
            expr = {type: 'and', expr1: expr, expr2: andExpr( iterator ) };
        }

        return expr;
    }

    function relationExpr( iterator ) {
        var expr = unaryExpr( iterator );
        var oper;
        if ( ( oper = iterator.next() ) && /^[><=]+$/.test( oper.content ) ) {
            iterator.next();
            expr = {
                type: 'relation', 
                expr1: expr, 
                expr2: unaryExpr( iterator ), 
                oper: oper 
            };
        }

        return expr;
    }

    function unaryExpr( iterator ) {
        if ( iterator.current().content == '!' ) {
            iterator.next();
            return {
                type: 'unary',
                oper: '!',
                expr: primaryExpr( iterator )
            }
        }
        
        return primaryExpr( iterator );
    }

    function primaryExpr( iterator ) {
        var expr = iterator.current();
        if ( expr.content == '(' ) {
            iterator.next();
            expr = orExpr( iterator );
            iterator.next();
        }

        return expr;
    }
    
    /**
     * 解析模板变量的值
     * 
     * @inner
     * @param {string} varName 变量名
     * @param {string} filterName 过滤器名
     * @param {string} scope 
     * @return {string}
     */
    function parseVariable( varName, filterName, scope ) {
        var match = varName.match( /:([a-z]+)$/ );
        var value = '';

        if ( match && match.length > 1 ) {
            value = parseVariableByType( varName.replace(/:[a-z]+$/i, ''), match[1] );
        } else {
            var variable = scope.get( varName );
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
     * 获取target的内容
     *
     * @inner
     * @param {string} name target的名称
     * @return {string}
     */
    function getTargetContent( name ) {
        var target = targetContainer[ name ];
        if ( target ) {
            return getContent( target );
        }

        return '';
    }

    function getContent( node ) {
        var block = node.block;
        var i = 0;
        var len = block.length;
        var content = [];
        var item;

        for ( ; i < len; i++ ) {
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

    function merge( output, tplName, opt_privateContextId ) {
        if ( output ) {
            var scope = {
                get: function ( name ) {
                    return er.context.get( name, { 
                        contextId: opt_privateContextId 
                    } );
                }
            };
            var target = targetContainer[ tplName ];
            output.innerHTML = exec( target, scope );
        }
    }

    function replaceVariable( text, scope ) {
        return text.replace(
                /\$\{([.:a-z0-9_]+)\s*(\|[a-z]+)?\s*\}/ig,
                function ( $0, $1, $2 ) {
                    return parseVariable( $1, $2, scope );
                });
    }
    function exec( target, scope ) {
        var block = target.block;
        var i = 0;
        var len = block.length;
        var stat;
        var result = [];
        for ( ; i < len; i++ ) {
            stat = block[ i ];
            switch ( stat.type ) {
            case TYPE.TEXT:
                result.push( replaceVariable( stat.text, scope ) ) ;
                break;
            case TYPE.IMPORT:
                execImport( stat );
                break;
            case TYPE.FOR:
                
                var forScope = new Scope( scope );
                var arr = scope.get( stat.list );
                var j = 0;
                var listLen = arr.length;
                for ( ; j < listLen; j++ ) {
                    forScope.set( stat.item, arr[ j ] );
                    result.push( exec( stat, forScope ) );
                }
                break;
            case TYPE.IF:
                var valid = execConditionalExpr( stat.expr, scope );
                while ( !valid ) {
                    stat = stat[ 'else' ];
                    if ( !stat ) break;
                    valid = !stat.expr || execConditionalExpr( stat.expr, scope );
                }

                stat && result.push( exec( stat, scope ) );
                break;
            }
        }

        return result.join( '' );
    }

    function execImport( importStat ) {
        var name = importStat.id;
        return exec( targetContainer[ name ] );
    }

    var a;
    var now;

    var nodeIterator;

    /**
     * 解析模板
     *
     * @inner
     * @param {string} source 模板源
     */
    function parse( source ) {
        now = new Date;
        a = []
        nodeIterator = new NodeIterator( nodeAnalyse( source ) );
        a.push( 'end nodeAnalyse:' + ((new Date) - now) )
        syntaxAnalyse();
        a.push( 'end parse:' + ((new Date) - now) )
        //alert(a.join('\n'))
    }

    function popNode( stopType ) {
        var current;

        while ( ( current = analyseStack.current() )
                && current.type != stopType
        ) {
            analyseStack.pop();
        }

        return analyseStack.pop();
    }

    function pushNode( node ) {
        analyseStack.push( node );
    }

    function getError() {
        var node = analyseStack.bottom;
        return '[er template]' + node.type + ' ' + node.id 
            + ': unexpect ' + nodeIterator.current().type 
            + ' on ' + analyseStack.current().type;
    }

    function astParseByType( type ) {
        var parser = astParser[ type ];
        parser && parser();
    }

    var astParser = {};
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

    astParser[ TYPE.TEXT ] = 
    astParser[ TYPE.IMPORT ] = 
    astParser[ TYPE.CONTENTPLACEHOLDER ] = function () {
        analyseStack.current().block.push( nodeIterator.current() );
    };

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
                //er.template.parse( tplBuf.join( '\n' ) );
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
