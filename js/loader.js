( function ( szo ) {

  szo.loader = {} ;

  szo.loader.load = function( div, search, onSuccess, onFailure ) {

    function report( exception, message ) {
      html = '<p>' ;
      if( exception ) {
        window.console.error( exception ) ;
        html += '<code>' + exception + '</code><br>' ;
      }
      html += message ;
      html += '</p>' ;

      $( '<div>' + html + '</div>' ).appendTo( div ) ;

      $( '<h2>Could not initialize the application</h2>' ).prependTo( div )

    }

    szo.parser.createDefaultParsers(
      function( parsers ) {
        var parsersHealthy = true ;
        for( p = 0 ; p < parsers.length ; p ++ ) {
          if( parsers[ p ].problem() ) {
            report( parsers[ p ].problem(),
                'Could not find/interpret grammar in: ' + parsers[ p ].uri() ) ;
            parsersHealthy = false ;
          }
        }

        if( parsersHealthy ) {

          function find( parsers, uri ) { return szo.parser.findParser( parsers, uri ) }

          try {
            var searchParser = find( parsers, szo.parser.SEARCH_GRAMMAR_URI ) ;
            var vocabularyParser = find( parsers, szo.parser.VOCABULARY_GRAMMAR_URI ) ;
            var packParser = find( parsers, szo.parser.PACK_GRAMMAR_URI ) ;
            try {
              var locationSearch =
                  new szo.loader.LocationSearch( searchParser.parse( search ) ) ;
            } catch( e ) {
              report( e, 'Could not interpret this part of the URL: ' + search ) ;
              return ;
            }
            var vocabularyUri = locationSearch.vocabulary() ;
            window.console.info( 'Loading vocabulary from ' + vocabularyUri + ' ...' ) ;

            szo.resource.loadResources(
                [ vocabularyUri ],
                function( resources ) {
                  var vocabularyList = resources[ 0 ].content ;
                  if( typeof vocabularyList === 'undefined' || vocabularyList === null ) {
                    report( '', 'Could not load ' + vocabularyUri ) ;
                    onFailure() ;
                  } else {
                    var parsedVocabulary ;
                    try {
                      parsedVocabulary = vocabularyParser.parse( vocabularyList ) ;
                    } catch( e ) {
                      report( e, 'Could not parse Vocabulary' ) ;
                      return ;
                    }
                    window.console.debug( 'Loaded ' + parsedVocabulary.length +
                      ' pack reference' + ( parsedVocabulary.length > 1 ? 's' : '' ) ) ;

                    szo.resource.processResources(
                        parsedVocabulary[ 0 ],
                        function( transformable ) {
                          if( transformable.problem ) {
                            return new szo.vocabulary.Pack(
                                transformable.uri, transformable.problem, null ) ;
                          } else {
                            return new szo.vocabulary.Pack(
                                transformable.uri, transformable.content, packParser ) ;
                          }
                        },
                        function( packs ) {
                          onSuccess(
                              new szo.vocabulary.Vocabulary(
                                  vocabularyUri,
                                  packs,
                                  parsedVocabulary[ 1 ]
                              ),
                              locationSearch
                          ) ;
                        }
                    )
                  }
                }
            ) ;

          } catch( e ) {
            report( e, 'Unknown error' ) ;
            onFailure() ;
          }
        } else {
          onFailure() ;
        }
      }
    ) ;

  }

  var defaultVocabulary = 'vocabulary.txt' ;

  szo.loader.isDefaultVocabulary = function( string ) {
    return defaultVocabulary === string ;
  }


  // JavaScript defines window.location.search as the way to get the parameters of window's URL.
  szo.loader.LocationSearch = function() {

    var constructor = function LocationSearch( parseResult ) {

      function byKey( key ) {
        for( var i = 0 ; i < parseResult.length ; i ++ ) {
          var entry = parseResult[ i ] ;
          if( entry[ 0 ] == key ) {
            return entry.length > 1 ? entry[ 1 ] : true ;
          }
        }
        return null ;
      }

      this.vocabulary = function() {
        var v = byKey( 'v' ) ;
        return v ? v : defaultVocabulary ;
      }

      this.language = function() {
        var l = byKey( 'lang' ) ;
        return l ? l : szo.i18n.defaultLanguage() ;
      }

      this.flip = function() {
        return byKey( 'flip' ) != null ;
      }

      this.single = function() {
        return byKey( 'single' ) != null ;
      }

      this.tags = function() {
        var knownTags = byKey( 'tags' ) ;
        return knownTags ? knownTags.slice( 0 ) : null ;
      }
    }

    return constructor ;
  }() ;

} ( window.szo = window.szo || {} ) ) ;
