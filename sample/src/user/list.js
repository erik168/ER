/*
 * ER Sample
 * 
 * path:    src/user/list.js
 * desc:    list功能
 * author:  erik
 */

user.list = new er.Action( {
    model : user.model.list,
    view  : 'list',

    STATE_MAP: {
        order: 'desc',
        orderBy: 'id'
    },
    
    onafterrender: function () {
        esui.get( 'ListTable' ).onsort = this.getSortHandler();
    },

    getSortHandler: function () {
        var action = this;
        
        return function ( field, order ) {
            var orderBy = field.field;
            action.model.set( 'order', order );
            action.model.set( 'orderBy', orderBy );
            action.refresh();
        };
    }
} );