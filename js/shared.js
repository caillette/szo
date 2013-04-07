

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
function isArray( object ) {
  return Object.prototype.toString.apply( object ) === '[object Array]' ;
}


// [ operands ] --> operator( operand, operatorCompletion ) --> onCompletion[ results ]
function batchApply( operands, operator, onCompletion ) {
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

function loadResources( uris, onCompletion ) {
  processResources( uris, function( any ) { return any }, onCompletion ) ;
}

// Given an array of URIs, loads each of them as a text resource using AJAX,
// applies transformation and notifies of completion with an array of objects.
//
//     [ uri, ... ]
// --> transformer( { uri, content, problem } ) --> transformed
// --> [ transformed, ... ]
function processResources( uris, transformer, onCompletion ) {

  batchApply(
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
























