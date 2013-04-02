

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

    var nextComputationId = function() {
      var computationId = 0 ;
      return function() {
        return computationId ++ ;
      }
    }() ;

    function startComputation( event, parameters ) {
      start = new Date() ;
      console.debug( 'Starting computation...' ) ;
      computationInProgress( true ) ;
      $( '#board' ).empty() ;
      parameters.command = 'computation-start' ;
      if( event.currentTarget.type == 'checkbox' ) {
        // If this is a checkbox we let the worker trigger its state change.
        event.preventDefault() ;
      }

      var computation ;
      switch( parameters.computation ) {
        case 'long-dummy' :
          computation = new LongDummyComputation( 10000 ) ;
          break ;
        case 'short-dummy' :
          computation = new ShortDummyComputation() ;
          break ;
      }
      currentLoop = new ComputationLoop(
          {
            id : nextComputationId(),
            batchSize : 100,
            onBatchComplete : function( result ) {
              $( '#board' ).append( result.html ) ;
              setTimeout(
                  function() {
                    if( currentLoop ) currentLoop = currentLoop.batch() ;
                  },
                  1 // Let window thread take a breath.
              ) ;
            },
            onComputationComplete : function( result ) {
              result = typeof result === 'undefined' ? {} : result ;
              if( result.html ) {
                // Worker was running a single-step computation.
                $( '#board' ).html( result.html ) ;
                applyPropertyChanges( result.propertyChanges ) ;
              }
              currentLoop = null ;
              computationInProgress( false ) ;

            },
            log : function( message ) {
                console.debug( message ) ;
            }
          },
          computation
      ).batch() ;

    }

    var currentLoop = null ;


    function addWidgets() {
      $( '<button id="long-dummy-computation" >Multi-step computation</button>' )
          .click( function( event ) {
              startComputation( event, { computation : 'long-dummy' } ) ;
          } )
          .appendTo( '#top' )
      ;
      $( '<input '
          + 'type="checkbox" '
          + 'id="short-dummy-computation" '
          + 'name="short-dummy-computation" '
          + '></input>'
      )
          .click( function( event ) {
              startComputation( event, { computation : 'short-dummy' } ) ;
          } )
          .appendTo( '#top' )
      ;
      $( '<label for="short-dummy-computation" >Single-step computation</label>' )
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

    function computationInProgress( visible ) {
      $( '#computation-in-progress' )
          .stop( true, true )
          .animate( { opacity : ( visible ? 1 : 0 ) }, 100 )
      ;
    }

    console.log( 'Initialization complete.' ) ;
  }

}

