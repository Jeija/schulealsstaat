var log = require("../logging.js");
var db = require("../db");
var cert = require("../cert");
var config = require("../config");

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
					st.save();
					// TODO:
					// Log transaction
					res.end("ok");
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
	 *	originator : String(QR-ID),
	 *	comment : String
	 * }
	 */
	register("destroy_money", function (arg, res, req) {
		cert.check(["registration_hash", "master_hash"], req, function () {
			try {
				var data = JSON.parse(arg);
				db.students.getByQrid(data.originator, function (st) {
					if (!st) {
						log.warn("API", "destroy_money: qrid not found,\
							ignoring request");
						res.end("error: QR ID not found, ignoring request");
						return;
					}
					st.balance = st.balance - data.amount;
					st.save();
					// TODO:
					// Log transaction
					res.end("ok");
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
	 *	amount_sent : Number, OR amount_receive : Number,
	 *	comment : String(max. 300 characters),
	 *	sender_ip : String (optional)
	 * }
 	 *
	 * response values:
	 * ok --> Transaction succesfully completed
	 * nomoney --> Sender does not have enough money to pay for the transaction
	 * invalid_password	--> Sender password is invalid
	 * comment_to_long	--> comment is over 300 chars
	 * invalid_sender	--> Sender QR-ID is invalid
	 * invalid_recipient	--> Recipient QR-ID is invalid
	 * error:<something>	--> Some other error, propably with parameter
 	 */
	register("transaction", function (arg, res) {
		try {
			var data = JSON.parse(arg);
			console.log(config.get("transaction_tax", 0));
		} catch (e) {
			log.err("API", "transaction failed " + e);
			res.end("error: " + e);
		}
	});
}
