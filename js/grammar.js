var Parser = function() {

  var constructor = function( grammarSourceUri, onParserReady ) {

    var parser = null ;

    $.get( grammarSourceUri, function( parserSource ) {
      try {
        parser = PEG.buildParser( parserSource ) ;
      } catch( e ) {
        parser = e ;
      }
    } )
    .fail( function( jqXhr, textStatus, errorThrown ) {
      parser = 'Could not load parser source: ' + textStatus + ' ' + errorThrown ;
    } ) ;
    // JQuery already logs failed GET errors.

    this.loaded = function() {
      return parser != null ;
    } ;

    this.parse = function( text ) {
      if( typeof parser === 'string' ) {
        throw 'Parser not available. ' + parser ;
      }
      return parser.parse( text ) ;
    } ;
  } ;

  return constructor ;

}() ;