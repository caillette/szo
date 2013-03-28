

function checkBrowserFeatures() {
  $( '#required-features' ).append( '<h3>Checking required features…</h3>' ) ;
  var required = [ 'applicationcache', 'history', 'webworkers' ] ;

  var allGood = true ;

  if( isChromeUsingFileOrigin() ) {
    allGood = false ;
    reportHtml( '<p>Google Chrome <b>doesn\'t support file://</b> properly</p>' ) ;
  } else {
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
    $( '#required-features' ).append( featureMessageHtml ) ;
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

      var ab = new ArrayBuffer( 1 ) ; // TODO: use magic value to tell real worker it's dummy.
      worker.postMessage( ab, [ ab ] ) ;
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