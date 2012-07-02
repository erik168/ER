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

    er.template.parse(
        '<!-- target:contentImport -->import!!'
        + '<!-- master:masterTest3 --><!-- contentplaceholder:content3 -->'
        + '<!-- target:contentTarget3(master=masterTest3) -->'
        + '<!-- content:content3 -->hello <!--import:contentImport-->');
    equals(er.template.get('contentTarget3'), 'hello import!!', '带master的target，content中允许使用import');

    er.template.parse(
        '<!-- target:contentImport2 -->import!!'
        + '<!-- master:masterTest4 --><!-- contentplaceholder:content4 --><!--import:contentImport2-->'
        + '<!-- target:contentTarget4(master=masterTest4) -->'
        + '<!-- content:content4 -->hello ');
    equals(er.template.get('contentTarget4'), 'hello import!!', 'master中允许使用import');
});

test("merge", function() {
    var el = document.createElement( 'div' );
    document.body.appendChild( el );

    er.template.parse('<!-- target:mergeTest -->hello ${myName}!');
    er.context.set( 'myName', 'ER' );
    er.template.merge( el, 'mergeTest' );
    equals(el.innerHTML, 'hello ER!', 'merge，简单的${name}替换。');

    er.template.parse('<!-- target:mergeTest1_1 -->hello ${person.name}!');
    er.context.set( 'person', {name:'ER'} );
    er.template.merge( el, 'mergeTest1_1' );
    equals(el.innerHTML, 'hello ER!', 'merge，嵌套${person.name}替换。');

    er.template.parse('<!-- target:mergeTest1_2 -->hello ${person["name"]}!');
    er.context.set( 'person', {name:'ER'} );
    er.template.merge( el, 'mergeTest1_2' );
    equals(el.innerHTML, 'hello ER!', 'merge，嵌套${person["name"]}替换。');

    er.template.parse('<!-- target:mergeTest1_3 -->hello ${person["name"]}!');
    er.context.set( 'car', {driver: {name:'ER'} });
    er.template.merge( el, 'mergeTest1_3' );
    equals(el.innerHTML, 'hello ER!', 'merge，多级嵌套${car.driver["name"]}替换。');

    er.template.parse('<!-- target:mergeTest1_4 -->hello ${num}!');
    er.context.set( 'num', 0 );
    er.template.merge( el, 'mergeTest1_4' );
    equals(el.innerHTML, 'hello 0!', 'merge，值为bool false的替换。');

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

    er.template.parse('<!-- target:mergeTest6 --><!-- for: ${myList} as ${item} -->${item}|<!-- /for -->');
    er.context.set( 'myList', [1,2,3,4,5] );
    er.template.merge( el, 'mergeTest6' );
    equals(el.innerHTML, '1|2|3|4|5|', 'merge，for遍历数组');

    er.template.parse('<!-- target:mergeTest6_2 --><!-- for: ${myList} as ${item}, ${idx} --><!--if:${idx}>0-->|<!--/if-->${item},${idx}<!-- /for -->');
    er.context.set( 'myList', [1,2,3,4,5] );
    er.template.merge( el, 'mergeTest6_2' );
    equals(el.innerHTML, '1,0|2,1|3,2|4,3|5,4', 'merge，for遍历数组，带数组索引');

    er.template.parse('<!-- target:mergeTest6_3 --><!-- import: mergeTest6_2-->');
    er.context.set( 'myList', [1,2,3,4,5] );
    er.template.merge( el, 'mergeTest6_3' );
    equals(el.innerHTML, '1,0|2,1|3,2|4,3|5,4', 'merge，for遍历数组，带数组索引');

    er.template.parse('<!-- target:mergeTest7 --><!-- if: ${num} > 0 -->${num}<!--elif: ${num} == 0-->zero<!--else-->invalid<!-- /if -->');
    er.context.set( 'num', 1 );
    er.template.merge( el, 'mergeTest7' );
    equals(el.innerHTML, '1', 'merge，进入if分支');
    er.context.set( 'num', 0 );
    er.template.merge( el, 'mergeTest7' );
    equals(el.innerHTML, 'zero', 'merge，进入elif分支');
    er.context.set( 'num', -1 );
    er.template.merge( el, 'mergeTest7' );
    equals(el.innerHTML, 'invalid', 'merge，进入else分支');

    er.template.parse('<!-- target:mergeTest8 --><!-- if: ${num} || 1 -->1<!--/if-->');
    er.context.set( 'num', 0 );
    er.template.merge( el, 'mergeTest8' );
    equals(el.innerHTML, '1', 'merge "if" case，${num} || 1 expression');

    er.template.parse('<!-- target:mergeTest8_2 --><!-- if: ${num} && 1 -->1<!--/if-->');
    er.context.set( 'num', 'test' );
    er.template.merge( el, 'mergeTest8_2' );
    equals(el.innerHTML, '1', 'merge "if" case，${num} && 1 expression');

    er.template.parse('<!-- target:mergeTest8_3 --><!-- if: !${unknown} -->1<!--/if-->');
    er.template.merge( el, 'mergeTest8_3' );
    equals(el.innerHTML, '1', 'merge "if" case，!${unknown} expression');

    er.template.parse('<!-- target:mergeTest8_4 --><!-- if: ${num} == ${str} -->1<!--/if-->');
    er.context.set( 'num', 1 );
    er.context.set( 'str', '1' );
    er.template.merge( el, 'mergeTest8_4' );
    equals(el.innerHTML, '1', 'merge "if" case，${num} == ${str} expression');

    er.template.parse('<!-- target:mergeTest8_5 --><!-- if: ${num} === ${str} -->1<!--else-->2<!--/if-->');
    er.template.merge( el, 'mergeTest8_5' );
    equals(el.innerHTML, '2', 'merge "if" case，${num} === ${str} expression');

    er.template.parse('<!-- target:mergeTest8_6 --><!-- if: !( 0 && 0 ) -->1<!--else-->2<!--/if-->');
    er.template.merge( el, 'mergeTest8_6' );
    equals(el.innerHTML, '1', 'merge "if" case，!( 0 && 0 ) expression');

    er.template.parse('<!-- target:mergeTest8_7 --><!-- if: !0 && 0 -->1<!--else-->2<!--/if-->');
    er.template.merge( el, 'mergeTest8_7' );
    equals(el.innerHTML, '2', 'merge "if" case，!0 && 0 expression');

    lang.ifTest = 'iftest';
    er.template.parse('<!-- target:mergeTest8_8 --><!-- if: ${ifTest:lang} == "iftest" -->1<!--else-->2<!--/if-->');
    er.template.merge( el, 'mergeTest8_8' );
    equals(el.innerHTML, '1', 'merge "if" case，use ${ifTest:lang}');

    el.innerHTML = '';
    document.body.removeChild( el );
    el = null;
});

