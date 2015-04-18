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

	getCertainByProperties : function (properties, fields, cb) {
		Student.find(properties, fields, function (err, st) {
			if (err) log.err("MongoDB", "stdb.getCertainByProperties failed: " + err);
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
	},

	getCertainAll : function (fields, cb) {
		Student.find({}, fields, function (err, list) {
			if (err) log.err("MongoDB", "stdb.getCertainAll failed: " + err);
			cb(list);
		});
	}
};
