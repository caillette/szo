

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


// [ operands ] -> operator( operand, operatorCompletion ) -> onCompletion[ results ]
var BatchApply = function() {

  var constructor = function BatchApply( operands, operator, onCompletion ) {
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

    this.inspectResults = function( visitor, propagatedValue ) {
      for( var i = 0 ; i < results.length ; i ++ ) {
        propagatedValue = visitor( result[ i ], propagatedValue ) ;
      }
      return propagatedValue ;
    }
  }

  return constructor ;
}() ;
























