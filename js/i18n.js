( function ( szotargep ) {

  szotargep.i18n = {} ;

  szotargep.i18n.Table = function() {

    var constructor = function Table( codeSupplier ) {

      this.resource = function( key ) {
        return resources[ key ][ codeSupplier.i18nCode() ] ;
      }

      var resources = {
        list : {
          eng : 'List',
          fra : 'Liste',
          hun : 'Lista'
        },
        untagged : {
          eng : 'Untagged',
          fra : 'Sans étiquette',
          hun : 'Jegy nélkül'
        },
        all : {
          eng : 'All',
          fra : 'Tout',
          hun : 'Minden'
        },
        none : {
          eng : 'None',
          fra : 'Rien',
          hun : 'Semmi'
        },
        next : {
          eng : 'Next',
          fra : 'Suivant',
          hun : 'Felfel'
        },
        flip : {
          eng : 'Flip',
          fra : 'Inverser',
          hun : 'Megfordít'

        },
        total : {
          eng : 'Total',
          fra : 'Total',
          hun : 'Összesen'
        }
      }

    }

    return constructor ;

  }() ;

} ( window.szotargep = window.szotargep || {} ) ) ;
