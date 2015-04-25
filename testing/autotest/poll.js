var prefix = process.argv[2];
var number_str = process.argv[3];

if (isNaN(number_str)) {
	console.log("Invalid command! Usage:");
	console.log("   node poll.js <prefix> <number>");
	console.log("   > prefix: qrid prefix, e.g. abcd");
	console.log("   > number: number of students with that prefix");
	process.exit(1);
}

function prefaceZeros (str, zeros) {
	return str.length < zeros ? prefaceZeros("0" + str, zeros) : str;
}

var number = parseInt(number_str);

console.log("Using prefix", prefix, "for", number, "students");

var api = require("./api_autotest");
var answers_received = 0;

function pollForever(i, last_date) {
	var qrid = prefix + prefaceZeros(i.toString(), 7);

	api.action("transactions_poll", {
		qrid : qrid,
		password : qrid, /* defined as such in register.js */
		date : last_date
	}, function (res, servertime_ms) {
		var res_readable = res;
		if (typeof res == "object" && res.length > 0) {
			answers_received += res.length;
			res_readable = "object of length " + res.length;
		}
		console.log("Poll for", qrid + ", answer was", res_readable);
		var transtime = null;
		if (res && res[0]) transtime = res[0].time;
		pollForever(i, transtime ?  new Date().getTime(transtime) : last_date);
	});
}

for (var i = 1; i < number + 1; i++) pollForever(i, 0);
setInterval(function () {
	console.log("Status:", answers_received, "positive answers/transactions received so far");
}, 1000);
