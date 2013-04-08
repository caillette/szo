( function ( szotargep ) {

  szotargep.advance = {} ;

  // Represents the state that user put the application into by its various actions.
  // There is no notification because the HTML-bound part controls the whole kinematics.
  szotargep.advance.Advance = function() {
    // vocabulary: a Vocabulary instance.
    // uriParameters: value of window.location.search that reflects the state in another session.
    // random: an optional random generator for testing.
    var constructor = function Advance( vocabulary, uriParameters, random ) {

      if( typeof random === 'undefined' ) {
        random = function( upperIndex ) {
          return Math.floor( Math.random() * upperIndex ) ;
        }
      }

      var tagSelection = [] ;
      var cards = [] ;
      var currentCard = null ;
      var disclosure = 0 ;
      var asList ;


      // TODO use uriParameters.

      // tags: a value understood by Card.hasTag method.
      this.selectTags = function( tags ) {
        if( Array.isArray( tags ) ) {
          tagSelection = tags.slice( 0 ) ;
        } else {
          throw 'Unsupported: ' + tags ;
        }
        var previousCard = currentCard ;
        currentCard = null ;
        cards = [] ;
        vocabulary.visitCards( function( card ) {
          if( card.hasTag( tags ) ) cards.push( card ) ;
        } ) ;
        for( var c = 0 ; c < cards.length ; c ++ ) {
          if( cards[ c ] === previousCard ) {
            currentCard = previousCard ;
          }
        }
        if( currentCard == null ) this.pickRandomCard() ;
      }

      this.toggleTag = function( tag, selected ) {
        if( selected != this.isTagSelected( tag ) ) {
          var newSelection = this.tagSelection() ; // Does a copy.
//          newSelection = newSelection === null ? [] : newSelection ;
          if( selected ) {
            newSelection.push( tag ) ;
          } else {
            newSelection.remove( newSelection.indexOf( tag ) )
          }
          this.selectTags( newSelection ) ;
        }
      }

      this.pickRandomCard = function() {
        disclosure = 0 ;
        currentCard = cards === null ? null : cards[ random( cards.length ) ] ;
      }

      // Returns 0 when disclosing a new Card, a greater value (starting by 1) otherwise.
      this.nextAnswerOrCard = function() {
        checkViewAsList( false ) ;
        if( ! currentCard || disclosure >= currentCard.answerCount() ) {
          this.pickRandomCard() ;
        } else {
          disclosure ++ ;
        }
        return disclosure ;
      }

      // Returns the Card instance corresponding to the current Card.
      // Returns null if there is no Card selected.
      this.currentCard = function() {
        checkViewAsList( false ) ;
        return currentCard ;
      }

      this.disclosure = function() {
        checkViewAsList( false ) ;
        if( this.currentCard() == null ) throw 'No current Card' ;
        if( disclosure < 0 ) throw 'Internal error: disclosure=' + disclosure ;
        return disclosure ;
      }

      // asList: boolean, optional, method has no side-effect if asList is not set.
      // Returns the updated value.
      this.viewAsList = function( viewAsList ) {
        var oldAsList = asList ;
        if( typeof viewAsList === 'boolean' ) {
          asList = viewAsList ;
        }
        if( asList ) {
          currentCard = null ;
          disclosure = -1 ;
        } else if( oldAsList ) {
          this.pickRandomCard() ;
        }
        return asList ;
      }

      // Returns array copy. Not a great deal as we don't call it often.
      this.tagSelection = function() {
        return tagSelection.slice( 0 ) ;
      }

      this.isTagSelected = function( tag ) {
        return tagSelection.indexOf( tag ) >= 0 ;
      }

      // Returns array copy. Not a great deal as we use it only for debugging.
      this.cards = function() {
        return cards.slice( 0 ) ;
      }

      this.visitCards = function( visitor, onComplete, first, last ) {
        first = typeof first === 'number' ? first : 0 ;
        last = typeof last === 'number' ? Math.min( last, cards.length - 1 ) : cards.length - 1 ;
        var c = first ;
        while( true ) {
          if( c > last ) {
            break
          } else {
            visitor( cards[ c ] ) ;
            c ++ ;
          }
        }
        onComplete() ;
      }

      this.vocabulary = function() {
        return vocabulary ;
      }

      function checkViewAsList( expected ) {
        if( asList != expected ) throw 'Unexpected state: currently viewing as list' ;
      }

      // Show all the Cards as a list.
      this.selectTags( vocabulary.tags() ) ;
      this.toggleTag( szotargep.vocabulary.UNTAGGED, true ) ;
      this.viewAsList( true ) ;

    }
    return constructor ;
  }() ;

} ( window.szotargep = window.szotargep || {} ) ) ;

