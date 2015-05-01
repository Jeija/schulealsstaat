var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var log = require("../logging.js");

var studentSchema = new Schema({
	qrid :		{ type : String, index : true, unique : true },

	/* Personal Information (type may be teacher / school class / ...): */
	firstname :	{ type : String, index : true },
	lastname :	{ type : String, index : true },
	picname :	String,
	country :	{ type : String, index : true },
	birth :		Date,
	type :		{ type : String, index : true },

	/* Legal person / institution / ... */
	special_name :	{ type : String, index : true },

	/* Checkins, Checkouts --> Appearances */
	// type: "checkin/checkout/...", date: server time at checkin / checkout
	appear :	[{type : { type : String}, time : Date}],

	/* Password: */
	pwdhash :	String,
	pwdsalt :	String
}, { bufferCommands : false });

var Student = mongoose.model("Student", studentSchema);

module.exports = function (error) { return {
	add : function (info, answer, cb) {
		var ns = new Student(info);
		ns.save(function (err) {
			if (err) {
				error("stdb.add", answer, err);
			} else {
				cb();
			}
		});
	},

	getByProperties : function (properties, answer, cb) {
		Student.find(properties, function (err, st) {
			if (err) {
				error("stdb.getByProperties", answer, err);
			} else {
				cb(st);
			}
		});
	},

	/** getCertainByProperties is always lean! **/
	getCertainByProperties : function (properties, fields, answer, cb) {
		Student.find(properties, fields, { maxTime : 10 }).lean().exec(function (err, st) {
			if (err) {
				error("stdb.getCertainByProperties", answer, err);
			} else {
				cb(st);
			}
		});
	},

	getByQrid : function (qrid, answer, cb) {
		Student.findOne({qrid : qrid}, function (err, st) {
			if (err) {
				error("stdb.getByQrid", answer, err);
			} else {
				cb(st);
			}
		});
	},

	getByQridLean : function (qrid, answer, cb) {
		Student.findOne({qrid : qrid}).lean().exec(function (err, st) {
			if (err) {
				error("stdb.getByQridLean", answer, err);
			} else {
				cb(st);
			}
		});
	},

	getAll : function (answer, cb) {
		Student.find().lean().exec(function (err, list) {
			if (err) {
				error("stdb.getAll", answer, err);
			} else {
				cb(list);
			}
		});
	},

	getCertainAll : function (fields, answer, cb) {
		Student.find({}, fields).lean().exec(function (err, list) {
			if (err) {
				error("stdb.getCertainAll", answer, err);
			} else {
				cb(list);
			}
		});
	}
}};
