miniLock.UI = {}

$(window).load(function() {
'use strict';
// -----------------------
// UI Startup
// -----------------------

$('[data-utip]').utip()
$('input.miniLockEmail').focus()
$('span.dragFileInfo').text(
	$('span.dragFileInfo').data('select')
)

// -----------------------
// Unlock UI Bindings
// -----------------------

$('form.unlockForm').on('submit', function() {
	var emailMatch = new RegExp(
		'[-0-9a-zA-Z.+_]+@[-0-9a-zA-Z.+_]+\\.[a-zA-Z]{2,20}'
	)
	var email = $('input.miniLockEmail').val()
	var key   = $('input.miniLockKey').val()
	if (!email.length || !emailMatch.test(email)) {
		$('div.unlockInfo').text($('div.unlockInfo').data('bademail'))
		$('input.miniLockEmail').select()
		return false
	}
	if (!key.length) {
		$('div.unlockInfo').text($('div.unlockInfo').data('nokey'))
		$('input.miniLockKey').select()
		return false
	}
	if (miniLock.crypto.checkKeyStrength(key)) {
		$('div.unlockInfo').animate({height: 20})
		$('div.unlockInfo').text($('div.unlockInfo').data('keyok'))
		$('input.miniLockKey').attr('readonly', 'readonly')
		miniLock.user.unlock(key, email)
		// Keep polling until we have a key pair
		var keyReadyInterval = setInterval(function() {
			if (miniLock.session.keyPairReady) {
				clearInterval(keyReadyInterval)
				$('div.myMiniLockID code').text(
					miniLock.crypto.getMiniLockID(
						miniLock.session.keys.publicKey
					)
				)
				$('div.unlock').delay(200).fadeOut(200, function() {
					$('div.selectFile').fadeIn(200)
					$('div.squareFront').animate({
						backgroundColor: '#49698D'
					})
				})
			}
		}, 100)
	}
	else {
		$('div.unlockInfo').html(
			Mustache.render(
				miniLock.templates.keyStrengthMoreInfo,
				{
					phrase: miniLock.phrase.get(7)
				}
			)
		)
		$('div.unlockInfo').animate({height: 185})
		$('div.unlockInfo input[type=text]').unbind().click(function() {
			$(this).select()
		})
		$('div.unlockInfo input[type=button]').unbind().click(function() {
			$('div.unlockInfo input[type=text]').val(
				miniLock.phrase.get(7)
			)
		})
	}
	return false
})

// -----------------------
// File Select UI Bindings
// -----------------------

$('div.fileSelector').on('dragover', function() {
	$('span.dragFileInfo').text(
		$('span.dragFileInfo').data('drop')
	)
	return false
})

$('div.fileSelector').on('dragleave', function() {
	$('span.dragFileInfo').text(
		$('span.dragFileInfo').data('select')
	)
	return false
})

$('div.fileSelector').on('drop', function(e) {
	$('span.dragFileInfo').text(
		$('span.dragFileInfo').data('read')
	)
	e.preventDefault()
	var file = e.originalEvent.dataTransfer.files[0]
	miniLock.UI.handleFileSelection(file)
	return false
})

$('div.fileSelector').click(function() {
	$('input.fileSelectDialog').click()
})

$('input.fileSelectDialog').change(function(e) {
	e.preventDefault()
	if (!this.files) {
		return false
	}
	$('span.dragFileInfo').text(
		$('span.dragFileInfo').data('read')
	)
	var file = this.files[0]
	// Pause to give the operating system a moment to close its 
	// file selection dialog box so that the transition to the 
	// next screen will be smoother like butter.
	setTimeout(function(){
		miniLock.UI.handleFileSelection(file)
	}, 600)
	return false
})

// Click to select user's miniLock ID for easy copy-n-paste.
$('div.myMiniLockID').click(function() {
	var range = document.createRange()
	range.selectNodeContents($(this).find('code').get(0))
	var selection = window.getSelection()
	selection.removeAllRanges()
	selection.addRange(range)
})

// Handle file selection via drag/drop or browsing.
miniLock.UI.handleFileSelection = function(file) {
	miniLock.file.get(file, function(result) {
		miniLock.UI.readFile = result
		var miniLockFileYes = [
			0x6d, 0x69, 0x6e, 0x69,
			0x4c, 0x6f, 0x63, 0x6b,
			0x46, 0x69, 0x6c, 0x65,
			0x59, 0x65, 0x73, 0x2e
		]
		var operation = 'encrypt'
		var first16Bytes = (new Uint8Array(result.data)).subarray(0, 16)
		if (first16Bytes.indexOfMulti(miniLockFileYes) === 0) {
			operation = 'decrypt'
		}
		setTimeout(function() {
			$('span.dragFileInfo').text(
				$('span.dragFileInfo').data('select')
			)
		}, 1000)
		if (operation === 'encrypt') {
			$('form.file').trigger('encrypt:setup', file)
		}
		if (operation === 'decrypt') {
			miniLock.crypto.decryptFile(
				result,
				miniLock.session.keys.publicKey,
				miniLock.session.keys.secretKey,
				'miniLock.crypto.workerDecryptionCallback'
			)
			$('form.file').trigger('decrypt:start', file)
		}
		miniLock.UI.flipToBack()
	})
}

// -----------------------
// Back-to-front UI Bindings
// -----------------------

$('input.flipBack').click(function() {
	miniLock.UI.expireLinkToSaveFile()
	miniLock.UI.flipToFront()
})

miniLock.UI.flipToFront = function() {
	$('form.fileSelectForm input[type=reset]').click()
	$('#utip').hide()
	$('div.squareContainer').removeClass('flip')
}

miniLock.UI.flipToBack = function() {
	$('#utip').hide()
	$('div.squareContainer').addClass('flip')
}

// -----------------------
// Encrypting a File
// -----------------------

// Setup the screen for a new unencrypted file. 
$('form.file').on('encrypt:setup', function(event, file) {
	$('form.file').removeClass('decrypting encrypting decrypted encrypted decrypt encrypt failed withSuspectFilename')
	$('form.file').addClass('unprocessed')
	
	var originalName = file.name
	var inputName    = file.name
	var randomName   = miniLock.util.getRandomFilename()
	var outputName   = $('form.file').hasClass('withRandomName') ? randomName : file.name
	
	// Render all filenames in preparation for transitions.
	$('form.file div.name').removeClass('activated shelved expired')
	$('form.file div.name input').val('')
	$('form.file div.name h1').empty()

	$('form.file div.input.name input').val(inputName)
	$('form.file div.input.name h1').html(Mustache.render(
		miniLock.templates.filename, 
		miniLock.util.getBasenameAndExtensions(inputName)
	))

	$('form.file div.output.name input').val(outputName)
	$('form.file div.output.name h1').html(Mustache.render(
		miniLock.templates.filename, 
		miniLock.util.getBasenameAndExtensions(outputName)
	))

	$('form.file div.original.name input').val(originalName)
	$('form.file div.original.name h1').html(Mustache.render(
		miniLock.templates.filename, 
		miniLock.util.getBasenameAndExtensions(originalName)
	))

	$('form.file div.random.name input').val(randomName)
	$('form.file div.random.name h1').html(Mustache.render(
		miniLock.templates.filename, 
		miniLock.util.getBasenameAndExtensions(randomName)
	))
	
	if ($('form.file').hasClass('withRandomName')) {
		$('form.file div.random.name').addClass('activated')
		$('form.file div.original.name').addClass('shelved')
	} else {
		$('form.file div.output.name').addClass('activated')
	}

	// Render the size of the input file. 
	$('form.file span.fileSize').html(miniLock.UI.readableFileSize(file.size))
	
	// Insert the session ID if the audience list is empty.
	if ($('form.file div.blank.identity').size() === $('form.file div.identity').size()) {
		var sessionID = miniLock.crypto.getMiniLockID(miniLock.session.keys.publicKey)
		$('form.file div.blank.identity:first-child').replaceWith(Mustache.render(
			miniLock.templates.audienceListIdentity, 
			{'className': 'session', 'id': sessionID, 'label': 'Me'}
		))
	}
	
	$('div.blank.identity input[type=text]').first().focus()
	
	var withoutSessionID = $('form.file div.session.identity').size() === 0
	$('form.file').toggleClass('withoutSessionID', withoutSessionID)
	
	$('input.encrypt').prop('disabled', false)
})

// Set the screen to show the progress of the encryption operation.
$('form.file').on('encrypt:start', function(event, file) {
	$('form.file').removeClass('unprocessed')
	$('form.file').addClass('encrypting')
	
	$('input.encrypt').prop('disabled', true)
	
	// Get the output name that was defined durring setup.
	var outputName = $('form.file div.output.name input').val()
	
	// Render the output name at the top.
	$('div.output.name h1').html(Mustache.render(
		miniLock.templates.filename, 
		miniLock.util.getBasenameAndExtensions(outputName)
	))
	
	miniLock.UI.animateProgressBar(file.size)
})

// Set the screen to save an encrypted file.
$('form.file').on('encrypt:complete', function(event, file, senderID) {
	$('form.file').removeClass('encrypting')
	$('form.file').addClass('encrypted')
	
	// Render encrypted file size.
	$('form.file span.fileSize').text(miniLock.UI.readableFileSize(file.size))

	// Render link to save encrypted file.
	miniLock.UI.renderLinkToSaveFile(file)
	
	// Render identity of the sender.
	$('div.senderID code').text(senderID)

	// Summarize who can access the file.
	var audienceIDs = $('form.file div.identity:not(.blank) input[type=text]').map(function(){ return this.value.trim() }).toArray()
	var sessionID = miniLock.crypto.getMiniLockID(miniLock.session.keys.publicKey)
	$('form.file div.summary').text(miniLock.util.summarizeAudience(audienceIDs, sessionID))
})

// Display encryption error message, reset progress bar, and then flip back.
$('form.file').on('encrypt:failed', function(event, errorMessage) {
	$('form.file').removeClass('encrypting')
	$('form.file').addClass('encrypt failed')
	$('form.file div.failureNotice').text(errorMessage)
	$('div.progressBarFill').css({
		'width': '0', 
		'transition': 'none'
	})
	setTimeout(function() {
		miniLock.UI.flipToFront()
	}, 5000)
})

// Set a random filename and put the original on the shelf.
$('form.file').on('mousedown', 'a.setRandomName', function() {
	var randomName = miniLock.util.getRandomFilename()
	$('form.file').addClass('withRandomName')
	$('form.file div.original.name').addClass('shelved')	
	$('form.file div.random.name').addClass('activated')
	$('form.file div.random.name input').val(randomName)
	$('form.file div.random.name h1').html(Mustache.render(
		miniLock.templates.filename,
		miniLock.util.getBasenameAndExtensions(randomName)
	))
	$('form.file div.output.name').removeClass('activated')
	$('form.file div.output.name input').val(randomName)
	$('form.file div.output.name h1').val(Mustache.render(
		miniLock.templates.filename,
		miniLock.util.getBasenameAndExtensions(randomName)
	))
})

// Restore the original filename and deactivate the random one.
$('form.file').on('mousedown', 'a.setOriginalName', function() {
	var originalName = $('form.file div.original.name input').val()
	$('form.file').removeClass('withRandomName')
	$('form.file div.original.name').removeClass('shelved')
	$('form.file div.random.name').removeClass('activated')
	$('form.file div.output.name').addClass('activated')
	$('form.file div.output.name input').val(originalName)
	$('form.file div.output.name h1').html(Mustache.render(
		miniLock.templates.filename,
		miniLock.util.getBasenameAndExtensions(originalName)
	))
})

// Validate identity input and classify it as blank, invalid or the same as the current session.
$('form.file').on('input', 'div.identity', function() {
	$(this).removeClass('blank invalid session')
	$(this).find('label').empty()
	
	var sessionID = miniLock.crypto.getMiniLockID(miniLock.session.keys.publicKey)
	var inputID   = $(this).find('input[type=text]').val().trim()
	if (inputID.length === 0) {
		$(this).addClass('blank')
	} else {
		if (inputID === sessionID) {
			$(this).addClass('session')
			$(this).find('label').text('Me')
		}
		if (! miniLock.util.validateID(inputID)) {
			$(this).addClass('invalid')
			$(this).find('label').text('Invalid')
			if (inputID.length < 44){ $(this).find('label').text('Too short') }
			if (inputID.length > 44){ $(this).find('label').text('Too long')  }
		}
	}
	
	var withoutSessionID = $('form.file div.session.identity').size() === 0
	$('form.file').toggleClass('withoutSessionID', withoutSessionID)
	
	if ($('form.file div.blank.identity').size() === 0) {
		$('form.file div.miniLockIDList').append(Mustache.render(
			miniLock.templates.audienceListIdentity, 
			{'className': 'blank'}
		))
		$('form.file > div').first().stop().animate({
			scrollTop: $('form.file > div').first().prop('scrollHeight')
		}, 1500)
	}
})

// Remove an identity from from the audience list.
$('form.file').on('mousedown', 'div.identity input.remove', function() {
	var identity = $(this).closest('div.identity')
	identity.find('input.code').val('')
	identity.find('input.code').trigger('input')
	identity.remove()
	if ($('form.file div.identity').size() < 4 || $('form.file div.blank.identity').size()===0) {
		$('form.file div.miniLockIDList').append(Mustache.render(
			miniLock.templates.audienceListIdentity, 
			{'className': 'blank'}
		))
	}
})

// Add the session identity to the audience list.
$('form.file').on('mousedown', 'a.addSessionIDtoAudienceList', function() {
	var sessionID = miniLock.crypto.getMiniLockID(miniLock.session.keys.publicKey)
	$('form.file div.blank.identity').first().replaceWith(Mustache.render(
		miniLock.templates.audienceListIdentity, 
		{'className': 'session', 'id': sessionID, 'label': 'Me'}
	))
	$('form.file div.session.identity input.code').trigger('input')
})

// Press <return>, or click > to commit the form and begin encrypting.
$('form.file').on('submit', function(event) {
	$('#utip').hide()
	event.preventDefault()
	if ($('div.blank.identity').size() === $('div.identity').size()) {
		$('div.identity input').first().focus()
	} else if ($('div.invalid.identity').size()) {
		$('div.invalid.identity input').first().focus()
	} else {
		if ($('form.file div.scrollingsurface').prop('scrollTop') !== 0) {
			var scrollDuration = 33 * Math.sqrt($('form.file > div').prop('scrollTop'))
			$('form.file div.scrollingsurface').first().animate({scrollTop: 0}, scrollDuration)
		}
		var miniLockIDs = $('div.identity:not(.blank) input[type=text]').map(function(){ return this.value.trim() }).toArray()
		var outputName = $('form.file div.output.name input').val().trim()
		miniLock.crypto.encryptFile(
			miniLock.UI.readFile,
			outputName,
			miniLockIDs,
			miniLock.session.keys.publicKey,
			miniLock.session.keys.secretKey,
			'miniLock.crypto.workerEncryptionCallback'
		)
		$('form.file').trigger('encrypt:start', miniLock.UI.readFile)
		delete miniLock.UI.readFile
	}
})

// -----------------------
// Decrypting a File
// -----------------------

// Set the screen to show decryption progress for an encrypted file.
$('form.file').on('decrypt:start', function(event, file) {
	$('form.file').removeClass('unprocessed decrypting encrypting decrypted encrypted decrypt encrypt failed withSuspectFilename')
	$('form.file').addClass('decrypting')
	
	$('input.encrypt').prop('disabled', true)
	
	// Reset all the name tags
	$('form.file div.name').removeClass('activated shelved expired')
	$('form.file div.name input').val('')
	$('form.file div.name h1').empty('')
	
	// Render name of the input file at the top of the screen.
	$('form.file div.input.name').addClass('activated')
	$('form.file div.input.name h1').html(Mustache.render(
		miniLock.templates.filename, 
		miniLock.util.getBasenameAndExtensions(file.name, 'exclude.minilock')
	))
	
	// Remember the input file name.
	$('form.file div.input.name input').val(file.name)

	// Render input file size.
	$('span.fileSize').text(miniLock.UI.readableFileSize(file.size))

	// Animate decryption operation progress
	miniLock.UI.animateProgressBar(file.size)
})

// Set the screen to save a decrypted file.
$('form.file').on('decrypt:complete', function(event, file, senderID) {
	$('form.file').removeClass('decrypting')
	$('form.file').addClass('decrypted')

	var outputName = file.name
	var inputName  = $('form.file div.input.name input').val()

	// Render the output filename at the top.
	$('form.file div.output.name h1').html(Mustache.render(
		miniLock.templates.filename, 
		miniLock.util.getBasenameAndExtensions(outputName)
	))

	// Highlight differences if the output name differs from the input name.
	if (inputName.replace(/.minilock$/, '') !== outputName) {
		$('div.output.name').addClass('activated')
		$('div.input.name').removeClass('activated').addClass('expired')
	}
	
	// Render decrypted file size.
	$('span.fileSize').text(miniLock.UI.readableFileSize(file.size))

	// Render link to save decrypted file.
	miniLock.UI.renderLinkToSaveFile(file)

	// Render identity of the sender.
	$('div.senderID code').text(senderID)

	// Render name of the input file in the summary the bottom of the screen.
	$('form.file div.summary').html('Decrypted from ' + Mustache.render(
		miniLock.templates.filename, 
		miniLock.util.getBasenameAndExtensions(inputName, 'exclude.minilock')
	))

	// Show the suspect filename notice when applicable.
	if (miniLock.util.isFilenameSuspicious(outputName)) {
		$('form.file').addClass('withSuspectFilename')
	}
})

// Display decryption error message, reset progress bar, and then flip back.
$('form.file').on('decrypt:failed', function(event, errorMessage) {
	$('form.file').removeClass('decrypting')
	$('form.file').addClass('decrypt failed')
	$('form.file div.failureNotice').text(errorMessage)
	$('form.file div.progressBarFill').css({
		'width': '0%', 
		'transition': 'none'
	})
	setTimeout(function() {
		miniLock.UI.flipToFront()
	}, 5000)
})

// -----------------------
// Link to Save File (appears on decrypt:complete and encrypt:complete)
// -----------------------

// After you save, expire the link and go back to the front.
$('form.file').on('click', 'a.fileSaveLink', function() {
	setTimeout(function() {
		miniLock.UI.expireLinkToSaveFile()
	}, 100)
	setTimeout(function() {
		miniLock.UI.flipToFront()
	}, 1000)
})

// Toggle `withHintToSave` class on the file construction form
// when you mouse in-and-out so that a helpfull status message 
// can be displayed in the form header.
$('form.file').on('mouseover mouseout', 'a.fileSaveLink', function(){ 
	$('form.file').toggleClass('withHintToSave')
})

miniLock.UI.renderLinkToSaveFile = function(file) {
	window.URL = window.webkitURL || window.URL
	$('a.fileSaveLink').attr('download', file.name)
	$('a.fileSaveLink').attr('href', window.URL.createObjectURL(file.data))
	$('a.fileSaveLink').data('downloadurl', [
		file.type,
		$('a.fileSaveLink').attr('download'),
		$('a.fileSaveLink').attr('href')
	].join(':'))
	$('a.fileSaveLink').css('height', $('form.file div.activated.name h1').height())
	$('a.fileSaveLink').css('visibility', 'visible')
}

miniLock.UI.expireLinkToSaveFile = function() {
	window.URL = window.webkitURL || window.URL
	window.URL.revokeObjectURL($('a.fileSaveLink')[0].href)
	$('a.fileSaveLink').attr('download', '')
	$('a.fileSaveLink').attr('href', '')
	$('a.fileSaveLink').data('downloadurl', '')
	$('a.fileSaveLink').css('height', 0)
	$('a.fileSaveLink').css('visibility', 'hidden')
}

// The crypto worker calls this method when a 
// decrypt or encrypt operation is complete.
// Input: Object:
//	{
//		name: File name,
//		size: File size (bytes),
//		data: File data (Blob),
//		type: File MIME type
//	}
//	operation: 'encrypt' or 'decrypt'
//	senderID: Sender's miniLock ID (Base58)
miniLock.UI.fileOperationIsComplete = function(file, operation, senderID) {
	$('form.file').trigger(operation + ':complete', file, senderID)
}

// The crypto worker calls this method when a 
// decrypt or encrypt operation has failed.
// Operation argument is either 'encrypt' or 'decrypt'.
miniLock.UI.fileOperationHasFailed = function(operation, error) {
	var details = error.message.match(/Encryption|Decryption failed - (.*)/)[1]
	$('form.file').trigger(operation+':failed', 'miniLock '+details+'.')
}

// Convert an integer from bytes into a readable file size.
// For example, 7493 becomes '7KB'.
miniLock.UI.readableFileSize = function(bytes) {
	var KB = bytes / 1024
	var MB = KB    / 1024
	var GB = MB    / 1024
	if (KB < 1024) {
		return Math.ceil(KB) + 'KB'
	}
	else if (MB < 1024) {
		return (Math.round(MB * 10) / 10) + 'MB'
	}
	else {
		return (Math.round(GB * 10) / 10) + 'GB'
	}
}

// Animate progress bar based on file size.
miniLock.UI.animateProgressBar = function(fileSize) {
	var estimateInSeconds = miniLock.user.progressBarEstimate(fileSize)
	var estimateInMiliseconds = Math.round(estimateInSeconds * 1000)
	$('form.file div.progressBarFill').css({
		'width': '0',
		'transition': 'none'
	})
	setTimeout(function(){
		$('form.file div.progressBarFill').css({
			'width': '100%',
			'transition': 'width '+estimateInMiliseconds+'ms linear'
		})
	}, 1)
}

// -----------------------
// Design & Developer Tools
// -----------------------

// $('input.miniLockEmail').val('manufacturing@minilock.io')
// $('input.miniLockKey').val('Sometimes miniLock people use this key when they are working on the software')
// $('form.unlockForm').submit()
// miniLock.UI.readFile = {name: $('form.file input.saveName').val()}

})
