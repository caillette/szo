

function verifyBrowserFeatures( div ) {
  reportHtml( '<h3>Verifying browser features…</h3>' ) ;
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

    console.log( 'Initializing…' ) ;

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
            // Do it here after the Worker said it started. When doing it before it gets polluted
            // by some yet-uncancelled computation.
            $( '#board' ).empty() ;
            break ;
          case 'computation-progress' :
            // Re-post to the Worker for triggering next computation steps.
            worker.postMessage( { command : 'computation-continue' } ) ;
            $( '#board' ).append( e.data.html ) ;
            break ;
          case 'computation-complete' :
            if( e.data.html ) {
              $( '#board' ).html( e.data.html ) ;
            }
            $( '#computation-in-progress' ).css( 'visibility', 'hidden') ;
            console.log( 'Computation complete.' ) ;
            break ;
        }

      },
      false
    ) ;
    worker.postMessage( '' ) ; // Start it up.


    $( '<button>Multi-step computation</button>' )
        .click( function() {
          $( '#computation-in-progress' ).css( 'visibility', 'visible') ;
          worker.postMessage( { command : 'computation-start', computation : 'long-dummy' } ) ;
        } )
        .appendTo( '#top' )
    ;
    $( '<button>Single-step computation</button>' )
        .click( function() {
          $( '#computation-in-progress' ).css( 'visibility', 'visible') ;
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

    console.log( 'Initialization complete.' ) ;
  }

}