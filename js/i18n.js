( function ( szotargep ) {

  szotargep.i18n = {} ;

  szotargep.i18n.defaultLanguage = function() { return 'hu' }

  szotargep.i18n.visitLanguages = function( visitor ) {
    for( var l = 0 ; l < languages.length ; l ++ ) {
      var language = languages[ l ] ;
      visitor( language ) ;
    }
  }

  var languages = [
      { code639_1 : 'hu', name : 'Magyar' },
      { code639_1 : 'en', name : 'English' },
      { code639_1 : 'fr', name : 'Français' }
  ] ;




  var codeSupplier ;

  szotargep.i18n.initialize = function( languageCodeSupplier ) {
    codeSupplier = languageCodeSupplier ;
    szotargep.i18n.initialize = null ; // So nobody will call it again.
  }

  szotargep.i18n.currentI18nCode = function() {
    return codeSupplier.i18nCode() ;
  }

  szotargep.i18n.resource = function( key ) {
    return resources[ key ][ codeSupplier.i18nCode() ] ;
  }

  var resources = {
    list : {
      en : 'List',
      fr : 'Liste',
      hu : 'Lista'
    },
    untagged : {
      en : 'Untagged',
      fr : 'Sans étiquette',
      hu : 'Jegy nélkül'
    },
    all : {
      en : 'All',
      fr : 'Tout',
      hu : 'Minden'
    },
    none : {
      en : 'None',
      fr : 'Rien',
      hu : 'Semmi'
    },
    next : {
      en : 'Next',
      fr : 'Suivant',
      hu : 'Felfel'
    },
    flip : {
      en : 'Flip',
      fr : 'Inverser',
      hu : 'Megfordít'

    },
    total : {
      en : 'Total',
      fr : 'Total',
      hu : 'Összesen'
    }
  }


} ( window.szotargep = window.szotargep || {} ) ) ;
