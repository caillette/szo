// =======================
// Constants for everybody
// =======================

var UNDEFINED = "undefined" ;
var CHECKED = "checked" ;
var UNCHECKED = "unchecked" ;
var UNAVAILABLE = "unavailable" ;


// =======
// Parsing
// =======

// Equivalence: a pair of Terms.
// Term: what's in a non-indented line.
// Definition: the indented lines relative to a Term.

var letters = "\\wáéíóúÁÉÚÍÓÚőűŐŰöüÜÖœæàâèêëïîôûùçŒÆÀÂÈÊËÏÎÔÛÙÇß€" ;
var characters = "+’'Ø~,;!—…–\\:\\*\\.\\?\\-\\(\\)\\[\\]/\\\\\"" + letters ;
var charactersMeta = characters ;
var textExp = "(?:[" + characters + "][ " + characters + "]*)" ;
var termExp = textExp ;
var definitionLineExp = "(?: +" + textExp + ")" ;
var definitionLineCapturingExp = "(?: +(" + textExp + "))" ;


function parseEquivalences( themeKey, text ) {
  // http://regexpal.com
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
    array.push( { THEME_KEY : themeKey, LANGUAGE_1 : array1, LANGUAGE_2 : array2 } ) ;
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

function parseTitle( text, defaultTitle ) {
  var title = parseMeta( "title", text ) ;
  return  title == null ? defaultTitle : title ;
}

function parseMeta( key, text ) {
  var lineExp = new RegExp( key + "\\s*\\:\\s*([" + charactersMeta + " ]+)\n" ) ;
  var match = lineExp.exec( text ) ;
  return match ? match[ 1 ] : null ;
}

// ==========
// Page setup
// ==========

function showMessage( message ) {
  if( $( "#console" ).is( ":visible" ) ) {
    $( "p#messages" ).append( "<pre>" + message.toString() + "</pre>" ) ;
  }
}



// All declared themes.
// It's an array of of associative arrays where each element represents a theme.
// Don't use for( i in THEMES ), use for( i in THEMES.keys() ).
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

  populateStorageCacheFromCookie() ;

}

function initializeShortcuts() {
  shortcut.add( "return",function() {
    if( ! LISTING_EQUIVALENCES ) disclose() ;
  } ) ;
}

function initializeThemes() {

  $( "#themes > dt" ).each( function() {
    var themeKey = $( this ).text() ;
    THEMES.push( { key : themeKey, status : UNDEFINED } ) ;
  } ) ;

  var checkedThemes = retrieve( "checked-themes", [] ) ;
  function isChecked( themeKey ) {
    for( index in checkedThemes ) {
      if( checkedThemes[ index ] == themeKey ) return true ;
    }
    return false ;
  }

  showMessage( "Loading themes..." ) ;
  for( index in THEMES.keys() ) {
    var theme = THEMES[ index ] ;
    loadTheme( theme.key, function() {
      // All themes loaded, let's do something with them.
      THEMES.sort( function( first, second ) {
        if( first.status == UNAVAILABLE ) return 1 ;
        if( second.status == UNAVAILABLE ) return -1 ;
        return first.title.localeCompare( second.title ) ;
      } ) ;
      for( index in THEMES.keys() ) {
        var theme = THEMES[ index ] ;
        populateThemeList( theme ) ;
        if( theme.status = UNCHECKED ) {
          theme.status = isChecked( theme.key ) ? CHECKED : UNCHECKED ;
        }
      }
      checkAllThemesByStatus() ;
    } ) ;
  }
}

// Seems that we need to make this variable global, for visibility reasons.
var completionCount = 0 ;


