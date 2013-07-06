// ========================
// Array.prototype patching
// ========================

// Seems only needed by IE8 and below.
// http://stackoverflow.com/a/1181586
if( ! Array.prototype.indexOf ) {
  Array.prototype.indexOf = function( needle ) {
    for( var i = 0 ; i < this.length ; i++ ) {
      if( this[ i ] === needle ) {
        return i ;
      }
    }
    return -1 ;
  } ;
}

// Array Remove - By John Resig (MIT Licensed)
// http://ejohn.org/blog/javascript-array-remove
Array.prototype.remove = function( from, to ) {
  var rest = this.slice( ( to || from ) + 1 || this.length ) ;
  this.length = from < 0 ? this.length + from : from ;
  return this.push.apply( this, rest ) ;
} ;

// The correct way to check Array-ness:
// http://studiokoi.com/blog/article/typechecking_arrays_in_javascript
Array.prototype.isArray = function ( object ) {
  return Object.prototype.toString.apply( object ) === '[object Array]' ;
}





( function ( szotargep ) {

// =========
// Resources
// =========

  $.ajaxSetup( {
      cache : false // Disable caching of AJAX responses.
  } ) ;

  szotargep.resource = {} ;

  // [ operands ] --> operator( operand, operatorCompletion ) --> onCompletion[ results ]
  szotargep.resource.batchApply = function( operands, operator, onCompletion ) {
    var results = new Array( operands.length ) ;
    var completion = 0 ;

    for( var i = 0 ; i < operands.length ; i ++ ) {
      operator(
          operands[ i ],
          function( index ) {
            return function( result ) {
              results[ index ] = result ;
              completion ++ ;
              if( completion == operands.length ) {
                onCompletion( results ) ;
              }
            } ;
          }( i )
      ) ;
    }
  } ;

  szotargep.resource.loadResources = function( uris, onCompletion ) {
    szotargep.resource.processResources( uris, function( any ) { return any }, onCompletion ) ;
  }

  // Given an array of URIs, loads each of them as a text resource using AJAX,
  // applies transformation and notifies of completion with an array of objects.
  //
  //     [ uri, ... ]
  // --> transformer( { uri, content, problem } ) --> transformed
  // --> [ transformed, ... ]
  szotargep.resource.processResources = function( uris, transformer, onCompletion ) {

    szotargep.resource.batchApply(
        uris,
        function( uri, notifyBatchApply ) {
          $.get(
              uri,
              null,
              function( localUri ) {
                return function( content ) {
                  var loaded ;
                  try {
                    window.console.debug( 'Successfully loaded ' + localUri ) ;
                    loaded = transformer( { uri : localUri, content : content, problem : null } ) ;
                  } catch( e ) {
                    window.console.error( 'Internal error: transformation failed with ' + e ) ;
                  }
                  notifyBatchApply( loaded ) ;
                }
              }( uri ),
              'text'
          )
          .fail( function( jqXhr, textStatus, errorThrown ) {
            var problem = textStatus + '\n' + errorThrown ;
            var transformed = transformer( { uri : uri, content : null, problem : problem } ) ;
            notifyBatchApply( transformed ) ;
          } ) ;

        },
        onCompletion
    ) ;
  }

// =====
// Index
// =====

  // Enriched with useful functions by szotargep.main after vocabulary loaded.
  szotargep.index = {} ;


// ====
// HTML
// ====

  szotargep.html = {} ;

  szotargep.html.showCardDetail = function( card ) {
    if( typeof card === 'number' ) card = szotargep.index.cardOfIndex( card ) ;

    var html = '' ;
    if( card ) {
      html += '<code>' + card.pack().url() + ' @ ' + card.lineInPack() + '</code><br>' ;
      var tagsHtml = '' ;
      card.visitTags( function( tag ) {
        tagsHtml += '<span>' + tag + '</span>' ;
      } ) ;
      tagsHtml = tagsHtml === '' ? '<em>Untagged</em>' : tagsHtml ;
      html += tagsHtml ;
    }
    $( '#card-location' ).html( html ) ;
  }


} ( window.szotargep = window.szotargep || {} ) ) ;





