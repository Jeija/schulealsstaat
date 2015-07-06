var settings = require("../settings.js");
var common = require("./common.js");
var log = require("../logging.js");
var config = require("../config");
var cert = require("../cert");
var flow = require("flow");
var db = require("../db");

// Round a currency value up
function HGC_roundup(value) {
	var decplaces = config.get("hgc_decimal_places");
	return Math.ceil(value * Math.pow(10, decplaces)) / Math.pow(10, decplaces);
}

module.exports = function (register, register_cert) {
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
register("get_balance", function (payload, answer, info) {
	db.students.getByQridLean(payload.qrid, answer, function (st) {
		if (!st) {
			answer("invalid_qrid");
			return;
		}

		if(!common.check_password(st, payload.password)) {
			answer("invalid_password");
			return;
		}

		db.transactions.getBalance(st._id, answer, function (balance) {
			answer(String(balance));
			info("done for " + common.student_readable(st));
		});
	});
});

/**
 * get_balance_master
 *	qrid : String(QR-ID)
 *
 * respone values:
 * a Number (in String)	--> balance of the person with qrid if password was correct
 * invalid_qrid		--> the provided qrid doesn't exist
 * error:<something>	--> Some other error, e.g. with JSON parsing
 */
register_cert("get_balance_master", ["admin_hash"], function (payload, answer, info) {
	db.students.getByQridLean(payload, answer, function (st) {
		if (!st) {
			answer("invalid_qrid");
			return;
		}

		db.transactions.getBalance(st._id, answer, function (balance) {
			answer(String(balance));
			info("done for " + common.student_readable(st));
		});
	});
});

/**
 * get_last_transactions {
 *	qrid : String(QR-ID),
 *	password : String,
 *	amount : Number (returns <amount> last transactions or all transactions if amount <= 0)
 * }
 *
 * If there are incoming tax transactions and normal transactions, it will show the last <amount> of each of them.
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
 *				comment : String }]
 * invalid_qrid		--> the provided qrid doesn't exist
 * invalid_password	--> provided password was wrong
 * error:<something>	--> Some other error, e.g. with JSON parsing
 */
register("get_last_transactions", function (payload, answer, info) {
	db.students.getByQridLean(payload.qrid, answer, function (st) {
		if (!st) {
			answer("invalid_qrid");
			return;
		}

		if(!common.check_password(st, payload.password)) {
			answer("invalid_password");
			return;
		}

		db.transactions.getByProperties({
			$or : [
				{ "sender.reference" : st._id },
				{ "recipient.reference" : st._id }
			]
		}, payload.amount, answer, function (tr) {
			// Little hack: If account described by qrid has received tax income,
			// transform these tax income transactions into normal ones and display them
			// indicated to client by setting transformed_taxinc to true
			db.transactions.getByProperties({
				"tax_recipient" : st._id
			}, payload.amount, answer, function (tr_tax) {
				for (var i = 0; i < tr_tax.length; i++) {
					if (tr_tax[i].amount_tax > 0) {
						tr.push({
							sender : tr_tax[i].sender,
							recipient : common.student_public_only(st),
							time : tr_tax[i].time,
							amount_sent : tr_tax[i].amount_tax,
							amount_received : tr_tax[i].amount_tax,
							amount_tax : 0,
							percent_tax : 0,
							transformed_taxinc : true,
							comment : "!!! Transformed tax income transaction !!!"
						});
					}
				}

				info("done for " + common.student_readable(st));
				answer(tr);
			});
		});
	});
});

/**
 * find_transactions {
 *	query : Query for transactions DB,
 *	amount : Number (returns <amount> last transactions or all transactions if amount <= 0)
 * }
 *
 * response values:
 * Array		--> all matching transactions
 *			--> Form: [{
 *				sender : String,
 *				recipient : String,
 *				time : Date,
 *				amount_sent : Number,
 *				amount_received : Number,
 *				amount_tax : Number,
 *				percent_tax : Number,
 *				comment : String }]
 * Array may also be empty, if no matching transactions were found
 */
register_cert("find_transactions", ["admin_hash"], function (payload, answer, info) {
	db.transactions.getByProperties(payload.query, payload.amount, answer, function (tr) {
		if (payload.amount > 0)
		{
			var min = tr.length - payload.amount;
			if (min < 0) min = 0;
			tr = tr.slice(min, tr.length);
		}
		info("found " + tr.length + " matches");
		answer(tr);
	});
});

/**
 * On startup: Check if tax income account exists (wait for Database init before)
 */
var taxinc_check_initial = setInterval(function () {
	if (!db.ready) return;
	clearInterval(taxinc_check_initial);
	db.students.getByQridLean(config.get("taxinc_qrid"), function () {}, function (taxinc) {
		if (!taxinc)
			log.err("BANK", "Tax income account not found. You MUST create a tax " + 
				"income account in order to collect any taxes.");
	});
});

/**
 * Net value <--> gross value conversion
 * gross value (brutto) --> amount_sent
 * net value   (netto ) --> amount_received
 *
 * Formulas:
 *   --> taxamount = tax% * net 
 *   --> taxamount = tax% * gross / (1 + tax%)
 *
 * Tax parameter is in % already, so it has to be converted.
 */
function gross2tax(gross, tax_percent) {
	var tax = tax_percent / 100;
	return HGC_roundup(tax * gross / (1 + tax));
}

function net2tax(net, tax_percent) {
	var tax = tax_percent / 100;
	return HGC_roundup(tax * net);
}

/**
 * When dealing with transactions, it is important to make sure no two transactions
 * can be executed at the same time, as this may cause the system to deduct money
 * from accounts that have no money left (due to a multithreading race condition).
 *
 * Therefore, when performing a transaction, the system basically only announces a
 * write_intent to the database. The actual transaction only takes places when the
 * transaction with write_intent is the first in the list of transactions. If, however,
 * the sender doesn't have enough money left on their account, the transaction with the
 * write_intent is removed.
 */
var pending_transactions = [];
function transaction_queue(trid, sender, entry, answer, info) {
	pending_transactions.push({
		trid : trid,
		sender : sender,
		entry : entry,
		answer : answer,
		info : info
	});
}

function transaction_write(entry, answer, info, cb) {
	/**
	 * Calculate sender balance
	 * Sender balance aggregation can now be safely issued since this is
	 * the only newly written transaction at this time.
	 */
	db.transactions.write(entry, answer, function () {
		/*** Log to console and answer with success ***/
		info("Transaction from " + common.student_readable(entry.sender) + " to " +
			common.student_readable(entry.recipient) + ", with net value " +
			entry.amount_received + " HGC, tax income is " + entry.amount_tax + " HGC.");
		answer("ok");
		if (cb) cb();
	});
}

setInterval(function () {
	function onWritePermission(i, trid, answer) {
		var pe = pending_transactions[i];
		if (!pe) return; // (other callback was faster)
		db.transactions.getBalance(pe.sender, pe.answer, function (bal) {
			if (bal - pe.entry.amount_sent < 0) {
				pe.answer("nomoney");
				db.transactions.writeComplete(trid);
				delete pending_transactions[i];
			} else {
				transaction_write(pe.entry, pe.answer, pe.info, function () {
					delete pending_transactions[i];
					db.transactions.writeComplete(trid);
				});
			}
		}); 
	}

	for (var i = 0; i < pending_transactions.length; i++) {
		var pe = pending_transactions[i];
		if (!pe) continue;
		db.transactions.checkWritePermission(pe.trid, pe.sender, pe.answer,
			onWritePermission.bind(null, i, pe.trid, pe.answer));
	}
}, settings.transaction_interval);

/**
 * Add transaction intent to database, but wait for permission before performing
 * Takes care of making sure sender and recipient exist and gathering data from
 * the students database.
 *
 * Does NOT perform any security checks, so there is no need for a password
 * Does NOT sanitize all of user input, like number of decimal places or comment length
 * If the recipient is the magic_account, the money will be destroyed
 * If the sender is the magic_account, the money will be spawned
 */
function transaction(sender_qrid, recipient_qrid,
		amount_sent, amount_received, tax,
		comment, answer, info) {
	var sender, recipient, taxinc;
	var magic_account = config.get("magic_account");
	var spawn_money = sender_qrid == magic_account;
	var destroy_money = recipient_qrid == magic_account;

	/*** Check for over- or underspecification (amount_sent / amount_received) ***/
	if (!amount_sent && !amount_received) { answer("underspecified"); return; }
	if (amount_sent && amount_received) { answer("overspecified"); return; }

	/*** Check for invalid money amounts ***/
	if (amount_sent && (!Number.isFinite(amount_sent) || amount_sent <= 0))
		{ answer("invalid_amount"); return; }
	if (amount_received && (!Number.isFinite(amount_received) || amount_received <= 0))
		{ answer("invalid_amount"); return; }

	/*** Gather data from students database ***/
	flow.exec(function () {
		db.students.getByQridLean(config.get("taxinc_qrid"), answer, this);
	}, function (st) {
		if (!st) {
			answer("error: no tax income account");
			log.err("API", "You MUST add a tax income account, ignoring transaction!");
			return;
		}
		taxinc = st;
		if (spawn_money) this(true);
		else db.students.getByQridLean(sender_qrid, answer, this);
	}, function (st) {
		if (!st) { answer("invalid_sender"); return; }
		sender = st;
		if (destroy_money) this(true);
		else db.students.getByQridLean(recipient_qrid, answer, this);
	}, function (st) {
		if (!st) { answer("invalid_recipient"); return; }
		recipient = st;

		/* Calculate amount to transfer with taxes:
		 * In dubio pro central bank - round up after hgc_decimal_places,
		 * so central bank gets more tax income and recipient gets less money
		 * or sender has to pay more money
		 */
		var amount_tax = amount_sent ? gross2tax(amount_sent, tax) : net2tax(amount_received, tax);
		amount_sent = amount_sent ? amount_sent : amount_received + amount_tax;
		amount_received = amount_received ? amount_received : amount_sent - amount_tax;

		/*** Generate sender / recipient entries for transaction DB ***/
		if (destroy_money) recipient = { qrid : magic_account };
		if (spawn_money) sender = { qrid : magic_account };

		var recipient_public = common.student_public_only(recipient);
		var sender_public = common.student_public_only(sender);
		recipient_public.reference = recipient._id;
		sender_public.reference = sender._id;

		var entry = {
			sender : sender_public,
			recipient : recipient_public,
			tax_recipient : taxinc._id,
			time : Date(),

			amount_sent : amount_sent,
			amount_received : amount_received,
			amount_tax : amount_tax,
			percent_tax : tax,

			comment : comment
		};

		/*** Add write_intent to transactions database to request permission ***/
		if (spawn_money) {
			transaction_write(entry, answer, function () {
				info("done for " + common.student_readable(recipient_public));
				answer("ok");
			});
			return;
		}

		db.transactions.intent(sender._id, answer, function (trid) {
			transaction_queue(trid, sender._id, entry, answer, info);
		});
	});
}

/**
 * transaction / transaction_taxfree {
 *	sender : String (QR-ID),
 *	sender_password : String,
 *	recipient : String (QR-ID),
 *	Either provide:
 *	amount_sent : Number, OR amount_received : Number,
 *	comment : String(max. 300 characters)
 * }
 *
 * transaction_taxfree: No tax fees, but requires registration_cert or admin_cert
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
function nDecimals(num) {
	var match = (''+num).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
	if (!match) { return 0; }
	return Math.max(0, (match[1] ? match[1].length : 0) - (match[2] ? +match[2] : 0));
}

function transaction_normal(payload, answer, info, tax) {
	/*** Gather data from payload ***/
	var sender = payload.sender;
	var recipient = payload.recipient;
	var sender_password = payload.sender_password;
	var comment = "comment" in payload ? payload.comment : false;
	var sent = "amount_sent" in payload ? payload.amount_sent : false;
	var received = "amount_received" in payload ? payload.amount_received : false;

	/*** Check comment length ***/
	if (comment && comment.length > config.get("tr_comment_maxlen"))
		{ answer("comment_too_long"); return; }

	/*** Check if amount has more than hgc_tr_decimal_places decimals ***/
	var tr_decplaces = config.get("hgc_tr_decimal_places");
	if (sent && nDecimals(sent) > tr_decplaces)
		{ answer("too_many_decplaces"); return; }
	if (received && nDecimals(received) > tr_decplaces)
		{ answer("too_many_decplaces"); return; }

	/*** Check sender password + perform transaction ***/
	db.students.getByQridLean(sender, answer, function (st) {
		if (!st) { answer("invalid_sender"); return; }
		if (!common.check_password(st, sender_password))
			{ answer("invalid_password"); return; }
		transaction(sender, recipient, sent, received, tax, comment, answer, info);
	});
}

