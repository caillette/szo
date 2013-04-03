
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

