var settings = require("../settings");
var config = require("../config");
var common = require("./common");
var log = require("../logging");
var db = require("../db");

module.exports = function (register, register_cert) {

/**
 * Active poll requests, an array with objects of the schema:
 * {
 *	answer : answer object,
 *	info : info object,
 *	date : timestamp the client reports for the last information,
 *	qrid : QR-ID of polling client
 * }
 */
var polls = [];

/**
 * Long Polling for new incoming transactions
 * transactions_poll {
 *	qrid : String (QR-ID of polling recipient),
 *	password : String (password of recipient),
 *	date : Number (milliseconds timestamp of last transaction)
 * }
 *
 * response values:
 * an Array of objects	--> list of transactions since last refresh
 * invalid_qrid		--> the provided qrid doesn't exist
 * invalid_password	--> provided password was wrong
 * invalid_date		--> provided date cannot be interpreted as a JS timestamp
 */
register("transactions_poll", function (payload, answer, info) {
	db.students.getCertainByQridLean(payload.qrid, {
		_id : 1,
		pwdhash : 1,
		pwdsalt : 1
	}, answer, function (st) {
		if (!st) {
			answer("invalid_qrid");
			return;
		}

		if(!common.check_password(st, payload.password)) {
			answer("invalid_password");
			return;
		}

		if (!("date" in payload) || isNaN(payload.date) || !Number.isFinite(payload.date)) {
			answer("invalid_date");
			return;
		}

		info("polling " + payload.qrid);
		var idx = polls.push({
			answer : answer,
			info : info,
			date : payload.date,
			qrid : payload.qrid
		}) - 1;

		setTimeout(function () {
			if (!polls[idx]) return;
			info("timeout " + payload.qrid);
			answer({});
			delete polls[idx];
		}, config.get("poll_timeout"));
	});
});

/**
 * Regularly update information on polls from database
 * That way, multiple API instances can use the same database and
 * send proper polling answers synchronously.
 */
function handleDbPollAnswer(trgroup, idx) {
	if (!polls[idx]) return;
	polls[idx].answer(trgroup);
	polls[idx].info("found new transaction, replying to " + polls[idx].qrid);
	delete polls[idx];
}

setInterval(function () {
	if (polls.length == 0) return;

	// One database query for every polling client on this worker
	var qrid_to_index = {};
	var query = { $or : [] };

	polls.forEach(function (p, idx) {
		query.$or.push({
			time : { $gt : new Date(p.date) },
			"recipient.qrid" : p.qrid
		});
		qrid_to_index[p.qrid] = idx;
	});

	// DB connection currently closed
	if (!db.transactions) return;

	if (query.$or.length == 0) return;
	db.transactions.getByProperties(query, config.get("poll_max"), function () {
		// don't answer db errors to polling clients
	}, function (trlist) {
		// Group transactions per-qrid (to answer in bulk later on)
		var groups = {};
		trlist.forEach(function (tr) {
			if (!groups[tr.recipient.qrid]) groups[tr.recipient.qrid] = [];
			groups[tr.recipient.qrid].push(tr);
		});

		for (qrid in groups) {
			handleDbPollAnswer(groups[qrid], qrid_to_index[qrid]);
		};
	});
}, settings.poll_db_update_interval);

};
