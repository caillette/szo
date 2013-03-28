// Logging, from http://stackoverflow.com/a/12580824
( function() {
  // create a noop console object if the browser doesn't provide one.
  if( ! window.console ) {
    window.console = {} ;
  } else {
    // IE has a console that has a 'log' function but no 'debug'. to make console.debug work in IE,
    // we just map the function. (Extend for info etc if needed.)
    if( ! window.console.debug && typeof window.console.log !== 'undefined' ) {
      window.console.debug = window.console.log ;
    }
  }

  // ... And create all functions we expect the console to have (took from firebug).
  var names = [ 'log', 'debug', 'info', 'warn', 'error', 'assert', 'dir', 'dirxml',
      'group', 'groupEnd', 'time', 'timeEnd', 'count', 'trace', 'profile', 'profileEnd' ] ;

  for( var i = 0 ; i < names.length; ++i ) {
    if( ! window.console[ names[ i ] ] ) {
      window.console[ names[ i ] ] = function() {} ;
    }
  }

  window.console.debug = function() {} ;

} )() ;