// Loads a theme, with various side effects on the DOM for the checkboxes and on the THEMES array.
// Doesn't work with Chrome , which complains with a non-allowed cross-origin request if using
// XMLHttpRequest (Access-Control-Allow-Origin) or iframes.
// http://stackoverflow.com/questions/205087/jquery-ready-in-a-dynamically-inserted-iframe/205221#205221
function loadTheme( themeKey, onCompletion ) {
  showMessage( "Loading '" + themeKey + "'..." ) ;
  var theme = THEMES.byKey( themeKey ) ;
  var keyCount = THEMES.keys().length ;
  completionCount = 0 ;

  $.get( themeKey, function( payload ) {
    var equivalences = parseEquivalences( themeKey, payload ) ;

    theme.equivalences = equivalences ;
    theme.status = UNCHECKED ;
    theme.key = themeKey ;
    theme.title = parseTitle( payload, themeKey ) ;

    showMessage( "Loaded " + equivalences.length + " equivalences for " + themeKey + "." ) ;

  } ).error( function() {
    theme.status = UNAVAILABLE ;
    showMessage( "Unavailable: '" + themeKey + "'." ) ;
  } ).complete( function() {
    completionCount ++ ;
    if( completionCount == keyCount ) {
      showMessage( "Loaded " + completionCount + " theme(s)." ) ;
      onCompletion() ;
    }
  } ) ;

}

function populateThemeList( theme ) {

  if( theme.status == UNCHECKED ) {
    var id = "checkbox-" + theme.key ;
    $( "#theme-choice" ).append(
        "<p>"
        + "<input "
            + "type = 'checkbox' "
            + "name = '" + theme.key + "' "
            + "id = '" + id + "' "
            + "onclick ='onThemeChecked() ;' "
        + ">"
        + "<label for='" + id + "' >" + theme.title + "</label>"
    ) ;
  } else {
    $( "#theme-choice" ).append(
        "<p>"
        + "<input "
            + "type ='checkbox' "
            + "name ='theme-" + theme.key + "' "
            + "disabled ='disabled' "
        + ">"
        + "<span style = 'text-decoration : line-through ;' >" + theme.key + "</span>"
    ) ;
  }
}


// ===============================
// Theme and equivalence selection
// ===============================

// All Equivalences to chose into. Same structure as a THEMES element.
var EQUIVALENCES = [] ;

// Reminds last Equivalence showed for not showing twice the same in a row.
var LAST_EQUIVALENCE = null ;

// Inverts the natural order (the one in theme files).
var INVERT_LANGUAGES = false ;

// We recalculate everything each time since it's just feeding an array.
function onThemeChecked() {
  DISCLOSURE = 0 ;
  EQUIVALENCES = [] ;

  for( key in THEMES.keys() ) {
    var theme = THEMES[ key ] ;
    if( theme.status == CHECKED ) {
      theme.status = UNCHECKED ;
    }
  }

  $( "#theme-choice :checked" ).each( function() {
    var checkboxName = $( this ).attr( "name" ) ;
    var theme = THEMES.byKey( checkboxName ) ;
    theme.status = CHECKED ;
    for( equivalenceIndex in theme.equivalences ) {
      EQUIVALENCES.push( theme.equivalences[ equivalenceIndex ] ) ;
    }
  } ) ;
  saveCheckedThemes() ;
  showMessage( "Selected " + EQUIVALENCES.length + " equivalence(s)." ) ;

  if( LISTING_EQUIVALENCES ) {
    justPrintEquivalences() ;
  } else {
    showSomeEquivalence() ;
  }
  enableToolbarElements() ;
}


// Tells if we entered the list-style kind of display.
var LISTING_EQUIVALENCES = false ;

function togglePrintEquivalences() {
  LISTING_EQUIVALENCES = ! LISTING_EQUIVALENCES ;
  store( "LISTING_EQUIVALENCES", LISTING_EQUIVALENCES ) ;
  quickRefresh() ;
}

function quickRefresh() {
  if( LISTING_EQUIVALENCES ) {
    justPrintEquivalences() ;
  } else {
    DISCLOSURE = 0 ;
    showSomeEquivalence() ;
  }
  enableToolbarElements() ;
}

function justPrintEquivalences() {
  showTheme() ;
  $( "#board" ).html( "" ) ;
  if( EQUIVALENCES.length == 0 ) {
    clearBoard() ;
  } else {

    // Inlining seems to share the same function with always the same themeKey.
    function addMouseHandlers( table, themeKey ) {
      $( table ).mouseenter( function() {
        showTheme( themeKey ) ;
      } ) .mouseleave( function() {
        showTheme() ;
      } ) ;
    }

    $( "#board" ).append( "<p class='total' >Végösszeg: " + EQUIVALENCES.length + "</p>" ) ;
    for( themeIndex in EQUIVALENCES ) {
      var equivalence = EQUIVALENCES[ themeIndex ] ;
      var html = "<table class='equivalence-list' ><tbody>\n" ;
      html = printEquivalence( html, equivalence, false ) ;
      html += "</tbody></table>" ;
      var table = $( html ) ;
      addMouseHandlers( table, equivalence.THEME_KEY ) ;
      $( "#board" ).append( table ) ;

      // Supposed to help the Web browser to keep tables together.
      $( "#board" ).append( "<p class='void' ></p>\n" ) ;

    }
  }
}

