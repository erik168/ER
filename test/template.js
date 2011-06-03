module("er.template");


test("parse", function() {
    er.template.parse('<!-- target:parseTest1 -->abcdefg');
    equals(er.template.get('parseTest1'), 'abcdefg', 'A simple template without close tag can be parse.');

    er.template.parse('<!-- target:parseTest2 -->abcdefg<!-- /target -->');
    equals(er.template.get('parseTest2'), 'abcdefg', 'A simple template with a close tag can be parse.');

    er.template.parse('<!-- target:parseTest3 -->abcd${value}efg<!-- target:parseTest4 -->defg');
    equals(er.template.get('parseTest3'), 'abcd${value}efg', 'When there is a lot of target defined in template string, each one should be parse.');
    equals(er.template.get('parseTest4'), 'defg', 'When there is a lot of target defined in template string, each one should be parse.');

    er.template.parse('<!-- target:parseTest5 --><!-- target:parseTest6 -->');
    equals(er.template.get('parseTest5'), '', 'A template with nothing in it should be parse into a empty string.');
    
    equals(er.template.get('parseTest6'), '', '');
});

test("parse with Master", function() {
	er.template.parse('<!-- master:masterTest1 -->abcdefg');
	equals(er.template.get('masterTest1'), '', 'The plain text content in master template should not be get.');

	er.template.parse(
		'<!-- target:contentTarget1(master=masterTest2) -->'
		+ '<!-- content:content1 -->abc'
		+ '<!-- master:masterTest2 -->'
		+ '<!-- contentplaceholder:content1 -->def');
	equals(er.template.get('contentTarget1'), 'abcdef', '');
	
	er.template.parse(
		'<!-- target:contentTarget2(master=masterTest3) -->'
		+ '<!-- content:content1 -->abc'
		+ '<!-- master:masterTest2 -->'
		+ '<!-- contentplaceholder:content1 -->def');
});

test("merge", function() {
    
});

