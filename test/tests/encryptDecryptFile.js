// Test for file encryption.
QUnit.asyncTest('encryptDecryptFile', function(assert) {
	'use strict';
	var xhr = new XMLHttpRequest()
	xhr.open('GET', 'files/test.jpg', true)
	xhr.responseType = 'blob'
	xhr.onload = function() {
		var blob = this.response
		miniLock.file.get(blob, function(result) {
			result.name = 'test.jpg'
			assert.deepEqual(result.size, 348291, 'Original file size')
			miniLock.crypto.encryptFile(
				result,
				result.name,
				[
					//'This passphrase is supposed to be good enough for miniLock. :-)'
					//publicKey='CHPqY9NamcGHgG8o71DWZvAJTwg35ubSy6VQLoSkqSch'
					//secretKey='D7Q88Sy2rVoux1cUehgpa6cS1oFGBUHtLZvmEXF4QCKr'
					//salt='CEbwKd82ERAqm8n4ofhuBS'
					'79fgDYepcLgDuHjBcA4AYbxTAR3DSip4w9q48Z3LKXo8KRZXXMwXSaQp8NXvUhHvWg',

					//'This passphrase is supposed to be good enough for miniLock. 1234567890'
					//publicKey='FJ1bZx1NFnDdMhAqdne3ZpJmV4ixyDsuLytoaX51poDs'
					//secretKey='DviB6r1YoDWGakzgx481TbHchP98K4RcrGkNXVwxwVmX'
					//salt='B81Tn7Tzen4vEb48LYGehp'
					'8nqeeeBw6KzkZqFAGtW24JdrGUcYxLjo8CiAmy4FYnWpQdCazeZgMEue78FjasY14N'
				],
				Base58.decode('CHPqY9NamcGHgG8o71DWZvAJTwg35ubSy6VQLoSkqSch'),
				Base58.decode('D7Q88Sy2rVoux1cUehgpa6cS1oFGBUHtLZvmEXF4QCKr'),
				'79fgDYepcLgDuHjBcA4AYbxTAR3DSip4w9q48Z3LKXo8KRZXXMwXSaQp8NXvUhHvWg',
				'miniLock.test.encryptFileCallback'
			)
		})
	}
	xhr.send()
	miniLock.test.encryptFileCallback = function(message) {
		assert.deepEqual(message.name, 'test.jpg', 'Original file name')
		assert.deepEqual(message.saveName, 'test.jpg.minilock', 'Encrypted file name')
		assert.deepEqual(message.blob.size, 349480, 'Encrypted file size')
		miniLock.file.get(message.blob, function(result) {
			result.name = 'userHasChangedTheName.minilock'
			miniLock.crypto.decryptFile(
				result,
				Base58.decode('FJ1bZx1NFnDdMhAqdne3ZpJmV4ixyDsuLytoaX51poDs'),
				Base58.decode('DviB6r1YoDWGakzgx481TbHchP98K4RcrGkNXVwxwVmX'),
				'miniLock.test.decryptFileCallback'
			)
		})
	}
	miniLock.test.decryptFileCallback = function(message) {
		var reader = new FileReader()
		assert.deepEqual(message.name, 'test.jpg', 'Decrypted file name')
		assert.deepEqual(message.blob.size, 348291, 'Decrypted file size')
		reader.onload = function() {
			var hash = nacl.hash(new Uint8Array(this.result))
			assert.deepEqual(
				nacl.util.encodeBase64(hash),
				'NT2406X+QT6rIvmK9lsDGWuiljvWAd5S+IoEh7suxiVE+S//lmCU/Q3mDFWFeqNRdWjqvTSVEqRg3oZB++wYzg==',
				'Decrypted file integrity'
			)
			QUnit.start()
		}
		reader.readAsArrayBuffer(message.blob)
	}
})
