/*
 * ER Sample
 * 
 * path:    src/user/list.js
 * desc:    list功能
 * author:  erik
 */


user.listModel = new er.Model( {
    LOADER_LIST: [ 'listLoader', 'fieldLoader' ],

    listLoader: new er.Model.Loader( function () {
        this.stop();
        var me = this;

        baidu.ajax.get( 
            'data.php?' + me.getQueryString( {
                order   : 'order',
                orderBy : 'orderBy'
            } ), 
            function ( xhr ) {
                var data = baidu.json.parse( xhr.responseText );
                me.set( 'list', data );
                me.start();
            }
        );
    } ),

    fieldLoader: new er.Model.Loader( function () {
        this.set( 'fields', [
            {
                title   : 'ID',
                field   : 'id',
                content : 'id',
                width   : 30,
                sortable: 1
            },
            {
                title   : '名称',
                field   : 'name',
                width   : 950,
                content : function ( item ) {
                    return item.name;
                }
            }
        ] );
    } )
} );


user.list = new er.Action( {
    model : user.listModel,
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
            console.log(orderBy);
            action.model.set( 'order', order );
            action.model.set( 'orderBy', orderBy );
            console.log( action );
            action.refresh();
        };
    }
} );