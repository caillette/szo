

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

    console.log( 'Initializing ...' ) ;
    var start ;

    var worker = new Worker( 'js/worker.js' ) ;
    worker.addEventListener(
      'message',
      function( e ) {

        switch( e.data.command ) {
          case 'log' :
            console.log( '[Worker] ' + e.data.message ) ;
            break ;
          case 'echo' :
            alert( e.data.message ) ;
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
              console.log( 'Computation completed in ' + elapsed( start ) + ', DOM updated.' ) ;
              start = null ;
            }, 1 ) ; // Delay guarantees this occurs after processing pending DOM updates.
            break ;
        }

      },
      false
    ) ;
    worker.postMessage( '' ) ; // Start it up.


    $( '<button>Multi-step computation</button>' )
        .click( function() {
          start = new Date() ;
          console.log( 'Starting computation ...' ) ;
          computationInProgress( true ) ;
          worker.postMessage( { command : 'computation-start', computation : 'long-dummy' } ) ;
        } )
        .appendTo( '#top' )
    ;
    $( '<button>Single-step computation</button>' )
        .click( function() {
          console.log( 'Starting computation...' ) ;
          computationInProgress( true ) ;
          start = new Date() ;
          worker.postMessage( { command : 'computation-start', computation : 'short-dummy' } ) ;
        } )
        .appendTo( '#top' )
    ;
    $( '<button>Say hi to Worker</button>' )
        .click( function() {
          worker.postMessage( { command : 'echo', message : 'hi' } ) ;
        } )
        .appendTo( '#top' )
    ;

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