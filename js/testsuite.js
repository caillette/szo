module( 'Computations' ) ;

test( 'Empty test', function() {
  expect( 0 ) ;
} ) ;

/*
test( 'Subclassing', function() {
  var otherComputation = new OtherComputation( null ) ;
  ok( otherComputation instanceof OtherComputation, 'instanceof' ) ;
  ok( otherComputation instanceof Computation, 'instanceof through inheritance' ) ;
} ) ;
*/

test( 'Subclassing', function() {
  var circle = new Circle( 1, 2, 3 ) ;
  ok( circle instanceof Circle, 'instanceof' ) ;
  ok( circle instanceof Shape, 'instanceof through inheritance' ) ;
  equal( circle.toString(), 'Circle{x=1;y=2;r=3}', 'toString' ) ;
} ) ;



