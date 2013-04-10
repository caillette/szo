( function ( szotargep ) {

  szotargep.vocabulary = {} ;

  // A loadable resource containing Cards.
  szotargep.vocabulary.Pack = function() {

    // url: originating URL (for humans only).
    // content:
    // - If 'content instanceof Array' evaluates to true, treated as an array of Card objects.
    // - If 'content instanceof String' evaluates to true, treated as a parseable String.
    // - Throws an exception otherwise.
    // parser: an healthy Parser instance.
    var constructor = function Pack( url, content, parser ) {

      var cards ;
      var problem = null ;

      if( Array.isArray( content ) ) {
        cards = content ;
      } else if( parser === null ) {
        problem = content ;
        cards = [] ;
      } else if( parser.problem() ) {
        problem = parser.problem() ;
        cards = []
      } else {
        try {
          var parsedContent = parser.parse( content ) ;
          var descriptors = parsedContent[ 0 ] ;
          var globalTags = parsedContent[ 1 ] ;
          var cardsAsArray = parsedContent[ 2 ] ;
          cards = new Array( cardsAsArray.length ) ;
          for( cardIndex = 0 ; cardIndex < cardsAsArray.length ; cardIndex ++ ) {
            var cardAsArray = cardsAsArray[ cardIndex ] ;
            cards[ cardIndex ] = new szotargep.vocabulary.Card(
                cardAsArray[ 2 ],
                cardAsArray[ 3 ],
                merge( globalTags, cardAsArray[ 1 ] ),
                this,
                cardAsArray[ 0 ]
            ) ;
          }
        } catch( e ) {
          problem = e ;
          if( e[ 'line' ] != null ) problem += ' Location: line=' + e.line ;
          if( e[ 'column' ] != null ) problem += ', column=' + e.column ;
          cards = [] ;
          console.error( 'Could not interpret ' + url + ': ' + problem ) ;
        }
      }

      function merge( array1, array2 ) {
        var result = array1.slice( 0 ) ;
        for( var i = 0 ; i < array2.length ; i ++ ) {
          var element = array2[ i ] ;
          if( result.indexOf( element ) < 0 ) result.push( element ) ;
        }
        return result ;
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

  // Magic tag representing there is no tag.
  szotargep.vocabulary.UNTAGGED = '$Untagged' ;


  // A set of questions and answers that came out from a Pack.
  szotargep.vocabulary.Card = function() {

    var constructor = function Card( questions, answers, tags, pack, lineInPack ) {
      if( ! Array.isArray( questions ) ) throw 'Not an array: ' + questions ;
      if( ! Array.isArray( answers ) ) throw 'Not an array: ' + answers ;
      if( ! tags ) tags = [] ;
      if( typeof tags === 'string' ) tags = [ tags ] ;
      if( tags.indexOf( szotargep.vocabulary.UNTAGGED ) >= 0 ) {
        throw 'Don\'t create a Card with UNTAGGED tag' ;
      }

      this.visitTags = function( visitor ) {
        for( var t = 0 ; t < tags.length ; t ++ ) {
          visitor( tags[ t ] ) ;
        }
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
      this.visitStages = function( visitor ) {
        var stageCount = Math.max( questions.length, answers.length ) ;
        for( var s = 0 ; s < stageCount ; s ++ ) {
          visitor(
              s >= questions.length ? null : questions[ s ],
              s >= answers.length ? null : answers[ s ]
          ) ;
        }
      }
      // Deprecated
      this.answers = function() {
        return answers.slice( 0 ) ;
      }
    }

    constructor.prototype.toString = function() {
      return( 'Card{' + this.lineInPack() + '@' + this.pack().url() + '}' ) ;
    }

    constructor.prototype.tags = function() {
      var result = [] ;
      this.visitTags( function( tag ) { result.push( tag ) } ) ;
      return result ;
    }

    constructor.prototype.answerCount = function() {
      var answerCount = 0 ;
      this.visitStages( function( question, answer ) {
        if( answer != null ) answerCount ++ ;
      } ) ;
      return answerCount ;
    }


    // tags: a non-null array of tags (as Strings).
    // Every tag must already exist as defined tag (in the array returned by vocabulary.tags() )
    // or be the magic tag value UNTAGGED.
    // A card that contains one of the listed tags (or that have no tag at all if UNTAGGED
    // appears in the array) get selected.
    // If tags is an empty array, this function always returns false.
    constructor.prototype.hasTag = function( tags ) {
      if( tags.length === 0 ) {
        return false ;
      } else {
        var tagCount = 0 ;
        var found = false ;
        this.visitTags( function( cardTag ) {
          tagCount ++ ;
          if( tags.indexOf( cardTag ) >= 0 ) {
            found = true ;
          }
        } ) ;
        return found || ( tagCount === 0 && tags.indexOf( szotargep.vocabulary.UNTAGGED ) >= 0 ) ;
      }
    }

    return constructor ;
  }() ;

  // A queryable collection of Cards.
  szotargep.vocabulary.Vocabulary = function() {

    var constructor = function Vocabulary( url, packs, tagAppellations ) {

      this.visitPacks = function( visitor ) {
        for( var p = 0 ; p < packs.length ; p++ ) {
          visitor( packs[ p ] ) ;
        }
      }

      // tags: as understood by Card.hasTag(), or an undefined value meaning all cards.
      this.cards = function( tags ) {
        var result = new Array() ;
        this.visitCards( function( card ) {
          if( ! tags || card.hasTag( tags ) ) {
            result.push( card ) ;
          }
        } ) ;
        return result ;
      }

      this.url = function() {
        return url ;
      }

      this.tagAppellation = function( tag ) {
        // Unsafe implementation, no defensive copy etc.
        for( var i = 0 ; i < tagAppellations.length ; i ++ ) {
          var entry = tagAppellations[ i ] ;
          if( entry[ 0 ] === tag ) return entry[ 1 ] ;
        }
        return null ;
      }

    }

    constructor.prototype.toString = function() {
      return 'Vocabulary{'
          + this.packs().length + ';'
          + this.cards().length + ';'
          + this.tags().length +  '}'
      ;
    }

    // Returns an array containing the tags, with no duplicates.
    // Using an array (keys are ints, values are tags) handles the case where tags do have
    // the same name as reserved object members.
    constructor.prototype.tags = function() {
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

} ( window.szotargep = window.szotargep || {} ) ) ;
