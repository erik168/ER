/*
 * ER (Enterprise RIA)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    er/View.js
 * desc:    视图类
 * author:  erik
 */

///import er.context;
///import er.AbstractView;
///import er.UIAdapter;
///import baidu.object.extend;
///import baidu.lang.inherits;

er.View = function () {
    var AbstractView = er.AbstractView;

    function View( options ) {
        var construct = function () {
            baidu.extend( this, options );
        };
    
        construct.prototype = View.prototype;
        return construct;
    }

    View.prototype = {
        render: function () {
            AbstractView.prototype.render.call( this );
            this._controlMap = er.UIAdapter.init(
                baidu.g( this.target ), 
                this.UI_PROP_MAP, 
                this.model.getGUID()
            );
        },

        repaint: function ( controlMap ) {
            controlMap = controlMap || this._controlMap;
        
            var key;
            var control;
            var uiAdapter = er.UIAdapter;
           
            for ( key in controlMap ) {
                control = controlMap[ key ];
                if ( control ) {
                    // 重新灌入数据
                    uiAdapter.injectData( control, this.model.getGUID() );
                    
                    // 重绘控件
                    uiAdapter.repaint( control );     
                }
            }
        },

        clear: function () {
            var controlMap = this._controlMap;

            if ( controlMap ) {
                for ( key in controlMap ) {
                    er.UIAdapter.dispose( key );
                    delete controlMap[ key ];
                }
            }
            
            this._controlMap = null;
            AbstractView.prototype.clear.call( this );
        }
    };

    baidu.inherits( View, AbstractView );

    View.extend = function ( ext ) {
        baidu.extend( View.prototype, ext || {} );
    };
 
    return View;
}();



