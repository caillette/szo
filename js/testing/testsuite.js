
module( 'Vocabulary' ) ;

// So we can create a fresh instance for each test.
function vocabulary1() {
  // Resolve some test-specific chicken-and-egg problem.
  var fakePackA = {
    id : function() { return 1 ; },
    url : function() { return 'some://where' }
  } ;

  var card1 = new szotargep.vocabulary.Card(
      [ 'Question', 'And more' ], [ 'Választ' ], 'Jó', fakePackA, 1 ) ;
  var card2 = new szotargep.vocabulary.Card(
      [ 'rien' ], [ 'semmi' ], [ 'Rossz', 'Rémes', 'Pocsék' ], fakePackA, 2 ) ;
  var card3 = new szotargep.vocabulary.Card(
      [ 'Sans étiquette' ], [ 'jegy nélkül' ], [], fakePackA, 3 ) ;
  var packA = new szotargep.vocabulary.Pack(
      'some://where', [ card1, card2, card3 ] ) ;

  return {
    fakePackA : fakePackA,
    card1 : card1,
    card2 : card2,
    card3 : card3,
    packA : packA,
    vocabulary : new szotargep.vocabulary.Vocabulary( 'some://vocabulary', [ packA ], [] ),
    allDeclaredTags : [ 'Jó', 'Rossz', 'Rémes', 'Pocsék' ]
  }
}

// So we can create a fresh instance for each test.
function vocabularyBundle2() {
  var fakePack = {
    id : function() { return 1 ; },
    url : function() { return 'some://pack' }
  }

  var packA = new szotargep.vocabulary.Pack(
      'some://pack',
      [ new szotargep.vocabulary.Card(
          [ 'Question' ],
          [ 'Answer' ],
          [ 't1', 't2' ],
          fakePack,
          1
      ) ]
  ) ;

  return {
    vocabulary : new szotargep.vocabulary.Vocabulary(
        'vocabulary.txt',
        [ packA ],
        [ [ 't1', 'Tag one' ], [ 't2', 'Tag two' ] ]
    )
  }
}

test( 'Instantiate Vocabulary from predefined Cards', function() {
  var v = vocabulary1() ;

  deepEqual( v.vocabulary.tags(), [ 'Jó', 'Rossz', 'Rémes', 'Pocsék' ], 'Find Vocabulary Tags' ) ;
  deepEqual( v.vocabulary.cards(), [ v.card1, v.card2, v.card3 ], 'All Cards' ) ;
  deepEqual( v.vocabulary.cards( 'Jó' ), [ v.card1 ], 'Cards by tag' ) ;
  deepEqual(
      v.vocabulary.cards( [ szotargep.vocabulary.UNTAGGED ] ),
      [ v.card3 ],
      'Untagged Cards'
  ) ;
  equal( v.vocabulary.toString(), 'Vocabulary{1;3;4}', 'Vocabulary\'s toString' ) ;

  equal( v.packA.toString(), 'Pack{3;some://where}', 'Pack\'s toString' ) ;

  equal( v.card1.toString(), 'Card{1@some://where}', 'Card\'s toString' ) ;
  deepEqual( v.card1.questions(), [ 'Question', 'And more' ], 'Card\'s questions' ) ;
  deepEqual( v.card1.answers(), [ 'Választ' ], 'Card\'s answers' ) ;

} ) ;

test( 'Visiting Card stages', function() {
  var questions = [] ;
  var answers = [] ;
  vocabulary1().card1.visitStages( function( question, answer ) {
    if( question ) questions.push( question ) ;
    if( answer ) answers.push( answer ) ;
  } ) ;
  deepEqual( questions, [ 'Question', 'And more' ] ) ;
  deepEqual( answers, [ 'Választ' ] ) ;
} ) ;

test( 'Visiting Vocabulary cards', function() {
  var v = vocabulary1() ;
  var cards = [] ;
  v.vocabulary.visitCards( function( card ) {
    cards.push( card ) ;
  } ) ;
  deepEqual( cards, [ v.card1, v.card2, v.card3 ] ) ;
} ) ;


test( 'Instantiate Pack with problem', function() {
  var pack1 = new szotargep.vocabulary.Pack(
      'url:whatever',
      'ignored content',
      { problem : function() { return  'Problem here' } }
  ) ;
  equal( pack1.problem(), 'Problem here', 'Propagate Parser problem to the Pack' ) ;

  var pack2 = new szotargep.vocabulary.Pack( 'url:whatever', 'My problem', null ) ;
  equal( pack2.problem(), 'My problem', 'Support null parser' ) ;
} ) ;

