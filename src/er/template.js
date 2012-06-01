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

    // 节点类型声明
    var T_TEXT               = 0;
    var T_TARGET             = 1;
    var T_MASTER             = 2;
    var T_IMPORT             = 3;
    var T_CONTENT            = 4;
    var T_CONTENTPLACEHOLDER = 5;
    var T_FOR                = 6;
    var T_IF                 = 7;
    var T_ELIF               = 8;
    var T_ELSE               = 9;

    // 命令注释规则
    var COMMENT_RULE = /^\s*(\/)?([a-z]+)(.*)$/i;
    
    // 属性规则
    var PROP_RULE = /^\s*([0-9a-z_]+)\s*=\s*([0-9a-z_]+)\s*$/i;
    
    // FOR标签规则
    var FOR_RULE = /^\s*:\s*([0-9a-z_]+)\s+as\s+([0-9a-z_]+)\s*$/i;
    
    // IF和ELIF标签规则
    var IF_RULE = /^\s*:\s*([0-9a-z_]+)\s*([>=<]{1,2})\s*([a-z0-9_]+)\s*$/i

    // 普通命令标签规则
    var TAG_RULE = /^\s*:\s*([a-z0-9_]+)\s*(?:\(([^)]+)\))?\s*$/i;


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
     * 构造单元分析，返回构造流
     *
     * @inner
     * @return {Array}
     */
    function unitAnalyse( source ) {
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
        var textBuf = [];

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
                            type: 'text',
                            text: textBuf.join( '' )
                        } );
                        textBuf = [];
                        
                        unitType = RegExp.$2.toLowerCase();
                        unit = { type: unitType, prop: {} };
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
                                            unit.prop[ RegExp.$1 ] = RegExp.$2;
                                        }
                                    }
                                } else {
                                    debugger;
                                    throw 'id is invalid';
                                    //TODO: reset 2 text node?
                                }
                                unitStream.push( unit );
                                break;
                            case 'for':
                                if ( FOR_RULE.test( RegExp.$3 ) ) {
                                    unit.prop.list = RegExp.$1;
                                    unit.prop.item = RegExp.$2;
                                } else {
                                    debugger;
                                }

                                unitStream.push( unit );
                                break;
                            case 'if':
                            case 'elif':
                                if ( IF_RULE.test( RegExp.$3 ) ) {
                                    unit.prop.expr1 = RegExp.$1;
                                    unit.prop.assign = RegExp.$2;
                                    unit.prop.expr2 = RegExp.$3;
                                } else {
                                    debugger;
                                }

                                unitStream.push( unit );
                                break;
                            case 'else':
                                unitStream.push( unit );
                                break;
                            default:

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
        
        unitStream.push( {
            type: 'text',
            text: textBuf.join( '' )
        } );
        
        return unitStream.getRaw();
    }

    /**
     * 语法分析
     *
     * @inner
     * @param {Array} 构造单元流
     */
    function syntaxAnalyse( stream ) {
        var unit;
        createUnitIterator( stream );
        targetCache = {};
        masterCache = {};
        nodeStack   = new Stack;

        while ( ( unit = currentUnit() ) ) {
            switch ( unit.type ) {
            case 'target':
                astParser.target();
                break;
            case 'master':
                astParser.master();
                break;
            default:
                nextUnit();
            }
        }

        // link target 2 master
        for ( var key in masterCache ) {
            // TODO: exist master
            masterContainer[ key ] = masterCache[ key ];
        }

        for ( var key in targetCache ) {
            var target = targetCache[ key ];
            targetContainer[ key ] = target;
            // TODO: exist target
            if ( target.master ) {
                var master = masterContainer[ target.master ];
                target.block = [];

                for ( var i = 0; i < master.block.length; i++ ) {
                    var item = master.block[ i ];
                    switch ( item.type ) {
                        case 'contentplaceholder':
                            var content = target.content[ item.id ];
                            
                            for ( j = 0; j < content.block.length; j++ ) {
                                
                                target.block.push( content.block[ j ] );
                            }
                            break;
                        default:
                            target.block.push( item );
                    }
                }
            }
        }



        console.log( targetCache );
        console.log( masterCache );
    }

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
            } else if ( item.type == 'import' ) {
                content.push( getTargetContent( item.id ) );
            } else {
                content.push( item.text || '' );
            }
        }

        return content.join( '' );
    }

    /**
     * 合并模板与数据
     * 
     * @inner
     * @param {HTMLElement} output  要输出到的容器元素
     * @param {string}      tplName 视图模板
     * @param {string}      opt_privateContextId 私用context环境的id
     */
    function merge2( output, tplName, opt_privateContextId ) {
        if ( output ) {
            output.innerHTML = er.template.get( tplName ).replace(
                /\$\{([.:a-z0-9_]+)\s*(\|[a-z]+)?\s*\}/ig,
                function ( $0, $1, $2 ) {
                    return parseVariable( $1, $2, opt_privateContextId );
                });
        }
    }

    function merge( output, tplName, opt_privateContextId ) {
        if ( output ) {
            output.innerHTML = exec( tplName, opt_privateContextId );
        }
    }

    function replaceVariable( text, opt_privateContextId ) {
        return text.replace(
                /\$\{([.:a-z0-9_]+)\s*(\|[a-z]+)?\s*\}/ig,
                function ( $0, $1, $2 ) {
                    return parseVariable( $1, $2, opt_privateContextId );
                });
    }
    function exec( target, opt_privateContextId ) {
        target = targetContainer[ target ];
        var block = target.block;
        var i = 0;
        var len = block.length;
        var stat;
        var result= [];
        for ( ; i < len; i++ ) {
            stat = block[ i ];
            switch ( stat.type ) {
            case 'text':
                result.push( replaceVariable( stat.text, opt_privateContextId ) ) ;
                break;
            case 'import':
                result.push( execImport( stat, opt_privateContextId ) );
                break;
            }
        }

        return result.join( '' );
    }
    
    function execImport( importStat ) {
        var name = importStat.id;
        return exec( targetContainer[ name ] );
    }

    /**
     * 解析模板
     *
     * @inner
     * @param {string} source 模板源
     */
    function parse( source ) {
        var stream = unitAnalyse( source );
        syntaxAnalyse( stream );
    }

    function popNode( stopType ) {
        var current;

        while ( ( current = nodeStack.current() )
                && current.type != stopType
        ) {
            nodeStack.pop();
        }

        return nodeStack.pop();
    }

    function pushNode( node ) {
        nodeStack.push( node );
    }

    var targetCache;
    var masterCache;
    var nodeStack;
    

    var unitStream;
    var streamIndex;

    function createUnitIterator( stream ) {
        streamIndex = 0;
        unitStream = stream;
    }

    function nextUnit() {
        return unitStream[ ++streamIndex ] || null;
    }

    function prevUnit() {
        return unitStream[ --streamIndex ] || null;
    }

    function currentUnit() {
        return unitStream[ streamIndex ] || null;
    }

    function getError() {
        var node = nodeStack.bottom;
        return '[er template]' + node.type + ' ' + node.id 
            + ': unexpect ' + currentUnit().type 
            + ' on ' + nodeStack.current().type;
    }

    var astParser = {
        target: function () {
            var unit = currentUnit();
            var node;
            var parser;

            node = { 
                type    : 'target', 
                block   : [], 
                id      : unit.id, 
                content : {},
                master  : unit.prop.master
            };
            pushNode( node );
            targetCache[ unit.id ] = node;

            while ( ( unit = nextUnit() ) )  {
                switch ( unit.type ) {
                case 'target':
                case 'master':
                    popNode();
                    if ( !unit.endTag ) {
                        prevUnit();
                    }
                    return;
                case 'contentplaceholder':
                case 'else':
                case 'elif':
                    throw getError();
                default:
                    parser = astParser[ unit.type ];
                    parser && parser();
                    break;
                }
            }
        },

        master: function () {
            var unit = currentUnit();
            var node;
            var parser;

            node = { type: 'master', block: [], id: unit.id };
            pushNode( node );
            masterCache[ unit.id ] = node;

            while ( ( unit = nextUnit() ) )  {
                switch ( unit.type ) {
                case 'target':
                case 'master':
                    popNode();
                    if ( !unit.endTag ) {
                        prevUnit();
                    }
                    return;
                case 'content':
                case 'else':
                case 'elif':
                    throw getError();
                default:
                    parser = astParser[ unit.type ];
                    parser && parser();
                    break;
                }
            }
        },

        text: function () {try{
            nodeStack.current().block.push( currentUnit() );
        }catch(e){debugger;}
        },

        'import': function () {
            nodeStack.current().block.push( currentUnit() );
        },

        contentplaceholder: function () {
            nodeStack.current().block.push( currentUnit() );
        },

        content: function () {
            var unit = currentUnit();
            var node;
            var parser;

            node = { type: 'content', block: [], id: unit.id };
            nodeStack.bottom().content[ unit.id ] = node;
            pushNode( node );

            while ( ( unit = nextUnit() ) )  {
                if ( unit.endTag ) {
                    if ( unit.type == 'content' ) {
                        popNode( 'content' );
                    } else {
                        prevUnit();
                    }
                    return;
                }

                switch ( unit.type ) {
                case 'target':
                case 'master':
                    popNode();
                    prevUnit();
                    return;
                case 'contentplaceholder':
                case 'else':
                case 'elif':
                    throw getError();
                case 'content':
                    popNode( 'content' );
                    prevUnit();
                    return;
                default:
                    parser = astParser[ unit.type ];
                    parser && parser();
                    break;
                }
            }
        },

        'for': function () {
            var unit = currentUnit();
            var node;
            var parser;

            node = { type: 'for', block: [], item: unit.item, list: unit.list };
            nodeStack.current().block.push( node );
            pushNode( node );

            while ( ( unit = nextUnit() ) )  {
                if ( unit.endTag ) {
                    if ( unit.type == 'for' ) {
                        popNode( 'for' );
                    } else {
                        prevUnit();
                    }
                    return;
                }

                switch ( unit.type ) {
                case 'target':
                case 'master':
                    popNode();
                    prevUnit();
                    return;
                case 'contentplaceholder':
                case 'content':
                case 'else':
                case 'elif':
                    throw getError();
                default:
                    parser = astParser[ unit.type ];
                    parser && parser();
                    break;
                }
            }
        },

        'if': function () {
            var unit = currentUnit();
            var node
            var parser;

            node = {
                type  : 'if',
                expr1 : unit.prop.expr1,
                expr2 : unit.prop.expr2,
                oper  : unit.prop.oper,
                block : []

            };
            nodeStack.current().block.push( node );
            pushNode( node );

            while ( ( unit = nextUnit() ) ) {
                if ( unit.endTag ) {
                    if ( unit.type == 'if' ) {
                        popNode( 'if' );
                    } else {
                        prevUnit();
                    }
                    return;
                }

                switch ( unit.type ) {
                case 'target':
                case 'master':
                    popNode();
                    prevUnit();
                    return;
                case 'contentplaceholder':
                case 'content':
                    throw getError();
                default:
                    parser = astParser[ unit.type ];
                    parser && parser();
                    break;
                }
            }
        },

        elif: function () {
            var unit = currentUnit();
            var node = {
                type  : 'if',
                expr1 : unit.prop.expr1,
                expr2 : unit.prop.expr2,
                oper  : unit.prop.oper,
                block : []

            };
            var parser;

            popNode( 'if' )[ 'else' ] = node;
            pushNode( node );


            while ( ( unit = nextUnit() ) ) {
                if ( unit.endTag ) {
                    prevUnit();
                    return;
                }

                switch ( unit.type ) {
                case 'target':
                case 'master':
                    popNode();
                    prevUnit();
                    return;
                case 'contentplaceholder':
                case 'content':
                    throw getError();
                case 'elif':
                    prevUnit();
                    return;
                default:
                    parser = astParser[ unit.type ];
                    parser && parser();
                    break;
                }
            }
        },

        'else': function () {
            var unit = currentUnit();
            var node = nodeStack.current();
            var nodeType;
            var parser;

            while ( 1 ) {
                nodeType = node.type;
                if ( nodeType == 'if' || nodeType == 'elif' ) {
                    node = {
                        type  : 'else',
                        block : []
                    };
                    nodeStack.current()[ 'else' ] = node;
                    break;
                }

                node = nodeStack.pop();
            }
            pushNode( node );

            while ( ( unit = nextUnit() ) ) {
                if ( unit.endTag ) {
                    prevUnit();
                    return;
                }

                switch ( unit.type ) {
                case 'target':
                case 'master':
                    popNode();
                    prevUnit();
                    return;
                case 'contentplaceholder':
                case 'content':
                case 'else':
                case 'elif':
                    throw getError();
                default:
                    parser = astParser[ unit.type ];
                    parser && parser();
                    break;
                }
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
