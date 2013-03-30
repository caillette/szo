
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
            onComputationComplete : function() {
              self.postMessage( { command : 'computation-complete' } ) ;
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

// Encapsulates a computation that takes many steps to complete.
// Step execution occurs by batch of parameterized size.
// The result of each batch feeds the main thread for DOM update, so new HTML flows smoothly.
// When able to take several steps (by defining 'singleStep' and 'isComplete' functions)
// the Computation asks to the main thread to trigger next batch (a Worker can't post events to
// itself), so another Computation may start and cancel the running one.
// The case where the Computation occurs in a unique step (defining 'uniqueStep' function)
// is a simplification of the former.
var ComputationLoop = function() {

  var computationIdGenerator = 0 ;

  var constructor = function ComputationLoop( context, stepper ) {

    var id = computationIdGenerator ++ ;
    var batch = 0 ;

    this.batch = function() {
      if( stepper.uniqueStep && typeof( stepper.uniqueStep ) == "function" ) {
        if( batch > -1 ) {
          batch = -1 ;
          stepper.uniqueStep( id ) ;
          context.onBatchComplete( stepper.html() ) ;
          context.onComputationComplete() ;
        }
      } else if( stepper.isComplete() ) {
        log( 'Worker completed computation ' + id + '.' )
        context.onComputationComplete() ;
        return null ;
      } else {
        for( var i = 0 ; i < context.batchSize ; i ++ ) {
          stepper.singleStep( i == 0, id, batch ) ;
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

    var step = 0 ;
    var html ;

    this.isComplete = function() {
      return step >= stepCount ;
    }

    this.singleStep = function( newBatch, id, batch ) {
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
