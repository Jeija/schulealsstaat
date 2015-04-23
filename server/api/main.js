var TCPPORT = 1230;

var log = require("./logging.js");
var cluster = require("cluster");
var http = require("http");
var os = require("os");

/**
 * ### API multi-process cluster ###
 * This program runs multiple instances of the API server, one per CPU core.
 * Workers will pick API requests and perform database queries asynchronously.
 * Since critical database data (such as transactions) are only added and never
 * modified, relevant data will be consistent nevertheless.
 */

/**
 * ### API request Format ###
 * [IP]:[TCPPORT]/action/[ACTIONNAME], for instance:
 * 192.168.0.50:1230/action/student_checkin
 * [ACTIONNAME] is the name of the action registered via register([ACTION_NAME], function() {})
 * in actions/*.js
 *
 * Before requesting you may want to call [IP]:[TCPPORT]/ping, which answers with a 204 HTTP
 * status code if the API server is online.
 *
 * The API uses a form of hybrid encryption with AES for symmetric operations and RSA for keypairs.
 * POST data must be a JSON that consists of the following:
 * {
 *	passphrase : String, -- the RSA-encrypted AES key which encrypts the "encrypted"
				element and that can can be used for encrypted responses
 *	encrypted : { -- AES-Encrypted (by sjcl) object with passphrase
 *		payload : [anything], -- the actual parameters for the given (by URL) action
 *		cert : String -- authentication certificate to authorize the action (optional)
 *	}
 * }
 */

var nCPU = os.cpus().length;

// Master: Spawn workers
if (cluster.isMaster) {
	log.info("Master", "Detected " + nCPU + " CPU cores, spawning workers");
	for (var i = 0; i < nCPU; i++) cluster.fork();
	cluster.on("exit", function (worker, code, signal) {
		log.err("Master", "Worker " + worker.process.pid + " exited with " + signal + "!");
	});
	log.ok("Master", "All workers spawned!");

// Worker: Run API server on shared TCP socket
} else {
	var actions = require("./actions");

	log.ok("Worker", "(" + process.pid + ") Process Created!");
	http.createServer(function (req, res) {
		// Parse HTTP query
		var fragments = req.url.substring(1).split("/");
		var query = fragments.splice(0, 2);
		query.push(fragments.join('/'));

		if (query[0] == "ping") {
			res.writeHead(204, {"Access-Control-Allow-Origin" : "*"});
			res.end();
		} else if (query[0] == "action") {
			res.writeHead(200, {"Content-Type": "text/plain",
				"Access-Control-Allow-Origin" : "*"});
			if (req.method == "POST") {
				actions(query[1], req, res);
			} else {
				// Propably a CORS preflight
				res.end();
			}
		} else {
			// empty answer, but with Access-Control-Allow-Origin: *
			res.writeHead(200, {"Content-Type": "text/plain",
				"Access-Control-Allow-Origin" : "*"});
			res.end();
		}
	}).listen(TCPPORT);
	log.ok("Worker", "(" + process.pid + ") Listening on shared TCP Port " + TCPPORT);
}
