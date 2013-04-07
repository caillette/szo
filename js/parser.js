( function ( szotargep ) {

  szotargep.parser = {} ;


  // Encapsulate PEG.js parser and handles grammar loading.
  // Because grammar loading occurs with AJAX there must be a callback to tell it's ready.
  szotargep.parser.Parser = function() {

    function pegExceptionToString( e, uri ) {
      return e.toString()
          + ' @'
          + ( typeof uri === 'undefined' ? '' : uri + ':' )
          + ( e.line ? e.line : '?' ) + ':' + ( e.column ? e.column : '?' )
      ;
    }

    var constructor = function Parser( grammar, uri, problem ) {

      var pegParser ;

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
      }

      this.parse = function( text ) {
        if( pegParser ) {
          return pegParser.parse( text ) ;
        } else {
          throw 'PEG parser instantiation previously failed. ' + this.problem() ;
        }
      } ;

      this.problem = function() {
        return pegParser === null
            // Ultra defensive, this handles bad problem catching at initialization.
            ? ( typeof problem === 'undefined' || problem === null
                ? 'Could not initialize parser ' + uri : problem )
            : null
        ;
      }

      this.uri = function() {
        return uri ;
      }
    } ;

    return constructor ;

  }() ;


  // [ uri, ... ] --> [ parser, ... ]
  szotargep.parser.createParsers = function( grammarSourceUris, onGeneralCompletion ) {
    szotargep.resource.processResources(
        grammarSourceUris,
        function( transformable ) {
          if( transformable.problem ) {
            return new szotargep.parser.Parser( null, transformable.uri, transformable.problem )
          } else {
            return new szotargep.parser.Parser( transformable.content, transformable.uri ) ;
          }
        },
        onGeneralCompletion
    ) ;
  }



  szotargep.parser.SEARCH_GRAMMAR_URI = 'js/search.peg.txt' ;
  szotargep.parser.VOCABULARY_GRAMMAR_URI = 'js/vocabulary.peg.txt' ;
  szotargep.parser.PACK_GRAMMAR_URI = 'js/pack.peg.txt' ;

  szotargep.parser.createDefaultParsers = function( onCompletion ) {
    szotargep.parser.createParsers(
        [
            szotargep.parser.SEARCH_GRAMMAR_URI,
            szotargep.parser.VOCABULARY_GRAMMAR_URI,
            szotargep.parser.PACK_GRAMMAR_URI
        ],
        onCompletion
    ) ;
  }


  szotargep.parser.findParser = function( parsers, uri ) {
    for( var i = 0 ; i < parsers.length ; i ++ ) {
      if( parsers[ i ].uri() === uri ) {
        return parsers[ i ] ;
      }
    }
    throw 'Unknown uri "' + uri + '" in ' + parsers ;
  }

} ( window.szotargep = window.szotargep || {} ) ) ;

