

function verifyBrowserFeatures( div ) {
  reportHtml( '<h3>Verifying browser features...</h3>' ) ;
  var required = [ 'applicationcache', 'history', 'webworkers' ] ;

  var allGood = true ;

  if( isChromeUsingFileOrigin() ) {
    allGood = false ;
    reportHtml( '<p>Google Chrome <b>doesn\'t support file://</b> properly</p>' ) ;
  } else {
    // Workers don't work on Chrome with file:// so we don't send wrong message.
    for( var i  = 0 ; i < required.length ; i ++ ) {
      var supported = eval( 'Modernizr.' + required[ i ] ) ;
      report( required[ i ], supported ) ;
      allGood = allGood && supported ;
    }
  }

  // In the future:
  // - Browser display (small or large).
  return { capable : allGood } ;


  function report( feature, supported ) {
    reportHtml( '<p>' + feature + ( supported ? ' ok' : ' <b>not supported</b>' ) + '</p>' ) ;
  }

  function reportHtml( featureMessageHtml ) {
    $( div ).append( featureMessageHtml ) ;
  }

  function isChromeUsingFileOrigin() {
    return window.location.origin == 'file://'
        && window.navigator.userAgent.indexOf( 'Chrome' ) >= 0 ;
  }

}


function documentReady() {

  var capabilities = verifyBrowserFeatures( '#browser-features' ) ;
  if( capabilities.capable ) {
    $( '#browser-features' ).hide() ;

    console.debug( 'Initializing ...' ) ;
    var start ;

    addWidgets() ;

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

      actionPerformer = new ActionPerformer(
          {
            id : nextActionId(),
            batchSize : 100,
            onBatchComplete : function( result ) {
              $( '#board' ).append( result.html ) ;
              setTimeout(
                  function() {
                    if( actionPerformer ) actionPerformer = actionPerformer.perform() ;
                  },
                  1 // Let window thread take a breath.
              ) ;
            },
            onActionComplete : function( result ) {
              result = typeof result === 'undefined' ? {} : result ;
              if( result.html ) {
                // Worker was running a single-step action.
                $( '#board' ).html( result.html ) ;
                applyPropertyChanges( result.propertyChanges ) ;
              }
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


    function addWidgets() {
      $( '<button id="multi-step-action" >Multi-step action</button>' )
          .click( function( event ) {
              performAction( event, new LongDummyAction( 10000 ) ) ;
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
              performAction( event, new ShortDummyAction() ) ;
          } )
          .appendTo( '#top' )
      ;
      $( '<label for="single-step-action" >Single-step action</label>' )
          .appendTo( '#top' )
      ;
    }

    function applyPropertyChanges( propertyChanges ) {
      if( propertyChanges ) {
        for( i in propertyChanges ) {
          var propertyChange = propertyChanges[ i ] ;
          $( propertyChange.selector ).prop( propertyChange.propertyName, propertyChange.value ) ;
        }
      }
    }

    function actionInProgress( visible ) {
      $( '#action-performing' )
          .stop( true, true )
          .delay( visible ? 2 : 0 ) // Delay saves from blinking when action is quick.
          .animate( { opacity : ( visible ? 1 : 0 ) }, 100 )
      ;
    }

    console.log( 'Initialization complete.' ) ;
  }

}