function showSomeEquivalence() {

  // We shouldn't get into that function if the following is true, except with a keyboard shortcut.
  if( LISTING_EQUIVALENCES ) return ;

  if( EQUIVALENCES.length == 0 ) {
    clearBoard() ;
  } else {
    do {
      var random = Math.floor( Math.random() * EQUIVALENCES.length ) ;
      var newEquivalence = EQUIVALENCES[ random ] ;
    } while( newEquivalence == LAST_EQUIVALENCE && EQUIVALENCES.length > 1 ) ;
    LAST_EQUIVALENCE = newEquivalence ;
    showEquivalence( newEquivalence ) ;
  }
}

function printEquivalence( html, equivalence, mayHide ) {
  var max = Math.max( equivalence.LANGUAGE_1.length, equivalence.LANGUAGE_2.length ) ;

  function appendLanguage( html, language, index, visible ) {
    if( index < language.length ) {
      return html
          // Using a span to make the cell's content truly invisible.
          // Making the cell content invisible causes other decoractions to not show.
          + "<td" + ( visible ? "" : " class = 'undisclosed' " ) + "><span>"
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
      html = appendLanguage( html, equivalence.LANGUAGE_1, i, ! mayHide ) ;
    } else {
      html = appendLanguage( html, equivalence.LANGUAGE_1, i, true ) ;
      html = appendLanguage( html, equivalence.LANGUAGE_2, i, ! mayHide ) ;
    }
    html += "</tr>\n" ;
  }
  return html ;
}


function showEquivalence( equivalence ) {
  var html = "<table><tbody>\n" ;
  html = printEquivalence( html, equivalence, true ) ;

  html += "</tbody></table>\n" ;
  $( "#board" ).html( html ) ;
  showTheme( equivalence.THEME_KEY ) ;
}

function showTheme( themeKey ) {
  if( themeKey == undefined ) {
    $( "#theme-key" ).html( "<p></p>" ) ;

  } else {
    var equivalence = THEMES.byKey( themeKey ) ;
    $( "#theme-key" ).html( "<p>"
        + ( equivalence.key == equivalence.title ? "" : equivalence.title + "<br>")
        + "<code>" + equivalence.key + "</code>"
        + "</p>"
    ) ;
  }
}

function selectAllThemes( enabled ) {
  // Filter as a workaround.
  $( "#theme-choice :checkbox" ).filter( ":enabled" ).attr( "checked", enabled ) ;
  onThemeChecked() ;
}

function checkAllThemesByStatus() {
  $( "#theme-choice :checkbox" ).filter( ":enabled" ).each( function() {
    var themeKey = $( this ).attr( "name" ) ;
    var theme = THEMES.byKey( themeKey ) ;
    if( theme.status == CHECKED ) {
      $( this ).attr( "checked", true ) ;
    }
  } ) ;
  onThemeChecked() ;
}

function toggleInvertLanguages() {
  INVERT_LANGUAGES = ! INVERT_LANGUAGES ;
  store( "INVERT_LANGUAGES", INVERT_LANGUAGES ) ;
  quickRefresh() ;
}


function clearBoard() {
  $( "#board" ).html( "<p class='no-theme' >Nincs kiválasztás</p>" ) ;
  showTheme() ;
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
        .filter( "td" ).eq( 1 ) .removeClass( "undisclosed" ) ;
    DISCLOSURE ++ ;
  }
}


// ==================
// Toolbar's commands
// ==================

