module( 'Warmup' ) ;

test( 'Empty test', function() {
  expect( 0 ) ;
} ) ;

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



module( 'Vocabulary' ) ;

test( 'Instantiate Vocabulary from predefined Cards', function() {

  // Resolve some test-specific chicken-and-egg problem.
  var dummyPack = {
    id : function() { return 1 ; },
    url : function() { return 'some://where' }
  } ;

  var card1 = new Card( [ 'Question', 'And more' ], [ 'Választ' ], [ 'Jó' ], dummyPack, 1 ) ;
  var card2 = new Card( [ 'rien' ], [ 'semmi' ], [ 'Rossz' ], dummyPack, 2 ) ;
  var card3 = new Card( [ 'Sans étiquette' ], [ 'jegy nélkül' ], [], dummyPack, 3 ) ;
  var packA = new Pack( 1, 'some://where', [ card1, card2, card3 ] ) ;
  var vocabulary = new Vocabulary( [ packA ] ) ;

  deepEqual( vocabulary.tags(), [ 'Jó', 'Rossz' ], 'Find Vocabulary Tags' ) ;
  deepEqual( vocabulary.cards(), [ card1, card2, card3 ], 'All Cards' ) ;
  deepEqual( vocabulary.cards( 'Jó' ), [ card1 ], 'Cards by tag' ) ;
  deepEqual( vocabulary.cards( null ), [ card3 ], 'Untagged Cards' ) ;

  equal( packA.toString(), 'Pack{3;some://where}', 'Pack\'s toString' ) ;
  equal( card1.toString(), 'Card{1@some://where}', 'Card\'s toString' ) ;
  equal( vocabulary.toString(), 'Vocabulary{1;3;2}', 'Vocabulary\'s toString' ) ;

} ) ;

