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
            configureWidgets( advance ) ;
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

    function configureWidgets( advance ) {
      var start ;

      { // Firefox 19.0.2 wants this code block here.
        $( '<button id="multi-step-action" >Multi-step action</button>' )
            .click( function( event ) {
                performAction( event, new szotargep.action.LongDummyAction( 10000 ) ) ;
            } )
            .appendTo( '#top' )
        ;
        $( '<input '
            + 'type="checkbox" '
            + 'id="single-step-action" '
            + 'name="single-step-action" '
            + '></input>'
        )
            .click( function( event ) {
                performAction( event, new szotargep.action.ShortDummyAction() ) ;
            } )
            .appendTo( '#top' )
        ;
        $( '<label for="single-step-action" >Single-step action</label>' )
            .appendTo( '#top' )
        ;
      }

      function elapsed( start ) {
        return ( new Date() - start ) + ' ms' ;
      }

      var nextActionId = function() {
        var actionId = 0 ;
        return function() {
          return actionId ++ ;
        }
      }() ;

      function performAction( event, action ) {
        start = new Date() ;
        console.debug( 'Starting action...' ) ;
        actionInProgress( true ) ;
        $( '#board' ).empty() ;

        actionPerformer = new szotargep.action.ActionPerformer(
            {
              id : nextActionId(), // Just for debugging.
              batchSize : 100,
              onBatchComplete : function() {
                setTimeout(
                    function() {
                      if( actionPerformer ) actionPerformer = actionPerformer.perform() ;
                    },
                    1 // Let window thread take a breath.
                ) ;
              },
              onActionComplete : function( result ) {
                actionPerformer = null ;
                actionInProgress( false ) ;
                console.debug( 'Completed action in ' + elapsed( start ) + '.' ) ;
              },
              log : function( message ) {
                  console.debug( message ) ;
              }
            },
            action
        ).perform() ;

      }

      var actionPerformer = null ;




      function actionInProgress( visible ) {
        $( '#action-performing' )
            .stop( true, true )
            .delay( visible ? 2 : 0 ) // Delay saves from blinking when action is quick.
            .animate( { opacity : ( visible ? 1 : 0 ) }, 100 )
        ;
      }


    }


  }

} ( window.szotargep = window.szotargep || {} ) ) ;
