
function elapsed( start ) {
  return ( new Date() - start ) + ' ms' ;
}

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


// The correct way to check Array-ness:
// http://studiokoi.com/blog/article/typechecking_arrays_in_javascript
function isArray( object ) {
  return Object.prototype.toString.apply( object ) === '[object Array]' ;
}