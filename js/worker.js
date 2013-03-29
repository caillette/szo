
function log( message ) {
  // A Worker can't log using window.console so it delegates to main thread.
  self.postMessage( { command : 'log', message : message } ) ;
}



self.addEventListener( 'message', function( e ) {
  switch( e.data && e.data.command ) {

    case 'echo' :
      log( 'echo: ' + e.data.payload ) ;
      break ;

    case 'computation-start' :
      self.postMessage( { command : 'computation-start' } ) ; // Trigger board cleanup.
      currentComputation = new Computation( {
          batchSize : 100,
          onBatchComplete : function( html ) {
            // Will cause sending back a 'computation-continue' message.
            self.postMessage( {
                command : 'computation-progress',
                // Don't use Transferable Objects, it's just a rather small String here,
                // and we would have to rebuild it on the other side.
                html : html
            } ) ;
          },
          onComputationComplete : function() {
            self.postMessage( { command : 'computation-complete' } ) ;
            currentComputation = null ;
          }
      } ).batch() ;
      break ;

    case 'computation-continue' :
      if( currentComputation ) {
        currentComputation = currentComputation.batch() ;
      }
      break ;

  }
}, false ) ;

var currentComputation = null ;

// Encapsulates a computation that takes several steps to complete.
// Several steps occurs in a batch.
// The result of each batch feeds the main thread for DOM update, so new HTML flows smoothly.
// The Computation asks to the main thread to trigger next batch, so another Computation
// may start and cancel the running one.
var Computation = function() {

  var computationIdGenerator = 0 ;

  var constructor = function Computation( context ) {

    var id = computationIdGenerator ++ ;
    var step = 0 ;
    var batch = 0 ;
    var html = '<p>Initialized as computation #' + id + '</p>' ;

    function isComplete() {
      return step >= 10000 ;
    }

    function singleStep() {
      html += '<table>' ;
      html += '  <tbody>' ;
      html += '    <tr>' ;
      html += '      <td>Computation</td>' ;
      html += '      <td>' + id + '</td>' ;
      html += '    </tr>' ;
      html += '    <tr>' ;
      html += '      <td>Batch</td>' ;
      html += '      <td>' + batch + '</td>' ;
      html += '    </tr>' ;
      html += '    <tr>' ;
      html += '      <td>Step</td>' ;
      html += '      <td>' + step + '</td>' ;
      html += '    </tr>' ;
      html += '  </tbody>' ;
      html += '</table>' ;
      html += '<p></p>'
      step ++ ;
    }

    this.batch = function() {
      if( isComplete() ) {
        log( 'Worker completed computation ' + id + '.')
        context.onComputationComplete() ;
        return null ;
      } else {
        for( var i = 0 ; i < context.batchSize ; i ++ ) {
          singleStep() ;
          if( isComplete() ) break ;
        }
        context.onBatchComplete( html ) ;
        html = '' ;
        batch ++ ;
        return this ;
      }
    }
  } ;

  return constructor ;
}() ;

