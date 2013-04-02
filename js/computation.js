// Runs a computation that streams HTML to the main thread (a Worker can't modify the DOM).
// Because such computation may take time, the main thread may "interrupt" it.
// But Workers don't directly job cancellation, the computation breaks down itself into steps.
// The ComputationLoop batches steps execution. When a batch is complete, the ComputationLoop
// notifies the main thread, passing the new HTML fragment. Then main thread then updates the
// DOM and sends a message for continuing the computation if possible (a Worker can't post messages
// to itself). The ComputationLoop sends a message to the main thread upon computation completion.
// If the main thread wants to interrupt current computation, it just starts another one.
// The case where the computation occurs in one single step is just a simplification of the
// multi-step case.
var ComputationLoop = function() {

  var constructor = function ComputationLoop( context, stepper ) {

    var batch = 0 ;
    var totalTime = 0 ;


    this.batch = function() {

      function logCompletion( computation, totalTime ) {
        context.log( 'Completed ' + computation + ' computation ' + context.id
            + ' in ' + totalTime + ' ms.' ) ;
      }

      var start = new Date() ;
      if( batch == 0 ) context.log( 'Starting computation ' + context.id + ' ...' ) ;
      if( stepper.singleStep ) {
        context.onComputationComplete( stepper.singleStep( context.id ) ) ;
        logCompletion( 'single-step', new Date() - start ) ;
      } else if( stepper.isComplete() ) {
        context.onComputationComplete() ;
        logCompletion( 'multi-step', totalTime ) ;
      } else {
        for( var i = 0 ; i < context.batchSize ; i ++ ) {
          stepper.step( i == 0, context.id, batch ) ;
          if( stepper.isComplete() ) break ;
        }
        context.onBatchComplete( stepper.batchResult() ) ;
        batch ++ ;
        totalTime += new Date() - start ;
        return this ;
      }
      return null ; // Computation complete.
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

    this.batchResult = function() {
      return { html : html } ;
    }

  }

  return constructor ;
}() ;


var ShortDummyComputation = function() {

  var constructor = function ShortDummyComputation( flag ) {

    this.singleStep = function( id ) {
      var html = '<p>Initialized ' + this.constructor.name + '</p>' ;
      html += '<table>' ;
      html += '  <tbody>' ;
      html += '    <tr>' ;
      html += '      <td>Computation</td>' ;
      html += '      <td>' + id + '</td>' ;
      html += '    </tr>' ;
      html += '    <tr>' ;
      html += '      <td>Flag</td>' ;
      html += '      <td>' + flag + '</td>' ;
      html += '    </tr>' ;
      html += '  </tbody>' ;
      html += '</table>' ;
      html += '<p></p>' ;
      return {
          html : html,
          propertyChanges : [ {
              selector : '#short-dummy-computation',
              propertyName : 'checked',
              value : true
          } ]
      } ;
    }
  }

  return constructor ;
}() ;


// Represents the state that user put the application into by its various actions.
var Advance = function() {
  // vocabulary: a Vocabulary instance.
  // initiator: value of window.location.search that reflects the state in another session.
  var constructor = function Advance( vocabulary, initiator ) {

    var tags = [] ;
    var cards = [] ;
    var currentCard = null ;
    var viewAsList = false ;

    // TODO use initiator.

    this.selectTags = function( tags, selected ) {
      if( typeof tags === 'string' ) {
        this.tags = [ tags ] ;
      } else {
        this.tags = tags.slice( 0 ) ;
      }
      var PreviousCard = currentCards ;
      cards = [] ;
      vocabulary.visitCards( function( card ) {
        if( card.hasTag( tags ) ) cards.push( card ) ;
      } ) ;
      for( var c = 0 ; c < cards.length ; c ++ ) {
        if( cards[ c ] == previousCard ) {
          currentCard = previousCard ;
        } else {
          throw 'TODO: random Card choice' ;
        }
      }
    }

    // Returns array copy. Not a great deal as we use it only for debugging.
    this.tags = function() {
      return tags.slice( 0 ) ;
    }

    // Returns array copy. Not a great deal as we use it only for debugging.
    this.cards = function() {
      return cards.slice( 0 ) ;
    }

  }
  return constructor ;
}

var advance = new Advance() ;

