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

	addAppear : function (qrid, spec, answer, cb) {
		Student.update({
			qrid : qrid
		}, {
			$push : { appear : spec }
		}, function (err, result) {
			if (err) {
				error("stdb.addAppear", answer, err);
			} else {
				if (result.nModified > 0)
					cb(true);
				else
					cb(false);
			}
		});
	},

	getByProperties : function (properties, fields, limit, answer, cb) {
		if (!fields) fields = {};
		if (!limit || limit < 0) limit = Infinity;
		Student.find(properties, fields).lean().limit(limit).exec(function (err, st) {
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

	getCertainByQridLean : function (qrid, fields, answer, cb) {
		Student.findOne({qrid : qrid}, fields).lean().exec(function (err, st) {
			if (err) {
				error("stdb.getCertainByQridLean", answer, err);
			} else {
				cb(st);
			}
		});
	}
}; };