test( 'Instantiate Pack from parsed content', function() {

  var pack = new szotargep.vocabulary.Pack( 'url:whatever', 'any content', {
    problem : function() { return null ; },
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

  if( szotargep.i18n.initialize ) {
    szotargep.i18n.initialize( { i18nCode : function() { return 'def' } } ) ;
  }

  function createRandomFunction( fixedRandomValue ) {
    return function( upperIndex ) { return fixedRandomValue ; } ;
  }

  if( typeof random === 'undefined' ) {
    random = createRandomFunction( 0 ) ;
  } else if( typeof random === 'number' ) {
    random = createRandomFunction( random ) ;
  }
  return new szotargep.advance.Advance(
      vocabulary,
      {
          tags : function() { return null },
          single : function() { return false },
          flip : function() { return false },
          language : function() { return 'hu' },
          defaultLanguage : function() { return 'hu' }
      },
      random
  ) ;
}

function verifyCurrentCards( advance, cards ) {
  var visited = [] ;
  advance.visitCards(
      function( card ) { visited.push( card.lineInPack() ) ; },
      function() { ok( true ) },
      0, 1000
  ) ;

  var expectedCardLines = [] ;
  for( var c = 0 ; c < cards.length ; c ++ ) {
    expectedCardLines.push( typeof cards[ c ] === 'number' ? cards[ c ] : cards[ c ].lineInPack ) ;
  }

  // strictEqual tells that Card references are not the same because of the fake Pack.
  deepEqual( expectedCardLines, visited, 'current cards are the one expected' ) ;
}



test( 'viewAsList', function() {
  var a = advance1() ;
  ok( a.viewAsList( true ) ) ;
  ok( ! a.viewAsList( false ) ) ;
} ) ;

test( 'viewFlip, basic', function() {
  var a = advance1() ;
  ok( a.viewFlip( true ) ) ;
  ok( ! a.viewFlip( false ) ) ;
} ) ;

test( 'viewFlip, reset disclosure', function() {
  var nextRandom = 0 ;
  var v = vocabulary1() ;
  var a = advance( v.vocabulary, function( upperIndex ) { return nextRandom } ) ;
  a.viewAsList( false ) ; // Triggers a Card pick.
  nextRandom = 2 ;
  equal( a.disclosure(), 0, 'nextAnswerOrCard' ) ; // Next answer.

  nextRandom = "No more random now" ;
  ok( a.viewFlip( true ) ) ;
  equal( a.disclosure(), 0, 'reset occured' ) ;
} ) ;

test( 'initialState', function() {
  var v = vocabulary1() ;
  var a = advance1() ;

  ok( a.viewAsList() ) ;
  ok( ! a.viewFlip() ) ;
  ok( ! a.deckEnabled() ) ;
  equal( a.locationSearch(), '?v=some://vocabulary' ) ;
  deepEqual( a.cards(), v.vocabulary.cards(), 'all Cards selected' ) ;


  a.viewAsList( false ) ;
  equal( a.disclosure(), 0, 'disclosure' ) ;

  // strictEqual tells that Card references are not the same because of the fake Pack.
  deepEqual( a.currentCard(), v.card1, 'currentCard' ) ;

  deepEqual(
      a.tagSelection(),
      [].concat( v.allDeclaredTags ).concat( szotargep.vocabulary.UNTAGGED ),
      'all tags selected (using an empty array)' ) ;
} ) ;

test( 'location seach and tag selection', function() {
  var a = advance( vocabularyBundle2().vocabulary ) ;
  a.deselectAllTags() ;
  equal( a.locationSearch(), '?tags=' ) ;

  a.toggleTag( szotargep.vocabulary.UNTAGGED, true ) ;
  equal( a.locationSearch(), '?tags=$Untagged' ) ;

  a.toggleTag( 't1', true ) ;
  equal( a.locationSearch(), '?tags=$Untagged;t1' ) ;

  a.toggleTag( 't2', true ) ;
  equal( a.locationSearch(), '' ) ;

} ) ;

test( 'tagAppellation', function() {
  var v = vocabularyBundle2().vocabulary ;
  equal( v.tagAppellation( 't1' ), 'Tag one' ) ;
  equal( v.tagAppellation( 't2' ), 'Tag two' ) ;
  equal( v.tagAppellation( 'does not exist' ), null ) ;
} ) ;

test( 'nextAnswerOrCard', function() {
  var nextRandom = 0 ;
  var v = vocabulary1() ;
  var a = advance( v.vocabulary, function( upperIndex ) { return nextRandom } ) ;
  a.viewAsList( false ) ; // Triggers a Card pick.
  nextRandom = 1 ;
  equal( a.nextAnswerOrCard(), 1, 'nextAnswerOrCard' ) ; // Next answer.
  equal( a.nextAnswerOrCard(), 0, 'nextAnswerOrCard' ) ; // Next Card.

  // strictEqual tells that Card references are not the same because of the fake Pack.
  equal( a.currentCard().lineInPack(), v.card2.lineInPack(), 'currentCard' ) ;
} ) ;

test( 'Visiting selected Cards in Advance', function() {
  var v = vocabulary1() ;
  var a = advance1() ;

  var visited1 = [] ;
  a.visitCards(
      function( card ) { visited1.push( card.lineInPack() ) },
      function() { ok( true ) }
  ) ;
  deepEqual(
      visited1,
      [ v.card1.lineInPack(), v.card2.lineInPack(), v.card3.lineInPack() ],
      'all Cards (all are selected by default)'
  ) ;

  var visited2 = [] ;
  a.visitCards(
      function( card ) { visited2.push( card.lineInPack() ) },
      function() { ok( true ) },
      1, 1
  ) ;
  deepEqual( visited2, [ v.card2.lineInPack() ], 'visit with range' ) ;

  var visited3 = [] ;
  a.visitCards(
      function( card ) { visited3.push( card.lineInPack() ) ; },
      function() { ok( true, 'completion happens' ) },
      1, 2
  ) ;
  deepEqual(
      visited3,
      [ v.card2.lineInPack(), v.card3.lineInPack() ],
      'visit with range'
  ) ;

  var visited4 = [] ;
  a.visitCards(
      function( card ) { visited4.push( card.lineInPack() ) ; },
      function() { ok( true ) },
      1, 1000
  ) ;
  deepEqual(
      visited4,
      [ v.card2.lineInPack(), v.card3.lineInPack() ],
      'visit with excessive range'
  ) ;

  var visited5 = [] ;
  a.visitCards(
      function( card ) { visited3.push( card.lineInPack() ) ; },
      function() { ok( false, 'completion must not happen, end not reached' ) },
      0, 1
  ) ;
} ) ;

test( 'deck ', function() {
  var b = vocabulary1() ;
  var a = advance( b.vocabulary ) ;

  a.addToDeck( b.card1 ) ;
  ok( a.deckContains( b.card1 ) ) ;
  verifyCurrentCards( a, [ 1, 2, 3 ] ) ;

  a.deckEnabled( true ) ;
  ok( a.deckContains( b.card1 ) ) ;
  verifyCurrentCards( a, [ 1 ] ) ;

  a.removeFromDeck( b.card1 ) ;
  ok( ! a.deckContains( b.card1 ) ) ;

  a.deckEnabled( false ) ;
  ok( ! a.deckContains( b.card1 ) ) ;
  verifyCurrentCards( a, [ 1, 2, 3 ] ) ;

} ) ;


module( 'Parser' )

asyncTest( 'Simple parser loading', function() {
  szotargep.parser.createParsers(
      [ 'js/testing/simplest.peg.txt' ],
      function( parsers ) {
        ok( ! parsers[ 0 ].problem() ) ;
        deepEqual( parsers[ 0 ].parse( 'A' ), 'A', 'simple parsing' ) ;
        start() ;
      }
  ) ;
} ) ;

test( 'Eating comments', function() {
  var parser = new szotargep.parser.Parser( 'line = [12#\\n]*', 'uri:here', null ) ;
  var result = parser.parse( '1\n# comment\n2#' ) ;
  deepEqual( result, [ '1', '\n', '\n', '2', '#' ] ) ;
} ) ;


asyncTest( 'Can\'t load grammar', function() {
  szotargep.parser.createParsers(
      [ 'bad:url' ],
      function( parsers ) {
        ok( parsers[ 0 ].problem(), 'Parser has problem' ) ;
        start() ;
      }
  ) ;
} ) ;

asyncTest( 'Can\'t parse grammar', function() {
  szotargep.parser.createParsers(
      [ 'js/testing/broken.peg.txt' ],
      function( parsers ) {
        ok( parsers[ 0 ].problem(), 'Parser has problem' ) ;
        start() ;
      }
  ) ;
} ) ;

asyncTest( 'Parallel parser loading', function() {
  szotargep.parser.createDefaultParsers(
      function( parsers ) {
        equal( parsers.length, 3, 'Parser count' ) ;
        ok( parsers[ 0 ] != null, 'Non-null parser[ 0 ]' ) ;
        ok( parsers[ 1 ] != null, 'Non-null parser[ 1 ]' ) ;
        ok( parsers[ 2 ] != null, 'Non-null parser[ 2 ]' ) ;
        start() ;
      }
  ) ;

} ) ;

module( 'Pack grammar' ) ;

function parseEqual( testName, grammarUri, text, tree ) {
  test( testName, function() {
    expect( 1 ) ;
    stop() ;
    szotargep.parser.createParsers(
        [ grammarUri ],
        function( parsers ) {
          deepEqual( parsers[ 0 ].parse( text ), tree, 'text parsing' ) ;
          start() ;
        }
    ) ;
  } ) ;
}

function parsePackEqual( testName, text, tree ) {
  parseEqual( testName, szotargep.parser.PACK_GRAMMAR_URI, text, tree ) ;
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

asyncTest( 'Merge global and local tags', function() {
  expect( 1 ) ;

  var packAsText =
      '@t\n'
    + '\n'
    + '  @t @tt\n'
    + 'Q1\n'
    + 'A1'
  ;

  szotargep.parser.createParsers(
      [ szotargep.parser.PACK_GRAMMAR_URI ],
      function( parsers ) {
        var pack = new szotargep.vocabulary.Pack( 'some-uri', packAsText, parsers[ 0 ] ) ;
        deepEqual( pack.cards()[ 0 ].tags(), [ 't', 'tt' ]  ) ;
        start() ;
      }
  ) ;
} ) ;

module( 'Vocabulary list grammar' ) ;

function parseVocabularyEqual( testName, text, tree ) {
  parseEqual( testName, szotargep.parser.VOCABULARY_GRAMMAR_URI, text, tree ) ;
}

parseVocabularyEqual( 'Simple Vocabulary list',
    'x.txt\n'
  + 'x/yz.txt\n'
  + '\n'
  + '@foo Foo\n'
  + '@bar Bar *! Ű#\n'
  ,
  [
      [
          'x.txt',
          'x/yz.txt'
      ],
      [
          [
              'foo',
              'Foo'
          ],
          [
              'bar',
              'Bar *! Ű#'
          ]
      ]
  ]
) ;


module( 'Search parameters grammar' ) ;

function parseSearchEqual( testName, text, tree ) {
  parseEqual( testName, szotargep.parser.SEARCH_GRAMMAR_URI, text, tree ) ;
}

parseSearchEqual( 'Empty search', '' , [] ) ;

parseSearchEqual( 'Relative URI', '?v=foo/bar.txt' , [  [ 'v', 'foo/bar.txt' ] ] ) ;

parseSearchEqual( 'HTTP URI', '?v=http://foo/bar.txt' , [  [ 'v', 'http://foo/bar.txt' ] ] ) ;

parseSearchEqual( 'Flip', '?flip' , [  [ 'flip' ] ] ) ;

parseSearchEqual( 'Single', '?single' , [  [ 'single' ] ] ) ;

parseSearchEqual( 'Tags, 0', '?tags=' , [  [ 'tags', [] ] ] ) ;

parseSearchEqual( 'Tags, 1', '?tags=foo' , [  [ 'tags', [ 'foo' ] ] ] ) ;

parseSearchEqual( 'Tags, 2', '?tags=foo;bar' , [  [ 'tags', [ 'foo', 'bar' ] ] ] ) ;

parseSearchEqual( 'Language', '?lang=hun' , [  [ 'lang', 'hun' ] ] ) ;



module( 'Location Search' ) ;

test( 'Defaults', function() {
  equal( new szotargep.loader.LocationSearch( [] ).vocabulary(), 'vocabulary.txt' ) ;
  equal( new szotargep.loader.LocationSearch( []  ).tags(), null ) ;
  equal( new szotargep.loader.LocationSearch( []  ).single(), false ) ;
  equal( new szotargep.loader.LocationSearch( []  ).flip(), false ) ;
} ) ;

test( 'Explicit vocabulary', function() {
  equal(
      new szotargep.loader.LocationSearch( [ [ 'v', 'myvocabulary.txt' ] ] ).vocabulary(),
      'myvocabulary.txt'
  ) ;
} ) ;

test( 'Skip', function() {
  equal( new szotargep.loader.LocationSearch( [ [ 'flip' ] ]  ).flip(), true ) ;
} ) ;

test( 'Single', function() {
  equal( new szotargep.loader.LocationSearch( [ [ 'single' ] ]  ).single(), true ) ;
} ) ;

test( 'Tags', function() {
  deepEqual(
      new szotargep.loader.LocationSearch( [ [ 'tags', [ 't' ] ] ]  ).tags(),
      [ 't' ]
  ) ;
} ) ;

test( 'Language', function() {
  deepEqual(
      new szotargep.loader.LocationSearch( [ [ 'lang', 'foo' ] ]  ).language(),
      'foo'
  ) ;
} ) ;


module( 'Loader' ) ;

asyncTest( 'Load vocabulary', function() {
  expect( 1 ) ;
  szotargep.loader.load(
      null,
      '?v=js/testing/vocabulary-mixed.txt',
      function( vocabulary ) {
        equal( vocabulary.cards().length, 3, 'Check Cards loaded' ) ;
        start() ;
      },
      function() {
        ok( false, 'Unexpected load problem' ) ;
        start() ;
      }
  ) ;
} ) ;
