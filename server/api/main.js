var TCPPORT = 1337;

var http = require("http");
var log = require("./logging.js");
var actions = require("./actions");


/**
 * Use requests as follows:
 * [IP]:[TCPPORT]/action/[ACTIONNAME], for instance:
 * 192.168.0.50:1337/action/student_checkin
 * [ACTIONNAME] is the name of the action registered via register([ACTION_NAME], function() {})
 * in actions/*.js
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
http.createServer(function (req, res) {
	res.writeHead(200, {'Content-Type': 'text/plain', 'Access-Control-Allow-Origin' : '*'});

	// Parse HTTP query
	var fragments = req.url.substring(1).split("/");
	var query = fragments.splice(0, 2);
	query.push(fragments.join('/'));

	if (query[0] == "action") actions.execute(query[1], req, res);
}).listen(TCPPORT);

log.ok("NodeJS", "Server started");
log.info("NodeJS", "listening at port " + TCPPORT);
