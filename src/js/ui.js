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
	$('form.fileSelectForm input[type=reset]').click()
	miniLock.UI.flipToFront()
})


// -----------------------
// File Construction UI Bindings
// -----------------------

// Setup the screen for a new unencrypted file. 
$('form.file').on('encrypt:setup', function(event, file) {
	$('form.file').removeClass('decrypting encrypting decrypted encrypted')
	$('form.file').addClass('unprocessed')
	
	$('form.file div.name').removeClass('activated shelved expired')
	if ($('form.file').hasClass('withRandomName')) {
		$('form.file div.original.name').addClass('shelved')
		$('form.file div.random.name').addClass('activated')
	} else {
		$('form.file div.original.name').addClass('activated')
	}
	
	var randomName = miniLock.util.getRandomFilename()
	$('div.random.name b.basename').html(randomName)
	
	var saveName = $('form.file').hasClass('withRandomName') ? randomName : file.name
	$('form.file input.saveName').val(saveName)
	
	var basename = file.name.split('.')[0]
	var extensions = file.name.substr(basename.length)
	$('div.original.name b.basename').html(basename)
	$('div.original.name span.extensions').html(extensions)
	
	var fileSize = miniLock.UI.readableFileSize(file.size)
	$('span.fileSize').html(fileSize)
	
	if ($('form.file div.identity').size() === $('form.file div.blank.identity').size()) {
		var sessionID = miniLock.crypto.getMiniLockID(miniLock.session.keys.publicKey)
		$('div.identity input[type=text]').first().val(sessionID)
		$('div.identity').first().addClass('session')
		$('div.identity').first().removeClass('blank')
		$('div.identity label').first().text('Me')
	}
	
	$('div.blank.identity input[type=text]').first().focus()
	
	var missingMyMiniLockID = $('form.file div.session.identity').size() === 0
	$('form.file').toggleClass('missingMyMiniLockID', missingMyMiniLockID)
	
	$('input.encrypt').prop('disabled', false)
})

// Set the screen to show the progress of the encryption operation.
$('form.file').on('encrypt:start', function(event, file) {
	$('form.file').removeClass('unprocessed')
	$('form.file').addClass('encrypting')
	
	$('input.encrypt').prop('disabled', true)
	
	// TODO
	// miniLock.UI.animateProgressBar(file.size, 'encrypt')
	
	var saveName = $('form.file input.saveName').val()
	var basename = saveName.split('.')[0]
	var extensions = file.name.substr(basename.length)
	$('div.process.name b.basename').html(basename)
	$('div.process.name span.extensions').html(extensions)
	
	// TODO: Write accurate audience summary for encrypted file.
	$('form.file div.summary').text('You and one other person can decrypt this file.')
})

// Set the screen to save an encrypted file.
$('form.file').on('encrypt:complete', function(event, file) {
	$('form.file').removeClass('encrypting')
	$('form.file').addClass('encrypted')
	// Measure the height of the onscreen filename
	// and resize the file save link to fit.
	$('a.fileSaveLink').css('height', $(this).find('div.activated.name h1').height())
})

// Display an explanation when an encryption error occurs.
$('form.file').on('encrypt:failure', function(event, file) {
	$('form.file').removeClass('encrypting')
	$('form.file').addClass('failed')
})

// Setup the screen for the decryption view and start processing.
$('form.file').on('decrypt:start', function(event, file) {
	$('form.file').removeClass('encrypting decrypted encrypted unprocessed')
	$('form.file').addClass('decrypting')

	$('input.encrypt').prop('disabled', true)
	
	$('form.file div.name').removeClass('activated shelved expired')
	$('form.file div.name b.basename').html('')
	$('form.file div.name span.extensions').html('')

	var basename = file.name.split('.')[0]
	var extensions = file.name.substr(basename.length).replace(/.minilock$/, '')
	$('form.file div.input.name b.basename').html(basename)
	$('form.file div.input.name span.extensions').html(extensions)
	$('form.file div.input.name').addClass('activated')
	
	// TODO
	// miniLock.UI.animateProgressBar(file.size, 'encrypt')

	$('form.file div.summary').text('Decrypted from ' + file.name)
	
	$(this).data('inputFilename', file.name)
})