register("transaction", function (payload, answer, info) {
	// Tax in %
	var tax = config.get("transaction_tax_percent");
	transaction_normal(payload, answer, info, tax);
});

register_cert("transaction_taxfree", ["registration_hash", "admin_hash"],
		function (payload, answer, info) {
	transaction_normal(payload, answer, info, 0);
});

/**
 * master_hash --> spawn_money {
 *	amount : Number,
 *	recipient : String(QR-ID),
 *	comment : String
 * }
 * response values: "ok" or "error: <something>"
 */
register_cert("spawn_money", ["master_hash"], function (payload, answer, info) {
	info("Creation of money!");
	var sender = config.get("magic_account");
	var recipient = payload.recipient;
	var amount = payload.amount;
	var comment = "spawn_money" + (("comment" in payload) ? " - " + payload.comment : "");

	transaction(sender, recipient, amount, false, 0, comment, answer, info);
});

/**
 * master_hash --> destroy_money {
 *	amount : Number,
 *	sender : String(QR-ID),
 *	comment : String
 * }
 * response values: "ok" or "error: <something>"
 */
register_cert("destroy_money", ["master_hash"], function (payload, answer, info) {
	info("Destruction of money!");
	var recipient = config.get("magic_account");
	var sender = payload.sender;
	var amount = payload.amount;
	var comment = "destroy_money" + (("comment" in payload) ? " - " + payload.comment : "");

	transaction(sender, recipient, amount, false, 0, comment, answer, info);
});

