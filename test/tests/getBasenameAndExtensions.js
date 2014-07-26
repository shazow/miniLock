// Tests for extracting basename and extensions from a filename.
QUnit.test('getBasenameAndExtensions', function(assert) {
	'use strict';
	assert.deepEqual(
		miniLock.util.getBasenameAndExtensions('SCAN.JPG'),
		{basename: 'SCAN', extensions: '.JPG'}
	)

	assert.deepEqual(
		miniLock.util.getBasenameAndExtensions('Archive.tar.zip'),
		{basename: 'Archive', extensions: '.tar.zip'}
	)

	assert.deepEqual(
		miniLock.util.getBasenameAndExtensions('General Keith B. Alexander CV.2014.docx.exe.pdf'),
		{basename: 'General Keith B. Alexander CV', extensions: '.2014.docx.exe.pdf'}
	)

	assert.deepEqual(
		miniLock.util.getBasenameAndExtensions('Secret Song.mp3.minilock', 'exclude.minilock'),
		{basename: 'Secret Song', extensions: '.mp3'}
	)
})