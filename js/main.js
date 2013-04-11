( function ( szotargep ) {

  szotargep.main = {} ;

  szotargep.main.documentReady = function() {

    var showLanguageSelector = false ;

    if( new szotargep.browser.Capabilities( '#browser-capabilities' ).capable() ) {
      $( '#browser-capabilities' ).hide() ;

      console.debug( 'Initializing ...' ) ;

      szotargep.loader.load(
          '#problems',
          window.location.search,
          function( vocabulary, locationSearch ) {
            var advance = new szotargep.advance.Advance( vocabulary, locationSearch ) ;
            initializeI18n( advance ) ;
            reportProblems( vocabulary ) ;
            createCardIndex( vocabulary ) ;
            createTagWidgets( advance ) ;
            createTopWidgets( advance ) ;
            updateLabels( advance.i18nCode() ) ;
            initialUpdate( advance ) ;
            console.log( 'Initialization complete.' ) ;
          },
          function() {
            console.log( 'Initialization failed.' ) ;
          }
      ) ;
    }

    function initializeI18n( i18nSupplier ) {
      szotargep.i18n.initialize( i18nSupplier ) ;
    }

    function reportProblems( vocabulary ) {
      var html = '' ;
      vocabulary.visitPacks( function( pack ) {
        if( pack.problem() )
            html += '<p><code>' + pack.url() + '</code><br>' + pack.problem() + '</p>' ;
      } ) ;
      if( html != '' ) {
        $( '<div>' + html + '</div>' )
            .appendTo( '#problems' ) ;
        $( '<h2>Could not load all the Vocabulary</h2>' )
            .prependTo( '#problems' )
        ;
        $( '#problems' ).collapse( {
            accordion : true,
            open : function() { this.slideDown( 150 ) },
            close : function() { this.slideUp( 150 ) }
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
            + ( special ? 'id="label-' + tag + '"' : '' )
            + 'for="' + id + '" >'
            + ( special ? '<em>' + title + '</em>' : title )
            + '</label><br>'
        ).appendTo( '#tags' ) ;

      }

      createTagWidget(
          szotargep.vocabulary.UNTAGGED,
          '-untagged-',
          function( checked ) { advance.toggleTag( szotargep.vocabulary.UNTAGGED, checked ) }
      ) ;
      var tags = advance.vocabulary().tags() ;
      for( var t = 0 ; t < tags.length ; t ++ ) {
        var tag = tags[ t ] ;
        var title = advance.vocabulary().tagAppellation( tag ) ;
        title = title ? title : tag ;
        createTagWidget( tag, title ) ;
      }
    }
    
    function initialUpdate( advance ) {
      $( '#toggle-list' ).prop( 'checked', advance.viewAsList() ) ;
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
      $( '#toggle-list' ).prop( 'checked', advance.viewAsList() ) ;
      $( '#toggle-flip' ).prop( 'checked', advance.viewFlip() ) ;
      updateDeckContentChangeButtons( advance ) ;

      updateBrowserHistory( advance ) ;
    }

    function updateDeckContentChangeButtons( advance ) {
      $( '#add-to-deck' ).prop(
          'disabled',
          advance.viewAsList() || advance.deckContains( advance.currentCard() )
      ) ;
      $( '#remove-from-deck' ).prop(
          'disabled',
          advance.viewAsList() || ! advance.deckContains( advance.currentCard() )
      ) ;
    }

    function updateBrowserHistory( advance ) {
      var newLocationSearch =
          ( window.location.origin   // Firefox doesn't know 'origin'.
              ? window.location.origin
              : window.location.host ? window.location.host : ''
          )
          // At least Chrome 26.0.1410.43 doesn't push well an empty string.
        + ( window.location.pathname ? window.location.pathname : '' )
        + advance.locationSearch()
      ;

      window.history.pushState( null, null, newLocationSearch ) ;
    }

    function createTopWidgets( advance ) {

      $( '<input '
          + 'type="checkbox" '
          + 'id="toggle-list" '
          + 'class="widget" '
          + '></input>'
      )
          .click( function( event ) {
            advance.viewAsList( $( '#toggle-list' ).prop( 'checked' ) ) ;
            updateBoard( advance ) ;
          } )
          .appendTo( '#top' )
      ;

      $( '<label id="label-toggle-list" for="toggle-list" >-list-</label>' )
          .appendTo( '#top' ) ;

      $( '<button type="button" id="select-all-tags" class="widget" >-all-</button>'
      )
          .click( function( event ) {
              advance.selectAllTags() ;
              updateBoard( advance ) ;
          } )
          .appendTo( '#top' )
      ;

      $( '<button type="button" id="deselect-all-tags" class="widget" >-none-</button>' )
          .click( function( event ) {
              advance.deselectAllTags() ;
              updateBoard( advance ) ;
          } )
          .appendTo( '#top' )
      ;

      $( '<input '
          + 'type="checkbox" '
          + 'id="toggle-flip" '
          + 'class="widget" '
          + '></input>'
      )
          .click( function( event ) {
            advance.viewFlip( $( '#toggle-flip' ).prop( 'checked' ) ) ;
            updateBoard( advance ) ;
          } )
          .appendTo( '#top' )
      ;

      $( '<label id="label-toggle-flip" for="toggle-flip" >-flip-</label>' ).appendTo( '#top' ) ;


      $( '<button type="button" id="next-answer-or-card" class="widget" ><b>-next-</b></button>' )
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

      $( '<input '
          + 'type="checkbox" '
          + 'id="toggle-deck" '
          + 'class="widget" '
          + '></input>'
      )
          .click( function( event ) {
            advance.deckEnabled( $( '#toggle-deck' ).prop( 'checked' ) ) ;
            updateBoard( advance ) ;
          } )
          .appendTo( '#top' )
      ;

      $( '<label id="label-toggle-deck" for="toggle-deck" >-deck-</label>' ).appendTo( '#top' ) ;

      $( '<button type="button" id="add-to-deck" class="widget" >- + -</button>'
      )
          .click( function( event ) {
              if( advance.addToDeck( advance.currentCard() ) ) animateColor( $( this ) ) ;
              updateDeckContentChangeButtons( advance ) ;
          } )
          .appendTo( '#top' )
      ;

      $( '<button type="button" id="remove-from-deck" class="widget" >- - -</button>'
      )
          .click( function( event ) {
              if( advance.removeFromDeck( advance.currentCard() ) ) animateColor( $( this ) ) ;
              updateDeckContentChangeButtons( advance ) ;
          } )
          .appendTo( '#top' )
      ;

      function animateColor( $this ) {
          $this
              .animate( { color: "#cccccc" }, 50 )
              .animate( { color: "#000000" }, 500 )
          ;
      }



      if( showLanguageSelector ) {
        $(  '<select id="language-selection" class="widget" >' )
            .change( function( event ) {
                advance.i18nCode( $( this ).val() ) ;
                updateLabels() ;
                if( advance.viewAsList() ) {
                  // The list may contain some elements subject to change.
                  performAction( new szotargep.action.ShowList( advance ) ) ;
                }
                updateBrowserHistory( advance )
            } )
            .appendTo( '#top' )
        ;

        szotargep.i18n.visitLanguages( function( language ) {
          $( '#language-selection').append(
              '<option value="' + language.code639_1 + '" >' + language.name + '</option>' ) ;
        } ) ;
      }


    }

    function updateLabels( i18nCode ) {
      $( '#select-all-tags' ).text( szotargep.i18n.resource( 'all' ) ) ;
      $( '#deselect-all-tags' ).text( szotargep.i18n.resource( 'none' ) ) ;
      $( '#next-answer-or-card' ).html( '<b>' + szotargep.i18n.resource( 'next' ) + '</b>' ) ;
      $( '#label-toggle-list' ).text( szotargep.i18n.resource( 'list' ) ) ;
      $( '#label-toggle-flip' ).text( szotargep.i18n.resource( 'flip' ) ) ;

      $( '#label-toggle-deck' ).text( szotargep.i18n.resource( 'deck' ) ) ;
      $( '#add-to-deck' ).text( szotargep.i18n.resource( 'addToDeck' ) ) ;
      $( '#remove-from-deck' ).text( szotargep.i18n.resource( 'removeFromDeck' ) ) ;

      $( '#label-' + szotargep.vocabulary.UNTAGGED.replace( '$', '\\$' ) )
          .html( '<em>' + szotargep.i18n.resource( 'untagged' ) + '</em>' ) ;

      if( i18nCode ) $( '#language-selection' ).val( i18nCode ) ;
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
            .delay( visible ? 1 : 0 ) // Delay saves from blinking when action is quick.
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
//        console.debug( 'Starting action...' ) ;
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
//                console.debug( 'Completed action in ' + elapsed( start ) + '.' ) ;
              }
            },
            action
        ).perform() ;
      }
    }() ;

  }

} ( window.szotargep = window.szotargep || {} ) ) ;
