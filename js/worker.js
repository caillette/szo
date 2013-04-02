importScripts( 'shared.js' ) ;

function log( message ) {
  // A Worker can't log using window.console so it delegates to main thread.
  self.postMessage( { command : 'log', message : message } ) ;
}

self.addEventListener( 'message', function( e ) {
  switch( e.data && e.data.command ) {

    case 'echo' :
      log( 'echo: ' + e.data.message ) ;
      break ;

    case 'configure' :
      log( 'Configuring ...' ) ;
      break ;

    case 'computation-start' :
      self.postMessage( { command : 'computation-start' } ) ; // Trigger board cleanup.
      
      var computation ;
      switch( e.data.computation ) {
        case 'long-dummy' :
          computation = new LongDummyComputation( 10000 ) ;
          break ;
        case 'short-dummy' :
          computation = new ShortDummyComputation() ;
          break ;
      }
      
      currentLoop = new ComputationLoop(
          {
            batchSize : 100,
            onBatchComplete : function( result ) {
              // Will cause sending back a 'computation-continue' message.
              result.command = 'computation-progress' ;
              self.postMessage( result ) ;
              // Don't use Transferable Objects, it's just a rather small String here,
              // and we would have to rebuild it on the other side.
            },
            onComputationComplete : function( result ) {
              result = typeof result == 'undefined' ? {} : result ;
              result.command = 'computation-complete' ;
              self.postMessage( result ) ;
              currentLoop = null ;
            },
            log : function( message ) {
                log( message ) ;
            }
          },
          computation
      ).batch() ;
      break ;

    case 'computation-continue' :
      if( currentLoop ) {
        currentLoop = currentLoop.batch() ;
      }
      break ;

  }
}, false ) ;

var currentLoop = null ;

