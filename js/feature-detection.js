var BrowserCapabilities = function() {
  var constructor = function( div ) {

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

    this.capable = function() {
      return allGood ;
    }
  }

  return constructor ;
}() ;

