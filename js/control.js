(function() {
	
	// Do syntax highlighting
	SyntaxHighlighter.all();
	
// ------------------------------------------------------------------
//  Build the example
	
	var exampleDiv = document.getElementById('example');
	var exampleLink = exampleDiv.appendChild(
		createElement('a', {
			href: '#',
			innerHTML: 'Create Draggable!',
			onclick: function() {
				var dragElement = document.body.appendChild(
					createElement('div', {
						id: 'draggable',
						innerHTML: '<div id="drag-handle"></div>'
					})
				);
				var draggable = DragDrop.bind(dragElement, {
					anchor: document.getElementById('drag-handle'),
					boundingBox: 'windowSize'
				});
				return false;
			}
		})
	);
	
// ------------------------------------------------------------------
//  Helpers
	
	function createElement(tag, attributes) {
		var element = document.createElement(tag);
		for (var i in attributes) {
			if (attributes.hasOwnProperty(i)) {
				element[i] = attributes[i];
			}
		}
		return element;
	}
	
}());
