// Test for summarizing the audience of an encrypted file.
QUnit.test('summarizeAudience', function(assert) {
	'use strict';
	var audienceIDs
	var sessionID = '8xC1iX...'

	audienceIDs = ['8xC1iX...']
	assert.equal(
		miniLock.util.summarizeAudience(audienceIDs, sessionID),
		'Only you can decrypt this file.'
	)
	
	audienceIDs = ['8xC1iX...', 'QsaNeS...']
	assert.equal(
		miniLock.util.summarizeAudience(audienceIDs, sessionID),
		'You and 1 other person can decrypt this file.'
	)

	audienceIDs = ['8xC1iX...', 'QsaNeS...', 'M4X6Uk...']
	assert.equal(
		miniLock.util.summarizeAudience(audienceIDs, sessionID),
		'You and 2 other people can decrypt this file.'
	)
	
	audienceIDs = ['QsaNeS...']
	assert.equal(
		miniLock.util.summarizeAudience(audienceIDs, sessionID),
		'One person can decrypt this file. You can’t.'
	)
	
	audienceIDs = ['QsaNeS...', 'M4X6Uk...']
	assert.equal(
		miniLock.util.summarizeAudience(audienceIDs, sessionID),
		'2 other people can decrypt this file. You can’t.'
	)
})