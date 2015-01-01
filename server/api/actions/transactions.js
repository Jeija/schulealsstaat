var log = require("../logging.js");
var db = require("../db");
var cert = require("../cert");
var config = require("../config");
var flow = require("flow");
var common = require("./common.js");

// Round a currency value
function HGC_round(value) {
	var decplaces = config.get("hgc_decimal_places", 5);
	return Math.round(value * Math.pow(10, decplaces)) / Math.pow(10, decplaces);
}

module.exports = function (register) {
// #################### MONEY TRANSFER ####################
/**
 * registration_hash, master_hash --> spawn_money {
 *	amount : Number,
 *	recipient : String(QR-ID),
 *	comment : String
 * }
 * response values: "ok" or "error: <something>"
 */
register("spawn_money", function (arg, res, req) {
	cert.check(["registration_hash", "master_hash"], req, function () {
		try {
			var data = JSON.parse(arg);
			db.students.getByQrid(data.recipient, function (st) {
				if (!st) {
					log.warn("API", "spawn_money: qrid not found,\
						ignoring request");
					res.end("error: QR ID not found, ignoring request");
					return;
				}
				st.balance = st.balance + data.amount;

				var comment = "spawn_money";
				if ("comment" in data) comment += " - " + data.comment;
				var transaction = {
					sender : config.get("magic_account", "LORD"),
					recipient : st.qrid,
					time : Date(),

					amount_sent : data.amount,
					amount_received : data.amount,
					amount_tax : 0,
					percent_tax : 0,
					comment : comment,
					sender_ip : req.connection.remoteAddress
				}

				db.transactions.add(transaction, function (dbtrans) {
					st.transactions.push(dbtrans._id);
					st.save();
					res.end("ok");
				});
			});
		} catch (e) {
			log.err("API", "spawn_money failed " + e);
			res.end("error: " + e);
		}
	});
});

/**
 * registration_hash, master_hash --> destroy_money {
 *	amount : Number,
 *	sender : String(QR-ID),
 *	comment : String
 * }
 * response values: "ok" or "error: <something>"
 */
register("destroy_money", function (arg, res, req) {
	cert.check(["registration_hash", "master_hash"], req, function () {
		try {
			var data = JSON.parse(arg);
			db.students.getByQrid(data.sender, function (st) {
				if (!st) {
					log.warn("API", "destroy_money: qrid not found,\
						ignoring request");
					res.end("error: QR ID not found, ignoring request");
					return;
				}

				// Log the transaction and perform it
				st.balance = st.balance - data.amount;

				var comment = "spawn_money";
				if ("comment" in data) comment += " - " + data.comment;
				var transaction = {
					sender : st.qrid,
					recipient : config.get("magic_account", "LORD"),
					time : Date(),

					amount_sent : data.amount,
					amount_received : data.amount,
					amount_tax : 0,
					percent_tax : 0,
					comment : comment,
					sender_ip : req.connection.remoteAddress
				}

				db.transactions.add(transaction, function (dbtrans) {
					st.transactions.push(dbtrans._id);
					st.save();
					res.end("ok");
				});
			});
		} catch (e) {
			log.err("API", "destroy_money failed " + e);
			res.end("error: " + e);
		}
	});
});

/**
 * get_balance {
 *	qrid : String(QR-ID),
 *	password : String
 * }
 *
 * respone values:
 * a Number (in String)	--> balance of the person with qrid if password was correct
 * invalid_qrid		--> the provided qrid doesn't exist
 * invalid_password	--> provided password was wrong
 * error:<something>	--> Some other error, e.g. with JSON parsing
 */
register("get_balance", function (arg, res, req) { try {
	var data = JSON.parse(arg);
	db.students.getByQrid(data.qrid, function (st) {
		if (!st) {
			res.end("invalid_qrid");
			return;
		}

		if(!common.check_password(st, data.password)) {
			res.end("invalid_password");
			return;
		}

		res.end(String(st.balance));
	});
} catch(e) {
	log.err("API", "get_balance failed " + e);
	res.end("error: " + e);
}});

/**
 * get_all_transactions {
 *	qrid : String(QR-ID),
 *	password : String,
 *	amount : Number (returns <amount> last transactions or all transactions if amount <= 0)
 * }
 *
 * respone values:
 * Array		--> transactions of the person with qrid if password was correct
 *			--> Form: [{
 *				sender : String,
 *				recipient : String,
 *				time : Date,
 *				amount_sent : Number,
 *				amount_received : Number,
 *				amount_tax : Number,
 *				percent_tax : Number,
 *				comment : String,
 *				NOT: sender_ip
 * invalid_qrid		--> the provided qrid doesn't exist
 * invalid_password	--> provided password was wrong
 * error:<something>	--> Some other error, e.g. with JSON parsing
 */
register("get_last_transactions", function (arg, res, req) { try {
	var data = JSON.parse(arg);
	db.students.getByQrid(data.qrid, function (st) {
		if (!st) {
			res.end("invalid_qrid");
			return;
		}

		if(!common.check_password(st, data.password)) {
			res.end("invalid_password");
			return;
		}

		db.transactions.getByIdList(st.transactions, function (tr) {
			if (data.amount > 0)
				tr = tr.slice(Math.max(tr.length - data.amount, 1));
			res.end(JSON.stringify(tr));
		});
	});
} catch(e) {
	log.err("API", "get_last_transactions failed " + e);
	res.end("error: " + e);
}});

/**
 * transaction {
 *	sender : String (QR-ID),
 *	sender_password : String,
 *	recipient : String (QR-ID),
 *	Either provide:
 *	amount_sent : Number, OR amount_received : Number,
 *	comment : String(max. 300 characters)
 * }
 *
 * response values:
 * ok			--> Transaction succesfully completed
 * nomoney		--> Sender does not have enough money to pay for the transaction
 * invalid_password	--> Sender password is invalid
 * comment_too_long	--> comment is over 300 chars
 * invalid_sender	--> Sender QR-ID is invalid
 * invalid_recipient	--> Recipient QR-ID is invalid
 * overspecified	--> Both amount_sent and amount_received are specified
 * underspecified	--> Neither amount_sent or amount_received are specified
 * invalid_amount	--> Amount is not > 0
 * too_many_decplaces	--> Amount has more decimal places than hgc_tr_decimal_places allows
 * error:<something>	--> Some other error, e.g. with JSON parsing
 */
register("transaction", function (arg, res, req) { try {
	var data = JSON.parse(arg);

	// Tax in %, amount_tax in HGC
	var tax = config.get("transaction_tax_percent", 0);

	// amount_received = net value in HGC, amount_sent = gross value in HGC,
	// amount_tax = tax_income in HGC
	var amount_tax = 0, amount_received = 0, amount_sent = 0;

	// Check comment length
	if ("comment" in data) {
		if (data.comment.length > config.get("tr_comment_maxlen", 300)) {
			res.end("comment_too_long");
			return;
		}
	}

	// Get sender + recipient from DB
	var sender, recipient;
	flow.exec(function () {
		db.students.getByQrid(data.sender, this);
	}, function (st) {
		if (!st) {
			res.end("invalid_sender");
			return;
		}
		sender = st;
		db.students.getByQrid(data.recipient, this);
	}, function (st) {
		if (!st) {
			res.end("invalid_recipient");
			return;
		}
		recipient = st;

		// Check sender's password:
		if(!common.check_password(sender, data.sender_password)) {
			res.end("invalid_password");
			return;
		}

		// Check for over- or underspecification of transfer amount
		if ("amount_sent" in data && "amount_received" in data) {
			res.end("overspecified");
			return;
		}

		if (!("amount_sent" in data) && !("amount_received" in data)) {
			res.end("underspecified");
			return;
		}

		var tr_decplaces = config.get("hgc_tr_decimal_places", 2);

		/* Calculate amount to transfer with taxes */
		// Possibility 1 - amount_sent is specified
		if ("amount_sent" in data) {
			if (typeof data.amount_sent != "number" || isNaN(data.amount_sent)
				|| !isFinite(data.amount_sent)) {
				res.end("error: invalid amount_sent");
				return;
			}

			if (data.amount_sent <= 0) {
				res.end("invalid_amount");
				return;
			}

			// Check if amount has more than hgc_tr_decimal_places decimals
			if ((data.amount_sent * Math.pow(10, tr_decplaces)) % 1 != 0) {
				res.end("too_many_decplaces");
				return;
			}

			amount_sent = HGC_round(data.amount_sent);
			amount_received = HGC_round(amount_sent / (1 + tax / 100));
		}

		// Possibility 2 - amount_received is specified
		if ("amount_received" in data) {
			if (typeof data.amount_received != "number" || isNaN(data.amount_received) ||
				!isFinite(data.amount_received)) {
				res.end("error: invalid amount_received");
				return;
			}

			if (data.amount_received <= 0) {
				res.end("invalid_amount");
				return;
			}

			// Check if amount has more than hgc_tr_decimal_places decimals
			if ((data.amount_sent * Math.pow(10, tr_decplaces)) % 1 != 0) {
				res.end("too_many_decplaces");
				return;
			}

			amount_received = HGC_round(data.amount_received);
			amount_sent = HGC_round((1 + tax / 100) * amount_received);
		}
		amount_tax = HGC_round(amount_sent - amount_received);

		// Check if sender still has enough money on his account
		if (sender.balance < amount_sent) {
			res.end("nomoney");
			return;
		}

		// Pre-generate transaction DB entry
		var transaction = {
			sender : sender.qrid,
			recipient : recipient.qrid,
			time : Date(),

			amount_sent : amount_sent,
			amount_received : amount_received,
			amount_tax : amount_tax,
			percent_tax : tax,
			sender_ip : req.connection.remoteAddress
		}
		if ("comment" in data) transaction.comment = data.comment;

		// Actual transaction and collect tax income
		sender.balance -= amount_sent;
		recipient.balance += amount_received;
		db.students.getByQrid(config.get("taxinc_qrid", "taxinc"),
		function (tic) {
			if (!tic) {
				log.err("BANK", "Tax income account not found, discarding " 
					+ "income of " + amount_tax + " HGC.");
			} else {
				tic.balance += amount_tax;
				tic.save();
			}

			db.transactions.add(transaction, function (dbtrans) {
				sender.transactions.push(dbtrans._id);
				recipient.transactions.push(dbtrans._id);
				sender.save();
				recipient.save();
				res.end("ok");
			});
		});

		log.info("BANK", "Transaction from " + sender.firstname + " "
			+ sender.lastname + " to " + recipient.firstname + " "
			+ recipient.lastname + ", with net value " + amount_received
			+ " HGC, tax income is " + amount_tax + " HGC.");
	}); } catch (e) {
		log.err("API", "transaction failed " + e);
		res.end("error: " + e);
	}
});

} // module.exports
