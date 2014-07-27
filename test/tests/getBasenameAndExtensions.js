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
		miniLock.util.getBasenameAndExtensions('Sombody With A. Period CV.2014.docx.exe.pdf'),
		{basename: 'Sombody With A. Period CV', extensions: '.2014.docx.exe.pdf'}
	)
})