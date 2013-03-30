

function verifyBrowserFeatures( div ) {
  reportHtml( '<h3>Verifying browser features...</h3>' ) ;
  var required = [ 'applicationcache', 'history', 'webworkers' ] ;

  var allGood = true ;

  if( isChromeUsingFileOrigin() ) {
    allGood = false ;
    reportHtml( '<p>Google Chrome <b>doesn\'t support file://</b> properly</p>' ) ;
  } else {
    // Workers don't work on Chrome with file:// so we don't send wrong message.
    for( var i in required ) {
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

    var worker = new Worker( 'js/worker.js' ) ;
    worker.addEventListener(
      'message',
      function( e ) {

        switch( e.data.command ) {
          case 'log' :
            console.debug( '[Worker] ' + e.data.message ) ;
            break ;
          case 'echo' :
            alert( e.data.message ) ;
            break ;
          case 'configure' :
            console.debug( "Configuring ..." ) ;
            addWidgets( e.data.widgetDefinitions ) ;
            console.debug( "Configuration complete." ) ;
            break ;
          case 'computation-start' :
            // Do that only after Worker said it started.
            // Doing it before doesn't work as there may be still-running computation sending HTML.
            $( '#board' ).empty() ;
            break ;
          case 'computation-progress' :
            // Re-post to the Worker for triggering next computation batch.
            worker.postMessage( { command : 'computation-continue' } ) ;
            $( '#board' ).append( e.data.html ) ;
            break ;
          case 'computation-complete' :
            if( e.data.html ) {
              // Worker was running a single-step computation.
              $( '#board' ).html( e.data.html ) ;
            }
            computationInProgress( false ) ;
            setTimeout( function() {
              console.debug( 'Computation completed in ' + elapsed( start ) + ', DOM updated.' ) ;
              start = null ;
            }, 1 ) ; // Delay guarantees this occurs after processing pending DOM updates.
            break ;
        }

      },
      false
    ) ;
    worker.postMessage( '' ) ; // Start it up.
    worker.postMessage( { command : 'configure' } ) ;

    $( '<button>Say hi to Worker</button>' )
        .click( function() {
          worker.postMessage( { command : 'echo', message : 'hi' } ) ;
        } )
        .appendTo( '#top' )
    ;

    function startComputation( event, parameters ) {
      start = new Date() ;
      console.debug( 'Starting computation...' ) ;
      computationInProgress( true ) ;
      parameters.command = 'computation-start' ;
      worker.postMessage( parameters ) ;
      if( event.currentTarget.type == 'checkbox' ) {
        // If this is a checkbox we let the worker trigger its state change.
        event.preventDefault() ;
      }
    }

    function addWidgets( widgetDefinitions ) {
      for( i in widgetDefinitions ) {
        var widgetDefinition = widgetDefinitions[ i ] ;
        var $widget = $( widgetDefinition.html )
        $widget.appendTo( widgetDefinition.target ) ;
        if( widgetDefinition.clickParameters ) {
          // Add only on the first widget, omit checkbox label that comes second.
          $widget.first().click( function( parameters ) {
            // Capturing outer value with a JavaScript closure.
            // This prevents a side-effect where parameters were messed up.
            // Normal use of JQuery obtains the same result.
            return function( event ) {
              startComputation( event, parameters ) ;
            } ;
          }( widgetDefinition.clickParameters ) ) ;
        }
      }
    }

    function applyPropertyChanges( propertyChanges ) {
      if( propertyChanges ) {
        for( propertyChange in propertyChanges ) {
          $( propertyChange.selector ).prop( propertyChange.propertyName, propertyChange.value ) ;
        }
      }
    }

    function computationInProgress( visible ) {
      $( '#computation-in-progress' )
          .stop( true, true )
          .delay( visible ? 2 : 0 ) // Delay saves from blinking when computation is quick.
          .animate( { opacity : ( visible ? 1 : 0 ) }, 100 )
      ;
    }

    console.log( 'Initialization complete.' ) ;
  }

}