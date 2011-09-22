/* 建议 */
/* debug时，使用document.write的方法引入外部css */
/* 上线前或提交测试前，使用shell合并 */

document.write( '<script src="src/sample.js" type="text/javascript"></script>' );

document.write( '<script src="src/user.js" type="text/javascript"></script>' );
document.write( '<script src="src/user/model.js" type="text/javascript"></script>' );
document.write( '<script src="src/user/model/list.js" type="text/javascript"></script>' );
document.write( '<script src="src/user/list.js" type="text/javascript"></script>' );

