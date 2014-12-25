var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var log = require("../logging.js");

var transactionSchema = new Schema({
	/* QR-IDs of sender and recipient and timestamp */
	sender : String,
	recipient : String,
	time : Date,

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
			if (err) log.err("MongoDB", "trdb.add failed: " + err)
			cb(nt);
		});
	},

	// Callback paremeter are all transactions involving qrid sorted by time in ascending order
	getAllInvolvingQrid : function (qrid, cb) {
		var query = {	$query : {$or : [{sender : qrid}, {recipient : qrid}]},
				$orderby : {time : 1}};
		Transaction.find(query, function (err, tr) {
			if (err) log.err("MongoDB", "trdb.getAllInvolvingQrid failed: " + err)
			cb(tr);
		});
	}
}
