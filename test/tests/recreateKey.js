// Key derivation test using known miniLock ID
QUnit.asyncTest('recreateKey', function(assert) {
	'use strict';
	miniLock.session = {
		keys: {},
		salt: null,
		keyPairReady: false,
		invalidKey: false
	}
	var passphrase = 'This passphrase is supposed to be good enough for miniLock. :-)'
	var miniLockID = '79fgDYepcLgDuHjBcA4AYbxTAR3DSip4w9q48Z3LKXo8KRZXXMwXSaQp8NXvUhHvWg'
	miniLock.user.unlock(passphrase, miniLockID)
	assert.deepEqual(miniLock.session.keyPairReady, false, 'keyPairReady starts as false')
	assert.deepEqual(Object.keys(miniLock.session.keys).length, 0, 'sessionKeys is empty')
	var keyInterval = setInterval(function() {
		if (miniLock.session.keyPairReady) {
			clearInterval(keyInterval)
			assert.deepEqual(Object.keys(miniLock.session.keys).length, 2, 'sessionKeys is filled')
			assert.deepEqual(miniLock.session.keyPairReady, true, 'keyPairReady set to true')
			assert.deepEqual(typeof(miniLock.session.keys), 'object', 'Type check')
			assert.deepEqual(typeof(miniLock.session.keys.publicKey), 'object', 'Public key type check')
			assert.deepEqual(typeof(miniLock.session.keys.secretKey), 'object', 'Secret key type check')
			assert.deepEqual(miniLock.session.keys.publicKey.length, 32, 'Public key length')
			assert.deepEqual(miniLock.session.keys.secretKey.length, 32, 'Secret key length')
			assert.deepEqual(miniLock.session.miniLockID, miniLockID, 'miniLockID verify')
			var decodedID = miniLock.util.decodeID(miniLock.session.miniLockID)
			assert.deepEqual(decodedID.publicKey.length, 32, 'miniLockID.publicKey length')
			assert.deepEqual(decodedID.salt.length, 16, 'miniLockID.salt length')
			assert.deepEqual(
				Base58.encode(miniLock.session.keys.publicKey),
				'CHPqY9NamcGHgG8o71DWZvAJTwg35ubSy6VQLoSkqSch',
				'Public key Base58 representation'
			)
			assert.deepEqual(
				Base58.encode(miniLock.session.keys.secretKey),
				'D7Q88Sy2rVoux1cUehgpa6cS1oFGBUHtLZvmEXF4QCKr',
				'Secret key Base64 representation'
			)
			assert.deepEqual(
				Base58.encode(decodedID.salt),
				'CEbwKd82ERAqm8n4ofhuBS',
				'miniLockID salt representation'
			)
			QUnit.start()
		}
	}, 500)
})