/**
 * master_hash --> master_transaction {
 *	same arguments as "transaction" action, but:
 *		- doesn't require sender_password
 *		- if "tax_percent" is specified, uses that tax value
 * }
 *
 * Same answers as "transaction" action, apart from too_many_decplaces, comment_too_long
 * (these properties won't be checked)
 */
register_cert("master_transaction", ["master_hash"], function (payload, answer, info) {
	info("Forced (master) transaction of money!");
	// Tax in %
	var tax_percent = "tax_percent" in payload ?
		payload.tax_percent : config.get("transaction_tax_percent");
	if (tax_percent < 0) { answer("error: invalid tax_percent"); return; }
	var sender = payload.sender;
	var recipient = payload.recipient;
	var sent = "amount_sent" in payload ? payload.amount_sent : false;
	var received = "amount_received" in payload ? payload.amount_received : false;
	var comment = "comment" in payload ? payload.comment : false;

	// Do NOT perform password checking, comment length checking, decimal places checking
	// for master transactions
	transaction(sender, recipient, sent, received, tax_percent, comment, answer, info);
});

/**
 * master_hash --> delete_transaction
 *	payload : ObjectID (ObjectID of transaction in DB)
 *
 * response values:
 * invalid_id	--> transaction with that _id couldn't be found
 * ok		--> transaction successfully deleted
 */
register_cert("transaction_delete", ["master_hash"], function (payload, answer, info) {
	db.transactions.getById(payload, answer, function (tr) {
		if (!tr) {
			answer("invalid_id");
			return;
		}
		info("Deleting transaction from " + common.student_readable(tr.sender) + " to " +
			common.student_readable(tr.recipient) + ", gross value " + tr.amount_sent +
			", id is " + tr._id);
		tr.remove();
		answer("ok");
	});
});

}; // module.exports
