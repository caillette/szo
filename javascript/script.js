
var THEMES = [] ; // All declared themes.

var CHECKED = "checked" ;
var UNCHECKED = "unchecked" ;
var UNAVAILABLE = "unavailable" ;

var LANGUAGE_1 = "LANGUAGE_1" ;
var LANGUAGE_2 = "LANGUAGE_2" ;


function parse( text ) {
  // http://regexpal.com
  // http://regexpal.com/?flags=m&regex=%5Cn(%5B0-9a-zA-Z%5D%5B%200-9a-zA-Z%5D*)%5Cn(%3F%3A(%3F%3A%20%2B%5B0-9a-zA-Z%5D%5B%200-9a-zA-Z%5D*)%5Cn)*(%5B0-9a-zA-Z%5D%5B%200-9a-zA-Z%5D*)%5Cn(%3F%3A(%3F%3A%20%2B%5B0-9a-zA-Z%5D%5B%200-9a-zA-Z%5D*)%5Cn)*&input=%0AFo%0AB%20ar%0A%0AWhat%0A%20ever%0A%0AFoo%0ABar%0A%20Foo%0ABar%0A%0AFoo%0A%20Bar%0AFoo%0A%20Bar%0A%0AFoo%0A%20%20Bar%0A%20%20Bar%0AFoo%20%0A%20%20Bar%0A%0AFoo%0A%20%20Bar%0AFoo%0A%20%20%0A%0A
  characters = "0-9a-zA-Z" ;
  characters = ",;!\\?\\-\\wáéíóúÁÉÚÍÓÚőűŐŰöüÜÖœàâèêëïîôûçŒÀÂÈÊËÏÎÔÛÇ" ;
  termLine = "(?:[" + characters + "][ " + characters + "]*)" ;
  definitionLine = "(?: +[" + characters + "][ " + characters + "]*)" ;
  var entry = new RegExp(
        "\n"
      + "(" + termLine + ")\n((?:" + definitionLine + "\n)*)"
      + "(" + termLine + ")\n((?:" + definitionLine + "\n)*)"
      ,"g"
  ) ;

  var array = [] ;
  var guard = 0 ;

  while( guard++ < 100 ) {
    var match = entry.exec( text ) ;
    if( ! match ) break ;
    array.push( { LANGUAGE_1 : match[ 1 ], LANGUAGE_2 : match[ 3 ] } ) ;
  }
  return array ;
} 



