var fs = require("fs");
var ursa = require("ursa");
var cert = require("../cert");
var sjcl = require("sjcl");
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

function decrypt_query(query_enc, aes_key) {
	return sjcl.decrypt(aes_key, query_enc);
}

function execute(name, req, res)
{
	// Given action is not registered
	if (!actions[name]) { res.end(); return; }

	var POST = "";
	req.on("data", function (data) { POST += data; });
	req.on("end", function () { try {
		var post_data = JSON.parse(POST);

		// Retrieve AES key from post_data
		var aes_key = decrypt_aes_key(post_data.passphrase);
		var query_str = decrypt_query(post_data.encrypted, aes_key);
		var query = JSON.parse(query_str);

		// Send AES-encrypted answer
		var on_answer = function (ans) {
			if (ans) res.end(sjcl.encrypt(aes_key, JSON.stringify(ans)));
		};

		if (actions[name].cert)
			cert.check(actions[name].cert, query.cert, function () {
				actions[name].action(query.payload, on_answer, req);
			}, function () {
				log.warn("API", name + ": incorrect certificate from "
					+ req.connection.remoteAddress);
				res.end("error: incorrect certificate");
			});
		else
			actions[name].action(query.payload, on_answer, req);
	} catch(e) {
		log.err("API", name + ": " + e);
		res.end("error: " + e);
	}});
}

require("./misc.js")(register_action, register_action_cert);
require("./config.js")(register_action, register_action_cert);
require("./students.js")(register_action, register_action_cert);
require("./transactions.js")(register_action, register_action_cert);

module.exports = {
	execute: execute
};
