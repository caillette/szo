
function log( message ) {
  // A Worker can't log using window.console .
  self.postMessage( { command : 'log', message : message } ) ;
}

self.addEventListener( 'message', function( e ) {
  switch( e.data && e.data.command ) {
    case 'feature-detection' :
      // Used to check Transferable Objects feature, does nothing.
      break ;
    case 'echo' :
      log( 'echo: ' + e.data.payload ) ;
      break ;
  }
}, false ) ;



