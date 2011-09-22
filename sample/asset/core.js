/* 建议 */
/* debug时，使用document.write的方法引入外部css */
/* 上线前或提交测试前，使用shell合并 */

/* __debug__
document.write( '<script src="../release/$((er))" type="text/javascript"></script>' );  
__debug__ */

document.write( '<script src="../src/er.js" type="text/javascript"></script>' );            // __debug__
document.write( '<script src="../src/er/_util.js" type="text/javascript"></script>' );      // __debug__
document.write( '<script src="../src/er/init.js" type="text/javascript"></script>' );       // __debug__
document.write( '<script src="../src/er/config.js" type="text/javascript"></script>' );     // __debug__
document.write( '<script src="../src/er/context.js" type="text/javascript"></script>' );    // __debug__
document.write( '<script src="../src/er/permission.js" type="text/javascript"></script>' ); // __debug__
document.write( '<script src="../src/er/Module.js" type="text/javascript"></script>' );     // __debug__
document.write( '<script src="../src/er/template.js" type="text/javascript"></script>' );   // __debug__
document.write( '<script src="../src/er/router.js" type="text/javascript"></script>' );     // __debug__
document.write( '<script src="../src/er/controller.js" type="text/javascript"></script>' ); // __debug__
document.write( '<script src="../src/er/locator.js" type="text/javascript"></script>' );    // __debug__
document.write( '<script src="../src/er/Model.js" type="text/javascript"></script>' );      // __debug__
document.write( '<script src="../src/er/View.js" type="text/javascript"></script>' );       // __debug__
document.write( '<script src="../src/er/IAction.js" type="text/javascript"></script>' );    // __debug__
document.write( '<script src="../src/er/AbstractAction.js" type="text/javascript"></script>' ); // __debug__
document.write( '<script src="../src/er/Action.js" type="text/javascript"></script>' );     // __debug__
document.write( '<script src="../src/er/extend.js" type="text/javascript"></script>' );     // __debug__
document.write( '<script src="../src/er/extend/ui.js" type="text/javascript"></script>' );  // __debug__
document.write( '<script src="../src/er/extend/action_enhance.js" type="text/javascript"></script>' ); // __debug__

/* __debug__
document.write( '<script src="../release/$((esui))" type="text/javascript"></script>' );  
__debug__ */

document.write( '<script src="../src/esui.js" type="text/javascript"></script>' );          // __debug__
document.write( '<script src="../src/esui/config.js" type="text/javascript"></script>' );   // __debug__
document.write( '<script src="../src/esui/util.js" type="text/javascript"></script>' );     // __debug__
document.write( '<script src="../src/esui/init.js" type="text/javascript"></script>' );     // __debug__
document.write( '<script src="../src/esui/get.js" type="text/javascript"></script>' );      // __debug__
document.write( '<script src="../src/esui/dispose.js" type="text/javascript"></script>' );  // __debug__
document.write( '<script src="../src/esui/Control.js" type="text/javascript"></script>' );  // __debug__
document.write( '<script src="../src/esui/InputControl.js" type="text/javascript"></script>' ); // __debug__
document.write( '<script src="../src/esui/Button.js" type="text/javascript"></script>' );   // __debug__
document.write( '<script src="../src/esui/TextInput.js" type="text/javascript"></script>' );    // __debug__
document.write( '<script src="../src/esui/Table.js" type="text/javascript"></script>' );    // __debug__
