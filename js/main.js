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
            reportProblems( vocabulary ) ;
            createCardIndex( vocabulary ) ;
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

    function reportProblems( vocabulary ) {
      var html = '' ;
      vocabulary.visitPacks( function( pack ) {
        if( pack.problem() )
            html += '<p><code>' + pack.url() + '</code><br>' + pack.problem() + '</p>' ;
      } ) ;
      if( html != '' ) {
        $( '<div id="problem-list" >' + html + '</div>' )
            .appendTo( '#problems' ) ;
        $( '<h2 id="problem-disclosure" >Could not load all the Vocabulary</h2>' )
            .click( function() {  } )
            .prependTo( '#problems' )
        ;
        $( '#problems' ).collapse( {
            accordion : true,
            open: function() { this.slideDown( 150 ) },
            close: function() { this.slideUp( 150 ) }
        } ) ;

      }
    }

    function createCardIndex( vocabulary ) {
      var cards = vocabulary.cards() ;

      szotargep.index.cardOfIndex = function( index ) {
        return cards[ index ] ;
      } ;

      szotargep.index.indexOfCard = function( card ) {
        var index = cards.indexOf( card ) ;
        if( index < 0 ) throw 'Unknown Card: ' + card ;
        return index ;
      }

    }


    function updateTagCheckedState( advance ) {
      $( '#tags :checkbox').each( function( ) {
        var $this = $( this ) ;
        var tag = $this.attr( 'id' ) ;
        tag = tag.substring( 'tag$'.length ) ;
        $( this ).prop( 'checked', advance.isTagSelected( tag ) )
      } ) ;

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

        var id = 'tag$' + tag ;
        $( '<input '
            + 'type="checkbox" '
            + 'id="' + id + '"'
            + '</input>'
        )
          .click( click )
          .appendTo( '#tags' )
        ;

        $( '<label '
            + 'for="' + id + '" >'
            + ( title ? '<em>' + title + '</em>' : tag )
            + '</label><br>'
        ).appendTo( '#tags' ) ;

      }

      createTagWidget(
          szotargep.vocabulary.UNTAGGED,
          'Untagged',
          function( checked ) { advance.toggleTag( szotargep.vocabulary.UNTAGGED, checked ) }
      ) ;
      var tags = advance.vocabulary().tags() ;
      for( var t = 0 ; t < tags.length ; t ++ ) {
        var tag = tags[ t ] ;
        createTagWidget( tag )
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
      updateTagCheckedState( advance ) ;

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

      $( '<button type="button" id="select-all-tags" class="widget" >All</button>' )
          .click( function( event ) {
              advance.selectAllTags() ;
              updateBoard( advance ) ;
          } )
          .appendTo( '#top' )
      ;

      $( '<button type="button" id="deselect-all-tags" class="widget" >None</button>' )
          .click( function( event ) {
              advance.deselectAllTags() ;
              updateBoard( advance ) ;
          } )
          .appendTo( '#top' )
      ;

      $( '<button type="button" id="next-answer-or-card" class="widget" ><b>Next</b></button>' )
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
