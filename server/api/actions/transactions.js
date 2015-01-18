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

module.exports = function (register, register_cert) {
// #################### MONEY TRANSFER ####################
/**
 * registration_hash, master_hash --> spawn_money {
 *	amount : Number,
 *	recipient : String(QR-ID),
 *	comment : String
 * }
 * response values: "ok" or "error: <something>"
 */
register_cert("spawn_money", ["registration_hash", "master_hash"], function (payload, answer, req) {
	db.students.getByQrid(payload.recipient, function (st) {
		if (!st) {
			log.warn("API", "spawn_money: qrid not found, ignoring request");
			answer("error: QR ID not found, ignoring request");
			return;
		}
		st.balance = st.balance + payload.amount;

		var comment = "spawn_money";
		if ("comment" in payload) comment += " - " + payload.comment;
		var transaction = {
			sender : config.get("magic_account", "Zentralbank"),
			recipient : st.qrid,
			time : Date(),
			amount_sent : payload.amount,
			amount_received : payload.amount,
			amount_tax : 0,
			percent_tax : 0,
			comment : comment,
			sender_ip : req.connection.remoteAddress
		}

		db.transactions.add(transaction, function (dbtrans) {
			st.transactions.push(dbtrans._id);
			st.save();
			answer("ok");
		});
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
register_cert("destroy_money", ["registration_hash", "master_hash"], function (payload, answer, req) {
	db.students.getByQrid(payload.sender, function (st) {
		if (!st) {
			log.warn("API", "destroy_money: qrid not found, ignoring request");
			answer("error: QR ID not found, ignoring request");
			return;
		}

		// Log the transaction and perform it
		st.balance = st.balance - payload.amount;

		var comment = "spawn_money";
		if ("comment" in payload) comment += " - " + payload.comment;
		var transaction = {
			sender : st.qrid,
			recipient : config.get("magic_account", "LORD"),
			time : Date(),

			amount_sent : payload.amount,
			amount_received : payload.amount,
			amount_tax : 0,
			percent_tax : 0,
			comment : comment,
			sender_ip : req.connection.remoteAddress
		}

		db.transactions.add(transaction, function (dbtrans) {
			st.transactions.push(dbtrans._id);
			st.save();
			answer("ok");
		});
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
register("get_balance", function (payload, answer) {
	db.students.getByQrid(payload.qrid, function (st) {
		if (!st) {
			answer("invalid_qrid");
			return;
		}

		if(!payload.password || !common.check_password(st, payload.password)) {
			answer("invalid_password");
			return;
		}

		answer(String(st.balance));
	});
});

/**
 * get_last_transactions {
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
register("get_last_transactions", function (payload, answer) {
	db.students.getByQrid(payload.qrid, function (st) {
		if (!st) {
			answer("invalid_qrid");
			return;
		}

		if(!common.check_password(st, payload.password)) {
			answer("invalid_password");
			return;
		}

		db.transactions.getByIdList(st.transactions, function (tr) {
			if (payload.amount > 0)
				tr = tr.slice(Math.max(tr.length - payload.amount, 0));
			answer(tr);
		});
	});
});

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
register("transaction", function (payload, answer, req) {
	// Tax in %, amount_tax in HGC
	var tax = config.get("transaction_tax_percent", 0);

	// amount_received = net value in HGC, amount_sent = gross value in HGC,
	// amount_tax = tax_income in HGC
	var amount_tax = 0, amount_received = 0, amount_sent = 0;

	// Check comment length
	if ("comment" in payload) {
		if (payload.comment.length > config.get("tr_comment_maxlen", 300)) {
			answer("comment_too_long");
			return;
		}
	}

	// Get sender + recipient from DB
	var sender, recipient;
	flow.exec(function () {
		db.students.getByQrid(payload.sender, this);
	}, function (st) {
		if (!st) {
			answer("invalid_sender");
			return;
		}
		sender = st;
		db.students.getByQrid(payload.recipient, this);
	}, function (st) {
		if (!st) {
			answer("invalid_recipient");
			return;
		}
		recipient = st;

		// Check sender's password:
		if(!common.check_password(sender, payload.sender_password)) {
			answer("invalid_password");
			return;
		}

		// Check for over- or underspecification of transfer amount
		if ("amount_sent" in payload && "amount_received" in payload) {
			answer("overspecified");
			return;
		}

		if (!("amount_sent" in payload) && !("amount_received" in payload)) {
			answer("underspecified");
			return;
		}

		var tr_decplaces = config.get("hgc_tr_decimal_places", 2);

		/* Calculate amount to transfer with taxes */
		// Possibility 1 - amount_sent is specified
		if ("amount_sent" in payload) {
			if (typeof payload.amount_sent != "number" || isNaN(payload.amount_sent)
				|| !isFinite(payload.amount_sent)) {
				answer("error: invalid amount_sent");
				return;
			}

			if (payload.amount_sent <= 0) {
				answer("invalid_amount");
				return;
			}

			// Check if amount has more than hgc_tr_decimal_places decimals
			if ((payload.amount_sent * Math.pow(10, tr_decplaces)) % 1 != 0) {
				answer("too_many_decplaces");
				return;
			}

			amount_sent = HGC_round(payload.amount_sent);
			amount_received = HGC_round(amount_sent / (1 + tax / 100));
		}

		// Possibility 2 - amount_received is specified
		if ("amount_received" in payload) {
			if (typeof payload.amount_received != "number"
				|| isNaN(payload.amount_received)
				|| !isFinite(payload.amount_received)) {
				answer("error: invalid amount_received");
				return;
			}

			if (payload.amount_received <= 0) {
				answer("invalid_amount");
				return;
			}

			// Check if amount has more than hgc_tr_decimal_places decimals
			if ((payload.amount_sent * Math.pow(10, tr_decplaces)) % 1 != 0) {
				answer("too_many_decplaces");
				return;
			}

			amount_received = HGC_round(payload.amount_received);
			amount_sent = HGC_round((1 + tax / 100) * amount_received);
		}
		amount_tax = HGC_round(amount_sent - amount_received);

		// Check if sender still has enough money on his account
		if (sender.balance < amount_sent) {
			answer("nomoney");
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
		if ("comment" in payload) transaction.comment = payload.comment;

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
				answer("ok");
			});
		});

		log.info("BANK", "Transaction from " + sender.firstname + " "
			+ sender.lastname + " to " + recipient.firstname + " "
			+ recipient.lastname + ", with net value " + amount_received
			+ " HGC, tax income is " + amount_tax + " HGC.");
	});
});

} // module.exports
