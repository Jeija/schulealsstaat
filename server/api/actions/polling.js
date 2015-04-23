var log = require("../logging.js");
var db = require("../db");
var config = require("../config");
var common = require("./common.js");

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
 *	date : Number (milliseconds timestamp of last transaction, max. age: 5 minutes)
 *		if it is missing, date 5 minutes before is default
 * }
 *
 * response values:
 * an Array of objects	--> list of transactions since last refresh
 * invalid_qrid		--> the provided qrid doesn't exist
 * invalid_password	--> provided password was wrong
 */
register("transactions_poll", function (payload, answer, error, info) {
	db.students.getByQrid(payload.qrid, function (st) {
		if (!st) {
			answer("invalid_qrid");
			return;
		}

		if(!common.check_password(st, payload.password)) {
			answer("invalid_password");
			return;
		}

		var date = payload.date;
		var date_minimum = Date.now() - 1000 * config.get("poll_max_age", 60 * 5);
		if (!date || !Number.isFinite(date) || date < date_minimum) {
			date = date_minimum;
		}

		var idx = polls.push({
			answer : answer,
			info : info,
			date : date,
			qrid : payload.qrid
		});

		setTimeout(function () {
			answer({});
			info("timeout");
			delete polls[idx];
		}, config.get("poll_timeout", 30000));
	});
});

/**
 * Regularly update information on polls from database
 * That way, multiple API instances can use the same database and
 * send proper polling answers synchronously.
 */
function handleDbPollAnswer(tr, idx) {
	if (!tr || tr.length <= 0) return;
	if (!polls[idx]) return;
	polls[idx].answer(tr);
	polls[idx].info("found new transaction, replying");
	delete polls[idx];
}

setInterval(function () {
	// One database query for each polling client
	polls.forEach(function (p, idx) {
		var query = {
			time : { $gt : new Date(p.date) },
			"recipient.qrid" : p.qrid
		};

		db.transactions.getByProperties(query, config.get("poll_max", 5), function (tr) {
			handleDbPollAnswer(tr, idx);
		});
	});
}, config.get("poll_db_update_interval", 1000));

};
