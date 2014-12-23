/*!
 * @author yomotsu http://yomotsu.net/
 * MIT License
 */


virtualInput = {};

( function ( ns ) {

  var _ua = ( function () {
    return {
      Touch: typeof document.ontouchstart != "undefined",
      Pointer: window.navigator.pointerEnabled,
      MSPoniter: window.navigator.msPointerEnabled
    }
  } )();

  ns._start = 'pointerdown MSPointerDown touchstart mousedown';
  ns._move  = 'pointermove MSPointerMove touchmove  mousemove';
  ns._end   = 'pointerup   MSPointerUp   touchend   mouseup';


  // https://github.com/mrdoob/eventdispatcher.js/
  /**
   * @author mrdoob / http://mrdoob.com/
   */
  var EventDispatcher = function () {}

  EventDispatcher.prototype = {

    constructor: EventDispatcher,

    apply: function ( object ) {

      object.addEventListener = EventDispatcher.prototype.addEventListener;
      object.hasEventListener = EventDispatcher.prototype.hasEventListener;
      object.removeEventListener = EventDispatcher.prototype.removeEventListener;
      object.dispatchEvent = EventDispatcher.prototype.dispatchEvent;

    },

    addEventListener: function ( type, listener ) {

      if ( this._listeners === undefined ) this._listeners = {};

      var listeners = this._listeners;

      if ( listeners[ type ] === undefined ) {

        listeners[ type ] = [];

      }

      if ( listeners[ type ].indexOf( listener ) === - 1 ) {

        listeners[ type ].push( listener );

      }

    },

    hasEventListener: function ( type, listener ) {

      if ( this._listeners === undefined ) return false;

      var listeners = this._listeners;

      if ( listeners[ type ] !== undefined && listeners[ type ].indexOf( listener ) !== - 1 ) {

        return true;

      }

      return false;

    },

    removeEventListener: function ( type, listener ) {

      if ( this._listeners === undefined ) return;

      var listeners = this._listeners;
      var listenerArray = listeners[ type ];

      if ( listenerArray !== undefined ) {

        var index = listenerArray.indexOf( listener );

        if ( index !== - 1 ) {

          listenerArray.splice( index, 1 );

        }

      }

    },

    dispatchEvent: function ( event ) {
        
      if ( this._listeners === undefined ) return;

      var listeners = this._listeners;
      var listenerArray = listeners[ event.type ];

      if ( listenerArray !== undefined ) {

        event.target = this;

        var array = [];
        var length = listenerArray.length;

        for ( var i = 0; i < length; i ++ ) {

          array[ i ] = listenerArray[ i ];

        }

        for ( var i = 0; i < length; i ++ ) {

          array[ i ].call( this, event );

        }

      }

    }

  };


  ns.Joystick = function ( $container, size, params ) {

    EventDispatcher.prototype.apply( this );

    this.angle = 0;
    this.position = { x: 0, y: 0 };
    this.pointerId = null;
    this.isActive = false;

    this.width = size * 2;
    this.halfWidth = size;

    var that = this;
    var id = params && params.id ? params.id  : '';
    var template = [
      '<div class="virtualInput-joystick" id="' + id + '">',
        '<div class="virtualInput-joystick__button"></div>',
        '<svg class="virtualInput-joystick__frame" width="' + this.width + '" height="' + this.width + '" viewbox="0 0 64 64">',
          '<polygon class="virtualInput-joystick__arrowUp"    points="32 19 34 21 30 21"></polygon>',
          '<polygon class="virtualInput-joystick__arrowRight" points="45 32 43 34 43 30"></polygon>',
          '<polygon class="virtualInput-joystick__arrowDown"  points="32 45 34 43 30 43"></polygon>',
          '<polygon class="virtualInput-joystick__arrowLeft"  points="19 32 21 34 21 30"></polygon>',
          '<circle  class="virtualInput-joystick__circle" cx="32" cy="32" r="16" stroke-width="' + ( this.halfWidth / 64 ) + '"></circle>',
        '</svg>',
      '</div>'
    ].join( '' );

    var $win = $( window );
    this.$all = $( template );
    this.$button = this.$all.find( '.virtualInput-joystick__button' );
    $container.append( this.$all );

    this.$all.css( {
      width:  this.width,
      height: this.width
    } );

    this.$button.css( {
      width:  size * .6,
      height: size * .6
    } );

    this.offset = this.$all.offset();
    this.buttonRadius = this.$button.width() / 2;
    this.frameRadius = size / 2;

    var onbuttondown = function ( event ) {

      event.preventDefault();
      event.stopPropagation();

      that.dispatchEvent( { type: 'active' } );
      that.isActive = true;

      if ( event.originalEvent.pointerId ) {

        that.pointerId = event.originalEvent.pointerId;

      } else if ( event.originalEvent.changedTouches ) {

        that.pointerId = event.originalEvent.changedTouches[ event.originalEvent.changedTouches.length - 1 ].identifier;

      }
      
      var coordinate = that.getEventCoordinate( event );

      if ( !coordinate ) { return; }

      that.setPosition( coordinate.x, coordinate.y );
      that.dispatchEvent( { type: 'move' } );
      
      $win.on( ns._move, onbuttonmove );
      $win.on( ns._end,  onbuttonup );

    };

    var onbuttonmove = function ( event ) {

      event.preventDefault();
      event.stopPropagation();
      
      var coordinate = that.getEventCoordinate( event );

      if ( !coordinate ) {

        return;

      }

      that.setPosition( coordinate.x, coordinate.y );
      that.dispatchEvent( { type: 'move' } );

    };

    var onbuttonup = function ( event ) {

      event.stopPropagation();

      var wasEventHappend;

      if ( event.originalEvent.pointerId ) {

        if ( that.pointerId !== event.originalEvent.pointerId ) {

          return;
          
        }

      } else if ( event.originalEvent.changedTouches ) {

        for ( i = 0, l = event.originalEvent.changedTouches.length; i < l; i ++ ) {

          if ( that.pointerId === event.originalEvent.changedTouches[ i ].identifier ) {

            wasEventHappend = true;
            break;

          }

          if ( !wasEventHappend ) {

            return;

          }

        }

      }

      that.dispatchEvent( { type: 'disactive' } );
      that.isActive = false;
      that.setPosition( 0, 0 );
      $win.off( ns._move, onbuttonmove );
      $win.off( ns._end,  onbuttonup );

    }

    this.setCSSPosition( 0, 0 );
    this.$all.on( ns._start, onbuttondown );
    
    $win.on( 'resize', function () {

      that.offset = that.$all.offset();
      
    } );

  };

  ns.Joystick.prototype.getLength = function ( x, y ) {

    return Math.sqrt( Math.pow( x, 2 ) + Math.pow( y, 2 ) );

  };

  ns.Joystick.prototype.setAngle = function ( lengthX, lengthY ) {

    if ( lengthX === 0 && lengthY === 0 ) {

      return this.angle;

    }

    var angle = Math.atan( lengthY / lengthX );

    if ( 0 > lengthX && 0 <= lengthY ) {
      //the second quadrant
      angle += Math.PI;

    } else if ( 0 > lengthX && 0 > lengthY ) {
      //the third quadrant
      angle += Math.PI;

    } else if ( 0 <= lengthX && 0 > lengthY ) {
      //the fourth quadrant
      angle += Math.PI * 2;

    }

    this.angle = angle;
    return angle;

  };

  ns.Joystick.prototype.getAngle = function () {

    return this.angle;

  };

  ns.Joystick.prototype.getPointOnRadius = function () {

    return {
      x: Math.cos( this.angle ),
      y: Math.sin( this.angle )
    };

  };

  ns.Joystick.prototype.getEventCoordinate = function ( event ) {

    var x, y, _event = null, i, l;

    if ( event.originalEvent.pointerId ) {

      if ( this.pointerId === event.originalEvent.pointerId ) {

        _event = event.originalEvent;

      }

    } else if ( event.originalEvent.changedTouches ) {

      for ( i = 0, l = event.originalEvent.changedTouches.length; i < l; i ++ ) {

        if ( this.pointerId === event.originalEvent.changedTouches[ i ].identifier ) {

          _event = event.originalEvent.changedTouches[ i ];

        }

      }

    } else {

      _event = event;

    }

    if ( _event === null ) {

      return false;

    }

    x = (   ( _event.clientX - this.offset.left ) - this.halfWidth ) / this.halfWidth * 2;
    y = ( - ( _event.clientY - this.offset.top  ) + this.halfWidth ) / this.halfWidth * 2;

    return { x: x, y: y };

  };

  ns.Joystick.prototype.setPosition = function ( x, y ) {

    this.position.x = x;
    this.position.y = y;
    var length = this.getLength( x, y );
    var angle = this.setAngle( x, y );

    if ( 1 >= length ) {

      this.setCSSPosition( x, y );
      return;

    }

    var pointOnRadius = this.getPointOnRadius();
    this.setCSSPosition( pointOnRadius.x, pointOnRadius.y );

  }

  ns.Joystick.prototype.setCSSPosition = function ( x, y ) {

    this.$button.css( {
      left: ( this.halfWidth + x * this.frameRadius - this.buttonRadius ),
      top:  ( this.halfWidth - y * this.frameRadius - this.buttonRadius )
    } );

  };







  ns.Button = function ( $container, size, params ) {

    EventDispatcher.prototype.apply( this );

    var that = this;
    var id = params && params.id ? params.id  : '';
    var label = params.label;
    var template = [
      '<div class="virtualInput-button" id="' + id + '">',
        '<div class="virtualInput-button__inner">',
          label,
        '</div>',
      '</div>'
    ].join( '' );
    var $button = $( template );
    $container.append( $button );
    $button.css( {
      width: size,
      height: size
    } );

    $button.on( ns._start, function () {

      that.dispatchEvent( { type: 'press' } );

    } );
    
  };


  ns.SquareButton = function ( $container, width, height, params ) {

    EventDispatcher.prototype.apply( this );

    this.isHeld = false;
    var that = this;
    var label = params.label;
    var template = [
      '<div class="virtualInput-squareButton">',
        '<div class="virtualInput-squareButton__inner">',
          label,
        '</div>',
      '</div>'
    ].join( '' );
    var $button = $( template );
    $container.append( $button );
    $button.css( {
      width: width,
      height: height,
      right: params.right,
      bottom: params.bottom,
    } );

    $button.on( 'mousedown', function () {

      that.isHeld = true;
      that.dispatchEvent( { type: 'press' } );

    } );

    $button.on( 'mouseleave', function () {

      that.isHeld = false;

    } );

    $button.on( 'mouseup', function () {

      that.isHeld = false;

    } );
    
  };


} )( virtualInput );
