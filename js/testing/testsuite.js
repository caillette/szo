
module( 'Vocabulary' ) ;

// So we can create a fresh instance for each test.
function vocabulary1() {
  // Resolve some test-specific chicken-and-egg problem.
  var fakePackA = {
    id : function() { return 1 ; },
    url : function() { return 'some://where' }
  } ;

  var card1 = new Card( [ 'Question', 'And more' ], [ 'Választ' ], 'Jó', fakePackA, 1 ) ;
  var card2 = new Card( [ 'rien' ], [ 'semmi' ], [ 'Rossz', 'Rémes', 'Pocsék' ], fakePackA, 2 ) ;
  var card3 = new Card( [ 'Sans étiquette' ], [ 'jegy nélkül' ], [], fakePackA, 3 ) ;
  var packA = new Pack( 'some://where', [ card1, card2, card3 ] ) ;

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

  deepEqual( v.vocabulary.tags(), [ 'Jó', 'Rossz', 'Rémes', 'Pocsék' ], 'Find Vocabulary Tags' ) ;
  deepEqual( v.vocabulary.cards(), [ v.card1, v.card2, v.card3 ], 'All Cards' ) ;
  deepEqual( v.vocabulary.cards( 'Jó' ), [ v.card1 ], 'Cards by tag' ) ;
  deepEqual( v.vocabulary.cards( null ), [ v.card3 ], 'Untagged Cards' ) ;
  equal( v.vocabulary.toString(), 'Vocabulary{1;3;4}', 'Vocabulary\'s toString' ) ;

  equal( v.packA.toString(), 'Pack{3;some://where}', 'Pack\'s toString' ) ;

  equal( v.card1.toString(), 'Card{1@some://where}', 'Card\'s toString' ) ;
  deepEqual( v.card1.questions(), [ 'Question', 'And more' ], 'Card\'s questions' ) ;
  deepEqual( v.card1.answers(), [ 'Választ' ], 'Card\'s answers' ) ;

} ) ;

test( 'Instantiate Pack from parsed content', function() {

  var pack = new Pack( 'url:whatever', 'any content', {
    parse : function( text ) {
      return [
          [
              [ 'd0', 'v0' ],
              [ 'd0', 'v0' ]
          ],
          [ 'T0', 'T1' ],
          [
              [
                  10,
                  [ 't', 'tt' ],
                  [ 'Q0', 'q0' ],
                  [ 'A0', 'a0' ]
              ],
              [
                  11,
                  [],
                  [ 'Q1' ],
                  [ 'A1' ]
              ]
          ]
      ] ;
    }
  } ) ;

  ok( ! pack.problem(), 'pack.problem()' ) ;
  equal( pack.url(), 'url:whatever', 'pack.url()' ) ;

  var card0 = pack.cards()[ 0 ] ;
  equal( card0.lineInPack(), 10, 'Card\'s lineInPack' ) ;
  deepEqual( card0.tags(), [ 'T0', 'T1', 't', 'tt' ], 'Card\'s tags' ) ;
  deepEqual( card0.questions(), [ 'Q0', 'q0' ], 'Card\' questions' ) ;
  deepEqual( card0.answers(), [ 'A0', 'a0' ], 'Card\' answers' ) ;

  var card1 = pack.cards()[ 1 ] ;
  equal( card1.lineInPack(), 11, 'Card\'s lineInPack' ) ;
  deepEqual( card1.tags(), [ 'T0', 'T1' ], 'Card\'s tags' ) ;
  deepEqual( card1.questions(), [ 'Q1' ], 'Card\' questions' ) ;
  deepEqual( card1.answers(), [ 'A1' ], 'Card\' answers' ) ;

} ) ;

module( 'Advance' ) ;

function advance1( fixedRandomValue ) {
  return advance( vocabulary1().vocabulary, fixedRandomValue ) ;
}

function advance( vocabulary, random ) {

  function createRandomFunction( fixedRandomValue ) {
    return function( upperIndex ) { return fixedRandomValue ; } ;
  }

  if( typeof random === 'undefined' ) {
    random = createRandomFunction( 0 ) ;
  } else if( typeof random === 'number' ) {
    random = createRandomFunction( random ) ;
  }
  return new Advance( vocabulary, '', random ) ;
}

test( 'viewAsList', function() {
  var a = advance1() ;
  ok( a.viewAsList( true ) ) ;
  ok( ! a.viewAsList( false ) ) ;
} ) ;

test( 'initialState', function() {
  var v = vocabulary1() ;
  var a = advance1() ;
  ok( a.viewAsList() ) ;
  a.viewAsList( false ) ;
  equal( a.disclosure(), 0, 'disclosure' ) ;

  // For some unknown reason, strictEqual tells that Card references are not the same.
  equal( a.currentCard().lineInPack(), v.card1.lineInPack(), 'currentCard' ) ;
} ) ;

