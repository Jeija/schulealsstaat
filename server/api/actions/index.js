var ursa = require("ursa");
var fs = require("fs");
var cert = require("../cert");
var log = require("../logging");
var aes = require("../aes_gibberish");

// Load private key to decrypt requests
var PRIVKEY_FILE = "privkey.pem";
var privkey_string = fs.readFileSync(__dirname + "/../" + PRIVKEY_FILE, "utf8");
var privkey = ursa.createPrivateKey(privkey_string);

var actions = {};

/**
 * Action registration
 * register_action: registers an API action
 * register_action_cert: like register_action, but requires a certificate to be executed
 *
 * name: The [ACTIONNAME] in the URL, such as "get_students" for [URL]/actions/get_students
 * action: A function that is executed if the action is called
 *		type: function (payload, answer, error, info)
 * cert: An array of certificate hash files that suffice for authentication
 */
function register_action(name, action)
{
	actions[name] = { cert : false, action : action };
}

function register_action_cert(name, cert, action)
{
	actions[name] = { cert : cert, action : action };
}

/**
 * Decrypt RSA data
 * The AES key for the request and response is encrypted using the asymmetric RSA encryption
 * and supplied in post_data.passphrase
 * Uses privkey.pem (PRIVKEY_FILE) for decryption
 */
function decrypt_aes_key(passphrase) {
	return privkey.decrypt(passphrase, "base64", "utf8", ursa.RSA_PKCS1_PADDING);
}

/**
 * OpenSSL AES decryption + encryption functions
 * These function handle both encryption / decryption as well as
 * serialization / deserialization.
 */
function decrypt_query(query_enc, aes_key, error, answer) {
	try {
		var plain = aes.decrypt(query_enc, aes_key);
		return JSON.parse(plain.toString());
	} catch(e) {
		error("catch (decrypt_query): " + e);
		answer("error: " + e);
	}
}

function encrypt_query(query_plain, aes_key, callback) {
	return aes.encrypt(JSON.stringify(query_plain), aes_key);
}

/**
 * Decrypt action and provide API_answer / API_error callbacks to actions
 * name: The [ACTIONNAME] in the URL, such as "get_students" for [URL]/actions/get_students
 * req: Node.js HTTP request object
 * res: Node.js HTTP response object
 */
function prepare_action(name, post, req, res)
{
	/**
	 * Success / Failure functions:
	 * API_answer (below, after key decryption):
	 * Send (AES-)encrypted answer to client
	 * Given as a parameter to function that have to answer two the client
	 *
	 * API_info:
	 * Report info/success messages
	 * Given as a parameter to actions that use logging
	 *
	 * API_error:
	 * Report error / warning messages to console including the IP
	 * Given as a parameter to function that may fail
	 */
	var ip = req.connection.remoteAddress;
	var API_error = function (msg) {
		log.warn("API_error", "[" + name + "][" + ip + "]: " + msg);
	};
	var API_info = function (msg) {
		log.info("API_log", "[" + name + "][" + ip + "]: " + msg);
	};

	// Given action is not registered
	if (!actions[name]) {
		API_error("invalid action");
		res.end("error: invalid action");
		return;
	}

	// Retrieve AES key from post_data
	var encrypted, aes_key;
	try {
		var post_data = JSON.parse(post);
		encrypted = post_data.encrypted;
		aes_key = decrypt_aes_key(post_data.passphrase);
	} catch(e) {
		API_error("catch (parse + decrypt): " + e);
		res.end("error: " + e);
		return;
	}

	var API_answer = function (msg) {
		res.end(encrypt_query(msg, aes_key));
	};

	/**
	 * Decrypt AES-encrypted data and process the action
	 * Also check the certificate, cert.check will look if the action
	 * really requires one and checks it if it does.
	 */
	var query = decrypt_query(encrypted, aes_key, API_error, API_answer);
	cert.check(actions[name].cert, query.cert, ip, function () {
		try {
			actions[name].action(query.payload, API_answer, API_info, req);
		} catch(e) {
			API_error("catch (action): " + e);
			API_answer("error: " + e);
		}
	}, function () {
		API_error("incorrect certificate");
		API_answer("error: incorrect certificate");
	});
}

require("./misc.js")(register_action, register_action_cert);
require("./config.js")(register_action, register_action_cert);
require("./polling.js")(register_action, register_action_cert);
require("./students.js")(register_action, register_action_cert);
require("./transactions.js")(register_action, register_action_cert);

/**
 * Module export:
 * Function that gathers the action's POST data
 */
module.exports = function (name, req, res) {
	var POST = "";
	req.on("data", function (data) { POST += data; });
	req.on("end", function () {
		prepare_action(name, POST, req, res);
	});
};
