
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

