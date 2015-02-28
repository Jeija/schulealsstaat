var openssl = require("openssl-wrapper");
var ursa = require("ursa");
var fs = require("fs");
var cert = require("../cert");
var log = require("../logging");

// Load private key to decrypt requests
var PRIVKEY_FILE = "privkey.pem";
var privkey_string = fs.readFileSync(__dirname + "/../" + PRIVKEY_FILE, "utf8");
var privkey = ursa.createPrivateKey(privkey_string);

var actions = {};

/**
 * Register an action that doesn't require a special certificate to be executed
 * \param name The [ACTIONNAME] in the URL, such as "get_students" for [URL]/actions/get_students
 * \param action A function(payload) that is executed if the action is called, return value
 * is what will be sent to the client as the answer
 */
function register_action(name, action)
{
	actions[name] = { cert : undefined, action : action };
}

/**
 * Register an action that doesn't require a special certificate to be executed
 * \param name The [ACTIONNAME] in the URL, such as "get_students" for [URL]/actions/get_students
 * \param cert An array containing the filenames of certificates that legitimate the action
 * \param action A function(payload) that is executed if the action is called, return value
 * is what will be sent to the client as the answer
 */
function register_action_cert(name, cert, action)
{
	actions[name] = { cert : cert, action : action };
}

// Decrypt RSA-encrypted symmetric AES key supplied in post_data.passphrase
function decrypt_aes_key(passphrase) {
	return privkey.decrypt(passphrase, "base64", "utf8", ursa.RSA_PKCS1_PADDING);
}


// OpenSSL AES decryption + encryption functions
function decrypt_query(query_enc, aes_key, name, answer, callback) {
	var query_buf = new Buffer(query_enc);
	var ssl_options = {
		"d" : true,
		"aes-256-cbc" : true,
		"a" : true,
		"k" : aes_key // child_process.spawn sanitizes user input
	};
	openssl.exec("enc", query_buf, ssl_options, function (err, plain) {
		try {
			callback(plain.toString());
		} catch(e) {
			log.err("API (Query)", name + ": " + e);
			answer("error: " + e);
		}
	});
}

function encrypt_query(query_plain, aes_key, callback) {
	var query_buf = new Buffer(query_plain);
	var ssl_options = {
		"e" : true,
		"aes-256-cbc" : true,
		"a" : true,
		"k" : aes_key // child_process.spawn sanitizes user input
	};

	openssl.exec("enc", query_buf, ssl_options, function (err, query_buf) {
		callback(query_buf.toString());
	});
}

function execute(name, req, res)
{
	// Given action is not registered
	if (!actions[name]) { res.end(); return; }

	var POST = "";
	req.on("data", function (data) { POST += data; });
	req.on("end", function () {
		var post_data, aes_key;
		try {
			// Retrieve AES key from post_data
			post_data = JSON.parse(POST);
			aes_key = decrypt_aes_key(post_data.passphrase);
		} catch(e) {
			log.err("API (JSON.parse + decrypt)", name + ": " + e);
			res.end("error: " + e);
			return;
		}

		// Send AES-encrypted answer
		var on_answer = function (ans) {
			if (!ans) return;
			encrypt_query(JSON.stringify(ans), aes_key, function (enc) {
				res.end(enc);
			});
		};

		try {
			var enc = post_data.encrypted;
			decrypt_query(enc, aes_key, name, on_answer, function (query_str) {
				var query = JSON.parse(query_str);
				var ip = req.connection.remoteAddress;
				var cert_required = actions[name].cert;
				if (cert_required) {
					var cert_provided = query.cert;
					cert.check(cert_required, cert_provided, ip, function () {
						actions[name].action(query.payload, on_answer, req);
					}, function () {
						log.warn("API (Cert)", name +
							": incorrect certificate from " + ip);
						on_answer("error: incorrect certificate");
					});
				} else {
					actions[name].action(query.payload, on_answer, req);
				}
			});
		} catch(e) {
			log.err("API (Action)", name + ": " + e);
			on_answer("error: " + e);
		}
	});
}

require("./misc.js")(register_action, register_action_cert);
require("./config.js")(register_action, register_action_cert);
require("./students.js")(register_action, register_action_cert);
require("./transactions.js")(register_action, register_action_cert);

module.exports = {
	execute: execute
};
