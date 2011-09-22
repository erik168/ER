<?php
// 提供测试数据用的php

class User {
	function __construct( $id, $name ) {
		$this -> id		= $id;
		$this -> name	= $name;
	}
}

$order   = @$_GET[ 'order' ];
$orderBy = @$_GET[ 'orderBy' ];

// 排序函数
// 作为示例，只简单进行了id排序
function sorter( $one, $other ) {
	global $order, $orderBy;

	if ( $orderBy == 'id' ) {
		if ( $order == 'asc' ) {
			return $one->id - $other->id;
		} else {
			return $other->id - $one->id;
		}
	}
}

// 循环生成简单的示例数据
$data = array();
for ( $i = 100; $i > 0; $i-- ) {
	$user = new User( $i, "User$i" );
	array_push( $data, $user );
}

if ( isset( $order ) && isset( $orderBy ) ) {
	usort( $data, "sorter" );
}

echo json_encode( $data );
?>

