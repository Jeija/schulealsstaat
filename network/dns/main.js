var dns = require("native-dns");
var server = dns.createServer();
var TTL = 180; // in seconds, here: 3 minutes

var lookup = require("./lookup.json");

if (process.env.USER != "root") {
	console.log("The DNS Server must be run as root, exiting.");
	return;
}

server.on("request", function (request, response) {
	for (var i = 0; i < request.question.length; i++) {
		var host = request.question[i].name;
		var address = lookup[host];
		if (!address) {
			console.log("[WARN] " + request.address.address + " requested " + host);
			address = lookup.__default;
		}
		console.log(request.address.address + ": " + host + "? --> " + address);
		response.answer.push(dns.A({
			name: host,
			address: address,
			ttl: TTL
		}));
	}
	response.send();
});
 
server.on("error", function (err, buff, req, res) {
	console.log(err.stack);
});

server.serve(53);