// When decryption is complete, update the screen with the file URL.
$('form.file').on('decrypt:complete', function(event, file) {
	$('form.file').removeClass('decrypting')
	$('form.file').addClass('decrypted')

	var basename = file.name.split('.')[0]
	var extensions = file.name.substr(basename.length)
	$('div.output.name b.basename').html(basename)
	$('div.output.name span.extensions').html(extensions)

	var inputFilename = $(this).data('inputFilename')
	if (inputFilename.replace(/.minilock$/, '') !== file.name) {
		$('div.output.name').addClass('activated')
		$('div.input.name').removeClass('activated').addClass('expired')
	}
	
	// TODO
	// if (miniLock.util.isFilenameSuspicious(file.name)) {
	// 	$('div.filenameSuspicious').fadeIn(200)
	// }

	// Measure the height of the onscreen filename
	// and resize the file save link to fit.
	$('a.fileSaveLink').css('height', $(this).find('div.activated.name h1').height())
})

// Display an explanation when a decryption error occurs.
$('form.file').on('decrypt:failure', function(event, file) {
	$('form.file').removeClass('decrypting')
	$('form.file').addClass('failed')
})

// Set a random filename and put the original on the shelf.
$('a.setRandomName').on('mousedown', function(event) {
	var name = miniLock.util.getRandomFilename()
	$('form.file').addClass('withRandomName')
	$('form.file div.random.name b.basename').text(name)
	$('form.file div.random.name').addClass('activated')
	$('form.file div.original.name').addClass('shelved')
	$('form.file input.saveName').val(name)
})

// Restore the original filename and deactivate the random one.
$('a.setOriginalName').on('mousedown', function(event) {
	var name = miniLock.UI.readFile.name
	$('form.file').removeClass('withRandomName')
	$('form.file div.original.name').removeClass('shelved').addClass('activated')
	$('form.file div.random.name').removeClass('activated')
	$('form.file input.saveName').val(name)
})

// Press return, or click > to commit the form and begin encrypting.
$('form.file').on('submit', function(event) {
	$('#utip').hide()
	event.preventDefault()
	if ($('div.blank.identity').size() === $('div.identity').size()) {
		$('div.identity input').first().focus()
	} else if ($('div.invalid.identity').size()) {
		$('div.invalid.identity input').first().focus()
	} else {
		var miniLockIDs = $('div.identity:not(.blank) input[type=text]').map(function(){ return this.value}).toArray()
		var saveName = $('form.file input.saveName').val().trim()
		setTimeout(function(){
			miniLock.crypto.encryptFile(
				miniLock.UI.readFile,
				saveName,
				[miniLock.crypto.getMiniLockID(miniLock.session.keys.publicKey)],
				miniLock.session.keys.publicKey,
				miniLock.session.keys.secretKey,
				'miniLock.crypto.workerEncryptionCallback'
			)
			delete miniLock.UI.readFile
		}, 500)
		$('form.file').trigger('encrypt:start', miniLock.UI.readFile)
	}
})

// Destroy the file and return to the front after you save.
$('a.fileSaveLink').click(function() {
	setTimeout(function() {
		window.URL = window.webkitURL || window.URL
		window.URL.revokeObjectURL($('a.fileSaveLink')[0].href)
		$('a.fileSaveLink').attr('download', '')
		$('a.fileSaveLink').attr('href', '')
		$('a.fileSaveLink').data('downloadurl', '')
		miniLock.UI.flipToFront()
	}, 1000)
})

// Toggle `withHintToSave` class on the file construction form
// when you mouse in-and-out so that a helpfull status message 
// can be displayed in the form header.
$('a.fileSaveLink').on('mouseover mouseout', function(){ 
	$('form.file').toggleClass('withHintToSave')
})


// -----------------------
// Audience Selection UI Bindings
// -----------------------

