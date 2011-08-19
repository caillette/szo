// =======================
// Constants for everybody
// =======================

var UNDEFINED = "undefined" ;
var CHECKED = "checked" ;
var UNCHECKED = "unchecked" ;
var UNAVAILABLE = "unavailable" ;

var EQUIVALENCES = "EQUIVALENCES" ;


// =======
// Parsing
// =======

// Equivalence: a pair of Terms.
// Term: what's in a non-indented line.
// Definition: the indented lines relative to a Term.


var characters = ",;!\\?\\-\\wáéíóúÁÉÚÍÓÚőűŐŰöüÜÖœàâèêëïîôûçŒÀÂÈÊËÏÎÔÛÇ" ;
var textExp = "(?:[" + characters + "][ " + characters + "]*)" ;
var termExp = textExp ;
var definitionLineExp = "(?: +" + textExp + ")" ;
var definitionLineCapturingExp = "(?: +(" + textExp + "))" ;


function parseEquivalences( text ) {
  // http://regexpal.com
  // http://regexpal.com/?flags=m&regex=%5Cn(%5B0-9a-zA-Z%5D%5B%200-9a-zA-Z%5D*)%5Cn(%3F%3A(%3F%3A%20%2B%5B0-9a-zA-Z%5D%5B%200-9a-zA-Z%5D*)%5Cn)*(%5B0-9a-zA-Z%5D%5B%200-9a-zA-Z%5D*)%5Cn(%3F%3A(%3F%3A%20%2B%5B0-9a-zA-Z%5D%5B%200-9a-zA-Z%5D*)%5Cn)*&input=%0AFo%0AB%20ar%0A%0AWhat%0A%20ever%0A%0AFoo%0ABar%0A%20Foo%0ABar%0A%0AFoo%0A%20Bar%0AFoo%0A%20Bar%0A%0AFoo%0A%20%20Bar%0A%20%20Bar%0AFoo%20%0A%20%20Bar%0A%0AFoo%0A%20%20Bar%0AFoo%0A%20%20%0A%0A
  var equivalenceExp = new RegExp(
        "\n"
      + "(" + termExp + ")\n((?:" + definitionLineExp + "\n)*)"
      + "(" + termExp + ")\n((?:" + definitionLineExp + "\n)*)"
      ,"g"
  ) ;

  var array = [] ;
  while( true ) {
    var match = equivalenceExp.exec( text ) ;
    if( ! match ) break ;
    var array1 = splitDefinitionLines( match[ 1 ], match[ 2 ] ) ;
    var array2 = splitDefinitionLines( match[ 3 ], match[ 4 ] ) ;
    array.push( { LANGUAGE_1 : array1, LANGUAGE_2 : array2 } ) ;
  }
  return array ;
}


function splitDefinitionLines( term, definitionLines ) {
  var lineExp = new RegExp( "" + definitionLineCapturingExp + "\n" ,"g" ) ;
  var array = [ term ] ;

  while( true ) {
    var match = lineExp.exec( definitionLines ) ;
    if( ! match ) break ;
    array.push( match[ 1 ] ) ;
  }
  return array ;

}

// ==========
// Page setup
// ==========

function showMessage( message ) {
  $( "p#messages" ).append( "<pre>" + message.toString() + "</pre>" ) ;
}



// All declared themes.
// Don't use for( i in THEMES ), use for( i in THEMES.keys() ).
// An array of of associative arrays where each element represents a theme.
// No guard against concurrent access needed since JavaScript is monothreaded
// (though asynchronous).
// http://stackoverflow.com/questions/2253586/thread-safety-in-javascript
var THEMES = [] ;

function environmentSetup() {

  THEMES.byKey = function( key ) {
    for( index in this ) {
      var theme = this[ index ] ;
      if( theme.key == key ) {
        return theme ;
      }
    }
    return null ;
  } ;

  THEMES.keys = function( key ) {
    var result = [] ;
    for( i = 0 ; i < this.length ; i ++ ) result.push( i ) ;
    return result ;
  } ;

  // http://stackoverflow.com/questions/330331/jquery-get-charset-of-reply-when-no-header-is-set
  $.ajaxSetup( {
    "beforeSend" : function( xhr ) {
      xhr.overrideMimeType( "text/html; charset=UTF-8" ) ;
    }
  } ) ;
}

function initializeThemes() {

  $( "#themes > dt" ).each( function() {
    var themeKey = $( this ).text() ;
    THEMES.push( { key : themeKey, status : UNDEFINED } ) ;
  } ) ;

  showMessage( "Loading themes..." ) ;
  for( index in THEMES.keys() ) {
    var theme = THEMES[ index ] ;
    loadTheme( theme.key ) ;
  }
}



