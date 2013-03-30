
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
            onBatchComplete : function( html ) {
              // Will cause sending back a 'computation-continue' message.
              self.postMessage( {
                  command : 'computation-progress',
                  // Don't use Transferable Objects, it's just a rather small String here,
                  // and we would have to rebuild it on the other side.
                  html : html
              } ) ;
            },
            onComputationComplete : function( html ) {
              var e = { command : 'computation-complete' } ;
              if( html ) e.html = html ;
              self.postMessage( e ) ;
              currentLoop = null ;
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

// Runs a computation that streams HTML to the main thread (a Worker can't modify the DOM).
// Because such computation may take time, the main thread may "interrupt" it.
// But Workers don't directly job cancellation, the computation breaks down itself into steps.
// The ComputationLoop batches steps execution. When a batch is complete, the ComputationLoop
// notifies the main thread, passing the new HTML fragment. Then main thread then updates the
// DOM and sends a message for continuing the computation if possible (a Worker can't post messages
// to itself). The ComputationLoop sends a message to the main thread upon computation completion.
// If the main thread wants to interrupt current computation, it just starts another one.
// The case where the computation occurs in one unique step is just a simplification of the
// multi-step case.
var ComputationLoop = function() {

  var computationIdGenerator = 0 ;

  var constructor = function ComputationLoop( context, stepper ) {

    var id = computationIdGenerator ++ ;
    var batch = 0 ;

    this.batch = function() {
      if( stepper.uniqueStep ) {
        stepper.uniqueStep( id ) ;
        context.onComputationComplete( stepper.html() ) ;
      } else if( stepper.isComplete() ) {
        log( 'Completed multi-step computation ' + id + '.' )
        context.onComputationComplete() ;
        return null ;
      } else {
        for( var i = 0 ; i < context.batchSize ; i ++ ) {
          stepper.step( i == 0, id, batch ) ;
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

var LongDummyComputation = function() {

  var constructor = function LongDummyComputation( stepCount ) {

    var currentStep = 0 ;
    var html ;

    this.isComplete = function() {
      return currentStep >= stepCount ;
    }

    this.step = function( newBatch, id, batch ) {
      if( newBatch ) html = '<p>Initialized ' + this.constructor.name + '</p>' ;

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
      html += '      <td>' + currentStep + '</td>' ;
      html += '    </tr>' ;
      html += '  </tbody>' ;
      html += '</table>' ;
      html += '<p></p>' ;
      currentStep ++ ;
    }

    this.html = function() {
      return html ;
    }

  }

  return constructor ;
}() ;


var ShortDummyComputation = function() {

  var constructor = function ShortDummyComputation( stepCount ) {

    var html = '<p>Initialized ' + this.constructor.name + '</p>' ;

    this.uniqueStep = function( id ) {
      html += '<table>' ;
      html += '  <tbody>' ;
      html += '    <tr>' ;
      html += '      <td>Computation</td>' ;
      html += '      <td>' + id + '</td>' ;
      html += '    </tr>' ;
      html += '  </tbody>' ;
      html += '</table>' ;
      html += '<p></p>' ;
    }

    this.html = function() {
      return html ;
    }

  }

  return constructor ;
}() ;
