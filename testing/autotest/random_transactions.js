var prefix = process.argv[2];
var number_str = process.argv[3];
var minimum_str = process.argv[4];
var maximum_str = process.argv[5];
var transactions_str = process.argv[6];

if (isNaN(transactions_str)) {
	console.log("Invalid command! Usage:");
	console.log("   node preload.js <prefix> <number> <minimum> <maximum> <transactions>");
	console.log("   > prefix: qrid prefix, e.g. abcd");
	console.log("   > number: number of students with that prefix");
	console.log("   > minimum: minimum HGC transaction value");
	console.log("   > maximum: maximum HGC transaction value");
	console.log("   > transactions: number of transactions to make");
	process.exit(1);
}

function prefaceZeros (str, zeros) {
	return str.length < zeros ? prefaceZeros("0" + str, zeros) : str;
}

var number = parseInt(number_str);
var minimum = parseFloat(minimum_str);
var maximum = parseFloat(maximum_str);
var transactions = parseInt(transactions_str);

console.log("Using prefix", prefix, "for", number, "students, transaction value between", minimum, "and", maximum);

var api = require("./api_autotest");
var NUM_QUERIES = 20;
var i = 0;
var active_queries = 0;

var interval = null;
function query() {
	if (active_queries >= NUM_QUERIES) return;
	active_queries++;
	i++;
	if (i > transactions && interval) {
		clearInterval(interval);
		return;
	}

	var sender_num = Math.floor(Math.random() * number + 1);
	var recipient_num = Math.floor(Math.random() * number + 1);
	var sender_qrid = prefix + prefaceZeros(sender_num.toString(), 7);
	var recipient_qrid = prefix + prefaceZeros(recipient_num.toString(), 7);
	var amount = parseFloat((Math.random() * (maximum - minimum) + minimum).toFixed(2));

	api.action_cert("transaction", {
		sender : sender_qrid,
		recipient : recipient_qrid,
		sender_password : sender_qrid, /* defined as such in register.js */
		amount_sent : amount,
		comment : "Testing: randomly generated transaction over " + amount + " HGC"
	}, "master_cert", function (res, servertime_ms) {
		console.log("Transaction from", sender_qrid, "to", recipient_qrid, "with gross value",
			amount.toFixed(2), ", answer was", res, ", took", servertime_ms, "ms");
		active_queries--;
	});
}
interval = setInterval(query, 2);
