function loadResources( div, onSuccess, onFailure ) {

  Parser.createDefaultParsers(
      function( parsers ) {
        var parsersHealthy = true ;
        for( p = 0 ; p < parsers.length ; p ++ ) {
          if( parsers[ p ].problem() ) {
            $( div ).append( '<p>' + parsers[ p ].problem() + '</p>')
            parsersHealthy = false ;
          }
        }

        if( parsersHealthy ) {
          onSuccess( /*TODO: Vocabulary object*/ ) ;
        } else {
          onFailure() ;
        }

      }
  ) ;

}