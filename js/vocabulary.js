
var Pack = function() {

  // content:
  // - If 'content instanceof Array' evaluates to true, treated as an array of Card objects.
  // - If 'content instanceof String' evaluates to true, treated as a parseable String.
  // - Throws an exception otherwise.
  var constructor = function Pack( id, url, content ) {

    var cards ;

    if( isArray( content ) ) {
      cards = content ;
    } else if( content instanceof String ) {
      throw 'Not implemented :(' ;
    } else {
      throw 'Unsupported content' ;
    }

    this.cards = function() {
      return cards ;
    } ;

    // The unique id of this Pack.
    // A Card displays its originating Pack. Since Cards and Packs go through an HTML representation
    // serialized to get out from Worker's thread, copying the whole Pack object would end up with
    // lots of duplications.
    // Pack's id allows to get back Card's pack on window thread.
    // Worker should send the id-indexed array of all Packs once it loaded them.
    this.id = function() {
      return id ;
    }

    this.url = function() {
      return url ;
    }
  }

  constructor.prototype.toString = function() {
    return 'Pack{' + this.url() + '}' ;
  }

  return constructor ;
}() ;


var Card = function() {

  var constructor = function Card( questions, answers, tags, pack ) {
    this.tags = function() {
      return tags ;
    }
    this.pack = function() {
      return pack ;
    }
  }

  constructor.prototype.toString = function() {
    throw 'Not implemented' ;
  }

  constructor.prototype.toHtml = function( standalone, inverted ) {
    throw 'Not implemented' ;
  }

  // tags: one of the following.
  // - An array of non-null Strings representing tags. Method returns true if there is at least
  //   one of the given tags that appear in the Card.
  // - null. Method returns true if Card has no tag at all.

  constructor.prototype.hasTag = function( tag ) {
    if( tag === null ) {
      return this.tags().length === 0 ;
    } else if( typeof tag === 'string' ) {
      return this.tags().indexOf( tag ) >= 0 ;
    } else if( isArray( tag ) ) {
      for( t in tag ) {
        if( this.hasTag( tag[ t ] ) ) {
          return true ;
        }
      }
    } else {
      throw 'Unsupported tag type: ' + tag ;
    }
    return false ;
  }

  return constructor ;
}() ;


var Vocabulary = function() {

  var constructor = function Vocabulary( packs ) {

    this.packs = function() {
      return packs ;
    }

    // Returns an array containing the tags, with no duplicates.
    // Using an array (keys are ints, values are tags) handles the case where tags do have
    // the same name as reserved object members.
    this.tags = function() {
      var result = new Array() ;
      for( p in packs ) {
        var pack = packs[ p ] ;
        for( c in pack.cards() ) {
          var card = pack.cards()[ c ] ;
          for( t in card.tags() ) {
            var tag = card.tags()[ t ] ;
            if( result.indexOf( tag ) < 0 ) {
              result.push( tag ) ;
            }
          }
        }
      }
      return result ;
    }

    // tags: one of the following.
    //   - An array of non-null Strings representing tags wanted.
    //   - null for cards with no tag.
    //   - No value for all the Cards.
    this.cards = function( tags ) {
      var result = new Array() ;
      for( p in packs ) {
        var pack = packs[ p ] ;
        for( c in pack.cards() ) {
          var card = pack.cards()[ c ] ;
          if( typeof tags === 'undefined' || card.hasTag( tags ) ) {
            result.push( card ) ;
          }
        }
      }
      return result ;
    }

  }

  constructor.prototype.toString = function() {
    throw 'Not implemented' ;
  }

  return constructor ;
}() ;