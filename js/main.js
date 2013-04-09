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
            var advance = new szotargep.advance.Advance( vocabulary, window.location.search ) ;
            createTagWidgets( advance ) ;
            createTopWidgets( advance ) ;
            initialUpdate( advance ) ;
            console.log( 'Initialization complete.' ) ;
          },
          function() {
            console.log( 'Initialization failed.' ) ;
          }
      ) ;
    }

    function createTagWidgets( advance ) {

      function createTagWidget( tag, title, special ) {
        var click = function( localTag, localSpecial ) {
          return function( event ) {
            var checked = $( this ).prop( 'checked' ) ;
            if( localSpecial ) {
              localSpecial( checked ) ;
            } else {
              advance.toggleTag( localTag, checked ) ;
            }
            updateBoard( advance ) ;
          }
        }( tag, special ) ;

        var id = 'tag$' + ( special ? '$' : '' ) + tag ;
        $( '<input '
            + 'type="checkbox" '
            + 'id="' + id + '"'
            + '</input>'
        )
          .prop( 'checked', advance.isTagSelected( tag ) )
          .click( click )
          .appendTo( '#tags' )
        ;

        $( '<label '
            + 'for="' + id + '" >'
            + ( title ? '<i>' + title + '</i>' : tag )
            + '</label><br>'
        ).appendTo( '#tags' ) ;
      }

      var tags = advance.vocabulary().tags() ;
      for( var t = 0 ; t < tags.length ; t ++ ) {
        var tag = tags[ t ] ;
        createTagWidget( tag )
      }
      createTagWidget(
          szotargep.vocabulary.UNTAGGED,
          'Untagged',
          function( checked ) { advance.toggleTag( szotargep.vocabulary.UNTAGGED, checked ) }
      ) ;
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

      $( '#next-answer-or-card' ).prop( 'disabled', advance.viewAsList() ) ;
    }

    function createTopWidgets( advance ) {

      $( '<input '
          + 'type="checkbox" '
          + 'id="toggle-list-or-single" '
          + 'class="widget" '
          + '></input>'
      )
          .click( function( event ) {
            advance.viewAsList( $( '#toggle-list-or-single' ).prop( 'checked' ) ) ;
            updateBoard( advance ) ;
          } )
          .appendTo( '#top' )
      ;

      $( '<label for="toggle-list-or-single" >List</label>' ) .appendTo( '#top' ) ;

      $( '<button type="button" id="next-answer-or-card" class="widget" >Next</button>' )
          .click( function( event ) {
              var next = advance.nextAnswerOrCard() ;
              if( next == 0 ) {
                updateBoard( advance ) ;
              } else {
                disclose( next ) ;
              }
          } )
          .appendTo( '#top' ) 
      ;

    }

    function disclose( next ) {
      $( "#board > table > tbody > tr" )
          .eq( next - 1 )
          .contents()
          .filter( "td" )
          .eq( 1 )
          .removeClass( "undisclosed" )
      ;
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
//            .delay( visible ? 2 : 0 ) // Delay saves from blinking when action is quick.
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
