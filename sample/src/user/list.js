/*
 * ER Sample
 * 
 * path:    src/user/list.js
 * desc:    list功能
 * author:  erik
 */


user.listModel = new er.Model({
    LOADER_LIST: [ 'listLoader', 'fieldLoader' ],

    listLoader: new er.Model.Loader( function () {
        this.stop();
        var me = this;

        baidu.ajax.get( 'data.php', function ( xhr ) {
            var data = baidu.json.parse( xhr.responseText );
            me.set( 'list', data );
            me.start();
        });
    } ),

    fieldLoader: new er.Model.Loader( function () {
        this.set( 'fields', [
            {
                title   : 'ID',
                content : 'id',
                width   : 30,
                sortable: 1
            },
            {
                title   : '名称',
                width   : 950,
                content : function ( item ) {
                    return item.name;
                }
            }
        ] );
    } )
});


user.list = new er.Action({
    model : user.listModel,
    VIEW  : 'list'
});