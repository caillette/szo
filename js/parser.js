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

    if( grammar ) {
      try {
        pegParser = PEG.buildParser( grammar, { trackLineAndColumn : true } ) ;
      } catch( e ) {
        pegParser = null ;
        problem = pegExceptionToString( e, uri ) ;
        window.console.error( problem ) ;
      }
    } else {
      pegParser = null ;
      problem = 'Could not load ' + uri ;
    }

    this.parse = function( text ) {
      if( this.problem() ) {
        throw 'PEG parser instantiation previously failed: ' + problem ;
      } else {
        return pegParser.parse( text ) ;
      }
    } ;

    this.problem = function() {
      return pegParser === null
          // Ultra defensive, this handles bad problem catching at initialization.
          ? ( problem === null ? 'Could not initialize parser' : problem )
          : null
      ;
    }
  } ;

  return constructor ;

}() ;

Parser.createParser = function( grammarSourceUri, onCompletion ) {
  $.get(
      grammarSourceUri,
      null,
      function( parserSource ) {
        try {
          window.console.debug( 'Successfully created parser from ' + grammarSourceUri ) ;
          onCompletion( new Parser( parserSource, grammarSourceUri ) ) ;
        } catch( e ) {
          onCompletion( new Parser( null, grammarSourceUri + ' ' + e ) ) ;
        }
      },
      'text'
  )
  .fail( function( jqXhr, textStatus, errorThrown ) {
    grammarSourceUri += ': ' + textStatus + '\n' + errorThrown ;
    onCompletion( new Parser( null, grammarSourceUri ) ) ;
    // JQuery already logs some failed GET errors, but forgets some corner-cases
    // like unrecognized XML with Firefox.
    window.console.error( 'Could not load ' + grammarSourceUri ) ;
  } ) ;
}


Parser.createParsers = function( grammarSourceUris, onGeneralCompletion ) {
  new BatchApply(
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


