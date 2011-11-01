(function() {
	
	// Do syntax highlighting
	SyntaxHighlighter.all();
	
	var exampleDiv = document.getElementById('example');
	var exampleLink = exampleDiv.appendChild(
		document.createElement('a')
	);
	
	exampleLink.href = '#';
	exampleLink.innerHTML = 'Run Example';
	exampleLink.onclick = function() {
	
	
		return false;
	};
	
}());
