var gibberish = require("./node_modules/gibberish-aes/dist/gibberish-aes-1.0.0");
var openssl = require("openssl-wrapper");
var crypto = require("crypto");
var sjcl = require("sjcl");

var TEST_DATA_LENGTH = 100000;
var TEST_CYCLES = 200;
var PASSWORD_LENGTH = 10;

console.log("Cycles: " + TEST_CYCLES + ", Length: " + TEST_DATA_LENGTH);
console.log();

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
var duration_sjcl = (end_sjcl - begin_sjcl) / 1000;

console.log("######### SJCL #########");
console.log("Duration:           " + duration_sjcl + "s");
console.log("Duration per cycle: " + duration_sjcl / TEST_CYCLES + "s");
console.log();

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
var duration_node = (end_node - begin_node) / 1000;

console.log("#### Node.JS crypto ####");
console.log("Duration:           " + duration_node + "s");
console.log("Duration per cycle: " + duration_node / TEST_CYCLES + "s");
console.log();

/*** Benchmark Gibberish-AES native encryption ***/
var begin_gibb = Date.now();
for (var i = 0; i < TEST_CYCLES; i++) {
	var password = random_password();
	var testdata = random_data();
	var enc = gibberish.enc(testdata, password);
	var dec = gibberish.dec(enc, password);

	if (dec != testdata) {
		console.log("Gibberish AES: Decryption failed");
		return;
	};
}
var end_gibb = Date.now();
var duration_gibb = (end_gibb - begin_gibb) / 1000;

console.log("#### Gibberish-AES  ####");
console.log("Duration:           " + duration_gibb + "s");
console.log("Duration per cycle: " + duration_gibb / TEST_CYCLES + "s");
console.log();

/*** Benchmark OpenSSL (decryption-only) ***/
var slde_enc = gibberish.enc(testdata, password);
var begin_slde = Date.now();
var slde_callbacks = 0;
for (var i = 0; i < TEST_CYCLES; i++) {
	var ssl_options = {
		"d" : true,
		"aes-256-cbc" : true,
		"a" : true,
		"k" : password
	};
	var enc_buf = new Buffer(slde_enc);
	openssl.exec("enc", enc_buf, ssl_options, function (err, buffer) {
		slde_callbacks++;
	});
}

var int1 = setInterval(function () {
	if (slde_callbacks < TEST_CYCLES) return;
	var end_slde = Date.now();
	var duration_slde = (end_slde - begin_slde) / 1000;
	console.log("######## OpenSSL ######## (decryption only)");
	console.log("Duration:           " + duration_slde + "s");
	console.log("Duration per cycle: " + duration_slde / TEST_CYCLES + "s");
	console.log();
	clearInterval(int1);
}, 1);

/*** Benchmark OpenSSL (encryption-only) ***/
var begin_slen = Date.now();
var slen_callbacks = 0;
var slen_password = random_password();
for (var i = 0; i < TEST_CYCLES; i++) {
	var testdata = new Buffer(random_data());
	var ssl_options = {
		"e" : true,
		"aes-256-cbc" : true,
		"a" : true,
		"k" : slen_password
	};

	var isfirst = i != 80;
	function createEval(isfirst, plain) {
		return function (err, buffer) {
			if (isfirst) {
				// First callback: Check if encrypted data is correct
				var dec = gibberish.dec(buffer.toString("utf-8"), slen_password);
				if (dec != plain.toString()) {
					console.log("OpenSSL crypto failed!");
				}
			}
			slen_callbacks++;
		}
	}

	openssl.exec("enc", testdata, ssl_options, createEval(i == 0, testdata));
}

var int2 = setInterval(function () {
	if (slen_callbacks < TEST_CYCLES) return;
	var end_slen = Date.now();
	var duration_slen = (end_slen - begin_slen) / 1000;
	console.log("######## OpenSSL ######## (encryption only)");
	console.log("Duration:           " + duration_slen + "s");
	console.log("Duration per cycle: " + duration_slen / TEST_CYCLES + "s");
	clearInterval(int2);
}, 1);
