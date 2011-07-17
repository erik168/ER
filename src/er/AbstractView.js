/*
 * ER (Enterprise RIA)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    er/AbstractView.js
 * desc:    View的抽象类
 * author:  erik
 */

///import er.template;
///import er.context;

er.AbstractView = function () {};
    
er.AbstractView.prototype = {
    setTarget: function ( target ) {
        this.target = target;
    },

    setTemplate: function ( template ) {
        this.template = template;
    },

    setModel: function ( model ) {
        this.model = model;
    },

    render: function () {
        var target = baidu.g( this.target );
        er.template.merge( dom, this.template, this.model.getGUID() );
    },

    repaint: function () {
        this.render();
    },

    clear: function () {
    }
};

