/** Register Students automatically, random names etc. **/
var NUM_QUERIES = 10;

var prefix = process.argv[2];
var number_str = process.argv[3];
var interval_str = process.argv[4];
if (isNaN(interval_str)) {
	console.log("Invalid command! Usage:");
	console.log("   node register.js <prefix> <number> <interval>");
	console.log("   > prefix: qrid prefix, e.g. abcd");
	console.log("   > number: number of students");
	console.log("   > interval: interval in which checkins/checkouts are performed (ms)");
	process.exit(1);
}
var number = parseInt(number_str);
var interval = parseInt(interval_str);

var api = require("./api_autotest");
var i = 0;

function prefaceZeros (str, zeros) {
	return str.length < zeros ? prefaceZeros("0" + str, zeros) : str;
}

function query() {
	i++;
	var qrid = prefix + prefaceZeros(Math.floor(Math.random() * number + 1).toString(), 7);
	var type = Math.random() < 0.5 ? "ec_checkin" : "ec_checkout";
	api.action_cert(type, qrid, "admin_cert", function (res, servertime_ms) {
		console.log("[" + i + "]", type, qrid, ", answer was", res,
			", took", servertime_ms, "ms");
	});
}
setInterval(query, interval);