// Loads a theme, with various side effects on the DOM for the checkboxes and on the THEMES array.
function loadTheme( themeKey ) {
  showMessage( "Loading '" + themeKey + "'..." ) ;
  var theme = THEMES.byKey( themeKey ) ;

  $.get( themeKey, function( payload ) {
    var equivalences = parseEquivalences( payload ) ;

    theme.equivalences = equivalences ;
    theme.status = UNCHECKED ;
    var id = "checkbox-" + themeKey ;
    $( "#theme-choice" ).append(
        "<input "
            + "type = 'checkbox' "
            + "name = '" + themeKey + "' "
            + "id = '" + id + "' "
            + "onclick ='checkTheme() ;' "
        + ">"
        + "<label for='" + id + "' >" + themeKey + "</label>"
        + "<br/>"
    ) ;

    showMessage( "Loaded " + equivalences.length + " equivalences for " + themeKey + "." ) ;

  } ).error( function() {
    theme.status = UNAVAILABLE ;
    $( "#theme-choice" ).append(
        "<input "
            + "type ='checkbox' "
            + "name ='theme-" + themeKey + "' "
            + "disabled ='disabled' "
        + ">"
        + "<span style = 'text-decoration : line-through ;' >" + themeKey + "</span>"
        + "<br/>"
    ) ;
    showMessage( "Unavailable: '" + themeKey + "'." ) ;
  } ) ;

}



// ===============================
// Theme and equivalence selection
// ===============================

// All Equivalences to chose into. Same structure as a THEMES element.
var EQUIVALENCES = [] ;

// Reminds last Equivalence showed for not showing twice the same in a row.
var LAST_EQUIVALENCE = null ;

// Inverts the natural order (the one in theme files).
var INVERT_LANGUAGES = true ;

// We recalculate everything each time since it's just feeding an array.
function checkTheme() {
  EQUIVALENCES = [] ;
  $( "#theme-choice :checked" ).each( function() {
    var checkboxName = $( this ).attr( "name" ) ;
    var theme = THEMES.byKey( checkboxName ) ;
    for( equivalenceIndex in theme.equivalences ) {
      var equivalence = theme.equivalences[ equivalenceIndex ] ;
      EQUIVALENCES.push( equivalence ) ;
    }
  } ) ;
  showMessage( "Selected " + EQUIVALENCES.length + " equivalence(s)." ) ;
  showSomeEquivalence() ;
  enableToolbarElements() ;
}

function showSomeEquivalence() {
  if( EQUIVALENCES.length == 0 ) {
    clearBoard() ;
  } else {
    do {
      var random = Math.floor( Math.random() * EQUIVALENCES.length ) ;
      var newEquivalence = EQUIVALENCES[ random ] ;
    } while( newEquivalence == LAST_EQUIVALENCE ) ;
    LAST_EQUIVALENCE = newEquivalence ;
    showEquivalence( newEquivalence ) ;
  }
}

function showEquivalence( equivalence ) {
  var max = Math.max( equivalence.LANGUAGE_1.length, equivalence.LANGUAGE_2.length ) ;
  var html = "<table><tbody>\n" ;

  function appendLanguage( html, language, index, visible ) {
    if( index < language.length ) {
      return html + "<td>"
          + "<span " + ( visible ? "" : "style = 'visibility : hidden ; ' " ) + ">"
          + language[ index ]
          + "</span></td>" ;
    } else {
      return html + "<td></td>" ;
    }
  } ;

  for( i = 0 ; i < max ; i ++ ) {
    html += "<tr>" ;
    if( INVERT_LANGUAGES ) {
      html = appendLanguage( html, equivalence.LANGUAGE_2, i, true ) ;
      html = appendLanguage( html, equivalence.LANGUAGE_1, i, false ) ;
    } else {
      html = appendLanguage( html, equivalence.LANGUAGE_1, i, true ) ;
      html = appendLanguage( html, equivalence.LANGUAGE_2, i, false ) ;
    }
    html += "</tr>\n" ;
  }

  html += "</tbody></table>\n" ;
  $( "#board" ).html( html ) ;
}



function clearBoard() {
  $( "#board" ).html( "<p>Nincs kiválasztás.</p>" ) ;
  LAST_EQUIVALENCE = null ;
}


// ==========
// Disclosure
// ==========

var DISCLOSURE = 0 ;

function disclose() {
  var max = INVERT_LANGUAGES
      ? LAST_EQUIVALENCE.LANGUAGE_1.length : LAST_EQUIVALENCE.LANGUAGE_2.length ;
  if( DISCLOSURE >= max ) {
    DISCLOSURE = 0 ;
    showSomeEquivalence() ;
  } else {
    // The :eq(n) pseudo-selector doesn't work as expected. 
    $( "#board > table > tbody > tr" ).eq( DISCLOSURE ).contents()
        .filter( "td" ).eq( 1 ).contents()
        .filter( "span" )
        .css( "visibility", "visible" ) ;
    DISCLOSURE ++ ;
  }
}


// ==================
// Toolbar's commands
// ==================

function initializeToolbar() {
  $( "#toolbar" ).append(
      "<button "
          + "type = 'button' "
          + "disabled = 'disabled' "
          + "name = 'next-equivalence' "
          + "onClick ='showSomeEquivalence() ;' "
      + ">További</button>"
  ).append(
      "<button "
          + "type = 'button' "
          + "disabled = 'disabled' "
          + "name = 'disclose' "
          + "onClick ='disclose() ;' "
      + ">Felfel</button>" 
  ) ;
}

function enableToolbarElements() {

  function setEnabled( element, enabled ) {
    if( enabled ) {
      element.removeAttr( "disabled" ) ;
    } else {
      element.attr( "disabled", "disabled" ) ;
    }
  }

  $( "#toolbar *" ).filter( ":button" ).each( function() {
    setEnabled( $( this ), EQUIVALENCES.length > 0 ) ;
  } ) ;

}