// Validate ID input and classify it as blank, invalid or the same as the current session.
$('form.file').on('input', 'div.identity', function(event) {
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
			if (inputID.length < 44) $(this).find('label').text('Too short')
			if (inputID.length > 44) $(this).find('label').text('Too long')
		}
	}
	
	var missingMyMiniLockID = $('form.file div.session.identity').size() === 0
	$('form.file').toggleClass('missingMyMiniLockID', missingMyMiniLockID)
	
	if ($('form.file div.blank.identity').size()===0) {
		var newIdentity = Mustache.render(miniLock.templates.audienceListIdentity, {})
		$('form.file div.miniLockIDList').append(newIdentity)
		$('form.file > div').first().stop().animate({
			scrollTop: $('form.file > div').first().prop('scrollHeight')
		}, 1500)
	}
})

$('form.file').on('mousedown', 'div.identity input.remove', function(event) {
	var oldIdentity = $(this).closest('div.identity')
	oldIdentity.remove()
	if ($('form.file div.identity').size() < 4 || $('form.file div.blank.identity').size()===0) {
		var newIdentity = Mustache.render(miniLock.templates.audienceListIdentity, {})
		$('form.file div.miniLockIDList').append(newIdentity)
	}
})


// -----------------------
// File Save UI Bindings
// -----------------------

// Input: Object:
//	{
//		name: File name,
//		size: File size (bytes),
//		data: File data (Blob),
//		type: File MIME type
//	}
//	operation: 'encrypt' or 'decrypt'
//	senderID: Sender's miniLock ID (Base58)
// Result: Anchor HTML element which can be used to save file
miniLock.UI.save = function(file, operation, senderID) {
	window.URL = window.webkitURL || window.URL
	$('a.fileSaveLink').attr('download', file.name)
	$('a.fileSaveLink').attr('href', window.URL.createObjectURL(file.data))
	$('a.fileSaveLink').data('downloadurl', [
		file.type,
		$('a.fileSaveLink').attr('download'),
		$('a.fileSaveLink').attr('href')
	].join(':'))
	
	$('span.fileSize').text(miniLock.UI.readableFileSize(file.size))

	$('div.senderID code').text(senderID)
	

	$('form.file').trigger(operation + ':complete', file)
}

// Convert an integer from bytes into a readable file size.
// For example, 7493 becomes '7.5KB'.
miniLock.UI.readableFileSize = function(bytes) {
	var KB = bytes / 1024
	var MB = KB    / 1024
	var GB = MB    / 1024
	if (KB < 1024) {
		return (Math.round(KB * 10) / 10) + 'KB'
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
	$('div.progressBarFill').css({width: '0%'})
	$('div.progressBarFill').animate({
		width: '99%'
	}, {
		duration: miniLock.user.progressBarEstimate(fileSize) * 1000,
		easing: 'linear',
		progress: function(animation, progress) {
			var percentage = Math.round(progress * 100)
			if (percentage >= 99) {
				percentage = 99
			}
			$('span.progressBarPercentage').text(percentage)
		}
	})
}

// Animate progress bar to show error.
miniLock.UI.animateProgressBarToShowError = function(operation) {
	var errorText = 'encryptionerror'
	if (operation === 'decrypt') {
		errorText = 'decryptionerror'
	}
	$('div.progressBarFill').stop().css({
		width: '100%',
		backgroundColor: '#F00'
	})
	$('span.progressBarPercentage').text(
		$('span.progressBarPercentage').data(errorText)
	)
	setTimeout(function() {
		$('div.squareContainer').toggleClass('flip')
	}, 4000)
	setTimeout(function() {
		$('div.progressBarFill').css({
			backgroundColor: '#FFF'
		})
	}, 4500)
}

miniLock.UI.flipToFront = function() {
	$('form.fileSelectForm input[type=reset]').click()
	$('div.squareContainer').removeClass('flip')
	$('#utip').hide()
}

miniLock.UI.flipToBack = function() {
	$('div.squareContainer').addClass('flip')
	$('#utip').hide()
}

// -----------------------
// Design & Developer Tools
// -----------------------
// $('input.miniLockKey').val('Sometimes miniLock people use this key when they are working on the software')
// $('form.unlockForm').submit()
// miniLock.UI.readFile = {name: $('form.file input.saveName').val()}

})
