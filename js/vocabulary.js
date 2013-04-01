// A loadable resource containing Cards.
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
      throw 'Not implemented' ;
    } else {
      throw 'Unsupported content' ;
    }

    this.visitCards = function( visitor ) {
      for( var c = 0 ; c < cards.length ; c ++ ) {
        visitor( cards[ c ] ) ;
      }
    }

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
    return 'Pack{' + this.cards().length + ';' + this.url() + '}' ;
  }

  constructor.prototype.cards = function() {
    var result = new Array() ;
    this.visitCards( function( card ) {
      result.push( card ) ;
    } ) ;
    return result ;
  } ;



  return constructor ;
}() ;

// A set of questions and answers that came out from a Pack.
var Card = function() {

  var constructor = function Card( questions, answers, tags, pack, lineInPack ) {
    this.tags = function() {
      return tags ;
    }
    this.pack = function() {
      return pack ;
    }
    this.lineInPack = function() {
      return lineInPack ;
    }
  }

  constructor.prototype.toString = function() {
    return( 'Card{' + this.lineInPack() + '@' + this.pack().url() + '}' ) ;
  }

  constructor.prototype.toHtml = function( standalone, inverted ) {
    throw 'Not implemented' ;
  }

  // tag: one of the following.
  // - An array of non-null Strings representing tags.
  //   This method returns true if at least one of the given tags appears in the Card.
  // - A String representing a tag. Method returns true if Card has this tag.
  // - null. Method returns true if Card has no tag at all.
  constructor.prototype.hasTag = function( tag ) {
    if( tag === null ) {
      return this.tags().length === 0 ;
    } else if( typeof tag === 'string' ) {
      return this.tags().indexOf( tag ) >= 0 ;
    } else if( isArray( tag ) ) {
      for( var t = 0 ; t < tag.length ; t++ ) {
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

// A queryable collection of Cards.
var Vocabulary = function() {

  var constructor = function Vocabulary( packs ) {

    this.visitPacks = function( visitor ) {
      for( var p = 0 ; p < packs.length ; p++ ) {
        visitor( packs[ p ] ) ;
      }
    }

    // Returns an array containing the tags, with no duplicates.
    // Using an array (keys are ints, values are tags) handles the case where tags do have
    // the same name as reserved object members.
    this.tags = function() {
      var result = new Array() ;
      this.visitCards( function( card ) {
        var tags = card.tags() ;
        for( var t = 0 ; t < tags.length ; t++ ) {
          var tag = tags[ t ] ;
          if( result.indexOf( tag ) < 0 ) {
            result.push( tag ) ;
          }
        }
      } ) ;
      return result ;
    }

    // tags: one of the following.
    // - One single String representing tag wanted.
    // - An array of non-null Strings representing tags wanted.
    // - null for cards with no tag.
    // - No value for all the Cards.
    this.cards = function( tags ) {
      var result = new Array() ;
      this.visitCards( function( card ) {
        if( typeof tags === 'undefined' || card.hasTag( tags ) ) {
          result.push( card ) ;
        }
      } ) ;
      return result ;
    }

  }

  constructor.prototype.toString = function() {
    return 'Vocabulary{'
        + this.packs().length + ';'
        + this.cards().length + ';'
        + this.tags().length +  '}'
    ;
  }

  constructor.prototype.visitCards = function( visitor ) {
    this.visitPacks( function( pack ) {
      var cards = pack.cards() ;
      for( var c = 0 ; c < cards.length ; c++ ) {
        visitor( cards[ c ] ) ;
      }
    } ) ;
  }

  constructor.prototype.packs = function() {
    var result = new Array() ;
    this.visitPacks( function( pack ) {
      result.push( pack ) ;
    } ) ;
    return result ;
  }

  return constructor ;
}() ;