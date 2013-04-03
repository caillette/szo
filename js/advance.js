
// Represents the state that user put the application into by its various actions.
// There is no notification because the HTML-bound part controls the whole kinematics.
var Advance = function() {
  // vocabulary: a Vocabulary instance.
  // uriParameters: value of window.location.search that reflects the state in another session.
  // random: an optional random generator for testing.
  var constructor = function Advance( vocabulary, uriParameters, random ) {

    if( typeof random === 'undefined' ) {
      random = function( upperIndex ) {
        return Math.floor( Math.random() * upperIndex ) ;
      }
    }

    var tags = [] ;
    var cards = [] ;
    var currentCard = null ;
    var disclosure = 0 ;
    var viewAsList = false ;

    // TODO use uriParameters.

    // tags: an array of tags to select or one single String representing a tag.
    // Throws an exception if the tag is unknown.
    this.selectTags = function( tags ) {
      if( typeof tags === 'string' ) {
        this.tags = [ tags ] ;
      } else {
        this.tags = tags.slice( 0 ) ;
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
      if( currentCard == null ) pickRandomCard() ;
    }

    this.pickRandomCard = function() {
      throw 'Not implemented' ;
    }

    // Returns a Card object when switching to the next Card (may be null).
    // When disclosing the next answer, returns 0 or greater as answer index.
    this.nextAnswerOrCard = function() {
      if( this.viewAsList() ) throw 'Illegal state: viewing as a list' ;
      throw 'Not implemented' ;
    }

    // Returns the Card instance corresponding to the current Card.
    // Returns null if viewing as a list or if there is no Card selected.
    this.currentCard = function() {
      throw 'Not implemented' ;
    }

    this.disclosure = function() {
      if( this.currentCard() == null ) throw 'No current Card' ;
      if( disclosure < 0 ) throw 'Internal error, disclosure=' + disclosure ;
      return disclosure ;
    }

    // asList: boolean, optional, method has no side-effect if asList is not set.
    // Returns the updated value.
    this.viewAsList = function( asList ) {
      if( typeof asList != 'undefined' ) {
        viewAsList = asList ;
      }
      return asList ;
    }

    // Returns array copy. Not a great deal as we use it only for debugging.
    this.tags = function() {
      return tags.slice( 0 ) ;
    }

    // Returns array copy. Not a great deal as we use it only for debugging.
    this.cards = function() {
      return cards.slice( 0 ) ;
    }

    this.visitCards = function( visitor ) {
      for( var c = 0 ; c < cards.length ; c ++ ) {
        visitor( cards[ c ] ) ;
      }
    }

  }
  return constructor ;
}() ;


