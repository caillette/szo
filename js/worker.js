
function log( message ) {
  // A Worker can't log using window.console so it delegates to main thread.
  self.postMessage( { command : 'log', message : message } ) ;
}



self.addEventListener( 'message', function( e ) {
  switch( e.data && e.data.command ) {

    case 'echo' :
      log( 'echo: ' + e.data.message ) ;
      break ;

    case 'computation-start' :
      self.postMessage( { command : 'computation-start' } ) ; // Trigger board cleanup.
      currentComputation = new ComputationLoop(
          {
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
          },
          new DummyComputation( 10000 )
      ).batch() ;
      break ;

    case 'computation-continue' :
      if( currentComputation ) {
        currentComputation = currentComputation.batch() ;
      }
      break ;

  }
}, false ) ;

var currentComputation = null ;

// Encapsulates a computation that takes many steps to complete.
// Step execution occurs by batch of parameterized size.
// The result of each batch feeds the main thread for DOM update, so new HTML flows smoothly.
// The Computation asks to the main thread to trigger next batch (a Worker can't post events to
// itself), so another Computation may start and cancel the running one.
var ComputationLoop = function() {

  var computationIdGenerator = 0 ;

  var constructor = function ComputationLoop( context, stepper ) {

    var id = computationIdGenerator ++ ;
    var batch = 0 ;

    this.batch = function() {
      if( stepper.isComplete() ) {
        log( 'Worker completed computation ' + id + '.' )
        context.onComputationComplete() ;
        return null ;
      } else {
        for( var i = 0 ; i < context.batchSize ; i ++ ) {
          stepper.singleStep( id, batch ) ;
          if( stepper.isComplete() ) break ;
        }
        context.onBatchComplete( stepper.html() ) ;
        batch ++ ;
        return this ;
      }
    }

    this.toString = function() {
      return this.constructor.name + '{id=' + id + '}' ;
    }
  } ;

  return constructor ;
}() ;

var DummyComputation = function() {

  var constructor = function DummyComputation( stepCount ) {

    var step = 0 ;
    var html = '<p>Initialized ' + this.constructor.name + '</p>' ;

    this.isComplete = function() {
      return step >= stepCount ;
    }

    this.singleStep = function( id, batch ) {
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
      html += '<p></p>' ;
      step ++ ;
    }

    this.html = function() {
      return html ;
    }

  }

  return constructor ;
}() ;
