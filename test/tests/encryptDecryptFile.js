// Test for file encryption.
QUnit.asyncTest('encryptDecryptFile', function(assert) {
	'use strict';

	// Chunk size (in bytes)
	// Warning: Must not be less than 256 bytes
	miniLock.crypto.chunkSize = 1024 * 1024 * 1

	var xhr = new XMLHttpRequest()
	xhr.open('GET', 'files/test.jpg', true)
	xhr.responseType = 'blob'
	xhr.onload = function() {
		assert.deepEqual(this.response.size, 348291, 'Original file size')
		miniLock.file.read(this.response, 0, this.response.size, function(result) {
			var hash = new BLAKE2s(32)
			hash.update(result.data)
			assert.deepEqual(
				nacl.util.encodeBase64(hash.digest()),
				'b5Uwx4IPiILdDL6Ym0GD/w1PIMu9hP1evJgYSKBH+/c=',
				'Original file hash'
			)
		})
		this.response.name = 'test.jpg'
		miniLock.crypto.encryptFile(
			this.response,
			'test.jpg',
			[
				'dJYs5sVfSSvccahyEYPwXp7n3pbXeoTnuBWHEmEgi95fF',
				'PHD4eUWB982LUexKj1oYoQryayreUeW1NJ6gmsTY7Xe12'
			],
			'dJYs5sVfSSvccahyEYPwXp7n3pbXeoTnuBWHEmEgi95fF',
			Base58.decode('7S4YTmjkexJ2yeMAtoEKYc2wNMHseMqDH6YyBqKKkUon'),
			miniLock.test.encryptFileCallback
		)
	}
	xhr.send()
	miniLock.test.encryptFileCallback = function(blob, saveName, senderID) {
		assert.deepEqual(saveName, 'test.jpg.minilock', 'Encrypted file name')
		assert.deepEqual(blob.size, 349779, 'Encrypted file size')
		assert.deepEqual(senderID, 'dJYs5sVfSSvccahyEYPwXp7n3pbXeoTnuBWHEmEgi95fF', 'Encrypted file sender')
		miniLock.util.resetCurrentFile()
		miniLock.crypto.decryptFile(
			blob,
			'PHD4eUWB982LUexKj1oYoQryayreUeW1NJ6gmsTY7Xe12',
			Base58.decode('B47Ez1ftjTPSL5Mu74YaQ33WAbDjNcBwYWnx7Fp6kvmr'),
			miniLock.test.decryptFileCallback
		)
	}
	miniLock.test.decryptFileCallback = function(blob, saveName, senderID) {
		var reader = new FileReader()
		assert.deepEqual(saveName, 'test.jpg', 'Decrypted file name')
		assert.deepEqual(blob.size, 348291, 'Decrypted file size')
		assert.deepEqual(senderID, 'dJYs5sVfSSvccahyEYPwXp7n3pbXeoTnuBWHEmEgi95fF', 'Decrypted file sender')
		reader.onload = function(readerEvent) {
			var hash = new BLAKE2s(32)
			hash.update(new Uint8Array(readerEvent.target.result))
			assert.deepEqual(
				nacl.util.encodeBase64(hash.digest()),
				'b5Uwx4IPiILdDL6Ym0GD/w1PIMu9hP1evJgYSKBH+/c=',
				'Decrypted file integrity'
			)
			QUnit.start()
		}
		reader.readAsArrayBuffer(blob)
	}
})
