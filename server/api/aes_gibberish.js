/**
 * Library for encrypting / decrypting GibberishAES-compatible AES
 * with the fast integrated node.js crypto API.
 * It can also decrypt OpenSSL-generated AES data, but won't encrypt for it (no padding support)z
 */

var crypto = require('crypto');

function md5(src) {
	return crypto.createHash("md5").update(src).digest("binary");
}

function randomString(length) {
	var s = "";
	for (var i = 0; i < length; i++)
		s += String.fromCharCode(32 + Math.floor(Math.random() * 94));
	return s;
}

function AES_mangle(salted_password) {
	var rounds = 3;
	var result = "";
	var hashes = [];
	for (var i = 0; i < rounds; i++) {
		var previous = hashes[i - 1] ? hashes[i - 1] : "";
		hashes[i] = md5(previous + salted_password);
		result += hashes[i];
	}

	return {
		key : result.substring(0, 32),
		iv  : result.substring(32, 48)
	};
}

function AES_encrypt(data, password) {
	/** Generate random salt **/
	var salt = randomString(8);
	var salted_password = password + salt;

	/** Calculate key and iv **/
	var mangled = AES_mangle(salted_password);

	/** Actually encrypt the content **/
	var cipher = crypto.createCipheriv("aes-256-cbc", mangled.key, mangled.iv);
	var ct = Buffer.concat([cipher.update(data, "utf-8"), cipher.final()]);

	/** Put OpenSSL-compatible buffer together **/
	var sslbuf = Buffer.concat([new Buffer("Salted__" + salt), ct]);

	return sslbuf.toString("base64");
}

function AES_decrypt(data, password) {
	/** Get Salted password and ciphertext from raw openssl data **/
	var buf = new Buffer(data, "base64");
	var salt = buf.toString("binary", 8, 16);
	var ct = buf.toString("binary", 16);
	var salted_password = password + salt;

	/** Calculate key and iv **/
	var mangled = AES_mangle(salted_password);

	/** Actually decipher the content **/
	var decipher = crypto.createDecipheriv("aes-256-cbc", mangled.key, mangled.iv);
	var content = decipher.update(ct, "binary", "utf8");
	content += decipher.final("utf8");
	return content;
}

module.exports = {
	decrypt : AES_decrypt,
	encrypt : AES_encrypt
};
