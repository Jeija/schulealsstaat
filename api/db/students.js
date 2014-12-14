var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var log = require("../logging.js");

var studentSchema = new Schema({
	qrid :		String,

	// Personal Information (type may be teacher / school class / ...):
	firstname :	String,
	lastname :	String,
	picname :	String,
	birth :		Date,
	type :		String,

	// Legal person / institution / ...
	special_name :	String,

	// Appearances (Checkins / Checkouts)
	// [{type : "checkin/checkout/...", time : date}, ...]
	appear :	Array,

	// Financial (transaction is an Array of ObjectIds that maps to the transactions db):
	transactions :	Array,
	balance :	Number,

	// Password:
	pwdhash :	String,
	pwdsalt :	String
});

var Student = mongoose.model("Student", studentSchema);

module.exports = {
	add : function (info) {
		var ns = new Student(info);
		ns.save(function (err) {
			if (err) log.err("MongoDB", "stdb.add failed: " + err);
		});
	},

	getByProperties : function (properties, cb) {
		Student.find(properties, function (err, st) {
			if (err) log.err("MongoDB", "stdb.getByProperties failed: " + err);
			cb(st);
		});
	},

	getByQrid : function (qrid, cb) {
		Student.findOne({qrid : qrid}, function (err, st) {
			if (err) log.err("MongoDB", "stdb.getByQrid failed: " + err);
			cb(st);
		});
	},

	getAll : function (cb) {
		Student.find({}, function (err, list) {
			if (err) log.err("MongoDB", "stdb.getAll failed: " + err);
			cb(list);
		});
	}
}
