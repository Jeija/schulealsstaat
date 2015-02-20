var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var log = require("../logging.js");

var transactionSchema = new Schema({
	/* QR-IDs of sender and recipient and timestamp */
	sender : String,
	recipient : String,
	time : Date,

	/* "Countries" of sender and recipient */
	sender_country : String,
	recipient_country : String,

	/* Amount in HGC, rounded to 5 comma values (12.34567) */
	amount_sent : Number,		// Amount subtracted from sender's account
	amount_received : Number,	// Amount added to recipient's account
	amount_tax : Number,		// Amount added to tax income account
	percent_tax : Number,		// Stores tax percentage value at transaction time

	/* Comment is an arbitrary String, up to <tr_comment_maxlen> (in config) characters,
		can be entered by sender or is generated programmatically */
	comment : String,

	/* Optional: IP of the sender, to help track physical positions of payments */
	sender_ip : String
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

	updateAllQrid : function (old_qrid, new_qrid) {
		// Sender
		Transaction.update(
			{ sender : old_qrid },			// Query sender
			{ $set : { sender : new_qrid } },	// Update sender
			{ multi : true },			// Update every transaction
			function (err) {			// Callback
				if (err) log.err("MongoDB", "trdb.updateAllQrid sender failed: " + err);
		});

		// Recipient
		Transaction.update(
			{ recipient : old_qrid },		// Query sender
			{ $set : { recipient : new_qrid } },	// Update sender
			{ multi : true },			// Update every transaction
			function (err) {			// Callback
				if (err) log.err("MongoDB", "trdb.updateAllQrid sender failed: " + err);
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
