
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

    case 'computation-start' :
      currentComputation = new Computation( {
          url : 'whatever',
          onStepComplete : function() {
            // A Worker can't post messages to itself so we ask our caller to "bounce" messages.
            self.postMessage( {
                command : 'computation-continue'
            } ) ;
          },
          onComputationComplete : function( html ) {
            self.postMessage( {
                command : 'computation-complete',
                html : html
            } ) ;
          }
      } ).step() ;
      break ;

    case 'computation-continue' :
      if( currentComputation ) {
        currentComputation = currentComputation.step() ;
      }
      break ;

  }
}, false ) ;

var currentComputation = null ;

// Encapsulates a computation that takes several steps to complete.
// Breaking it into steps allows cancellation of the ongoing one when user requests another.
var Computation = function() {

  var computationIdGenerator = 0 ;

  var constructor = function Computation( context ) {
    var id = computationIdGenerator ++ ;
    var step = 0 ;
    var html = 'Initialized as computation #' + id + '<br>' ;

    this.step = function() {
      if( step < 10000 ) {
        html += 'We are at step ' + step + '<br>\n' ;
        step ++ ;
        context.onStepComplete() ;
        return this ;
      } else {
        context.onComputationComplete( html ) ;
        return null ;
      }
    }

  } ;

  return constructor ;
}() ;

