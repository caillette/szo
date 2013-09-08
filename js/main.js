( function ( szo ) {

  szo.main = {} ;

  szo.main.documentReady = function() {

    var showLanguageSelector = false ;

    if( new szo.browser.Capabilities( '#browser-capabilities' ).capable() ) {
      $( '#browser-capabilities' ).hide() ;

      console.debug( 'Initializing ...' ) ;

      szo.loader.load(
          '#problems',
          window.location.search,
          function( vocabulary, locationSearch ) {
            $( '.initialization' ).css( 'display', 'none' ) ;
            var advance = new szo.advance.Advance( vocabulary, locationSearch ) ;
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
      szo.i18n.initialize( i18nSupplier ) ;
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

      szo.index.cardOfIndex = function( index ) {
        return cards[ index ] ;
      } ;

      szo.index.indexOfCard = function( card ) {
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
          szo.vocabulary.UNTAGGED,
          '-untagged-',
          function( checked ) { advance.toggleTag( szo.vocabulary.UNTAGGED, checked ) }
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
        performAction( new szo.action.ShowList( advance ) ) ;
      } else {
        performAction( new szo.action.ShowSingleCard( advance ) ) ;
      }
      updateTagCheckedState( advance ) ;

      $( '#next-answer-or-card' ).prop( 'disabled', advance.viewAsList() ) ;
      $( '#toggle-list' ).prop( 'checked', advance.viewAsList() ) ;
      $( '#toggle-flip' ).prop( 'checked', advance.viewFlip() ) ;
      $( '#toggle-deck' ).prop( 'checked', advance.deckEnabled() ) ;

      updateDeckChangingWidgets( advance ) ;
      updateBrowserHistory( advance ) ;
    }

    function updateDeckChangingWidgets( advance ) {
      var noDeckAction = advance.viewAsList() || advance.currentCard() == null ;
      $( '#add-to-deck' ).prop(
          'disabled',
          noDeckAction || advance.deckContains( advance.currentCard() )
      ) ;
      $( '#remove-from-deck' ).prop(
          'disabled',
          noDeckAction || ! advance.deckContains( advance.currentCard() )
      ) ;
    }

    var oldLocationSearch = null ;

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

      if( newLocationSearch != oldLocationSearch ) {
        window.history.pushState( null, null, newLocationSearch ) ;
        oldLocationSearch = newLocationSearch ;
      }
    }

    function createTopWidgets( advance ) {


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


      $( '<button type="button" id="select-all-tags" class="widget" >-all-</button>'
      )
          .click( function( event ) {
              advance.selectAllTags() ;
              updateBoard( advance ) ;
              animateColor( $( this ) ) ;
          } )
          .appendTo( '#top' )
      ;

      $( '<button type="button" id="deselect-all-tags" class="widget" >-none-</button>' )
          .click( function( event ) {
              advance.deselectAllTags() ;
              updateBoard( advance ) ;
              animateColor( $( this ) ) ;
          } )
          .appendTo( '#top' )
      ;

      $( '<input '
          + 'type="checkbox" '
          + 'id="toggle-list" '
          + 'class="widget" '
          + '></input>'
      )
          .click( function( event ) {
            toggleViewAsList() ;
          } )
          .appendTo( '#top' )
      ;

      $( '<label id="label-toggle-list" for="toggle-list" >-list-</label>' )
          .appendTo( '#top' ) ;


      $( '<button type="button" id="next-answer-or-card" class="widget" ><b>-next-</b></button>' )
          .click( function( event ) {
            nextAnswerOrCard( $( this ) ) ;
          } )
          .appendTo( '#top' ) 
      ;

      $( '<input '
          + 'type="checkbox" '
          + 'id="toggle-deck" '
          + 'class="widget" '
          + '></input>'
      )
          .click( function( event ) { toggleDeck() } )
          .appendTo( '#top' )
      ;

      $( '<label id="label-toggle-deck" for="toggle-deck" >-deck-</label>' ).appendTo( '#top' ) ;

      $( '<button type="button" id="add-to-deck" class="widget" >- + -</button>' )
          .click( function( event ) { addToDeck( $( this ) ) } )
          .appendTo( '#top' )
      ;

      $( '<button type="button" id="remove-from-deck" class="widget" >- - -</button>'
      )
          .click( function( event ) { removeFromDeck( $( this ) ) } )
          .appendTo( '#top' )
      ;


      if( showLanguageSelector ) {
        $(  '<select id="language-selection" class="widget" >' )
            .change( function( event ) {
                advance.i18nCode( $( this ).val() ) ;
                updateLabels() ;
                if( advance.viewAsList() ) {
                  // The list may contain some elements subject to change.
                  performAction( new szo.action.ShowList( advance ) ) ;
                }
                updateBrowserHistory( advance )
            } )
            .appendTo( '#top' )
        ;

        szo.i18n.visitLanguages( function( language ) {
          $( '#language-selection').append(
              '<option value="' + language.code639_1 + '" >' + language.name + '</option>' ) ;
        } ) ;
      }

      $( '<span id="about" class="widget" ><a href="about.html" target="_blank" >?</a></span>' )
          .appendTo( '#top' )
      ;

      function nextAnswerOrCard( $this ) {
        if( ! advance.viewAsList() ) {
          var next = advance.nextAnswerOrCard() ;
          if( next == 0 ) {
            updateBoard( advance ) ;
          } else {
            disclose( next ) ;
          }
          animateColor( $this ) ;
        }
      }

      function addToDeck( $this ) {
        if( ! advance.viewAsList() ) {
          if( advance.addToDeck( advance.currentCard() ) ) animateColor( $this ) ;
          updateDeckChangingWidgets( advance ) ;
        }
      }

      function removeFromDeck( $this ) {
        if( ! advance.viewAsList() ) {
          if( advance.removeFromDeck( advance.currentCard() ) ) animateColor( $this ) ;
          if( advance.deckEnabled() ) {
            updateBoard( advance ) ;
          } else {
            updateDeckChangingWidgets( advance ) ;
          }
        }
      }

      function toggleDeck() {
        advance.deckEnabled( ! advance.deckEnabled() ) ;
        updateBoard( advance ) ;
      }

      function toggleViewAsList() {
        advance.viewAsList( ! advance.viewAsList() ) ;
        updateBoard( advance ) ;
      }

      function animateColor( $this ) {
          $this
              .stop( true, true )
              .animate( { color: "#cccccc" }, 50 )
              .animate( { color: "#000000" }, 500 )
          ;
      }

      $( document ).bind(
          'keydown', 'right',
          function() { nextAnswerOrCard( $( '#next-answer-or-card' ) ) ; return false }
      ) ;
      $( document ).bind(
          'keydown', 'down',
          function() { addToDeck( $( '#add-to-deck' ) ) ; return false }
      ) ;
      $( document ).bind(
          'keydown', 'up',
          function() { removeFromDeck( $( '#remove-from-deck' ) ) ; return false }
      ) ;
      $( document ).bind( 'keydown', 'left', function() { toggleDeck() ; return false } ) ;

      $( document ).bind( 'keydown', 'return', function() { toggleViewAsList() ; return false } ) ;


    }

    function updateLabels( i18nCode ) {
      $( '#select-all-tags' ).text( szo.i18n.resource( 'all' ) ) ;
      $( '#deselect-all-tags' ).text( szo.i18n.resource( 'none' ) ) ;
      $( '#next-answer-or-card' ).html( '<b>' + szo.i18n.resource( 'next' ) + '</b>' ) ;
      $( '#label-toggle-list' ).text( szo.i18n.resource( 'list' ) ) ;
      $( '#label-toggle-flip' ).text( szo.i18n.resource( 'flip' ) ) ;

      $( '#label-toggle-deck' ).text( szo.i18n.resource( 'deck' ) ) ;
      $( '#add-to-deck' ).text( szo.i18n.resource( 'addToDeck' ) ) ;
      $( '#remove-from-deck' ).text( szo.i18n.resource( 'removeFromDeck' ) ) ;

      $( '#label-' + szo.vocabulary.UNTAGGED.replace( '$', '\\$' ) )
          .html( '<em>' + szo.i18n.resource( 'untagged' ) + '</em>' ) ;

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

        performer = new szo.action.Performer(
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

} ( window.szo = window.szo || {} ) ) ;
