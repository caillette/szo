// This is a playground for studying object instanciation with JavaScript.
// http://stackoverflow.com/questions/1595611/how-to-properly-create-a-custom-object-in-javascript/1597560#1597560

Function.prototype.makeSubclass = function() {
  function Class() {
    if( ! ( this instanceof Class ) )
        throw( 'Constructor called without "new"' ) ;
    if( 'initializer' in this )
        this.initializer.apply( this, arguments ) ;
  }
  Function.prototype.makeSubclass.nonconstructor.prototype = this.prototype ;
  Class.prototype = new Function.prototype.makeSubclass.nonconstructor() ;
  return Class ;
} ;
Function.prototype.makeSubclass.nonconstructor= function() {} ;


Shape = Object.makeSubclass() ;
Shape.prototype.valuesToString = function() {
  return 'x=' + this.x + ';y=' + this.y ;
}
Shape.prototype.toString = function() {
  return 'Shape{' + valuesToString() + '}' ;
}
Shape.prototype.initializer = function( x, y ) {
  this.x = x ;
  this.y = y ;
} ;


Point = Shape.makeSubclass() ;

Circle = Shape.makeSubclass() ;
Circle.prototype.initializer = function( x, y, r ) {
  Shape.prototype.initializer.call( this, x, y ) ;
  this.r = r ;
} ;
Circle.prototype.valuesToString = function() {
  return Shape.prototype.valuesToString.call( this ) + ';r=' + this.r ;
}
Circle.prototype.toString = function() {
  return 'Circle{' + this.valuesToString() + '}' ;
}




// Let's try the closure-based approach with no inheritance but functions in the prototype.
var Length = function() {
  var constructor = function Length( value ) {
    value = value ? value : 0 ;

    this.value = function() {
      return value ;
    } ;
  }

  constructor.prototype.toString = function() {
    return 'Length{' + this.value() + '}' ;
  }

  return constructor ;
}() ;


