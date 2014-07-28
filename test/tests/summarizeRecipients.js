// Test for summarizing the recipients of an encrypted file.
QUnit.test('summarizeRecipients', function(assert) {
	'use strict';
	var recipientIDs
	var sessionID = '8xC1iX...'

	recipientIDs = ['8xC1iX...']
	assert.equal(
		miniLock.util.summarizeRecipients(recipientIDs, sessionID),
		'Only you can decrypt this file.'
	)
	
	recipientIDs = ['8xC1iX...', 'QsaNeS...']
	assert.equal(
		miniLock.util.summarizeRecipients(recipientIDs, sessionID),
		'You and 1 other person can decrypt this file.'
	)

	recipientIDs = ['8xC1iX...', 'QsaNeS...', 'M4X6Uk...']
	assert.equal(
		miniLock.util.summarizeRecipients(recipientIDs, sessionID),
		'You and 2 other people can decrypt this file.'
	)
	
	recipientIDs = ['QsaNeS...']
	assert.equal(
		miniLock.util.summarizeRecipients(recipientIDs, sessionID),
		'One person can decrypt this file. You can’t.'
	)
	
	recipientIDs = ['QsaNeS...', 'M4X6Uk...']
	assert.equal(
		miniLock.util.summarizeRecipients(recipientIDs, sessionID),
		'2 other people can decrypt this file. You can’t.'
	)
})