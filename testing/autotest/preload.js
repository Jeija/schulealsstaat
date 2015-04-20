var prefix = process.argv[2];
var number_str = process.argv[3];
var money_str = process.argv[4];

if (isNaN(money_str)) {
	console.log("Invalid command! Usage:");
	console.log("   node preload.js <prefix> <number> <money>");
	console.log("   > prefix: qrid prefix, e.g. abcd");
	console.log("   > number: number of students with that prefix");
	console.log("   > money: amount of HGC to preload for each student");
	process.exit(1);
}

function prefaceZeros (str, zeros) {
	return str.length < zeros ? prefaceZeros("0" + str, zeros) : str;
}

var number = parseInt(number_str);
var money = parseInt(money_str);

console.log("Using prefix", prefix, "for", number, "students, preloading", money, "HGC each.");

var api = require("./api_autotest");
var NUM_QUERIES = 10;
var i = 0;
var active_queries = 0;

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
	api.action_cert("spawn_money", {
		amount : money,
		recipient : qrid,
		comment : "Testing: preloading money for a range of students"
	}, "master_cert", function (res, servertime_ms) {
		console.log("Preloaded", qrid, ", answer was", res, ", took", servertime_ms, "ms");
		active_queries--;
	});
}
interval = setInterval(query, 2);