test( 'nextAnswerOrCard', function() {
  var nextRandom = 0 ;
  var v = vocabulary1() ;
  var a = advance( v.vocabulary, function( upperIndex ) { return nextRandom } ) ;
  a.viewAsList( false ) ; // Triggers a Card pick.
  nextRandom = 1 ;
  equal( a.nextAnswerOrCard(), 1, 'nextAnswerOrCard' ) ; // Next answer.
  equal( a.nextAnswerOrCard(), 0, 'nextAnswerOrCard' ) ; // Next Card.

  // For some unknown reason, strictEqual tells that Card references are not the same.
  equal( a.currentCard().lineInPack(), v.card2.lineInPack(), 'currentCard' ) ;
} ) ;



module( 'Parser' )

asyncTest( 'Simple parser loading', function() {
  Parser.createParser(
      'js/testing/simplest.peg.txt',
      function( parser ) {
        ok( ! parser.problem() ) ;
        deepEqual( parser.parse( 'A' ), 'A', 'simple parsing' ) ;
        start() ;
      }
  ) ;
} ) ;


asyncTest( 'Can\'t load grammar', function() {
  Parser.createParser(
      'bad:url',
      function( parser ) {
        ok( parser.problem(), 'Parser has problem' ) ;
        start() ;
      }
  ) ;
} ) ;

asyncTest( 'Can\'t parse grammar', function() {
  Parser.createParser(
      'js/testing/broken.peg.txt',
      function( parser ) {
        ok( parser.problem(), 'Parser has problem' ) ;
        start() ;
      }
  ) ;
} ) ;

asyncTest( 'Parallel parser loading', function() {
  Parser.createDefaultParsers(
      function( parsers ) {
        equal( parsers.length, 2, 'Parser count' ) ;
        ok( parsers[ 0 ] != null, 'Non-null parser[ 0 ]' ) ;
        ok( parsers[ 1 ] != null, 'Non-null parser[ 1 ]' ) ;
        start() ;
      }
  ) ;

} ) ;

module( 'Pack grammar' ) ;

function parseEqual( testName, grammarUri, text, tree ) {
  test( testName, function() {
    expect( 1 ) ;
    stop() ;
    Parser.createParser(
        grammarUri,
        function( parser ) {
          deepEqual( parser.parse( text ), tree, 'text parsing' ) ;
          start() ;
        }
    ) ;
  } ) ;
}

function parsePackEqual( testName, text, tree ) {
  parseEqual( testName, Parser.PACK_GRAMMAR_URI, text, tree ) ;
}

parsePackEqual( 'Canonical Pack',
    'd1:v1\n'
  + 'd2:v2'
  + '\n'
  + '@T1 @T2\n'
  + '\n'
  + '  @t @tt\n'
  + 'Q1\n'
  + '  q1\n'
  + 'A1\n'
  + '  a1\n'
  + '\n'
  + 'Q2\n'
  + 'A2\n'
  ,
  [
      [
          [ 'd1', 'v1' ],
          [ 'd2', 'v2' ]
      ],
      [ 'T1', 'T2' ],
      [
          [
              5,
              [ 't', 'tt' ],
              [ 'Q1', 'q1' ],
              [ 'A1', 'a1' ]
          ],
          [
              11,
              [],
              [ 'Q2' ],
              [ 'A2' ]
          ]
      ]
  ]
) ;

parsePackEqual( 'Empty Pack',
  ''
  ,
  [
      [],
      [],
      []
  ]
) ;

parsePackEqual( 'Empty Pack with whitespaces and line breaks',
  '  \n\n \n'
  ,
  [
      [],
      [],
      []
  ]
) ;

parsePackEqual( 'Minimal Card',
    'Q\n'
  + 'A'
  ,
  [
      [],
      [],
      [
          [
              1,
              [],
              [ 'Q' ],
              [ 'A' ]
          ]
      ]
  ]
) ;

parsePackEqual( 'Minimal Card surrounded by blanks',
    '\n'
  + ' \n'
  + 'Q \n'
  + 'A  \n'
  + ' \n'
  ,
  [
      [],
      [],
      [
          [
              3,
              [],
              [ 'Q' ],
              [ 'A' ]
          ]
      ]
  ]
) ;

module( 'Vocabulary list grammar' ) ;

function parseVocabularyEqual( testName, text, tree ) {
  parseEqual( testName, Parser.VOCABULARY_GRAMMAR_URI, text, tree ) ;
}

parseVocabularyEqual( 'Simple Vocabulary list',
    'x.txt\n'
  + 'x/yz.txt'
  ,
  [
      'x.txt',
      'x/yz.txt'
  ]
) ;


