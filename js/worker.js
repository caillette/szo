
function log( message ) {
  // A Worker can't log using window.console .
  self.postMessage( { command : 'log', message : message } ) ;
}


// http://updates.html5rocks.com/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
function stringToArrayBuffer( string ) {
  var arrayBuffer = new ArrayBuffer( string.length * 2 ) ; // 2 bytes for each char.
  var bufferView = new Uint16Array( arrayBuffer ) ;
  for( var i = 0, stringLength = string.length ; i < stringLength ; i++ ) {
    bufferView[ i ] = string.charCodeAt( i ) ;
  }
  return arrayBuffer ;
}


self.addEventListener( 'message', function( e ) {
  switch( e.data && e.data.command ) {

    case 'feature-detection' :
      // Used to check Transferable Objects feature, does nothing.
      break ;

    case 'echo' :
      log( 'echo: ' + e.data.payload ) ;
      break ;

    case 'computation-start' :
      currentComputation = new Computation( {
          url : 'whatever',
          batchSize : 1000,
          onStepComplete : function() {
            // Causes re-posting of this message.
            self.postMessage( {
                command : 'computation-continue'
            } ) ;
          },
          onComputationComplete : function( html ) {
            var arrayBuffer = stringToArrayBuffer( html ) ;
            // http://updates.html5rocks.com/2011/12/Transferable-Objects-Lightning-Fast
            self.postMessage( arrayBuffer, [ arrayBuffer ] ) ;
          }
      } ).step() ;
      break ;

    case 'computation-continue' :
      if( currentComputation ) {
        currentComputation = currentComputation.step() ;
      }
      break ;

  }
}, false ) ;

var currentComputation = null ;

// Encapsulates a computation that takes several steps to complete.
// Breaking it into steps allows cancellation of the ongoing one when user requests another.
// Because a Worker can't post messages to itself it asks the caller (through the 'context')
// to repost messages. That's quite heavy so we perform several ('batchSize') steps in sequence.
var Computation = function() {

  var computationIdGenerator = 0 ;

  var constructor = function Computation( context ) {
    var id = computationIdGenerator ++ ;
    var step = 0 ;
    var html = '<p>Initialized as computation #' + id + '</p>' ;

    function isComplete() {
      return step >= 10000 ;
    }

    function singleStep() {
      html += '<table>' ;
      html += '  <tbody>' ;
      html += '    <tr>' ;
      html += '      <td>Computation</td>' ;
      html += '      <td>' + id + '</td>' ;
      html += '    </tr>' ;
      html += '    <tr>' ;
      html += '      <td>Step</td>' ;
      html += '      <td>' + step + '</td>' ;
      html += '    </tr>' ;
      html += '  </tbody>' ;
      html += '</table>' ;
      html += '<p></p>'
      step ++ ;
    }

    this.step = function() {
      if( isComplete() ) {
        log( 'Worker completed computation ' + id + '.')
        context.onComputationComplete( html ) ;
        return null ;
      } else {
        for( var i = 0 ; i < context.batchSize ; i ++ ) {
          singleStep() ;
          if( isComplete() ) break ;
        }
        context.onStepComplete() ;
        return this ;
      }
    }

  } ;

  return constructor ;
}() ;

