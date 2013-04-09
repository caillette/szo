( function ( szotargep ) {

  szotargep.action = {} ;

  // Performs an action that may take several steps to complete.
  // This lets window thread decide to start the next step, or simply not because another action
  // superceded this one. When selecting a lot of Cards (10.000 or more), one single DOM update
  // would choke the browser for several seconds. Instead, small incremental updates, while
  // taking longer in cumulated time, let the window thread "breath" and quickly respond to
  // the user adjusting his choice, before the whole result finished a lengthy DOM update.
  // The ActionPerformer supports single-stepped actions as a simplification of the multi-step case.
  szotargep.action.Performer = function() {

    var constructor = function Performer( context, action ) {

      var step = 0 ;
      var totalTime = 0 ;

      this.perform = function() {

        function logCompletion( action, totalTime ) {
          console.debug( 'ActionPerformer completed ' + action + ' action ' + context.id
              + ' in ' + totalTime + ' ms.' ) ;
        }

        var start = new Date() ;
        if( step == 0 ) console.debug( 'ActionPerformer starting action ' + context.id + ' ...' ) ;
        if( action.singleStep ) {
          action.singleStep( context.id ) ;
          context.onActionComplete() ;
          logCompletion( 'single-step', new Date() - start ) ;
        } else {
          action.step( step == 0, context.id ) ;
          if( action.isComplete() ) {
            totalTime += new Date() - start ;
            context.onActionComplete() ;
            logCompletion( 'multi-step', totalTime ) ;
          } else {
            context.onStepComplete() ;
            return this ;
          }
        }
        return null ; // Action complete.
      }

    } ;

    return constructor ;
  }() ;


  szotargep.action.ShowList = function() {

    var batchSize = 100 ;

    var constructor = function ShowList( advance ) {

      var cardIndex = 0 ;
      var complete = false ;

      this.isComplete = function() {
        return complete ;
      }

      this.step = function() {
        var html = '' ;

        advance.visitCards(
            function( card ) { html += cardAsHtml( card, advance.viewAsList() ) ; },
            function() { complete = true },
            cardIndex,
            cardIndex + batchSize
        ) ;

        html = html === '' ? '<p>Nothing to show</p>' : html ;

        $( '#board' ).append( html ) ;
        cardIndex += batchSize ;
      }

    }

    return constructor ;
  }() ;


  szotargep.action.ShowSingleCard = function() {

    var constructor = function ShowSingleCard( advance ) {

      this.singleStep = function( id ) {
        var html = '' ;
        var card = advance.currentCard() ;
        html += cardAsHtml( card, advance.viewAsList() ) ;
        $( '#board' ).html( html ) ;
        szotargep.html.showCardDetail( card ) ;
      }
    }

    return constructor ;
  }() ;


  function cardAsHtml( card, listView ) {

    function sectionAsTableDivision( section, undisclosed ) {
      var td =
          '<td' + ( ( undisclosed && ! listView ) ? ' class="undisclosed" ' : '' ) + '>'
        + ( section ? '<span>' + section + '</span>' : '' )
        + '</td>\n'
      ;
      return td ;
    }

    html = '' ;

    if( card == null ) {
      html += '<p>No Card to show</p>' ;
    } else {

      var tableAttributes = '' ;
      if( listView ) {
        tableAttributes += ' class="card-list" ' ;
        tableAttributes += 'onMouseOver="szotargep.html.showCardDetail('
            + szotargep.index.indexOfCard( card ) + ')" ' ;
        tableAttributes += 'onMouseOut="szotargep.html.showCardDetail()" ' ;
      }

      html += '<table' + tableAttributes + '>\n' ;
      html += '<tbody>\n' ;

      card.visitStages( function( question, answer ) {
        html += '<tr>\n' ;
        html += sectionAsTableDivision( question, false ) ;
        html += sectionAsTableDivision( answer, true ) ;
        html += '</tr>\n' ;
      } ) ;

      html += '</tbody>\n' ;
      html += '</table>\n' ;
      html += '<p class="void no-selection" ></p>\n' ; // Formatting trick for printing.
    }


    return html ;
  }

} ( window.szotargep = window.szotargep || {} ) ) ;
