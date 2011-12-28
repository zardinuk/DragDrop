/**
 * DragDrop.js
 *
 * A JavaScript micro-framework for adding drag-and-drop functionality
 * to elements for advanced UI development.
 *
 * @author     James Brumond
 * @version    0.2.3-beta
 * @copyright  Copyright 2011 James Brumond
 * @license    Dual licensed under MIT and GPL
 */

define([
  'underscore',
  'jquery',
  'backbone',
  'events'
], function(_, $, Backbone, Events) {
  var
	
  // Is this a touch device?
  touchEvents = (function() {
    var ret, elem = document.createElement('div');
    ret = ('ontouchstart' in elem);
    elem = null;
    return ret;
  }()),
  
  // Determine the events to bind to,
  events = (touchEvents ?
	    {
	      start: 'touchstart',
	      move: 'touchmove',
	      end: 'touchend'
	    } : {
	      start: 'mousedown',
	      move: 'mousemove',
	      end: 'mouseup'
	    }
	   ),

  // ----------------------------------------------------------------------------
  //  Helper Functions
	
  // Get the dimensions of the window
  getWindowSize = function() {
    return {
      x: window.innerWidth || document.documentElement.clientWidth || body().clientWidth,
      y: window.innerHeight || document.documentElement.clientHeight || body().clientHeight
    };
  },
	
  // Stop an event
  stopEvent = function(evt) {
    if (evt.preventDefault) {
      evt.preventDefault();
    }
    if (evt.stopPropagation) {
      evt.stopPropagation();
    }
    evt.returnValue = false;
    return false;
  },

  Box = {
    pointIntersect: function(point) {
      return point.x >= this.left && point.x <= this.right && point.y >= this.top && point.y <= this.bottom;
    },
    // North-West of Bottom-Right point, used for sorting
    NWofBR: function(point) {
      return point.x <= this.right && point.y <= this.bottom;
    },
    // South-East of Top-Left point, used for sorting
    SEofTL: function(point) {
      return this.top <= point.y && this.left <= point.x;
    },
    resetBounds: function(el) {
      var offset = el.offset();
      this.top = offset.top;
      this.left = offset.left;
      this.right = offset.left + el.width();
      this.bottom = offset.top + el.height();
    }
  },
	
  DragDrop = {
    // ------------------------------------------------------------------
    //  A constructor for a resource type used in referencing bindings
    Draggable: function(){
      // The next binding ID to use
      var nextBinding = 1;

      var klass = function(options) {
	_.extend(this, {
	  _id:      nextBinding++,
	  dragging: false,
	  groups:   options.groups || [],
	  boundingBox: options.boundingBox,
	  anchor:   $(options.anchor || options.element),
	  el:       $(options.element)
	});

	_.each(options.events, function(evt, func){
	  this.bind(evt, func);
	}, this);

	this.el.bind(events.start, _.bind(this.dragStart, this));

	this.onDrag    = _.bind(this.drag, this);
	this.onDragEnd = _.bind(this.dragStop, this);
      };
    
      klass.prototype = {
	// A class to add when an element is being dragged
	dragClass: 'drag',
      
	drag: function(e) {
	  if (this._proxy) {
	    // Find all needed offsets
	    var offsetX = e.clientX - this.dx;
	    var offsetY = e.clientY - this.dy;

	    var offsetWidth = this._proxy.width();
	    var offsetHeight = this._proxy.height();
	    // Find the new positions
	    var posX = this.startX + offsetX;
	    var posY = this.startY + offsetY;
	    // Enforce any bounding box
	    if (this.boundingBox) {
	      var box = this.boundingBox;
	      var minX, maxX, minY, maxY;
	      // Bound inside offset parent
	      if (box === 'offsetParent') {
		var parent = this.el.offsetParent();
		minX = minY = 0;
		maxX = parent.width();
		maxY = parent.height();
	      }
	      // Bound to the dimensions of the window
	      else if (box === 'windowSize') {
		var dimensions = getWindowSize();
		minX = minY = 0;
		maxX = dimensions.x;
		maxY = dimensions.y;
	      }
	      // Manual bounding box
	      else {
		minX = box.x.min;
		maxX = box.x.max;
		minY = box.y.min;
		maxY = box.y.max;
	      }
	      posX = Math.max(minX, Math.min(maxX - offsetWidth, posX));
	      posY = Math.max(minY, Math.min(maxY - offsetHeight, posY));
	    }
	    // Move the element
	    this._proxy.css({left: posX});
	    this._proxy.css({top: posY});
	  }

	  // Call any "drag" events
	  this.trigger('drag', e, this);
		  
	  return stopEvent(e);
	},
	dragStart: function(e){
	  // Make sure it's a left click
	  if ((window.event && e.button === 1) || e.button === 0) {
	    // Call any "beforedrag" events before calculations begin
	    this.trigger('beforedrag', e, this);
	    // Make sure everyone knows the element is being dragged
	    this.dragging = true;

	    if(!this.container) {
	      // Start calculating movement
	      this.proxyStart();
	    }

	    // Record where we started dragging
	    this.dx = e.clientX;
	    this.dy = e.clientY;

	    // Bind the movement event
	    $(document).bind(events.move, this.onDrag);
	    $(document).bind(events.end, this.onDragEnd);

	    // Avoid text selection problems
	    document.body.focus();
	    this.selStop = Events.bind(document, 'selectstart', false);

	    // Call any "dragstart" events
	    this.trigger('dragstart', e, this);

	    return stopEvent(e);
	  }
	},
	dragStop: function(e){
	  // Unbind move and end events
	  $(document).unbind(events.move, this.onDrag);
	  $(document).unbind(events.end, this.onDragEnd);

	  // Unbind text selection intercepts
	  Events.unbind(this.selStop);

	  // Clean up...
	  this.dragging = false;

	  // Call any "dragend" events
	  this.trigger('dragend', e, this)

	  // Clear the proxy, revert back to the previous state if no commit was issued
	  this.ditchProxy();

	  return stopEvent(e);
	},
	destroy: function() {
	  // Remove DOM event listener
	  Events.unbind(this.dragEvent);
	  // Remove us from groups we're part of
	  this.disband();
	  // Remove all event listeners
	  this.unbind();
	},
	disband: function(){
	  _.each(this.groups, function(group){
	    group.remove(this);
	  }, this);
	},

	// Interface features
	// Proxy is what floats around on the screen underneath the mouse cursor when there is no container
	proxy: function() {
	  // return this.el;
	  var proxy = this.el.clone();
	  proxy.css({opacity: 0.5});
	  proxy.addClass(this.dragClass);
	  return proxy;
	},
	proxyStart: function() {
	  this._proxy = this.proxy();
	  this._proxy.insertBefore(this.el);

	  var pos = this._proxy.position();
	  this.startX = pos.left;
	  this.startY = pos.top;

	  this._proxy.css({position: 'absolute', top: pos.top, left: pos.left});
	},
	ditchProxy: function() {
	  if (this._proxy) {
	    this._proxy.remove();
	    this._proxy = null;
	  }
	},
	// Drop is triggered when a free-float draggable is comitted, typically replaces the placeholder
	drop: function() {
	  this.el.detach();
	  this.el.css({position:'static', top:0, left:0, height:'auto',border:0});
	  return this.el;
	},
	// Placeholder is locked in to position in the containers from a free-floating draggable
	placeholder: function() {
	  if(!this._placeholder) {
	    this._placeholder = this.el.clone();
	    this._placeholder.css({position:'static', top:0, left:0, height:'auto',border:0});
	  }
	  return this._placeholder;
	},
	ditchPlaceholder: function() {
	  this._placeholder.remove();
	  this._placeholder = null;
	},
	attach: function(container) {
	  this.ditchProxy();
	  if(!container.el.find(this.el)[0])
	    container.el.append(this.placeholder());
	  this.container = container;
	},
	detach: function() {
	  this.container = null;
	  if(this._placeholder) {
	    this.ditchPlaceholder();
	  }
	  this.proxyStart();
	},
	// Drag end states
	commit: function() {
	  if(this._placeholder) {
	    this.drop().insertBefore(this._placeholder);
	    this.ditchPlaceholder();
	  }
	},

	// Utilities
	// snapEl is the element that snaps into different places as the drag, either
	// _placeholder or el.
	snapEl: function() {
	  return this._placeholder || this.el;
	},
	positionIn: function(list) {
	  return _.indexOf(list, this.snapEl()[0]);
	},
	moveBefore: function(el) {
	  this.snapEl().insertBefore(el);
	},
	moveAfter: function(el) {
	  this.snapEl().insertAfter(el);
	}
      };

      _.extend(klass.prototype, Backbone.Events);
      
      return klass;
    }(),

    /**
     * A droppable container, the default drop behavior is to append the draggable
     */
    Droppable: function() {
      var klass = function(options) {
	_.extend(this, {
	  groups:   options.groups || [],
	  el:       $(options.element),
	  drop:     options.drop || this.drop,
	  dropping: false
	});

	_.each(this.groups, function(group){
	  group.bind('dragstart', this.dropStart, this);
	  group.bind('dragend', this.dropStop, this);
	}, this);
      };

      klass.prototype = {
	dropClass: 'drop',

	// overrides
	// receive - take the draggable placeholder and apply it to this droppable
	receive: function(e, draggable) {
	  draggable.attach(this);
	},
	surrender: function(e, draggable) {
	  draggable.detach();
	},
	// drop - replace the placeholder with a permanant object
	drop: function(e, draggable) {
	  draggable.commit();
	},

	// Calculate intersection, might want a delay here
	drag: function(e, draggable) {
	  if (this.pointIntersect({x: e.clientX, y: e.clientY})) {
	    if (draggable.container != this) {
	      this.dragOver(e, draggable);
	    }
	  } else {
	    if (draggable.container == this) {
	      this.dragOut(e, draggable);
	    }
	  }
	},

	// Only monitor events when there is an item being dragged that we recognize
	dropStart: function(e, draggable, group) {
	  this.resetBounds(this.el);

	  if (draggable.container == this)
	    this.activate();

	  draggable.bind('drag', this.drag, this);

	  this.trigger('dropstart', e, draggable);
	},
	dropStop: function(e, draggable, group) {
	  draggable.unbind('drag', this.drag);
	  
	  if(draggable.container == this) {
	    // Commit
	    this.drop(e, draggable);
	    this.deactivate();
	  }

	  this.trigger('dropend', e, draggable);
	},

	// Mouseover behaviors
	dragOver: function(e, draggable){
	  this.activate();
	  this.receive(e, draggable);
	  this.trigger('dragover', e, draggable);
	},
	dragOut: function(e, draggable){
	  this.surrender(e, draggable)
	  this.deactivate();
	  this.trigger('dragout', e, draggable);
	},

	// basic vehaviors
	activate: function() {
	  this.el.addClass(this.dropClass);
	},
	deactivate: function() {
	  this.el.removeClass(this.dropClass);
	}
      };

      _.extend(klass.prototype, Backbone.Events);
      _.extend(klass.prototype, Box);
      
      return klass;
    }(),
    
    /**
     * A sortable container.
     * Works similar to a droppable but will also place drops according to a sorting algo.
     */
    Sortable: function() {
      var klass = function(options) {
	_.extend(this, {
	  groups:   options.groups || [],
	  el:       $(options.element)
	});

	if(options.droppable) {
	  if (options.droppable instanceof DragDrop.Droppable) {
	    this.droppable = options.droppable
	  } else {
	    this.droppable = new DragDrop.Droppable(options.droppable);
	  }
	  this.droppable.bind('dragover', this.sortStart, this);
	  this.droppable.bind('dragout', this.sortStop, this);
	}

	this.itemSelector = options.items;
      };

      klass.prototype = {
	refresh: function(){
	  this.items = $(this.itemSelector, this.el).toArray();
	  _.each(this.items, function(itemEl){
	    if(!itemEl.resetBounds) _.extend(itemEl, Box);
	    itemEl.resetBounds($(itemEl));
	  });
	},
	sortStart: function(e, draggable, group) {
	  this.refresh();

	  draggable.bind('drag', this.drag, this);
	},
	sortStop: function(e, draggable, group) {
	  draggable.unbind('drag', this.drag);
	},
	drag: function(e, draggable) {
	  var curPos      = draggable.positionIn(this.items),
	      point       = {x: e.clientX, y: e.clientY};

	  for(var i = curPos - 1; i >= 0; i--) {
	    if(this.items[i].NWofBR(point)){
	      draggable.moveBefore(this.items[i]);
	      this.refresh();
	      return;
	    }
	  }

	  for(var i = curPos + 1; i < this.items.length; i++) {
	    if(this.items[i].SEofTL(point)){
	      draggable.moveAfter(this.items[i]);
	      this.refresh();
	      return;
	    }
	  }
	}
      };

      return klass;
    }(),
    
    /**
     * The DragDrop namespace
     *
     * Example:
     * 
     *   DragDrop.bind ( element[, options ]);
     *   DragDrop.unbind ( reference );
     *   new DragDrop.Draggable();
     *
     * @access  public
     */
    Group: function() {
      var klass = function() {
	// Elements bound
	this.bindings = [];

	this.onDragStart = _.bind(this.dragStart, this);
	this.onDragStop  = _.bind(this.dragStop, this);
      };
      
      klass.prototype = {
	// ----------------------------------------------------------------------------
	//  Public Functions
    
	// Make an element draggable
	add: function(options) {
	  var self = this;
	
	  // Parse options
	  options = options || { };

	  if (options.element) {
	    // Check to make sure the elements aren't already bound
	    var existingBinding = _.find(this.bindings, function(b){
	      return b.el[0] = options.element;
	    });

	    if (existingBinding)
	      return existingBinding;

	    // Initialize the binding object
	    var draggable = new DragDrop.Draggable({
	      groups: [this],
	      element: options.element,
	      anchor: options.anchor,
	      events: options.events,
	      boundingBox: options.boundingBox
	    });

	    draggable.bind('dragstart', this.onDragStart);
	    draggable.bind('dragend', this.onDragStop);
	  
	    // Add the draggable to the list
	    self.bindings.push(draggable);

	    return draggable;
	  }
	},

	// Remove an element's draggableness
	remove: function(draggable) {
	  if (draggable instanceof Draggable) {
	    this.bindings = _.without(this.bindings, draggable);

	    draggable.unbind('dragstart', this.onDragStart);
	    draggable.unbind('dragend', this.onDragEnd);
	  
	    // Call any "unbind" events
	    draggable.trigger('unbind', this);
	  }
	},

	dragStart: function(e, draggable) {
	  this.trigger('dragstart', e, draggable, this);
	},

	dragStop: function(e, draggable) {
	  this.trigger('dragend', e, draggable, this);
	}
      };

      _.extend(klass.prototype, Backbone.Events);

      return klass;
    }()
  };
	
  // ----------------------------------------------------------------------------
  //  Expose
  return DragDrop;	
});
