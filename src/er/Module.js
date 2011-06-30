/*
 * ER (Enterprise RIA)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    er/Module.js
 * desc:    er(ecom ria)是一个用于支撑富ajax应用的框架
 */

///import er;

(function () {
    
    var moduleContainer = [];
    
    /**
     * 模块构造器
     * 
     * @public
     * @param {Object} mod 模块对象
     */
    er.Module = function ( mod ) {
        moduleContainer.push( mod );
        return mod;
    };
    
    /**
     * 获取模块列表
     * 
     * @public
     * @return {Array}
     */
    er.Module.getModuleList = function () {
        return moduleContainer;
    };
    
})();
    