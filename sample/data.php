<?php
// 提供测试数据用的php

class User {
	function __construct( $id, $name ) {
		$this -> id		= $id;
		$this -> name	= $name;
	}
}


$data = array();

for ( $i = 0; $i < 18; $i++ ) {
	$user = new User( $i, "User$i" );
	array_push( $data, $user );
}

echo json_encode( $data );
?>

