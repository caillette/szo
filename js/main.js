

function verifyBrowserFeatures() {
  reportHtml( '<h3>Checking browser features…</h3>' ) ;
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

    report( 'transferableobjects', detectTransferable() ) ; // Not mandatory.
  }

  // Future:
  // - Browser display (small or large).
  // ?
  return { capable : allGood } ;


  function report( feature, supported ) {
    reportHtml( '<p>' + feature + ( supported ? ' ok' : ' <b>not supported</b>' ) + '</p>' ) ;
  }

  function reportHtml( featureMessageHtml ) {
    $( '#browser-features' ).append( featureMessageHtml ) ;
  }


  function isChromeUsingFileOrigin() {
    return window.location.origin == 'file://'
        && window.navigator.userAgent.indexOf( 'Chrome' ) >= 0 ;
  }

  function detectTransferable() {
    try {
      var worker = new Worker( 'js/worker.js' ) ;
      // http://updates.html5rocks.com/2011/12/Transferable-Objects-Lightning-Fast
      worker.postMessage = worker.webkitPostMessage || worker.postMessage ;

      var ab = new ArrayBuffer( 1 ) ;
      worker.postMessage( { command : 'feature-detection' }, [ ab ] ) ;
      if( ab.byteLength ) {
        return false ;
      } else {
        return true ;
      }
    } catch( e ) {
      return false ;
    }
  }

}


function documentReady( browserCapabilities ) {
  var capabilities = verifyBrowserFeatures() ;
  if( capabilities.capable ) {
    $( '#browser-features' ).hide() ;

    console.log( 'Initializing…' ) ;

    var worker = new Worker( 'js/worker.js' ) ;
    worker.addEventListener( 'message', function( e ) {

    var payload ;

    if( e.data instanceof ArrayBuffer ) {
      // Dirty trick that works as long as we use ArrayBuffer in only one single case.
      payload = {} ;
      payload.command = 'computation-complete' ;
      payload.html = arrayBufferToString( e.data ) ;
    } else {
      payload = e.data ;
    }

      switch( payload.command ) {
        case 'log' :
          console.log( payload.message ) ;
          break ;
        case 'echo' :
          alert( payload.message ) ;
          break ;
        case 'computation-continue' :
          // Re-post to the Worker which wants to trigger next computation steps.
          worker.postMessage( payload ) ;
          break ;
        case 'computation-complete' :
          $( '#board' ).html( payload.html ) ;
          console.log( 'JQuery added HTML.' ) ;
      }
    }, false ) ;
    worker.postMessage() ; // Start it up.

    // http://jsperf.com/string-fromcharcode-apply-vs-for-loop
    // Doesn't work (know stack overflow problem):
    //   http://updates.html5rocks.com/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
    function arrayBufferToString( arrayBuffer ) {
      var string = '' ;
      var bufferView = new Uint16Array( arrayBuffer ) ;
      for( var i = 0 ; i < bufferView.length ; i++ ) {
        string += String.fromCharCode( bufferView[ i ] ) ;
      }
      return string ;
    }


    $( '<button>Multi-step computation</button>' )
        .click( function() {
          worker.postMessage( { command : 'computation-start' } ) ;
        } )
        .appendTo( '#top' )
    ;
    $( '<button>Say hi to Worker</button>' )
        .click( function() {
          worker.postMessage( { command : 'echo', payload : 'hi' } ) ;
        } )
        .appendTo( '#top' )
    ;


    console.log( 'Initialization complete.' ) ;

  }



}