var crypto = require("crypto");
var sjcl = require("sjcl");

var TEST_DATA_LENGTH = 100000;
var TEST_CYCLES = 500;
var PASSWORD_LENGTH = 10;

/*** Node.JS Builtin AES Encrypt / Decrypt functions ***/
function nodejs_encrypt(data, key) {
	var cipher = crypto.createCipher("aes-256-cbc", key);
	return cipher.update(data, "utf8", "hex") + cipher.final("hex");
}

function nodejs_decrypt(data, key) {
	var cipher = crypto.createDecipher("aes-256-cbc", key);
	return cipher.update(data, "hex", "utf8") + cipher.final("utf8");
}
 
// Generate random data to encrypt
function random_data () {
	var testdata = "";
	for (var i = 0; i < TEST_DATA_LENGTH; i++) {
		testdata += String.fromCharCode(Math.floor((Math.random() * 256)));
	}
	return testdata;
}

// Generate password to use for encryption
function random_password() {
	var password = "";
	for (var i = 0; i < PASSWORD_LENGTH; i++) {
		password += String.fromCharCode(Math.floor((Math.random() * 256)));
	}
	return password;
}

/*** Benchmark native sjcl ***/
var begin_sjcl = Date.now();
for (var i = 0; i < TEST_CYCLES; i++) {
	var password = random_password();
	var testdata = random_data();
	var enc = sjcl.encrypt(password, testdata);
	var dec = sjcl.decrypt(password, enc);
	if (dec != testdata) {
		console.log("SJCL: Decryption failed");
		return;
	};
}
var end_sjcl = Date.now();

/*** Benchmark Node.JS Builting functions ***/
var begin_node = Date.now();
for (var i = 0; i < TEST_CYCLES; i++) {
	var password = random_password();
	var testdata = random_data();
	var enc = nodejs_encrypt(testdata, password);
	var dec = nodejs_decrypt(enc, password);
	if (dec != testdata) {
		console.log("Node.JS: Decryption failed");
		return;
	};
}
var end_node = Date.now();

var duration_sjcl = (end_sjcl - begin_sjcl) / 1000;
var duration_node = (end_node - begin_node) / 1000;

console.log("Cycles: " + TEST_CYCLES + ", Length: " + TEST_DATA_LENGTH);
console.log();
console.log("######### SJCL #########");
console.log("Duration:           " + duration_sjcl + "s");
console.log("Duration per cycle: " + duration_sjcl / TEST_CYCLES + "s");
console.log();
console.log("#### Node.JS crypto ####");
console.log("Duration:           " + duration_node + "s");
console.log("Duration per cycle: " + duration_node / TEST_CYCLES + "s");