function initializeToolbar() {
  $( "#toolbar" )
      .append(
          "<button "
              + "type = 'button' "
              + "disabled = 'disabled' "
              + "name = 'select-all-themes' "
              + "class ='widget' "
              + "onClick ='selectAllThemes( true ) ;' "
          + ">Minden</button>"
      ).append(
          "<button "
              + "type = 'button' "
              + "disabled = 'disabled' "
              + "name = 'select-no-theme' "
              + "class ='widget' "
              + "onClick ='selectAllThemes( false ) ;' "
          + ">Semmi</button>"
      ).append(
          "<button "
              + "type = 'button' "
              + "disabled = 'disabled' "
              + "name = 'disclose' "
              + "id = 'disclose' "
              + "onClick ='disclose() ;' "
              + "class ='widget' "
          + ">Felfel</button>"
      ).append(
        "<input "
            + "type = 'checkbox' "
            + "disabled = 'disabled' "
            + "id = 'print-equivalences' "
            + "onclick ='togglePrintEquivalences() ;' "
            + "class ='widget' "
        + ">"
        + "<label for='print-equivalences' >Lista</label>"
      ).append(
        "<input "
            + "type = 'checkbox' "
            + "id = 'invert-languages' "
            + "onclick ='toggleInvertLanguages() ;' "
            + "class ='widget' "
        + ">"
        + "<label for='invert-languages' >Nyelv megfordit</label>"
      )
  ;

}

function enableToolbarElements() {

  function setEnabled( element, enabled ) {
    if( enabled ) {
      element.removeAttr( "disabled" ) ;
    } else {
      element.attr( "disabled", "disabled" ) ;
    }
  }

  $( "#toolbar *" )
      .not( "[ name |= 'select' ]" )
      .filter( ":button" )
      .each( function() {
        setEnabled( $( this ), EQUIVALENCES.length > 0 && ! LISTING_EQUIVALENCES ) ;
      }
  ) ;

  $( "#print-equivalences" ).each( function() {
    setEnabled( $( this ), EQUIVALENCES.length > 0 ) ;
  } ) ;

  var hasThemes =  $( "#theme-choice :checkbox" ).filter( ":enabled" ).length > 0 ;

  $( "#toolbar *" )
      .filter( "[ name |= 'select' ]" )
      .filter( ":button" )
      .each( function() {
        setEnabled( $( this ), hasThemes ) ;
      }
  ) ;



}



// =======
// Storage
// =======

function retrieveOptions() {
  LISTING_EQUIVALENCES = retrieve( "LISTING_EQUIVALENCES" ) ;
  $( "#print-equivalences" ).attr( "checked", LISTING_EQUIVALENCES ) ;
  INVERT_LANGUAGES = retrieve( "INVERT_LANGUAGES" ) ;
  $( "#invert-languages" ).attr( "checked", INVERT_LANGUAGES ) ;
}

function saveCheckedThemes() {
  var checked = [] ;
  for( key in THEMES.keys() ) {
    var theme = THEMES[ key ] ;
    if( theme.status == "checked" ) {
      checked.push( theme.key ) ;
    }
  }
  store( "checked-themes", checked ) ;
}

// Firefox doesn't support local storage for a local file:
// https://github.com/andris9/jStorage/issues/8
// So we're getting dirty and using cookies.

var useCookies = document.URL.substr( 0, 5 ) == "file:"
    && navigator.userAgent.indexOf( "Firefox" ) > -1 ;

// JSON stuff for when using cookies.
// Copied from jStorage plugin.
var jsonEncode = useCookies
    ? $.toJSON || Object.toJSON || ( window.JSON && ( JSON.encode || JSON.stringify ) )
    : null
;
var jsonDecode = useCookies
    ? $.evalJSON || ( window.JSON && (JSON.decode || JSON.parse ) ) || function( str ) {
        return String( str ).evalJSON()
    }
    : null
;

var storageCache = {} ;

function populateStorageCacheFromCookie() {
  if( useCookies ) {
    var reloaded = jsonDecode( $.cookie( "options" ) ) ;
    storageCache = reloaded == null ? {} : reloaded ;
  }
}

function retrieve( key, defaultValue ) {
  if( useCookies ) {
    if( key in storageCache ){
      return storageCache[ key ] ;
    }
    return typeof( defaultValue ) == "undefined" ? null : defaultValue ;
  } else {
    return $.jStorage.get( key, defaultValue ) ;
  }
}

function store( key, value ) {
  if( useCookies ) {
    storageCache[ key ] = value ;
    $.cookie( "options", jsonEncode( storageCache ) ) ;
  } else {
    $.jStorage.set( key, value ) ;
  }
}



