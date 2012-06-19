/*
 * ER (Enterprise RIA)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    er/router.js
 * desc:    路由器
 * author:  erik
 */

///import er;

er.router = function () {
    var routes = [];

    function router( loc ) {
        var i, len, item, rule, func, matches;

        for ( i = 0, len = routes.length; i < len; i++ ) {
            item = routes[ i ];
            rule = item.loc;
            func = item.func;

            if ( rule instanceof RegExp
                 && ( matches = rule.exec( loc ) ) !== null
            ) {
                func.apply( this, matches );
                break;

            } else if ( typeof rule == 'string' 
                        && rule == loc
            ) {
                func.call( this, loc );
                break;

            }
        }
    }

    router.add = function ( rule, func ) {
        routes.push( {
            loc  : rule,
            func : func
        } );
    };

    return router;
}();
