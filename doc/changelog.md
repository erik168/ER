ER Change Log
==============

2.1.0
---------

+ template：增加对if-elif-else和for as的支持；增加变量替换的中括号访问对象属性支持。
+ extend/action_enhance：增加reload方法，允许对Action进行重新加载。
+ 修复载入文件顺序不同时初始化步骤混乱导致DEFAULT_INDEX可能route不正常的问题。
+ locator：修复currentLocation在非ie浏览器下记录缺失问题。
+ router：修复规则为string时路由失败问题。
+ ESUI - Calendar：修复弹出层打开时显示月份可能和选中值不同的问题。
+ ESUI - Select：修复emptyText名称错误的问题。
+ ESUI - Table：修复在chrome19+中宽度计算的问题。


2.0.4
----------

+ ESUI - util：修复全局变量逃逸问题，涉及attrSegment。
+ ESUI - Link：修复对未声明的变量me的错误引用。
+ ESUI - Schedule：修复全局变量逃逸问题，涉及i/j。
+ ESUI - Table：修复全局变量逃逸问题，涉及i/thClass/currentSort/field。
    

2.0.3
----------

+ Template：修复content中的import内容未被替换的bug。
+ Extend UI：为UIAdapter添加uninit方法，用于在View的clear时调用。
+ ESUI：修复skin的class未被设置到浮层Layer的bug，包括Calendar、MultiCalendar、Select、Dialog控件。
+ ESUI - util：修正getControlsByContainer方法返回控件集合的顺序为正序（原为逆序）。
+ ESUI - Button：增加对页面中现有button元素的渲染支持；增加dispose时事件处理函数的自动释放。
+ ESUI - Calendar&amp;MultiCalendar：修复当range的begin和end year相等时显示年计算错误问题。
+ ESUI - Dialog：增加对现有dom元素的渲染支持；增加对foot中按钮自动渲染的支持；修改可拖动属性名（含css定义），原为dragable，现为draggable；修复多次open时拖动功能不正常的问题；修复top属性未转换成数值型的问题。
+ ESUI - Layer：增加partName的支持，用于其他应用Layer的控件提供部件名。
+ ESUI - Pager：修复当前页码大于5时第一页className设置有误导致的样式问题。
+ ESUI - Select：修复setValue时值为0或空字符串导致的设置失效。
+ ESUI - SideBar：修复渲染时序问题导致初始mode为fixed时渲染失效。
+ ESUI - Table：增加subrow打开是否允许互斥的功能支持；增加单双号行的样式定义支持；增加onsubrowclose事件；增加表格的头跟随元素左右border宽度的计算；修复head或foot内容为空时IE6下显示不正常的问题；修复autoState设置为1导致的性能损耗问题。
+ ESUI - TreeView：修复_getChildsHtml方法中全局变量逃逸问题。
    

2.0.2
-----------

+ Locator：修复在支持onhashchange的浏览器下无hash进入页面时，不自动跳转到DEFAULT_INDEX的问题。
+ ESUI - util：init方法允许dom的ui attribute中“;”号后与“:”号前存在空白字符。
+ ESUI - BoxGroup：删除一个多余的var声明。（接受firede的修改）
+ ESUI - Dialog：补充构造函数语句中漏掉的一个“;”号。（接受firede的修改）
+ ESUI - Schedule：删除数组后多余的“,”号。
+ ESUI - MaxLengthRule：更新错误提示文字。
+ 示例项目：修正core引入src的依赖顺序问题；提取model到独立的文件。


2.0.1
-----------

+ Locator：在支持的浏览器使用onhashchange替代轮询方案。
+ Locator：删除在老旧浏览器上使用input[type=text]跨页面前进后退的支持。
+ Context：删除set context对value的自动克隆。
+ ESUI：render时如果主元素有id，则不自动生成id。
+ ESUI - Link：修复语法错误。
+ ESUI - BoxGroup：修复语法错误。
+ ESUI - MultiCalendar：修复语法错误。
+ ESUI - TreeView：修复全局变量逃逸的错误。
    

2.0.0
------------

+ Locator：增加reload功能，redirect增加options参数，支持enforce。
+ Router：引入router进行中间转发，允许用户自定义转发规则。
+ Model：新增Model类，用于管理数据模型，隔离Action与Context。
+ Context：增加了change事件机制。
+ View：新增View类，用于视图渲染。
+ Action：修改执行阶段名[beforeinitcontext -> beforeloadmodel, afterinitcontext -> afterloadmodel]。
+ Action：剥离IAction、AbstractAction。
+ Action：删除原initcontext相关支持。
+ Action：变更view相关支持，移动到er.View中。
+ ESUI：完成UI标准化的实现。



1.3.0
----------

+ Action：增加Action自动加载的支持。
+ Template：增加母版(master)功能的支持。
+ Template：增加变量替换过滤器的支持( ${value|html} )，并提供html和url两种过滤器。
+ 修复Firefox下location的query中包含"&amp;"符号的解析截断问题。
+ 修复IE下权限验证失败自动转向时，浏览器崩溃的问题。
+ 修复opera下历史记录重复，影响前进后退的问题。


1.2.2
---------

+ 修复locator在IE8/9下历史记录保存的bug。
+ ESUI - MultiCalendar：优化日期区间选择控件的日期显示方式和交互。
+ ESUI - Select：修复text-indent造成的布局误差。
+ ESUI - SideBar：优化侧边栏展开和关闭的交互方式，并取消动态效果。


1.2.1
----------

+ 增强er.locator.redirect在传入location带有前缀#号的容错。
+ 优化template自动加载的解析。
+ 修复er.init时location为默认index的情况下Action不工作的问题。
+ Action增强：refresh方法增加额外的queryMap参数支持。
+ ESUI - Calendar：修复在IE下背景颜色穿透的问题。
+ ESUI - MultiCalendar：优化复日期选择控件shortcut区间重复匹配时多项active的交互。
+ ESUI - TextLine：增加onchange事件支持，增加行号区域宽度定制支持，修复setValue时行号区域不更新的bug。
+ ESUI - TextInput：修复setValue值为null时填入值为字符串null的问题，修复TextInput控件placeholder在获焦时内容未清空的问题，修复输入内容为placeholder时getValue为空的问题。
+ ESUI - Table：添加breakLine的全局配置支持，修复editable列在开启breakLine时的鼠标移入抖动问题，修复table控件标题配置为function时sort标记失效的问题。
+ ESUI - Tip：添加关闭按钮显示的配置与提示箭头配置功能，修复在超出可视区域自动方向判断的bug。


1.2.0
----------

+ 提供内置的简易UI组件库：ESUI。
+ Action增强：允许getQueryByContext接口传入参数表。
+ 修复firefox下query部分带中文自动转移导致的Action两次enter问题。
+ 修复controller在调度action时currentLocation记录失败导致referer为空的问题。
    

1.1.0
----------

+ Action增强：多例化与运行时环境管理增强，增加事件机制，并提供Action扩展机制。
+ 功能升级：IE下，使用动态创建iframe的方法替代静态页面保存历史记录。
+ 增加Module的抽象。
+ template增强：支持lang以及其他类型变量解析与替换功能。
+ controller增强：增加loadSubByPath方法。
+ 修复Action.extend后扩展时无法影响到先前扩展具有别名的Action的问题。


