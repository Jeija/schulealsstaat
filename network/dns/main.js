var dns = require("native-dns");
var log = require("./logging");
var najax = require("najax");
var server = dns.createServer();
var TTL = 30; // in seconds (here 30s, for failover to work)
var FAILOVER_PING_INTERVAL = 3; // in seconds

var lookup = require("./lookup.json");

if (process.env.USER != "root") {
	console.log("The DNS Server must be run as root, exiting.");
	return;
}

/**
 * Failover / load balancing system used for this URL
 * If a DNS entry is not an IP address string, but an object consisting of multiple
 * ip addresses as keys and probe URLs as values, perform a heartbeat HTTP request
 * to each of those URLs to see if they're working properly. They must return a
 * HTTP status code of 204 to be tested successfully.
 *
 * Working IPs are inside a "working" array in the lookup object.
 */
function heartbeat_probe(url, ip, name) {
	najax.get("http://" + ip + url).success(function () {
		if (!lookup[name].working[ip]) {
			log.ok("PROBE", "Server " + ip + " for " + name + " is online, url is " + url);
			lookup[name].working[ip] = true;
		}
	}).error(function () {
		if (lookup[name].working[ip] || lookup[name].working[ip] === undefined) {
			log.err("PROBE", "Server " + ip + " for " + name + " is offline, url is " + url);
			lookup[name].working[ip] = false;
		}
	});
}

function failover_heartbeat () {
	for (var name in lookup) {
		var entry = lookup[name];
		if (typeof entry !== "object") return;
		if (!("working" in entry)) entry.working = {};
		for (var ip in entry.failover) {
			var url = entry.failover[ip];
			heartbeat_probe(url, ip, name);
		}
	}
}

function failover_address (address) {
	var trueworking = [];
	for (var ip in address.working)
		if (address.working[ip]) trueworking.push(ip);
	var poolsize = trueworking.length;
	if (poolsize === 0) return null;
	return trueworking[Math.floor(Math.random() * trueworking.length)];
}

failover_heartbeat();
setInterval(failover_heartbeat, FAILOVER_PING_INTERVAL * 1000);

server.on("request", function (request, response) {
	for (var i = 0; i < request.question.length; i++) {
		var host = request.question[i].name;
		var address = lookup[host];
		if (!address) address = lookup.__default;
		if (typeof address == "object") address = failover_address(address);
		if (!address) {
			log.warn("REQUE", "Failover / Balancing pool for " + host + " is empty!");
			return;
		}

		log.info("REQUE", request.address.address + ": " + host + " : " + address);
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
