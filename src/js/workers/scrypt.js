// -----------------------
// Initialization
// -----------------------

importScripts(
	'../lib/crypto/scrypt.js'
)

// -----------------------
// Cryptographic functions
// -----------------------

// This web worker takes in as input a Uint8Array and returns
// 32 bytes of key material in a Uint8Array.
// scrypt is configured with the following parameters:
// Salt (16 bytes)
// N: 2^17
// r: 8,
// p: 1,
// L: 32
/*jshint -W098 */
var onmessage = function(message) {
	/*jshint -W106 */
	var scrypt = scrypt_module_factory()
	var keyBytes = scrypt.crypto_scrypt(
		message.data.key,
		message.data.salt,
		Math.pow(2, 17), 8, 1, 32
	)
	/*jshint +W106 */
	postMessage({
		keyBytes: keyBytes
	})
}
