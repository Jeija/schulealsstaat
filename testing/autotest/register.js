/** Register Students automatically, random names etc. **/
var NUM_QUERIES = 10;

var prefix = process.argv[2];
var number_str = process.argv[3];
if (isNaN(number_str)) {
	console.log("Invalid command! Usage:");
	console.log("   node register.js <prefix>");
	console.log("   > prefix: qrid prefix, e.g. abcd");
	console.log("   > number: number of students to register");
	process.exit(1);
}
var number = parseInt(number_str);

var api = require("./api_autotest");
var i = 0;
var active_queries = 0;

function prefaceZeros (str, zeros) {
	return str.length < zeros ? prefaceZeros("0" + str, zeros) : str;
}

var interval = null;
function query() {
	if (active_queries >= NUM_QUERIES) return;
	active_queries++;
	i++;
	if (i > number && interval) {
		clearInterval(interval);
		return;
	}

	var qrid = prefix + prefaceZeros(i.toString(), 7);
	api.action_cert("register_student", {
		firstname : Math.random().toString(36).slice(2),
		lastname : Math.random().toString(36).slice(2),
		qrid : qrid,
		country : "de",
		birth : new Date(Date.now() - 600000000000 + Math.random() * 300000000000),
		sclass : "testing", subclass : "",
		password : qrid
	}, "registration_cert", function (res, servertime_ms) {
		active_queries--;
		console.log("Registered", qrid, ", answer was", res, ", took", servertime_ms, "ms");
	});
}
interval = setInterval(query, 2);
