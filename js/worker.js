
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
          batchSize : 200,
          onStepComplete : function() {
            // Message bouncing.
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
// Because a Worker can't post messages to itself it asks the caller (through the 'context')
// to repost messages. That's quite heavy so we perform several ('batchSize') steps in sequence.
var Computation = function() {

  var computationIdGenerator = 0 ;

  var constructor = function Computation( context ) {
    var id = computationIdGenerator ++ ;
    var step = 0 ;
    var html = 'Initialized as computation #' + id + '<br>' ;

    function isComplete() {
      return step >= 100000
    }

    function singleStep() {
      html += 'We are at step ' + step + '<br>\n' ;
      step ++ ;
    }

    this.step = function() {
      if( isComplete() ) {
        context.onComputationComplete( html ) ;
        return null ;
      } else {
        for( var i = 0 ; i < context.batchSize ; i ++ ) {
          singleStep() ;
          if( isComplete() ) break ;
        }
        context.onStepComplete() ;
        return this ;
      }
    }

  } ;

  return constructor ;
}() ;

