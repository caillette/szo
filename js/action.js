( function ( szotargep ) {

  szotargep.action = {} ;

  // Performs an action that may take several steps to complete.
  // This lets window thread decide to start the next step, or simply not because another action
  // superceded this one. When selecting a lot of Cards (10.000 or more), one single DOM update
  // would // choke the browser for several seconds. Instead, small incremental updates, while
  // taking // longer in cumulated time, let the window thread "breath" and quickly respond to
  // the user adjusting his choice, before the whole result finished a lengthy DOM update.
  // For avoiding too small increments, the ActionPerformer executes steps in batches.
  // The ActionPerformer supports single-stepped actions as a simplification of the multi-step case.
  szotargep.action.ActionPerformer = function() {

    var constructor = function ActionPerformer( context, action ) {

      var batch = 0 ;
      var totalTime = 0 ;

      this.perform = function() {

        function logCompletion( action, totalTime ) {
          context.log( 'ActionPerformer completed ' + action + ' action ' + context.id
              + ' in ' + totalTime + ' ms.' ) ;
        }

        var start = new Date() ;
        if( batch == 0 ) context.log( 'ActionPerformer starting action ' + context.id + ' ...' ) ;
        if( action.singleStep ) {
          action.singleStep( context.id ) ;
          context.onActionComplete() ;
          logCompletion( 'single-step', new Date() - start ) ;
        } else if( action.isComplete() ) {
          context.onActionComplete() ;
          logCompletion( 'multi-step', totalTime ) ;
        } else {
          for( var i = 0 ; i < context.batchSize ; i ++ ) {
            action.step( i == 0, context.id, batch ) ;
            if( action.isComplete() ) break ;
          }
          context.onBatchComplete() ;
          batch ++ ;
          totalTime += new Date() - start ;
          return this ;
        }
        return null ; // Action complete.
      }

    } ;

    return constructor ;
  }() ;

  szotargep.action.LongDummyAction = function() {

    var constructor = function LongDummyAction( stepCount ) {

      var currentStep = 0 ;

      this.isComplete = function() {
        return currentStep >= stepCount ;
      }

      this.step = function( newBatch, id, batch ) {
        var html = newBatch ? '' : '<p>Initialized ' + this.constructor.name + '</p>' ;

        html += '<table>' ;
        html += '  <tbody>' ;
        html += '    <tr>' ;
        html += '      <td>Action</td>' ;
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

        $( '#board' ).append( html ) ;
        currentStep ++ ;
      }


    }

    return constructor ;
  }() ;


  szotargep.action.ShortDummyAction = function() {

    var constructor = function ShortDummyAction( flag ) {

      this.singleStep = function( id ) {
        var html = '<p>Initialized ' + this.constructor.name + '</p>' ;
        html += '<table>' ;
        html += '  <tbody>' ;
        html += '    <tr>' ;
        html += '      <td>Action</td>' ;
        html += '      <td>' + id + '</td>' ;
        html += '    </tr>' ;
        html += '    <tr>' ;
        html += '      <td>Flag</td>' ;
        html += '      <td>' + flag + '</td>' ;
        html += '    </tr>' ;
        html += '  </tbody>' ;
        html += '</table>' ;
        html += '<p></p>' ;

        $( '#board' ).html( html ) ;
      }
    }

    return constructor ;
  }() ;

} ( window.szotargep = window.szotargep || {} ) ) ;
