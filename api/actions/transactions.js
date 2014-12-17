var log = require("../logging.js");
var db = require("../db");
var cert = require("../cert");
var config = require("../config");
var crypto = require("crypto");
var flow = require("flow");

/**
 * Check a given password for a student
 * \param st The database entry for the student
 * \param pwd The provided password to check
 * \return True, if password is correct, otherwise false
 */
function check_password(st, pwd) {
	return (crypto.createHash("sha256").update(pwd + st.pwdsalt).digest("hex") == st.pwdhash);
}

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
 * error:<something>	--> Some other error, propably with parameter
 */
register("transaction", function (arg, res) { try {
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
		if(!check_password(sender, data.sender_password)) {
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

		/* Calculate amount to transfer with taxes */
		// Possibility 1 - amount_sent is specified
		if ("amount_sent" in data) {
			if (typeof data.amount_sent != "number" || isNaN(data.amount_sent)
				|| !isFinite(data.amount_sent)) {
				res.end("error: invalid amount_sent");
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
