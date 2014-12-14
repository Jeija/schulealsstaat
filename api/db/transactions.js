var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var log = require("../logging.js");

var transactionSchema = new Schema({
	// QR-IDs of sender and recipient
	sender : String,
	recipient : String,
	time : Date,

	// Amount in HGC, rounded to 5 comma values (12.34567)
	amount_sent : Number,		// Amount subtracted from sender's account
	amount_received : Number,	// Amount added to recipient's account
	amount_tax : Number,		// Amount added to tax income account
	percent_tax : Number,		// Stores tax percentage value at transaction time

	// Comment is an arbitrary String, up to 300 characters, can be entered by sender
	comment : String,

	// Optional: IP of the sender, to help track physical positions of payments
	sender_ip : String
});

var Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = {
	add : function (info) {
		var nt = new Transaction(info);
		nt.save(function (err) {
			if (err) log.err("MongoDB", "trdb.add failed: " + err);
		});
	}
}
