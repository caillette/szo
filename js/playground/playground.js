module( 'Object instantiation' ) ;

test( 'Subclassing', function() {
  var circle = new Circle( 1, 2, 3 ) ;
  ok( circle instanceof Circle, 'instanceof' ) ;
  ok( circle instanceof Shape, 'instanceof through inheritance' ) ;
  equal( circle.toString(), 'Circle{x=1;y=2;r=3}', 'toString' ) ;
} ) ;

test( 'Closure plus prototype', function() {
  var length = new Length( 1 ) ;
  ok( length instanceof Length, 'instanceof' ) ;
  equal( length.toString(), 'Length{1}', 'toString' ) ;

  strictEqual(
      new Length( 1 ).toString,
      new Length( 2 ).toString,
      'Share function object'
  ) ;
} ) ;

