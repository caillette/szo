// Encapsulate PEG.js parser and handles grammar loading.
// Because grammar loading occurs with AJAX there must be a callback to tell it's ready.
var Parser = function() {

  var constructor = function Parser( onParserLoaded, grammarSourceUri ) {

    var maybeParser = null ;
    var that = this ;

    grammarSourceUri = typeof grammarSourceUri === 'undefined' ? 'js/peg.txt' : grammarSourceUri ;

    $.get( grammarSourceUri, function( parserSource ) {
      try {
        maybeParser = PEG.buildParser( parserSource ) ;
      } catch( e ) {
        maybeParser = e ;
      }
      onParserLoaded( that ) ;
    } )
    .fail( function( jqXhr, textStatus, errorThrown ) {
      maybeParser = 'Could not load parser source: ' + textStatus + ' ' + errorThrown ;
      onParserLoaded( that ) ;
    } ) ;
    // JQuery already logs failed GET errors.

    this.loaded = function() {
      return maybeParser != null ;
    } ;

    this.parse = function( text ) {
      if( typeof maybeParser === 'string' ) {
        throw 'Parser not available. ' + maybeParser ;
      }
      return maybeParser.parse( text ) ;
    } ;
  } ;

  return constructor ;

}() ;