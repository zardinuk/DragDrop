// Author: Thomas Davis <thomasalwyndavis@gmail.com>
// Filename: main.js

// Require.js allows us to configure shortcut alias
// Their usage will become more apparent futher along in the tutorial.
require.config({
  paths: {
    underscore: 'underscore/underscore-min',
    jquery: 'jquery/jquery-min',
    backbone: 'backbone/backbone-optamd3-min',
    events: 'events/events',
    dragdrop: 'drag-drop'
  }
});

require([
  'dragdrop'
], function(DragDrop){
  // The "app" dependency is passed in as "App"
  // Again, the other dependencies passed in are not "AMD" therefore don't pass a parameter to this function

  var dragMe = $('.dragMe')[0];
  var dropMe = document.getElementById('dropMe');

  var shouldntHappen = function() {
    console.log('THIS SHOULDN\'T HAPPEN');
  };

  var group = new DragDrop.Group();

  var draggable = group.add({
    element: dragMe,
    anchor:  dragMe,
    boundingBox: 'offsetParent',
    events: {
      dragstart: function(evt) {
	console.log('DragDrop.bind dragstart', evt);
      },
      drag: function(evt) {
	console.log('DragDrop.bind drag', evt);
      },
      dragend: function(evt) {
	console.log('DragDrop.bind dragend', evt);
      }
    }
  });

  var droppable = new DragDrop.Droppable({
    element: dropMe,
    groups: [group]
  });

  var sortable = new DragDrop.Sortable({
    element: dropMe,
    // Be careful that this doesn't create circular references, best to start the selector with a ">"
    items: '> div',
    droppable: droppable
  });

  draggable.bind('dragstart', function(evt) {
    console.log('DragDrop.bindEvent dragstart', evt);
  });
  draggable.bind('drag', function(evt) {

  });
  draggable.bind('dragend', function(evt) {
    console.log('DragDrop.bindEvent dragend', evt);
  });

  draggable.bind('dragstart', shouldntHappen);
  draggable.unbind('dragstart', shouldntHappen);

  draggable.bind('drag', shouldntHappen);
  draggable.unbind('drag', shouldntHappen);

  draggable.bind('dragend', shouldntHappen);
  draggable.unbind('dragend', shouldntHappen);
});
