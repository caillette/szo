// Encapsulate PEG.js parser and handles grammar loading.
// Because grammar loading occurs with AJAX there must be a callback to tell it's ready.
var Parser = function() {

  function pegExceptionToString( e, uri ) {
    return e.toString()
        + ' @'
        + ( typeof uri === 'undefined' ? '' : uri + ':' )
        + ( e.line ? e.line : '?' ) + ':' + ( e.column ? e.column : '?' )
    ;
  }

  var constructor = function Parser( grammar, uri ) {

    var pegParser ;
    var problem = null ;

    try {
      pegParser = PEG.buildParser( grammar ) ;
    } catch( e ) {
      pegParser = null ;
      problem = pegExceptionToString( e, uri ) ;
      window.console.error( problem ) ;
    }

    this.parse = function( text ) {
      return this.healthy()
          ? pegParser.parse( text )
          : 'PEG parser instantiation failed: ' + problem
      ;
    } ;

    this.healthy = function() {
      return pegParser != null ;
    }

    this.problem = function() {
      return problem === null ? '' : problem ;
    }
  } ;

  return constructor ;

}() ;

Parser.createParser = function( grammarSourceUri, onCompletion ) {
  $.get( grammarSourceUri, function( parserSource ) {
  // TODO: instantiate a non-healthy Parser carrying the problem for further reporting.
    try {
      var parser = new Parser( parserSource, grammarSourceUri ) ;
      window.console.debug( 'Successfully created parser from ' + grammarSourceUri ) ;
      onCompletion( parser ) ;
    } catch( e ) {
      onCompletion( null ) ;
    }
  } )
  .fail( function( jqXhr, textStatus, errorThrown ) {
    onCompletion( null ) ;
  } ) ;
  // JQuery already logs failed GET errors.
}


Parser.createParsers = function( grammarSourceUris, onGeneralCompletion ) {
  semaphore(
      grammarSourceUris,
      function( grammarSourceUri, onSingleCompletion ) {
        return Parser.createParser( grammarSourceUri, onSingleCompletion ) ;
      },
      onGeneralCompletion
  ) ;
}



Parser.VOCABULARY_GRAMMAR_URI = 'js/vocabulary.peg.txt' ;
Parser.PACK_GRAMMAR_URI = 'js/pack.peg.txt' ;

Parser.createDefaultParsers = function( onCompletion ) {
  Parser.createParsers(
      [ Parser.VOCABULARY_GRAMMAR_URI, Parser.PACK_GRAMMAR_URI ],
      onCompletion
  ) ;
}


