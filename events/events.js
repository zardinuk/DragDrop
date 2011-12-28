define([], function(){
  /**
   * A namespace with functions for event binding
   *
   * Example:
   *
   *   Bind
   *    var evt = Events.bind(obj, 'event', function() { ... });
   *
   *   Unbind
   *    Events.unbind(evt);
   *     -OR-
   *    evt.unbind();
   *
   * @access  private
   */
  var
	
  // Bind an event
  bindEvent = (function() {
    if (document.addEventListener) {
      return function(obj, event, func) {
	obj.addEventListener(event, func, false);
      };
    } else if (document.attachEvent) {
      return function(obj, event, func) {
	obj.attachEvent('on' + event, func);
      };
    } else {
      return function() { };
    }
  }()),
	
  // Unbind an event
  unbindEvent = (function() {
    if (document.removeEventListener) {
      return function(obj, event, func) {
	obj.removeEventListener(event, func, false);
      };
    } else if (document.detachEvent) {
      return function(obj, event, func) {
	obj.detachEvent('on' + event, func);
      };
    } else {
      return function() { };
    }
  }());
  
  // Build the return value
  return {
    bind: function(obj, event, func) {
      var oldFunc = (func === false) ? function(e) {
	return stopEvent(e);
      } : func;
      func = function(e) {
	return oldFunc.call(obj, e || window.event);
      };
      bindEvent(obj, event, func);
      var ret = function() {
	unbindEvent(obj, event, func);
      };
      ret.unbind = function() {ret();};
      return ret;
    },
    unbind: function(unbinder) {
      unbinder();
    }
  };
  
});
