/*
 * ER (Enterprise RIA)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    er/controller.js
 * desc:    控制器
 * author:  erik
 */

///import er.IAction;
///import er.Module;
///import er.permission;
///import baidu.sio.callByBrowser;
    
/**
 * 控制器
 * 
 * @desc
 *      控制器负责将对应的path转向给相应的action对象处理
 */
er.controller = function () {
    var contextContainer = {},
        configContainer  = {},
        mainActionContext,
        currentPath,
        currentLocation,
        _isEnable = 1;

    
    function authJudge( path ) {
        var actionConfig = getActionConfigByPath( path );
        if ( !actionConfig ) {
            throw new Error('ER: the path "' + path + '" cannot bind to action.');
            return;
        }
        
        var actionAuth = actionConfig.authority;
        
        // 权限判断
        if ( actionAuth && !er.permission.isAllow( actionAuth ) ) {
            return actionConfig.noAuthLocation || getConfig( 'DEFAULT_INDEX' );
        }

        return null;
    }

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
                queryMap : er.locator.parseQuery( query ) || {},
                path     : path,
                domId    : er._util.getConfig( 'MAIN_ELEMENT_ID' )
            },
            actionConfig,
            actionName,
            actionPath,
            action;  
        
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
            
            // 记录当前的path
            currentPath = path; 
            
            // 加载action
            actionName = actionConfig.action;
            action = findAction( actionName );
            actionPath = getActionPath( actionName );
            if ( action || !actionPath ) {
                _loadAction( action, arg );
            } else if ( actionPath ) {
                baidu.sio.callByBrowser( actionPath, function () {
                    _loadAction( findAction( actionName ), arg );
                });
            }
        }

        // 记录当前的locator    
        currentLocation = loc; 
        
        /**
         * 加载action
         *
         * @inner
         */
        function _loadAction( action, arg ) {
            mainActionContext = loadAction( action, arg );
        }
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
     * @param {Object} action        action对象
     * @param {Object} arg           加载action的参数
     * @param {string} opt_privateId 私有环境id
     */
    function loadAction( action, arg, opt_privateId ) {
        if ( action && action.prototype instanceof er.IAction ) {
            var actionContextId = er._util.getUID(),
                actionContext;
            
            
            arg = arg || {};
            arg._contextId = actionContextId;
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
        if ( typeof context == 'string' ) {
            context = contextContainer[ context ];
        }

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
        var moduleContainer = er.Module.getModuleList(),
            i   = 0, 
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

        var action,
            actionPath  = getActionPath( actionName ),
            arg         = {type: 'sub', domId: domId},
            privateId;
        
        // 查找action
        if ( typeof actionName == 'string' ) {
            action = findAction( actionName );
        }
        
        // 初始化arg参数
        if ( opt_argMap ) {
            baidu.extend( arg, opt_argMap );
        }
        
        // 加载action，action不存在时自动加载
        if ( action || !actionPath ) {
            return loadAction( action, arg );
        } else {
            privateId = er._util.getUID();
            baidu.sio.callByBrowser( actionPath, function () {
                loadAction( findAction( actionName ), arg, privateId );
            });

            return privateId;
        }
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

        return loadSub( domId, actionConfig.action, opt_argMap );
    }
    
    /**
     * 触发Action的事件
     *
     * @public
     * @param {string}        type              事件名
     * @param {Any}           eventArg          事件对象
     * @param {string|Object} opt_actionRuntime action的runtime id或对象
     */
    function fireActionEvent( type, eventArg, opt_actionRuntime ) {
        var actionCtx;

        if ( opt_actionRuntime ) {
            actionCtx = opt_actionRuntime;
            if ( typeof actionCtx == 'string' ) {
                actionCtx = contextContainer[ actionCtx ];
            }
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

    /**
     * 获取ACTION的路径
     * 
     * @inner
     * @param {string} ACTION ACTION的名称
     * @return {string}
     */
    function getActionPath( actionName ) {
        var rootPath        = er._util.getConfig( 'ACTION_ROOT' );
        var actionPath      = er._util.getConfig( 'ACTION_PATH' );
        var autoLoadMode    = er._util.getConfig( 'ACTION_AUTOLOAD' );
        var path = rootPath + (/\/$/.test(rootPath) ? '' : '/');
        var relatePath;

        if ( autoLoadMode ) {
            relatePath = actionPath[ actionName ]; // 查找配置项

            // 根据默认规则生成path
            if ( !relatePath ) {
                switch ( String(autoLoadMode).toLowerCase() ) {
                case 'action':  // action粒度规则
                    path += actionName.replace( /\./g, '/' ) + '.js';
                    break;
                default:        // module粒度规则
                    actionName = actionName.split('.');
                    actionName.pop();
                    path += actionName.join('/') + '.js';
                    break;
                }
            } else {
                path += relatePath;
            }

            return path;
        }

        return '';
    }

    return {
        authJudge               : authJudge,
        forward                 : forward,
        init                    : init,
        _enable                 : enable,
        loadSub                 : loadSub,
        loadSubByPath           : loadSubByPath,
        unloadSub               : unloadAction,
        fireEvent               : fireActionEvent,
        fireMain                : function (type, eventArg) {fireActionEvent(type, eventArg);}
    };
}();
    