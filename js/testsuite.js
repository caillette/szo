
module( 'Vocabulary' ) ;

// So we can create a fresh instance for each test.
function vocabulary1() {
  // Resolve some test-specific chicken-and-egg problem.
  var fakePackA = {
    id : function() { return 1 ; },
    url : function() { return 'some://where' }
  } ;

  var card1 = new Card( [ 'Question', 'And more' ], [ 'Választ' ], [ 'Jó' ], fakePackA, 1 ) ;
  var card2 = new Card( [ 'rien' ], [ 'semmi' ], [ 'Rossz' ], fakePackA, 2 ) ;
  var card3 = new Card( [ 'Sans étiquette' ], [ 'jegy nélkül' ], [], fakePackA, 3 ) ;
  var packA = new Pack( 1, 'some://where', [ card1, card2, card3 ] ) ;

  return {
    fakePackA : fakePackA,
    card1 : card1,
    card2 : card2,
    card3 : card3,
    packA : packA,
    vocabulary : new Vocabulary( [ packA ] )
  }
}

test( 'Instantiate Vocabulary from predefined Cards', function() {
  var v = vocabulary1() ;
  deepEqual( v.vocabulary.tags(), [ 'Jó', 'Rossz' ], 'Find Vocabulary Tags' ) ;
  deepEqual( v.vocabulary.cards(), [ v.card1, v.card2, v.card3 ], 'All Cards' ) ;
  deepEqual( v.vocabulary.cards( 'Jó' ), [ v.card1 ], 'Cards by tag' ) ;
  deepEqual( v.vocabulary.cards( null ), [ v.card3 ], 'Untagged Cards' ) ;

  equal( v.packA.toString(), 'Pack{3;some://where}', 'Pack\'s toString' ) ;
  equal( v.card1.toString(), 'Card{1@some://where}', 'Card\'s toString' ) ;
  equal( v.vocabulary.toString(), 'Vocabulary{1;3;2}', 'Vocabulary\'s toString' ) ;
} ) ;


module( 'Advance' ) ;

function advance1( fixedRandomValue ) {
  if( typeof fixedRandomValue === 'undefined' ) {
    fixedRandomValue = 0 ;
  }
  return new Advance( vocabulary1(), '', function() { return fixedRandomValue ; } ) ;
}

test( 'viewAsList', function() {
  var a = advance1() ;
  ok( a.viewAsList( true ) ) ;
  ok( ! a.viewAsList( false ) ) ;
} ) ;

