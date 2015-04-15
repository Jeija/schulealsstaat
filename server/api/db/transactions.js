var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var log = require("../logging.js");

var commonProfileSchema = {
	special_name :	{ type : String, index : true },
	firstname :	{ type : String, index : true },
	lastname :	{ type : String, index : true },
	country :	{ type : String, index : true },
	type :		{ type : String, index : true },
	qrid :		{ type : String, index : true }
};

var transactionSchema = new Schema({
	/**
	 * References to sender + recipient and copies of their profiles at transaction time
	 * If either one of them changes e.g. their country, taxes can still be calculated.
	 * Also, if the QR card is reused or if the recipient changes their name, it can be
	 * tracked back in case of fraud or abuse.
	 *
	 * Current information on sender / recipient can be accessed by tracing back their
	 * document _id value (if available in sender.reference, recipient.reference)
	 */
	sender : commonProfileSchema,
	recipient : commonProfileSchema,

	/* Timestamp */
	time : { type : Date, index : true },

	/* Amount in HGC, rounded to 5 comma values (e.g. 12.34567) */
	amount_sent : Number,		// Amount subtracted from sender's account
	amount_received : Number,	// Amount added to recipient's account
	amount_tax : Number,		// Amount added to tax income account
	percent_tax : Number,		// Stores tax percentage value at transaction time

	/* Comment is an arbitrary String, up to <tr_comment_maxlen> (in config) characters,
		can be entered by sender or is generated programmatically */
	comment : String
});

var Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = {
	add : function (info, cb) {
		var nt = new Transaction(info);
		nt.save(function (err) {
			if (err) log.err("MongoDB", "trdb.add failed: " + err);
			cb(nt);
		});
	},

	// Callback paremeter are all transactions in the list sorted by time in ascending order
	getByIdList : function (list, cb) {
		var query = {_id : {$in : list}};
		Transaction.find(query).sort({
			"time" : "ascending"
		}).exec(function (err, tr) {
			if (err) log.err("MongoDB", "trdb.getByIdList failed: " + err);
			cb(tr);
		});
	},

	getByProperties : function (properties, cb) {
		Transaction.find(properties).sort({
			"time" : "descending"
		}).exec(function (err, st) {
			if (err) log.err("MongoDB", "stdb.getByProperties failed: " + err);
			cb(st);
		});
	}
};
