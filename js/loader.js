function load( div, search, onSuccess, onFailure ) {

  function report( problem ) {
    $( div ).append( '<p>' + problem + '</p>') ;
    window.console.error( problem ) ;
  }

  Parser.createDefaultParsers(
    function( parsers ) {
      var parsersHealthy = true ;
      for( p = 0 ; p < parsers.length ; p ++ ) {
        if( parsers[ p ].problem() ) {
          report( parsers[ p ].problem() ) ;
          parsersHealthy = false ;
        }
      }

      if( parsersHealthy ) {

        try {
          var searchParser = Parser.findParser( parsers, Parser.SEARCH_GRAMMAR_URI ) ;
          var vocabularyParser = Parser.findParser( parsers, Parser.VOCABULARY_GRAMMAR_URI ) ;
          var packParser = Parser.findParser( parsers, Parser.PACK_GRAMMAR_URI ) ;
          var locationSearch = new LocationSearch( searchParser.parse( search ) ) ;
          var vocabularyUri = locationSearch.vocabulary() ;
          window.console.info( 'Loading vocabulary from ' + vocabularyUri + ' ...' ) ;

          loadResources(
              [ vocabularyUri ],
              function( resources ) {
                var vocabularyList = resources[ 0 ].content ;
                if( typeof vocabularyList === 'undefined' || vocabularyList === null ) {
                  report( 'Could not load ' + vocabularyUri ) ;
                  onFailure() ;
                } else {
                  var parsedVocabulary = vocabularyParser.parse( vocabularyList ) ;
                  window.console.debug( 'Loaded ' + parsedVocabulary.length + ' pack entries' ) ;
                }
              }
          ) ;

        } catch( e ) {
          report( e ) ;
          onFailure() ;
        }
//        onSuccess( /*TODO: Vocabulary object*/ ) ;
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

