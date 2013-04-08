( function ( szotargep ) {

  szotargep.main = {} ;

  szotargep.main.documentReady = function() {

    if( new szotargep.browser.Capabilities( '#browser-capabilities' ).capable() ) {
      $( '#browser-capabilities' ).hide() ;

      console.debug( 'Initializing ...' ) ;

      szotargep.loader.load(
          '#problems',
          window.location.search,
          function( vocabulary ) {
            var advance = new szotargep.advance.Advance( vocabulary, window.location.searh ) ;
            createWidgets( advance ) ;
            initialUpdate( advance ) ;
            configureTags( advance ) ;
            console.log( 'Initialization complete.' ) ;
          },
          function() {
            console.log( 'Initialization failed.' ) ;
          }
      ) ;
    }

    function configureTags( advance ) {
      var tags = advance.vocabulary().tags() ;
      for( var t = 0 ; t < tags.length ; t ++ ) {
        var tag = tags[ t ] ;
        $( '<input '
            + 'type="checkbox" '
            + 'id="tag$' + tag + '" '
            + '</input>'
        ).appendTo( '#tags' ) ;
        $( '<label '
            + 'for="tag$' + tag + '" >'
            + tag
            + '</label><br>'
        ).appendTo( '#tags' ) ;
      }
    }
    
    function initialUpdate( advance ) {
      $( '#toggle-list-or-single' ).prop( 'checked', advance.viewAsList() ) ;
      updateBoard( advance ) ;
    }

    function updateBoard( advance ) {
      if( advance.viewAsList() ) {
        performAction( new szotargep.action.ShowList( advance ) ) ;
      } else {
        performAction( new szotargep.action.ShowSingleCard( advance ) ) ;
      }
    }

    function createWidgets( advance ) {

      $( '<input '
          + 'type="checkbox"'
          + 'id="toggle-list-or-single"'
          + '></input>'
      )
          .click( function( event ) {
            advance.viewAsList( $( '#toggle-list-or-single' ).prop( 'checked' ) ) ;
            updateBoard( advance ) ;
          } )
          .appendTo( '#top' )
      ;

      $( '<label for="toggle-list-or-single" >List</label>' )
          .appendTo( '#top' ) ;
    }



    var performAction = function( action ) {
      var start ;
      var performer = null ;

      function elapsed( start ) {
        return ( new Date() - start ) + ' ms' ;
      }

      function actionInProgress( visible ) {
        $( '#action-performing' )
            .stop( true, true )
            .delay( visible ? 2 : 0 ) // Delay saves from blinking when action is quick.
            .animate( { opacity : ( visible ? 1 : 0 ) }, 100 )
        ;
      }

      var nextActionId = function() {
        var actionId = 0 ;
        return function() {
          return actionId ++ ;
        }
      }() ;

      return function( action ) {
        start = new Date() ;
        console.debug( 'Starting action...' ) ;
        actionInProgress( true ) ;
        $( '#board' ).empty() ;

        performer = new szotargep.action.Performer(
            {
              id : nextActionId(), // Just for debugging.
              onStepComplete : function() {
                setTimeout(
                    function() {
                      if( performer ) performer = performer.perform() ;
                    },
                    1 // Let window thread take a breath.
                ) ;
              },
              onActionComplete : function( result ) {
                performer = null ;
                actionInProgress( false ) ;
                console.debug( 'Completed action in ' + elapsed( start ) + '.' ) ;
              }
            },
            action
        ).perform() ;
      }
    }() ;

  }

} ( window.szotargep = window.szotargep || {} ) ) ;
