<?php header( "Content-Type", "text/javascript" ); ?>
var data = 
<?php
	// 数据模拟
	$index = 1;
	$textPrefix = 'text';
	class Node {
		function __construct( $id, $text, $hasChild ) {
			$this -> id = $id;
			$this -> text = $text;

			if ( $hasChild ) {
				$this -> children = array();
			}
		}

		function addChild( $child ) {
			if ( isset( $this -> children ) ) {
				array_push( $this -> children, $child );
			}
		}
	}
	
	function getNode( $hasChild ) {
		global $textPrefix, $index;

		$data = new Node( $index, "${textPrefix} - ${index}", $hasChild );
		$index++;

		return $data;
	}

	$data = getNode( true );

	for ( $i = 0; $i < 3; $i++ ) {
		$node = getNode( true );
		$data -> addChild( $node );

		for ( $j = 0; $j < 33; $j++ ) {
			$node2 = getNode( true );
			$node -> addChild( $node2 );

			for ( $k = 0; $k < 1000; $k++ ) {
				$node3 = getNode( false );
				$node2 -> addChild( $node3 );
			}
		}
	}

	echo json_encode( $data );
?>
;
