/*
 * ER Sample
 * 
 * path:    src/user/model/list.js
 * desc:    list的数据模型
 * author:  erik
 */


user.model.list = new er.Model( {
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

