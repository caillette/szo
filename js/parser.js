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
  } ;

  return constructor ;

}() ;

Parser.createParser = function( grammarSourceUri, onCompletion ) {
  $.get( grammarSourceUri, function( parserSource ) {
    try {
      onCompletion( new Parser( parserSource, grammarSourceUri ) ) ;
    } catch( e ) {
      onCompletion( null ) ;
    }
  } )
  .fail( function( jqXhr, textStatus, errorThrown ) {
    onCompletion( null ) ;
  } ) ;
  // JQuery already logs failed GET errors.
}


Parser.createParsers = function( grammarSourceUris, onCompletion ) {

  var parsers = new Array( grammarSourceUris.length ) ;
  var completion = 0 ;

  // Emulates a counting semaphore which calls 'onCompletion' after loading all the grammars.
  // Grammar loading occurs in parallel with AJAX.
  for( var i = 0 ; i < grammarSourceUris.length ; i ++ ) {
    Parser.createParser(
        grammarSourceUris[ i ],
        function( index ) {
          return function( parser ) {
            parsers[ index ] = parser ;
            completion ++ ;
            if( completion == grammarSourceUris.length ) {
              onCompletion( parsers ) ;
            }
          } ;
        }( i )
    ) ;
  }
}

