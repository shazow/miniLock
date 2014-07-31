chrome.app.runtime.onLaunched.addListener(function(input) {
	// Create an app window unless one is already open.
	if (chrome.app.window.getAll().length === 0) {
		chrome.app.window.create('index.html', {
			bounds: {
				width: 550,
				height: 550
			},
			resizable: false
		})
	}
})
