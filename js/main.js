

function checkBrowserFeatures() {
  $( '#required-features' ).append( '<h3>Checking required features…</h3>' ) ;
  var required = [ 'applicationcache', 'history', 'webworkers' ] ;

  var allGood = true ;
  for( var i in required ) {
    var supported = eval( 'Modernizr.' + required[ i ] ) ;
    $( '#required-features' ).append(
        '<p>' + required[ i ] + ( supported ? ' ok' : ' <b>not supported</b>' ) + '</p>' ) ;
    allGood = allGood && supported ;
  }

  return allGood ;
}