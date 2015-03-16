// TODO: Use proper server URLs
var USER_SERVER = "http://api.saeu";
var PROXY_SERVER = "http://centralbank.eu";
var USER_PORT = 1230;
var PROXY_PORT = 1381;

var fs = require("fs");
var path = require("path");
var http = require("http");
var najax = require("najax");

var log = require("./logging");

// Load certificate from file
var cert = fs.readFileSync(path.join(__dirname, "cert", "proxy_cert")).toString();

// Send request to 'real' intranet server
function postUserRequest(req, cb) {
	najax.post({
		url : USER_SERVER + ":" + USER_PORT + "/action/" + req.action,
		data : req.request,
		contentType : "raw"
	}).success(function (res) {
		log.info("postUserRequest", "Got intranet server response");
		cb(res);
	});
}

// Send user server to internet proxy server
function postUserResponse(res, id) {
	var POST = { cert : cert, payload : res };
	najax.post({
		url : PROXY_SERVER + ":" + PROXY_PORT + "/putResponse/" + id,
		data : POST,
		contentType : "json"
	}).success(function (err) {
		if (err != "ok") {
			log.err("putResponse", "Internet proxy didn't answer 'ok', but " + err);
		} else {
			log.info("putResponse", "Forwarded request with ID " + id + " succesfully");
		}
	});
}

setInterval(function () {
	var POST = { cert : cert };
	var options = {
		url : PROXY_SERVER + ":" + PROXY_PORT + "/getActions",
		data : POST,
		contentType : "json"
	};

	// Get requests and execute them
	najax.post(options).success(function (requests_str) {
		var requests = JSON.parse(requests_str);
		for (var id in requests) {
			req = requests[id];
			log.info("postUserRequest", "Processing request with ID " + id);
			postUserRequest(req, function (res) {
				postUserResponse(res, id);
			});
		}
	});
}, 100);
