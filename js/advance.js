( function ( szotargep ) {

  szotargep.advance = {} ;

  // Represents the state that user put the application into by its various actions.
  // There is no notification because the HTML-bound part controls the whole kinematics.
  szotargep.advance.Advance = function() {
    // vocabulary: a Vocabulary instance.
    // locationSearch: reflects the state of another session.
    // random: an optional random generator for testing.
    var constructor = function Advance( vocabulary, locationSearch, random ) {

      if( typeof random === 'undefined' ) {
        random = function( upperIndex ) {
          return Math.floor( Math.random() * upperIndex ) ;
        }
      }

      var vocabularyTags = vocabulary.tags() ; // Shortcut.
      var tagSelection = [] ;
      var cards = [] ;
      var deck = [] ;
      var currentCard = null ;
      var disclosure = 0 ;
      var asList ;
      var flipView ;
      var currentI18nCode = szotargep.i18n.defaultLanguage() ;

      // tags: a value understood by Card.hasTag method.
      this.selectTags = function( tags ) {
        if( Array.isArray( tags ) ) {
          tagSelection = tags.slice( 0 ) ;
        } else {
          throw 'Unsupported: ' + tags ;
        }
        if( ! this.deckEnabled() ) {
          feedCardsFromTagSelection( this, tags ) ;
        }
      }

      function feedCardsFromTagSelection( that, tags ) {
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
        that.pickRandomCard() ;
      }

      this.addToDeck = function( card ) {
        if( this.deckContains( card ) ) {
          return false ;
        } else {
          deck.push( card ) ;
          return true ;
        }
      }

      this.removeFromDeck = function( card ) {
        var index = deck.indexOf( card ) ;
        if( index >= 0 ) {
          deck.remove( index ) ;
          if( deck.length == 0 ) currentCard = null ;
          this.pickRandomCard() ;
          return true ;
        } else {
          return false ;
        }
      }

      this.deckContains = function( card ) {
        return deck.indexOf( card ) >= 0 ;
      }

      this.deckEnabled = function( enabled ) {
        if( typeof enabled != 'undefined' ) {
          if( enabled ) {
            cards = deck ;
          } else {
            feedCardsFromTagSelection( this, tagSelection ) ;
          }
        }
        return cards === deck ;
      }



      this.toggleTag = function( tag, selected ) {
        if( selected != this.isTagSelected( tag ) ) {
          var newSelection = this.tagSelection() ; // Does a copy.
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
        currentCard = cards.length == 0 ? null : cards[ random( cards.length ) ] ;
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

      // flip: boolean, optional, method has no side-effect if asList is not set.
      // Returns the updated value.
      this.viewFlip = function( flip ) {
        if( typeof flip === 'boolean' ) {
          flipView = flip ;
          disclosure = 0 ;
        }
        return flipView ;
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
        if( c >= cards.length ) onComplete() ;
      }

      this.selectAllTags = function() {
        this.selectTags( vocabularyTags ) ;
        this.toggleTag( szotargep.vocabulary.UNTAGGED, true ) ;
      }

      this.deselectAllTags = function() {
        this.selectTags( [] ) ;
      }

      this.vocabulary = function() {
        return vocabulary ;
      }

      this.i18nCode = function( code ) {
        if( typeof code != 'undefined' ) {
          currentI18nCode = code ;
          moment.lang( code ) ;
        }
        return currentI18nCode ;
      }

      // Returns a string that is valid as 'window.location.search' value,
      // representing the current state of this Advance object.
      this.locationSearch = function() {
        var result = [] ;
        if( ! szotargep.loader.isDefaultVocabulary( vocabulary.url() ) ) {
          result.push( 'v=' + vocabulary.url() ) ;
        }
        if( ! this.viewAsList() ) result.push( 'single' ) ;
        if( this.viewFlip() ) result.push( 'flip' ) ;
        if( this.i18nCode() != szotargep.i18n.defaultLanguage() ) {
          result.push( 'lang=' + this.i18nCode() ) ;
        }
        if( tagSelection.length <= vocabularyTags.length ) {
          var newTags = 'tags=' + tagSelection.join( ';' ) ;
          result.push( newTags ) ;
        }
        result = result.length == 0 ? '' : '?' + result.join( '&' ) ;
        return result ;
      }

      function checkViewAsList( expected ) {
        if( asList != expected ) throw 'Unexpected state: currently viewing as list' ;
      }

      var requestedTags = locationSearch.tags() ;
      if( requestedTags ) {
        if( requestedTags.length == 0 ) {
          this.deselectAllTags() ;
        } else {
          for( var t = 0 ; t < requestedTags.length ; t ++ ) {
            var requestedTag = requestedTags[ t ] ;
            if( requestedTag === szotargep.vocabulary.UNTAGGED
             || vocabularyTags.indexOf( requestedTag ) >= 0
            ) {
              this.toggleTag( requestedTag, true ) ;
            }
          }
        }
      } else {
        this.selectAllTags() ;
      }

      this.viewAsList( ! locationSearch.single() ) ;
      this.viewFlip( locationSearch.flip() ) ;
      this.i18nCode( locationSearch.language() ) ;

    }
    return constructor ;
  }() ;

} ( window.szotargep = window.szotargep || {} ) ) ;

