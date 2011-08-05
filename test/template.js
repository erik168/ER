module("er.template");


test("parse", function() {
    er.template.parse('<!-- target:parseTest1 -->abcdefg');
    equals(er.template.get('parseTest1'), 'abcdefg', '单一target，不包含target结束。');

    er.template.parse('<!-- target:parseTest2 -->abcdefg<!-- /target -->test2');
    equals(er.template.get('parseTest2'), 'abcdefg', '单一target，包含target结束。');

    er.template.parse('<!-- target:parseTest3 -->abcd${value}efg<!-- target:parseTest4 -->defg');
    equals(er.template.get('parseTest3'), 'abcd${value}efg', '多taret解析');
    equals(er.template.get('parseTest4'), 'defg', '多taret解析');

    er.template.parse('<!-- target:parseTest5 --><!-- target:parseTest6 -->');
    equals(er.template.get('parseTest5'), '', 'target内容为空时，应解析为空字符串');
    equals(er.template.get('parseTest6'), '', 'target内容为空时，应解析为空字符串');

    
    equals(er.template.get('parseTest7'), '', '不存在的target，应解析为空字符串');
});

test("parse with Master", function() {
	er.template.parse('<!-- master:masterTest1 -->abcdefg');
	equals(er.template.get('masterTest1'), '', 'master母版不能通过er.template.get获取。所以应为空串。');

	er.template.parse(
		'<!-- target:contentTarget1(master=masterTest2) -->'
		+ '<!-- content:content1 -->abc'
		+ '<!-- master:masterTest2 -->'
		+ '<!-- contentplaceholder:content1 -->def');
	equals(er.template.get('contentTarget1'), 'abcdef', '指定了master的target，内容由master、contentplaceholder和content决定。');
});

test("merge", function() {
    var el = document.createElement( 'div' );
    document.body.appendChild( el );

    er.template.parse('<!-- target:mergeTest -->hello ${myName}!');
    er.context.set( 'myName', 'ER' );
    er.template.merge( el, 'mergeTest' );
    equals(el.innerHTML, 'hello ER!', 'merge，简单的${name}替换。');

    er.template.parse('<!-- target:mergeTest2 -->hello ${myName|html}!');
    er.context.set( 'myName', '<b>ER</b>' );
    er.template.merge( el, 'mergeTest2' );
    equals(el.innerHTML, 'hello &lt;b&gt;ER&lt;/b&gt;!', 'merge，过滤器的替换${name|html}。');

    er.template.parse('<!-- target:mergeTest3 -->hello ${myName|url}!');
    er.context.set( 'myName', '?E&R' );
    er.template.merge( el, 'mergeTest3' );
    equals(el.innerHTML, 'hello %3FE%26R!', 'merge，过滤器的替换${name|url}。');
    
    lang.myModule = {};
    lang.myModule.name = 'ER from lang.myModule.name';

    er.template.parse('<!-- target:mergeTest4 -->hello ${myModule.name:lang}!');
    er.template.merge( el, 'mergeTest4' );
    equals(el.innerHTML, 'hello ER from lang.myModule.name!', 'merge，类型替换${myModule.name:lang}，默认查找lang.myModule.name。');

    myModule.lang = {};
    myModule.lang.name = 'ER from myModule.lang.name';
    er.template.merge( el, 'mergeTest4' );
    equals(el.innerHTML, 'hello ER from myModule.lang.name!', 'merge，类型替换${myModule.name:lang}，myModule.lang.name优先级更高。');

    myModule.lang.name = '<b>ER</b> from myModule.lang.name';
    er.template.parse('<!-- target:mergeTest5 -->hello ${myModule.name:lang|html}!');
    er.template.merge( el, 'mergeTest5' );
    equals(el.innerHTML, 'hello &lt;b&gt;ER&lt;/b&gt; from myModule.lang.name!', 'merge，混合类型和过滤器替换${myModule.name:lang|html}。');

    el.innerHTML = '';
    document.body.removeChild( el );
    el = null;
});

