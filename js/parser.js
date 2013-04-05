// Encapsulate PEG.js parser and handles grammar loading.
// Because grammar loading occurs with AJAX there must be a callback to tell it's ready.
var Parser = function() {

  var constructor = function Parser( grammar ) {

    var pegParser ;

    try {
      pegParser = PEG.buildParser( grammar ) ;
    } catch( e ) {
      pegParser = null ;
      window.console.error( e ) ;
      throw e ;
    }

    this.parse = function( text ) {
      return pegParser.parse( text ) ;
    } ;
  } ;

  return constructor ;

}() ;

Parser.createParser = function( grammarSourceUri, onCompletion ) {
  $.get( grammarSourceUri, function( parserSource ) {
    try {
      onCompletion( new Parser( parserSource ) ) ;
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

