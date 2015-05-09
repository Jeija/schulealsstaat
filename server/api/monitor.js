var settings = require("./settings");
var cluster = require("cluster");
var log = require("./logging");

// Action names not to collect data on
var blacklist = [
	"transactions_poll"
];

/**
 * perfdata: A list of per-request objects that contains relevant data on API performance
 * {
 *	<random index> : {
 *		begin : Timestamp,
 *		after_decrypt : Timestamp,
 *		after_action : Timestamp,
 *		end : Timestamp
 *	}
 * }
 */
var perfdata = [];
var n_req = 0;

/**
 * Master code:
 * Collect all statistics that are sent by workers and regularly
 * print overall API performance reports.
 */
if (cluster.isMaster) {
	module.exports = function (worker) {
		worker.on("message", function (msg) {
			if (msg.type == "req_begin") {
				n_req++;
				perfdata[msg.id] = { begin : Date.now() };
				setTimeout(function () {
					delete perfdata[msg.id];
				}, settings.report_deprecate);
			} else if (msg.type == "req_after_decrypt") {
				perfdata[msg.id].after_decrypt = Date.now();
			} else if (msg.type == "req_after_action") {
				perfdata[msg.id].after_action = Date.now();
			} else if (msg.type == "req_end") {
				perfdata[msg.id].end = Date.now();
			}
		});
	};

	setInterval(function () {
		// Determine which requests have been answered and which are pending
		var finished = [];
		var pending = [];
		var i;

		for (i in perfdata) {
			if (perfdata[i] && perfdata[i].end) finished.push(perfdata[i]);
			if (perfdata[i] && !perfdata[i].end) pending.push(perfdata[i]);
		}

		// Calculate some nice stats
		var total_worktime = 0;
		for (i = 0; i < finished.length; i++)
			total_worktime += finished[i].end - finished[i].begin;

		var mean_api_res_time = total_worktime / finished.length;
		var n_pending = pending.length;
		var pending_decrypt = 0, pending_action = 0, pending_encrypt = 0;
		var total_pending_since = 0;

		for (i = 0; i < pending.length; i++) {
			if (pending[i].begin && !pending[i].after_decrypt) pending_decrypt++;
			if (pending[i].after_decrypt && !pending[i].after_action) pending_action++;
			if (pending[i].after_action && !pending[i].end) pending_encrypt++;
			total_pending_since += Date.now() - pending.begin;
		}

		var mean_pending_time = total_pending_since / n_pending;

		// Report stats to console
		log.info("STATS", "Performance report, data since " +
			settings.report_deprecate / 1000 + "s");
		log.info("STATS", "New requests in the last " + settings.report_interval / 1000 +
			"s: " + n_req);
		log.info("STATS", "Mean API response time: " +
			mean_api_res_time.toFixed(2) + "ms");
		log.info("STATS", "Total API activity time: " +
			total_worktime.toFixed(2) + "ms");
		log.info("STATS", "Mean time in pending state: " +
			mean_pending_time.toFixed(2) + "ms");
		log.info("STATS", "Number of pending actions: " + n_pending);
		log.info("STATS", "Pending in decryption state: " + pending_decrypt);
		log.info("STATS", "Pending in action state: " + pending_action);
		log.info("STATS", "Pending in encryption / send state: " + pending_encrypt);

		n_req = 0;
	}, settings.report_interval);

/**
 * Worker code:
 * Provide functions to send updates on worker performance to the master
 */
} else {
	var count = 0;

	module.exports = {};
	module.exports.req_begin = function (name) {
		if (blacklist.indexOf(name) > -1) return;
		var id = process.pid + "_" + count++;

		process.send({
			type : "req_begin",
			id : id
		});

		return id;
	};

	module.exports.req_after_decrypt = function (id, name) {
		if (blacklist.indexOf(name) > -1) return;
		process.send({
			type : "req_after_decrypt",
			id : id
		});
	};

	module.exports.req_after_action = function (id, name) {
		if (blacklist.indexOf(name) > -1) return;
		process.send({
			type : "req_after_action",
			id : id
		});
	};

	module.exports.req_end = function (id, name) {
		if (blacklist.indexOf(name) > -1) return;
		process.send({
			type : "req_end",
			id : id
		});
	};
}
