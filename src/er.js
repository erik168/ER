/*
 * ER (Enterprise RIA)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    er.js
 * desc:    er(ecom ria)是一个用于支撑富ajax应用的框架
 * author:  erik
 * depend:  baidu.json.parse, 
 *          baidu.json.stringify, 
 *          baidu.g, 
 *          baidu.ajax.request,
 *          baidu.extend, 
 *          baidu.object.clone, 
 *          baidu.ie, 
 *          baidu.browser.firefox
 */

var er = function () {
    /*
     * 预声明
     */
    var locator_,           // 声明定位器
        controller_,        // 声明控制器
        context_,           // 声明上下文数据管理器
        template_,          // 声明模板解析器
        stateHolder_,       // 声明状态保持器
        permission_,        // 声明权限管理器
        Action_,            // 声明Action的构造器
        ActionBase_,        // 声明Action基础功能base
        ActionBaseX_ = {},  // 声明Action扩展对象
        ActionX_,           // 声明Action扩展原型对象构造器
        Module_;            // 声明模块构造器 
    
    /**
     * 简易的模板解析器
     */
    template_ = function () {
        var container = {},
            isLoaded;

        /**
         * 解析模板变量的值
         * 
         * @private
         * @param {string} varName 变量名
         * @param {string} privateContextId 私用context环境的id
         * @return {string}
         */
        function parseVariable( varName, privateContextId ) {
            var match = varName.match( /:([a-z]+)$/ );

            if ( match && match.length > 1 ) {
                return parseVariableByType( varName.replace(/:[a-z]+$/i, ''), match[1] );
            } else {
                var variable = context_.get( varName, privateContextId );
                if ( hasValue( variable ) ) {
                    return variable;
                }
            }
            
            return '';
        }
        
        /**
         * 解析带有类型的模板变量的值
         * 
         * @private
         * @param {string} varName 变量名
         * @param {string} type 变量类型，暂时为lang|config
         * @return {string}
         */
        function parseVariableByType( varName, type ) {
            var packs           = varName.split('.'),
                len             = packs.length - 1,
                topPackageName  = packs.shift(),
                win             = window,
                objOnDef        = getConfig('DEFAULT_PACKAGE'),
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

            if ( hasValue( objOnDef ) ) {
                return objOnDef;
            } else if ( hasValue( objOnSelf ) ) {
                return objOnSelf;
            } else if ( hasValue( objOnBase ) ) {
                return objOnBase;
            }
            
            return '';
        }
        
        // 返回暴露的方法
        return {
            /**
             * 获取指定模板target的HTML片段
             * 
             * @public
             * @param {string} target
             * @return {string}
             */
            get: function ( target ) {
                return container[ target ] || '';
            },
            
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
                    output.innerHTML = template_.get( tplName ).replace(
                        /\$\{([.:a-z0-9_]+)\}/ig,
                        function ( $0, $1 ) {
                            return parseVariable( $1, opt_privateContextId );
                        });
                }
            },
            
            /**
             * 加载外部模板
             * 
             * @public
             */
            load: function () {
                var list    = getConfig('TEMPLATE_LIST'),
                    len     = list instanceof Array && list.length,
                    tplBuf  = [],
                    i       = 0;
                    
                if ( len && !isLoaded ) {
                    isLoaded = 1;
                    loadTemplate();
                } else {
                    initER();
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
                        template_.parse( tplBuf.join('') );
                        initER();
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
                    baidu.ajax.request(list[i], {
                        'method'   : 'get',
                        'onsuccess': successCallback,
                        'onfailure': loadedCallback
                    });
                }
            },
            
            /**
             * 解析模板
             * 
             * @public
             * @param {string} source 模板源
             */
            parse: function ( source ) {
                var lines       = source.split( /\r?\n/ ),
                    linesLen    = lines.length,
                    linesIndex  = 0,
                    targetStartRule = /<!--\s*target:\s*([a-zA-Z0-9]+)\s*-->/, 
                    targetEndRule   = /<!--\s*\/target\s*-->/,                  
                    importRule      = /<!--\s*import:\s*([a-zA-Z0-9]+)\s*-->/,
                    key,
                    line,
                    segment,
                    current = [],
                    currentName, tempName,
                    currentContainer = {};
                    
                // 逐行读取解析target
                for ( ; linesIndex < linesLen; linesIndex++ ) {
                    line = lines[ linesIndex ];
                    
                    if ( line.length <= 0 ) {
                        continue;
                    }
                    
                    if ( targetStartRule.test( line ) ) {
                        // 开始target的读取
                        tempName = RegExp.$1;
                        segment = line.split( targetStartRule );
                        addLine( segment[0] );
                        addTpl();
                        current = [];
                        currentName = tempName;
                        addLine( segment[ 2 ] );
                    } else if ( targetEndRule.test( line ) ) {
                        // 结束target的读取
                        segment = line.split( targetEndRule );
                        addLine( segment[ 0 ] );
                        addTpl();
                        
                    } else {
                        addLine( line );
                    }
                }
                addTpl();
                
                // 解析import
                for ( key in currentContainer ) {
                    container[ key ] = parseImport( currentContainer[ key ] );
                }
                
                /**
                 * 解析import
                 * 
                 * @inner
                 * @param {string} source
                 */
                function parseImport( source ) {
                    if ( importRule.test( source ) ) {
                        return parseImport(source.replace(importRule, 
                            function ( $0, $1 ) {
                                return currentContainer[ $1 ] || container[ $1 ] || '';
                            }
                        ));
                    }
                    
                    return source;
                }
                
                /**
                 * 向临时容器里添加行
                 * 
                 * @inner
                 * @param {Object} str
                 */
                function addLine( str ) {
                    if ( str && currentName ) {
                        current.push( str );
                    }
                }
                
                /**
                 * 将当前读出字符添加到模板变量
                 * 
                 * @inner
                 */
                function addTpl() {
                    if ( currentName ) {
                        currentContainer[ currentName ] = current.join('\n');
                    }
                    currentName = null;
                }
            }
        };
    }();
    
    /**
     * Hash定位器
     * 
     * @desc
     *      Locator = [ path ] [ ~ query ]
     *      path    = "/" [ *char *( "/" *char) ]
     *      query   = *qchar
     *      char    = ALPHA | DIGIT
     *      qchar   = char | "&" | "="
     */
    locator_ = function () {
        var currentPath     = '',
            currentQuery    = '',
            currentLocation = '',
            IFRAME_CONTENT  = "<html><head></head><body>"
                + "<script type=\"text/javascript\">"
                + "var path = \"#{0}\";"
                + "var query = #{1};"
                + "var loc = \"#{2}\";"
                + "parent.er.locator._updateHash(loc);"
                + "parent.er.controller.forward(path, query, loc);"
                + "window.onload = function () {document.getElementById('save').value = loc;};"
                + "</script><input type=\"text\" id=\"save\"></body></html>";
        
        /**
         * 获取location信息
         * 
         * @public
         * @return {string}
         */
        function getLocation() {
            var hash = location.hash;
            if ( hash ) {
                return hash.replace( /^#/, '' );
            }
            
            return '';
        }
        
        /**
         * 更新hash信息
         *
         * @private
         * @param {string} loc
         */
        function updateLocation( loc ) {
            var locResult   = parseLocation( loc ),
                path        = locResult.path,
                query       = locResult.query,
                historyList,
                historyInput,
                isOldLoc,
                i, 
                len;
            
            if ( baidu.ie ) {
                historyInput = baidu.g( getConfig( 'CONTROL_INPUT_ID' ) );

                if ( historyInput ) {
                    if ( !/(~|&)_ietag=([a-z0-9]+)(&|$)/.test( loc ) ) {
                        if ( loc.indexOf('~') > 0 ) {
                            loc += '&';
                        } else {
                            loc += '~';
                        }
                        
                        loc += '_ietag=' + random();
                    }

                    historyList = baidu.json.parse( historyInput.value );

                    for ( i = 0, len = historyList.length; i < len; i++ ) {
                        if ( historyList[ i ].loc == loc ) {
                            isOldLoc = i;
                            break;
                        }
                    }

                    if ( typeof isOldLoc != 'number' ) {
                        historyList.push({
                            path:path, 
                            query:query, 
                            loc:loc
                        });
                    } else {
                        randomMap_[ RegExp.$2 ] = 1;
                    }

                    historyInput.value = baidu.json.stringify( historyList );
                }
            }
            
            // 存储当前信息
            currentPath = path;
            currentQuery = query;
            currentLocation = loc;
            location.hash = loc;

            return true;
        }

        /**
         * 控制定位器转向
         * 
         * @public
         * @param {string} loc location位置
         */
        function redirect( loc ) {
            // 空string和非string不做处理
            if ( !loc || typeof loc != 'string' ) {
                return;
            }
            
            // 增加location带起始#号的容错性
            // 可能有人直接读取location.hash，经过string处理后直接传入
            loc = loc.replace( /^#/, '' );

            // 未设置path时指向当前path
            if ( /^~/.test( loc ) ) {
                loc = currentPath + loc
            }
            
            // 如果locacion中包含encodeURI过的字符
            // firefox会自动decode，造成传入的loc和getLocation结果不同
            // 所以需要提前写入，获取真实的hash值
            if ( baidu.browser.firefox ) {
                location.hash = loc;
                loc = getLocation();
            }  

            // 与当前location相同时不进行转向
            updateLocation( loc );
            /*if (!updateHash(loc)) {
                return;
            }*/

            loc = currentLocation;
            // 触发onredirect事件
            locator_.onredirect();
            
            // ie下使用中间iframe作为中转控制
            // 其他浏览器直接调用控制器方法
            if ( baidu.ie ) {
                ieForword( currentPath, currentQuery, loc );
            } else {
                controller_.forward( currentPath, currentQuery, loc );
            }
        }
        
        /**
         * IE下调用控制器forword
         * 
         * @private
         * @param {Object} path 路径
         * @param {Object} query 查询条件
         * @param {string} loc 定位器
         */
        function ieForword( path, query, loc ) {
            var iframe = baidu.g( getConfig( 'CONTROL_IFRAME_ID' ) ),
                iframeDoc = iframe.contentWindow.document;

            iframeDoc.open( 'text/html' );
            iframeDoc.write(
                baidu.format(
                    IFRAME_CONTENT, 
                    escapeIframeContent( path ), 
                    (query ? '"' + escapeIframeContent( query ) + '"' : 'null'), 
                    escapeIframeContent( loc )
                ));
            iframeDoc.close();
        }

        /**
         * iframe内容字符串的转义
         *
         * @private
         * @param {string} 源字符串
         * @return {string}
         */
        function escapeIframeContent( source ) {
            return source.replace( /\\/g, "\\\\" ).replace( /\"/g, "\\\"" );
        }

        /**
         * 解析location
         * 
         * @private
         * @param {Object} loc
         */
        function parseLocation( loc ) {
            loc = loc.replace( /^#/, '' );
            var pair = loc.match( /^([^~]*)(~(.*))?$/ ),
                re = {};
                
            re.path  = pair[ 1 ] || getConfig( 'DEFAULT_INDEX' );
            re.query = (pair.length == 4 ? pair[ 3 ] : '');
            return re;
        }
        
        /**
         * 获取参数集合
         * 
         * @return {Object}
         */
        function getQueryMap() {
            return parseQuery( currentQuery );
        }
        
        /**
         * 将参数解析为Map
         * 
         * @public
         * @param {string} query 参数字符串
         * @return {Object}
         */
        function parseQuery( query ) {
            query = query || '';
            var params      = {},
                paramStrs   = query.split( '&' ),
                len         = paramStrs.length,
                item,
                value;
    
            while ( len-- ) {
                item = paramStrs[ len ].split( '=' );
                value = item[ 1 ];
                
                // firefox在读取hash时，会自动把encode的uri片段进行decode
                if ( !baidu.browser.firefox ) {
                    value = decodeURIComponent( value );
                }
                
                params[ item[ 0 ] ] = value;
            }
            
            return params;
        }
        
        /**
         * 获取location的path
         * 
         * @return {string}
         */
        function getPath() {
            return currentPath;
        }
        
        /**
         * 获取location的query
         * 
         * @return {string}
         */
        function getQuery() {
            return currentQuery;
        }  
        
        /**
         * 初始化locator
         */
        function init() {
            // 初始化默认的index
            if ( !getLocation() ) {
                location.hash = getConfig( 'DEFAULT_INDEX' );
            }

            /**
             * @private
             */
            function changeListener() {
                var loc = getLocation();
                if ( loc != currentLocation ) {
                    locator_.redirect(loc);
                }
            }
            
            if ( baidu.ie ) {
                ieIframeRecorderInit();
                ieInputRecorderInit();
            }
            
            setInterval( changeListener, 100 );
        }
        
        /**
         * ie下用于记录与历史数据的input初始化
         *
         * @private
         */
        function ieInputRecorderInit() {
            var input      = baidu.g( getConfig( 'CONTROL_INPUT_ID' ) ),
                currentLoc = location.hash.replace( /^#/, '' ),
                currentIndex,
                historyList,
                i, len, item;

            if ( !input ) {
                return;
            }
            
            input.value = input.value || '[]';
            historyList = baidu.json.parse( input.value );
            
            // 记录一遍ietag
            for ( i = 0, len = historyList.length; i < len; i++ ) {
                item = historyList[ i ];
                if ( /_ietag=([a-z0-9]+)(&|$)/.test( item.loc ) ) {
                    randomMap_[ RegExp.$1 ] = 1;
                }
            }

            controller_._enable( 0 );
            for ( i = 0; i < len; i++ ) {
                item = historyList[ i ];
                if ( item.loc == currentLoc ) {
                    currentIndex = i;
                    (i == len - 1) && controller_._enable( 1 );
                }
                ieForword( item.path, item.query, item.loc );
            }

            controller_._enable( 1 );
            i -= ( currentIndex + 1 );
            i && history.go( -i );
        }

        /**
         * ie下用于记录与控制跳转的iframe初始化
         *
         * @private
         */
        function ieIframeRecorderInit() {
            // 具有input记录历史信息的时候
            // 历史行为iframe的id需要变更
            // 避免先前的历史被保存
            if ( baidu.g( getConfig( 'CONTROL_INPUT_ID' ) ) ) {
                er.config.CONTROL_IFRAME_ID = getConfig('CONTROL_IFRAME_ID') + (new Date).getTime();
            } 

            ieIframeRecorderCreate();
        }
        
        /**
         * ie下创建记录与控制跳转的iframe
         *
         * @private
         */
        function ieIframeRecorderCreate() {
            var iframe = document.createElement('iframe'),
                size   = 200,
                pos    = '-1000px';

            iframe.id       = getConfig( 'CONTROL_IFRAME_ID' );
            iframe.width    = size;
            iframe.height   = size;
            iframe.src      = "about:blank";

            iframe.style.position   = "absolute";
            iframe.style.top        = pos;
            iframe.style.left       = pos;

            document.body.appendChild(iframe);
        }

        // 返回暴露的方法
        return {
            'redirect'          : redirect,
            'getPath'           : getPath,
            'getQuery'          : getQuery,
            'getLocation'       : getLocation,
            'getQueryMap'       : getQueryMap,
            'parseQuery'        : parseQuery,
            'init'              : init,
            '_updateHash'       : updateLocation,
            'onredirect'        : new Function()
        };
    }();
    
    /**
     * 控制器
     * 
     * @desc
     *      控制器负责将对应的path转向给相应的action对象处理
     */
    controller_ = function () {
        var contextContainer = {},
            configContainer  = {},
            mainActionContext,
            currentPath,
            currentLocation,
            _isEnable = 1;
    
        
        /**
         * 跳转视图
         * 
         * @public
         * @param {Object} path 路径
         * @param {Object} query 查询条件
         * @param {string} loc 定位器
         */
        function forward( path, query, loc ) {
            if ( !_isEnable ) { 
                return; 
            }

            // location相同时不做forward
            if ( loc == currentLocation ) {
                return;
            }
            
            var arg = {  // 组合所需的argument对象
                    type     : 'main',
                    referer  : currentLocation,
                    queryMap : locator_.parseQuery( query ) || {},
                    path     : path,
                    domId    : getConfig( 'MAIN_ELEMENT_ID' )
                },
                actionConfig,
                actionAuth;  
            
            // path未发生变化时，不卸载和重新加载
            if ( path == currentPath ) {
                arg.refresh = true;
                mainActionContext && ( mainActionContext.enter( arg ) );
            } else {
                unloadAction( mainActionContext );
                mainActionContext   = null;
                currentPath         = null;
                currentLocation     = null;
                
                // 查找action配置
                actionConfig = getActionConfigByPath( path );
                if ( !actionConfig ) {
                    throw new Error('ER: the path "' + path + '" cannot bind to action.');
                    return;
                }
                actionAuth = actionConfig.authority;
                
                // 权限判断
                if ( actionAuth && !permission_.isAllow( actionAuth ) ) {
                    locator_.redirect( actionConfig.noAuthLocation || getConfig('DEFAULT_INDEX') );
                    return;
                }
                
                // 记录当前的path
                currentPath = path; 
                
                // 加载action
                mainActionContext = loadAction( findAction( actionConfig.action ), arg );
            }

            // 记录当前的locator    
            currentLocation = loc;   
        }
        
        /**
         * 根据path获取action配置
         * 
         * @public
         * @param {string} path
         * @return {Object}
         */
        function getActionConfigByPath( path ) {
            return configContainer[ path ];
        }

        /**
         * 加载action
         * 
         * @private
         * @param {Object} action action对象
         * @param {Object} arg 加载action的参数
         */
        function loadAction( action, arg ) {
            if ( action && action.prototype.__action__ ) {
                var actionContextId = random(),
                    actionContext;
                
                
                actionContext = new action( actionContextId );
                contextContainer[ actionContextId ] = actionContext;
                actionContext.enter( arg );
                
                return actionContext;
            }

            return null;
        }

        
        /**
         * 卸载action
         * 
         * 重置会话。卸载控件并清除显示区域内容
         * @private
         */
        function unloadAction( context ) {
            if ( !context ) {
                return;
            }
            
            context.leave();
            delete contextContainer[ context._contextId ];
        }

        /**
         * 初始化controller
         * 
         * @public
         */
        function init() {
            var i   = 0, 
                len = moduleContainer.length,
                j, len2,
                path,
                module, actions, actionConfig;
            
            for ( ; i < len; i++ ) {
                module = moduleContainer[ i ];
                
                // 初始化module
                if ( 'function' == typeof module.init ) {
                    module.init();
                }
                
                // 注册action
                actions = module.config && module.config.action;
                if ( actions ) {
                    for ( j = 0, len2 = actions.length; j < len2; j++ ) {
                        actionConfig = actions[ j ];
                        path = actionConfig.path;
                        
                        configContainer[ path ] = actionConfig;
                    }
                }
            }
        }
        
        /**
         * 查找获取Action对象
         * 
         * @private
         * @param {string|Object} actionName action的对象路径 | action配置对象
         */
        function findAction( actionName ) {
            if ( !actionName ) {
                return null;
            } else if ( 'object' == typeof actionName ) {
                actionName = actionName.action;
            }
            
            var action = window,
                props = actionName.split('.'),
                i, len;
            
            for ( i = 0, len = props.length; i < len; i++ ) {
                action = action[ props[ i ] ];
                if ( !action ) {
                    action = null;
                    break;
                }
            }
            
            return action;
        }
        
        /**
         * 载入子action
         * 
         * @public
         * @param {string} domId 加载action的容器元素id
         * @param {string|Object} actionName action的对象路径 | action配置对象
         * @param {Object} opt_argMap 一些可选的arg参数
         */
        function loadSub( domId, actionName, opt_argMap ) {
            if ( !_isEnable || !actionName ) { 
                return null; 
            }

            var action = actionName,
                arg = {type: 'sub', domId: domId};
            
            if ( typeof action == 'string'
                 || (typeof action == 'object' && action.action)
            ) {
                action = findAction( action );
            }
            
            if ( opt_argMap ) {
                baidu.extend( arg, opt_argMap );
            }
                
            return loadAction(action, arg);
        }

        /**
         * 通过path载入子action
         * 
         * @public
         * @param {string} domId 加载action的容器元素id
         * @param {string} path 要加载的path，path需要在module中配置过action
         * @param {Object} opt_argMap 一些可选的arg参数
         */
        function loadSubByPath( domId, path, opt_argMap ) {
            var actionConfig = getActionConfigByPath( path );
            if ( !actionConfig ) {
                throw new Error('ER: the path "' + path + '" cannot bind to action.');
                return null;
            }

            return loadSub( domId, actionConfig, opt_argMap );
        }
        
        /**
         * 触发Action的事件
         *
         * @protected
         * @param {string} type 事件名
         * @param {Any} eventArg 事件对象
         * @param {string} opt_contextId action的contextid
         */
        function fireActionEvent( type, eventArg, opt_contextId ) {
            var actionCtx;
            if ( opt_contextId ) {
                actionCtx = contextContainer[ opt_contextId ];
            } else {
                actionCtx = mainActionContext;
            }

            actionCtx && actionCtx.fireEvent( type, eventArg );
        }
        
        /**
         * 设置控制器可用状态
         *
         * @inner
         * @param {boolean} isEnable
         */
        function enable( isEnable ) {
            _isEnable = isEnable;
        }

        return {
            forward                 : forward,
            init                    : init,
            _enable                 : enable,
            loadSub                 : loadSub,
            loadSubByPath           : loadSubByPath,
            unloadSub               : unloadAction,
            fireMain                : function (type, eventArg) {fireActionEvent(type, eventArg);}
        };
    }();
    
    var moduleContainer = [];
    
    /**
     * 模块构造器
     * 
     * @param {Object} mod 模块对象
     */
    Module_ = function ( mod ) {
        moduleContainer.push( mod );
        return mod;
    };
    
    
    /**
     * Action基础功能
     */
    ActionBase_ = {
        /**
         * 标识action
         *
         * @private
         */
        __action__: 1,

        /**
         * 进入当前action
         * 
         * @protected
         * @desc
         *      render与repaint时都从enter入口，只有path离开才leave
         *      来易来，去难去……
         * @param {Object} arg 进入的参数
         */
        enter: function ( arg ) {
            var me = this;
           
            arg = arg || {};
            // 保存argMap    
            me.arg = arg; 
            
            this.__fireEvent( 'enter' );
            
            // 重置会话上下文
            context_.addPrivate( me._contextId );
            
            // 初始化context
            me.__beforeinitcontext();
            me.initContext( callback );
            
            /**
             * 初始化context后的回调，用于绘制主区域或重绘控件
             * 
             * @inner
             */
            function callback() {
                me.__afterinitcontext();
                if ( arg.refresh ) {
                    me.__beforerepaint();
                    me.repaint();
                    me.__afterrepaint();
                } else {
                    me.__beforerender();
                    me.render();
                    me.__afterrender();
                }
                me.__entercomplete();
            }
        },
        
        /**
         * 开始重绘前的内部行为
         *
         * @protected
         */      
        __beforerender: function () {
            this.__fireEvent( 'beforerender' );
        },
        
        /**
         * 重绘完成后的内部行为
         *
         * @protected
         */      
        __afterrender: function () {
            this.__fireEvent( 'afterrender' );
        },

        /**
         * 开始重绘前的内部行为
         *
         * @protected
         */      
        __beforerepaint: function () {
            this.__fireEvent( 'beforerepaint' );
        },

        /**
         * 重绘完成后的内部行为
         *
         * @protected
         */      
        __afterrepaint: function () {
            this.__fireEvent( 'afterrepaint' );
        },

        /**
         * context初始化完成后的内部行为
         *
         * @protected
         */      
        __afterinitcontext: function () {
            this.__fireEvent( 'afterinitcontext' );
        },

        /**
         * context初始化前的内部行为
         *
         * @protected
         */      
        __beforeinitcontext: function () {
            this.__fireEvent( 'beforeinitcontext' );
        },

        /**
         * enter完成的内部行为
         *
         * @protected
         */
        __entercomplete: function () {
            this.__fireEvent( 'entercomplete' );
        },

        RESERVE_EVENT: {
            'enter'             : 1,
            'leave'             : 1,
            'entercomplete'     : 1,
            'beforeinitcontext' : 1,
            'afterinitcontext'  : 1,
            'beforerender'      : 1,
            'afterrender'       : 1,
            'beforerepaint'     : 1,
            'afterrepaint'      : 1
        },

        /**
         * 自定义事件触发
         *
         * @public
         * @param {string} type 事件名
         * @param {Any} eventArg 事件对象
         */
        fireEvent: function ( type, eventArg ) {
            type = type.replace( /^on/i, '' );
            if ( this.RESERVE_EVENT[ type ] ) {
                throw new Error("ER: Reserve event cannot fire manually.");
                return;
            }

            this.__fireEvent( type, eventArg );
        },
        
        /**
         * 事件触发的内部方法
         *
         * @private
         * @param {string} type 事件名
         * @param {Any} eventArg 事件对象
         */
        __fireEvent: function ( type, eventArg ) {
            type = type.replace( /^on/i, '' );

            eventHandler = this[ 'on' + type ];
            if ( typeof eventHandler == 'function' ) {
                eventHandler.call( this, eventArg );
            }

            if ( this.RESERVE_EVENT[ type ] ) {
                eventHandler = Action_[ 'on' + type ];
                if ( typeof eventHandler == 'function' ) {
                    eventHandler.call( this, eventArg );
                }
            }
        },
        
        /**
         * 初始化context
         * 
         * @prtected
         * @param {Object} argMap 初始化的参数
         * @param {Function} callback 初始化完成的回调函数
         */
        initContext: function ( callback ) {
            var me          = this,
                arg         = me.arg,
                path        = arg.path,
                queryMap    = arg.queryMap,
                ignoreState = me.IGNORE_STATE || (queryMap && queryMap.ignoreState),
                initerMap   = me.CONTEXT_INITER_MAP,
                initerList  = [],
                i           = -1,
                len         = 0,
                currState   = {},
                stateSaved  = stateHolder_.get( path ) || {},
                stateMap    = me.STATE_MAP || {},
                key, stateValue;
            
            // 先将query中的key/value装入context
            for ( key in queryMap ) {
                me.setContext( key, queryMap[ key ] );
            }
            
            /**
             * 获取state值
             * 
             * @inner
             */
            function getState( key ) {
                if ( hasValue( queryMap[ key ] ) ) {
                    return queryMap[ key ];
                } else if ( !ignoreState && hasValue( stateSaved[ key ] ) ) {
                    return stateSaved[ key ];
                }
                return stateMap[ key ];
            }
            
            // 初始化状态相关的context 
            for ( key in stateMap ) {
                stateValue = getState( key );
                currState[ key ] = stateValue;
                me.setContext( key, stateValue );
            }
            
            // 保持状态写入
            !ignoreState && ( stateHolder_.set( path, currState ) );
            
            // 初始化context initer函数的列表
            for ( key in initerMap ) {
                initerList.push( key );
                len++;
            }
            
            // 开始初始化action指定的context
            repeatCallback();
            
            /**
             * Context初始化的回调函数
             * 
             * @private
             */
            function repeatCallback() {
                i++;
                
                if ( i < len ) {
                    initerMap[ initerList[ i ] ].call( me, repeatCallback );
                } else {
                    callback();
                }
            }
        },
        
        /**
         * 绘制当前action的显示
         * 
         * @protected
         * @param {HTMLElement} dom 绘制区域的dom元素
         */
        render: renderAction_,
        
        /**
         * 重新绘制当前action的显示
         * 
         * @protected
         */
        repaint: renderAction_,
        
        /**
         * action使用的设置context
         * 
         * @protected
         * @param {string} key context名
         * @param {Object} value
         */
        setContext: function ( key, value ) {
            context_.set( key, value, this._contextId );
        },
        
        /**
         * 获取context，可获取action所处私有环境的context
         * 
         * @protected
         * @param {string} key context名
         */
        getContext: function ( key ) {
            return context_.get( key, this._contextId );
        },
        
        /**
         * 从context中获取请求参数字符串
         * 用于参数自动拼接
         * 
         * @protected
         * @param {Object} opt_queryMap 参数表
         * @return {string}
         */
        getQueryByContext: function ( opt_queryMap ) {
            var queryMap = opt_queryMap || this.CONTEXT_QUERY_MAP,
                buffer   = [],
                value,
                key;
                
            if ( queryMap ) {
                for ( key in queryMap ) {
                    value = this.getContext( queryMap[ key ] );
                    if ( hasValue( value ) ) {
                        buffer.push( key + '=' + encodeURIComponent( value ) );
                    }
                }
                
                return buffer.join( '&' );
            }
            
            return '';
        },
        
        /**
         * 刷新当前action页面
         * 
         * @protected
         * @param {Object} opt_extraMap 额外参数表,(KV)queryName/contextName
         */
        refresh: function ( opt_extraMap ) {
            opt_extraMap = opt_extraMap || {};
            var key, 
                cxtKey,
                path     = this.arg.path,
                stateMap = this.STATE_MAP,
                buffer   = [],
                value;
            
            // 自动组装state对应的context    
            for ( key in stateMap ) {
                value = this.getContext( key );
                if ( !hasValue( value ) ) {
                    value = '';
                }
                buffer.push( key + '=' + encodeURIComponent( value ) );
            }
            
            // 额外参数表的组装  
            for ( key in opt_extraMap ) {
                cxtKey = opt_extraMap[ key ];
                if ( typeof cxtKey == 'string' ) {
                    value = this.getContext( cxtKey );
                    if ( !hasValue( value ) ) {
                        value = '';
                    }
                    
                    buffer.push( key + '=' + encodeURIComponent( value ) );
                }
            }
            
            buffer.push( '_r=' + random() );
            locator_.redirect( '~' + buffer.join('&') );
        },

        /**
         * 重置状态值
         * 
         * @protected
         * @param {string} opt_name 需要重置的状态名，不提供时重置所有状态
         */
        resetState: function ( opt_name ) {
            var stateMap = this.STATE_MAP;
            
            if ( !opt_name ) {
                for ( var key in stateMap ) {
                    this.setContext( key, stateMap[ key ] );
                }
            } else {
                this.setContext( opt_name, stateMap[ opt_name ] );
            }
        },
        
        /**
         * 返回上一个location
         * 
         * @protected
         */
        back: function () {
            var arg = this.arg,
                referer = arg && arg.referer;
                
            if ( arg.type != 'main' ) {
                return;
            }
            
            // 沿路返回或返回配置的location
            if ( !referer || this.USE_BACK_LOCATION ) {
                referer = this.BACK_LOCATION;
            }
            locator_.redirect( referer );
        },
        
        /**
         * 离开当前action
         * 
         * @protected
         */
        leave: function () {
            this.__fireEvent( 'leave' );
            
            this.dispose();
        },
        
        
        /**
         * 执行离开时的清理动作
         * 
         * @protected
         */
        dispose: function () {
            // 释放context
            context_.removePrivate( this._contextId );
            
            // 清空主区域
            var dom = baidu.g( this.arg.domId );
            dom && ( dom.innerHTML = '' );
        }
    }; 
    
    /**
     * 绘制Action的函数
     * 
     * @inner
     * @desc
     *      挂接到ActionBase中，因为重复挂接而声明在外部
     */
    function renderAction_() {
        var me   = this,
            arg  = me.arg,
            dom  = baidu.g( arg.domId ),
            view = me.VIEW;
        
        // 获取view
        switch ( typeof view ) {
        case 'object':
            view = view[ arg.type ];
            break;
        case 'function':
            view = view.call( me );
            break;
        default:
            view = String( view );
            break;
        }
        
        template_.merge( dom, view, me._contextId );
    }
    
    /**
     * Action类
     * 
     * @desc 
     *      实现action的加载与重绘以及常用列表页与表单页的基础功能
     * @param {Object} obj 业务action功能对象
     * @param {string} opt_name action名，加载默认action的基础功能
     */
    Action_ = function ( obj, opt_name ) {
        var base = opt_name ? ( ActionBaseX_[ opt_name ] || ActionBase_ ) : ActionBase_,
            clazz = function ( contextId ) {
                this._contextId = contextId;
                baidu.extend(this, obj);
            };
        
        clazz.prototype = base;
        base = null;
        
        return clazz;
    };
    
    // 将基础功能挂接到Action的prototype中，暴露基类方法
    // 为了Action扩展能调用基类方法
    Action_.prototype = baidu.object.clone( ActionBase_ );
    
    // 初始化Action扩展原型对象构造器
    ActionX_ = new Function();
    ActionX_.prototype = ActionBase_;

    /**
     * 扩展Action的功能
     * 
     * @public
     * @param {Object} obj 扩展的功能对象
     * @param {string} opt_name 扩展别名，不提供则扩展默认Action
     */
    Action_.extend = function ( obj, opt_name ) {
        var key, 
            base = ActionBase_;
        
        if ( opt_name ) {
            base = ActionBaseX_[ opt_name ];
            if ( !base ) {
                base = new ActionX_();
                ActionBaseX_[ opt_name ] = base;
            }
        }
        
        for ( key in obj ) {
            base[ key ] = obj[ key ];
        }
    };
    
    
    /**
     * 运行时的上下文数据管理器
     * 
     * @desc
     *      context为上下文数据提供环境，分为public,private两个级别
     */
    context_ = function () {
        var publicContext = {},    // public级别数据容器
            privateContext = {};   // private级别数据容器

        return {
            /**
             * 设置应用环境上下文
             * 
             * @public
             * @param {string|Object} name 环境变量名
             * @param {Any} value 环境变量值
             * @param {string} opt_contextId 环境id
             */
            set: function ( name, value, opt_contextId ) {
                var context = opt_contextId ? privateContext[ opt_contextId ] : publicContext;
                
                if ( !context ) {
                    throw new Error('ER: private context "' + opt_contextId + '" is not exist.');
                }
                context[ name ] = baidu.object.clone( value );
            },
            
            /**
             * 增加私有环境
             * 
             * @param {string} contextId 环境标识
             */
            addPrivate: function ( contextId ) {
                !privateContext[ contextId ] && ( privateContext[ contextId ] = {} );
            },
            
            /**
             * 移除私有环境
             * 
             * @param {string} contextId 环境标识
             */
            removePrivate: function ( contextId ) {
                delete privateContext[ contextId ];
            },
            
            /**
             * 获取上下文环境变量
             * 
             * @public
             * @param {string} name 上下文变量名
             * @param {string} opt_contextId 环境id
             * @return {string}
             */
            get: function ( name, opt_contextId ) {
                var value,
                    priv;
                    
                if ( 'string' == typeof opt_contextId ) { 
                    priv = privateContext[ opt_contextId ];
                    value = priv[ name ];
                }
                
                if ( hasValue( value ) ) {
                    return value;
                }
                
                value = publicContext[ name ];
                if ( hasValue( value ) ) {
                    return value;
                }
        
                return null;
            }
        };
    }();
    
    /**
     * 状态保持器
     * 
     * @desc
     *      状态保持器能根据path保持相关Context狀態
     */
    stateHolder_ = (function () {
        var stateMap = {};

        return {
            /**
             * 获取状态
             * 
             * @public
             * @param {string} path 状态名
             * @return {Object}
             */
            'get': function ( path ) {
                return stateMap[ path ] || null;
            },
            
            /**
             * 设置状态
             * 
             * @public
             * @param {string} key 状态名
             * @param {Object} state 状态對象
             */
            'set': function ( path, state ) {
                stateMap[ path ] = state;
            }
        };
    })();
    
    /**
     * 权限管理器
     * 
     * @desc
     *      权限管理器为页面提供了是否允许访问的权限控制，也能通过isAllow方法判断是否拥有权限。
     */
    permission_ = function () {
        var permissible = {};
        
        return {
            /**
             * 初始化权限数据
             * 
             * @public
             * @param {Object} data 权限数据
             */
            init: function ( data ) {
                var key, item;

                for ( key in data ) {
                    item = data[ key ];

                    if ( 'object' == typeof item ) {
                        permission_.init( item );
                    } else if ( item ) {
                        permissible[ key ] = item;
                    }
                }
            },
            
            /**
             * 判断是否拥有权限
             * 
             * @public
             * @param {string} name 权限名
             * @return {boolean}
             */
            isAllow: function ( name ) {
                return !!permissible[ name ];
            }
        };
    }();
    
    /**
     * 框架功能加载
     * 
     * @inner
     */
    function initER() {
        er.oninit();
        controller_.init();
        locator_.init();
    }
    
    /**
     * 获取配置信息
     * 
     * @inner
     * @param {string} name 配置项名称
     * @return {string}
     */
    function getConfig( name ) {
        var cfg = er.config,
            // 配置默认值
            defaultCfg = {         
                CONTROL_IFRAME_ID   : 'ERHistroyRecordIframe',
                CONTROL_INPUT_ID    : 'ERHistoryRecordInput',
                DEFAULT_INDEX       : '/',
                MAIN_ELEMENT_ID     : 'Main'
            },
            value = cfg[ name ];
        
        if ( !hasValue( value ) ) {
            value = defaultCfg[ name ] || null;
        }    
        
        return value;
    }
    
    /**
     * 判断变量是否有值。null或undefined时返回false
     * 
     * @param {Any} variable
     * @return {boolean}
     */
    function hasValue( variable ) {
        return !(variable === null || typeof variable == 'undefined');
    }
    
    var randomMap_ = {};
    
    /**
     * 获取不重复的随机串
     * 
     * @param {number} 随机串长度
     * @return {string}
     */
    function random( len ) {
        len = len || 10;
        
        var chars    = "qwertyuiopasdfghjklzxcvbnm1234567890",
            charsLen = chars.length,
            len2     = len,
            rand     = "";
            
        while (len2--) {
            rand += chars.charAt( Math.floor( Math.random() * charsLen ) );
        }
        
        if ( randomMap_[ rand ] ) {
            return random( len );
        }
        
        randomMap_[ rand ] = 1;
        return rand;
    }
    
    // 返回er框架主object，暴露相应的组件
    return {
        locator     : locator_,
        controller  : controller_,
        context     : context_,
        template    : template_,
        permission  : permission_,
        Action      : Action_,
        Module      : Module_,
        init        : template_.load,
        config      : {},
        
        oninit      : new Function()
    };
}();
