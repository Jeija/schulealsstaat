var TCPPORT = 1337;

var log = require("./logging.js");
var http = require("http");
var actions = require("./actions");

// Use requests as follows:
// [IP]:[TCPPORT]/action/[ACTIONNAME]/?data=[PARAMETERS]
// for instance (mind that the JSON must be encoded, ignored here for readability):
// 192.168.0.50:1337/action/student_checkin/data={qrid : 123456}
// [ACTIONNAME] is the name of the action registered via register([ACTION_NAME], function() {})
// in actions/*.js
http.createServer(function (req, res) {
	res.writeHead(200, {'Content-Type': 'text/plain', 'Access-Control-Allow-Origin' : '*'});

	// Parse HTTP query
	var fragments = req.url.substring(1).split("/");
	var query = fragments.splice(0, 2);
	query.push(fragments.join('/'));
	if (query[2]) query[2] = query[2].replace("?data=", "");

	try {
		query[2] = decodeURIComponent(query[2]);
	} catch (e) {
		console.log("[ERROR] decodeURIComponent failed, ignoring");
		res.end("invalid argument");
		return;
	}

	if (!(query[0] == "action" && actions.execute(query[1], query[2], res, req)))
		res.end();
}).listen(TCPPORT);

log.ok("NodeJS", "Server started");
log.info("NodeJS", "listening at port " + TCPPORT);
