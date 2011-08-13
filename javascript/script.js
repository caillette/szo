
var THEMES = [] ; // All declared themes.

var CHECKED = "checked" ;
var UNCHECKED = "unchecked" ;
var UNAVAILABLE = "unavailable" ;

var LANGUAGE_1 = "LANGUAGE_1" ;
var LANGUAGE_2 = "LANGUAGE_2" ;


function parse( text ) {
  // http://regexpal.com
  // http://regexpal.com/?flags=s&regex=(%5B0-9a-zA-Z%5D%5B%200-9a-zA-Z%5D*)%5Cn(%20%2B%5B0-9a-zA-Z%5D%5B%200-9a-zA-Z%5D*)%5Cn(%5B0-9a-zA-Z%5D%5B%200-9a-zA-Z%5D*)%5Cn(%20%2B%5B0-9a-zA-Z%5D%5B%200-9a-zA-Z%5D*)%5Cn&input=Fo%0AB%20ar%0A%0AWhat%0A%20ever%0A%0AFoo%0ABar%0A%20Foo%0ABar%0A%0AFoo%0A%20%20Bar%0AFoo%20%0A%20%20Bar%0A%0AFoo%0A%20%20Bar%0AFoo%0A%20%20%0A%0A
  characters = "0-9a-zA-Z" ;
//  characters = ",;!\\?\\-\\wáéíóúÁÉÚÍÓÚőűŐŰöüÜÖœàâèêëïîôûçŒÀÂÈÊËÏÎÔÛÇ" ;
//  termLine = "^([" + characters + "](?:[ " + characters + "])+)\n" ;
//  definitionLine = "^ +([" + characters + "](?:[ " + characters + "])+)\n" ;
//  var entry = new RegExp( termLine + definitionLine + "*" + termLine + definitionLine + "*" ) ;

//  var entry = new RegExp(
//      "([" + characters + "][ " + characters + "]*)\\n" +
//      "( +[" + characters + "][ " + characters + "]*)"
//  ) ;
  var entry = new RegExp( "(line1)(line2)", "g" ) ;

  var array = [] ;
  var guard = 0 ;

  while( guard++ < 10 ) {
    var match = entry.exec( text ) ;
    if( ! match ) break ;
    array.push( { LANGUAGE_1 : match[ 1 ], LANGUAGE_2 : match[ 2 ] } ) ;
  }
  return array ;
} 



