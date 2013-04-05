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
  var parser ;

  $.get( grammarSourceUri, function( parserSource ) {
    try {
      onCompletion( new Parser( parserSource ) ) ;
    } catch( e ) {
      onCompletion( null ) ;
    }
  } )
  .fail( function( jqXhr, textStatus, errorThrown ) {
    maybeParser = 'Could not load parser source: ' + textStatus + ' ' + errorThrown ;
    onCompletion( null ) ;
  } ) ;
  // JQuery already logs failed GET errors.
}

