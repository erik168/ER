/*
 * ER Sample
 * 
 * path:    src/user.js
 * desc:    声明user module
 * author:  erik
 */


var user = new er.Module({
    config: {
        action: [
            {path: '/user/list', action: 'user.list'},
            {path: '/', action: 'user.list'}
        ]
    }
});
