function loadResources( div, search, onSuccess, onFailure ) {

  function report( problem ) {
    $( div ).append( '<p>' + problem + '</p>')
  }

  Parser.createDefaultParsers(
    function( parsers ) {
      var parsersHealthy = true ;
      for( p = 0 ; p < parsers.length ; p ++ ) {
        if( parsers[ p ].problem() ) {
          report( parsers[ p ].problem() + '</p>' ) ;
          parsersHealthy = false ;
        }
      }

      if( parsersHealthy ) {

        try {
          var searchParser = Parser.findParser( Parser.SEARCH_GRAMMAR_URI ) ;
          searchParser.parse( search ) ;
        } catch( e ) {
          report( e ) ;
          onFailure() ;
        }
        onSuccess( /*TODO: Vocabulary object*/ ) ;
      } else {
        onFailure() ;
      }
    }
  ) ;

}

// JavaScript defines window.location.search as the way to get the parameters of window's URL.
var LocationSearch = function() {
  var constructor = function LocationSearch( parseResult ) {

    function byKey( key ) {
      for( var i = 0 ; i < parseResult.length ; i ++ ) {
        var entry = parseResult[ i ] ;
        if( entry[ 0 ] == key ) {
          return entry[ 1 ] ;
        }
      }
      return null ;
    }

    this.vocabulary = function() {
      var v = byKey( 'v' ) ;
      return v ? v : 'vocabulary.txt' ;
    }
  }
  return constructor ;
}() ;

