// A loadable resource containing Cards.
var Pack = function() {

  // url: originating URL (for humans only).
  // content:
  // - If 'content instanceof Array' evaluates to true, treated as an array of Card objects.
  // - If 'content instanceof String' evaluates to true, treated as a parseable String.
  // - Throws an exception otherwise.
  // parser: an healthy Parser instance.
  var constructor = function Pack( url, content, parser ) {

    var cards ;
    var problem = null ;

    if( isArray( content ) ) {
      cards = content ;
    } else if( parser === null ) {
      problem = content ;
      cards = [] ;
    } else {
      try {
        var parsedContent = parser.parse( content ) ;
        var descriptors = parsedContent[ 0 ] ;
        var globalTags = parsedContent[ 1 ] ;
        var cardsAsArray = parsedContent[ 2 ] ;
        cards = new Array( cardsAsArray.length ) ;
        for( cardIndex = 0 ; cardIndex < cardsAsArray.length ; cardIndex ++ ) {
          var cardAsArray = cardsAsArray[ cardIndex ] ;
          cards[ cardIndex ] = new Card(
              cardAsArray[ 2 ],
              cardAsArray[ 3 ],
              globalTags.slice( 0 ).concat( cardAsArray[ 1 ] ),
              this,
              cardAsArray[ 0 ]
          ) ;
        }
      } catch( e ) {
        problem = e ;
        cards = [] ;
      }
    }

    this.visitCards = function( visitor ) {
      for( var c = 0 ; c < cards.length ; c ++ ) {
        visitor( cards[ c ] ) ;
      }
    }

    this.url = function() {
      return url ;
    }

    this.problem = function() {
      return problem ;
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
    if( ! isArray( questions ) ) throw 'Not an array: ' + questions ;
    if( ! isArray( answers ) ) throw 'Not an array: ' + answers ;
    if( tags === null ) tags = [] ;
    if( typeof tags === 'string' ) tags = [ tags ] ;

    this.tags = function() {
      return tags ;
    }
    this.pack = function() {
      return pack ;
    }
    this.lineInPack = function() {
      return lineInPack ;
    }
    this.questions = function() {
      return questions.slice( 0 ) ;
    }
    this.answers = function() {
      return answers.slice( 0 ) ;
    }
  }

  constructor.prototype.toString = function() {
    return( 'Card{' + this.lineInPack() + '@' + this.pack().url() + '}' ) ;
  }

  constructor.prototype.toHtml = function( standalone, inverted ) {
    throw 'Not implemented' ;
  }

  // tag: one of the following.
  // - A non-empty array of non-null Strings representing tags.
  //   This method returns true if at least one of the given tags appears in the Card.
  // - An empty array. This methods returns true.
  // - A String representing a tag. Method returns true if Card has this tag.
  // - null. Method returns true if Card has no tag at all.
  constructor.prototype.hasTag = function( tag ) {
    if( tag === null ) {
      return this.tags().length === 0 ;
    } else if( typeof tag === 'string' ) {
      return this.tags().indexOf( tag ) >= 0 ;
    } else if( isArray( tag ) ) {
      if( tag.length === 0 ) {
        return true ;
      } else {
        for( var t = 0 ; t < tag.length ; t++ ) {
          if( this.hasTag( tag[ t ] ) ) {
            return true ;
          }
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