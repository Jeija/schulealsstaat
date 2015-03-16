var USER_PORT = 443;
var PROXY_PORT = 1381;

var http = require("http");
var cert = require("./cert");
var log = require("./logging");
var requests = {};
var responses = {};
var id = 0;

/*** USER-SIDE SERVER ***/
http.createServer(function (req, res) {
	// Parse HTTP query
	var fragments = req.url.substring(1).split("/");
	var url_components = fragments.splice(0, 2);
	url_components.push(fragments.join('/'));

	if (url_components[0] == "ping") {
		// Answer PING requests immediately
		res.writeHead(204, {"Access-Control-Allow-Origin" : "*"});
		res.end();
		return;
	} else if (url_components[0] == "action") {
		// Store ACTION requests in 'requests'
		res.writeHead(200, {"Content-Type": "text/plain",
			"Access-Control-Allow-Origin" : "*"});
		var POST = "";
		req.on("data", function (data) { POST += data; });
		req.on("end", function () {
			responses[id] = res;
			requests[id] = {
				action : url_components[1],
				request : POST
			};
			log.info("ADD", "New request in query, ID is " + id);
			id++;
		});
	} else {
		// empty answer, but with Access-Control-Allow-Origin: *
		res.writeHead(200, {"Content-Type": "text/plain",
			"Access-Control-Allow-Origin" : "*"});
		res.end();
	}
}).listen(USER_PORT);

log.ok("USER", "Server started");
log.info("USER", "Listening at port " + USER_PORT);


/*** PROXYCLIENT-SIDE SERVER ***/
http.createServer(function (req, res) {
	res.writeHead(200, {'Content-Type': 'text/plain', 'Access-Control-Allow-Origin' : '*'});

	// Parse HTTP query
	var fragments = req.url.substring(1).split("/");
	var url_components = fragments.splice(0, 2);
	url_components.push(fragments.join('/'));

	var POST = "";
	req.on("data", function (data) { POST += data; });
	req.on("end", function () {
		var query, payload, givencert;
		try {
			query = JSON.parse(POST);
			payload = "payload" in query ? query.payload : null;
			givencert = "cert" in query ? query.cert : null;
		} catch(e) {
			log.warn("PROXY", "JSON.parse(POST) failed with " + e);
			return;
		}

		cert.check(["proxy_hash"], givencert, req.connection.remoteAddress, function () {
			// Respond with 'requests' to getActions requests
			if (url_components[0] == "getActions") {
				res.end(JSON.stringify(requests));
				requests = {};
			}

			// Send client answer on putResponse requests
			if (url_components[0] == "putResponse") {
				var id = url_components[1];
				log.info("putResponse", "Request with ID " + id + " finished!");
				var user_res = responses[id];
				if (user_res) {
					user_res.end(payload);
					res.end("ok");
				} else {
					res.end("error: already answered");
				}
			}
		});
	});
}).listen(PROXY_PORT);

log.ok("PROXY", "Server started");
log.info("PROXY", "Listening at port " + PROXY_PORT);
