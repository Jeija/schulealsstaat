var log = require("../logging.js");
var common = require("./common.js");
var db = require("../db");
var cert = require("../cert");
var crypto = require("crypto");

// Removes all private / security-related data from a student Object
function student_public_only(st) {
	if (!st) return null;
	return {
		special_name :	st.special_name,
		firstname :	st.firstname,
		lastname :	st.lastname,
		picname :	st.picname,
		birth :		st.birth,
		type :		st.type,
		qrid :		st.qrid
	};
}

// Generate Salt / Hash combination from password
function generate_pwdhash(pwd) {
	var pwdsalt = crypto.randomBytes(32).toString('hex');
	var pwdhash = crypto.createHash("sha256").update(pwd + pwdsalt).digest("hex");
	return { salt : pwdsalt, hash : pwdhash };	
}

module.exports = function (register){
	// #################### ADMIN PANEL #####################
	/**
	 * Returns JSON of all students in DB.
	 *
	 * admin_hash --> students_dump
	 *
	 * Parameter: none (invalid JSON) or object specifying inclusion / exclusion of fields:
	 *	inclusion:	{ "firstname" : 1, "lastname" : 1 }	--> only included
	 *	exlusion:	{ "appear" : 0, "transactions" : 0 }	--> only excluded
	 *
	 * response value:
	 * none (error) or dump of db.students, with all properties:
	 * [{<student1>}, {<student2>}, ...]
	 */
	register("students_dump", function (arg, res, req) {
		log.info("API", "students_dump: this may take a while");
		cert.check(["admin_hash"], req, function () {
			var fields = undefined;
			try { fields = JSON.parse(arg); } catch (e) {}

			if (fields) {
				db.students.getCertainAll(fields, function (list) {
					res.end(JSON.stringify(list));
				});
			} else {
				db.students.getAll(function (list) {
					res.end(JSON.stringify(list));
				});
			}
		});
	});

	/**
	 * Finds student by given key-value pairs in DB, also supports mongoose-style
	 * properties like $ne, $or, ...
	 *
	 * admin_hash --> get_students {
	 *	query : {
	 *		key1 : value1 (both Strings),
	 *		key2 : value2 (both Strings)
	 *	}
	 *	fields : <explanation see below>
	 * }
	 *
	 * fields: optional (get everything) or object specifying inclusion / exclusion of fields:
	 *	inclusion:	{ "firstname" : 1, "lastname" : 1 }	--> only included
	 *	exlusion:	{ "appear" : 0, "transactions" : 0 }	--> only excluded
	 *
	 * response value:
	 * none (error) or list of student that match given criteria:
	 * [{<student1>}, {<student2>}, ...]
	 */
	register("get_students", function (arg, res, req) {
		// Data contains an attribute list that may fit none, one or multiple students
		cert.check(["admin_hash"], req, function () {
			try {
				var data = JSON.parse(arg);
				if ("fields" in data) {
					db.students.getCertainByProperties(data, data.fields,
						function (st) {
						res.end(JSON.stringify(st));
					});
				} else {
					db.students.getByProperties(data, function (st) {
						res.end(JSON.stringify(st));
					});
				}
			} catch(e) {
				log.err("API", "get_students failed " + e);
			}
		});
	});

	/**
	 * Changes given value in student's profile entry in DB.
	 * Student is given by his / her QR-ID, key by data.prop and new value by data.value.
	 * Only the following properties can be changed using this function:
	 * firstname, lastname, qrid, picname, birth, type, special_name
	 *
	 * admin_hash --> profile_edit {
	 *	qrid : String (QR-ID),
	 *	prop : String (object key),
	 *	value : String (new value)
	 * }
	 *
	 * response value:
	 * "ok" or "error: <something>"
	 */
	register("profile_edit", function (arg, res, req) {
		cert.check(["admin_hash"], req, function () {
			try {
				var data = JSON.parse(arg);
				db.students.getByQrid(data.qrid, function (st) {
					if (!st) { res.end("error: wrong qrid"); return; }
					var allow_edit = ["firstname", "lastname", "qrid", "picname",
						"birth", "type", "special_name"];
					if (allow_edit.indexOf(data.prop) <= -1) {
						res.end("error: not allowed to edit " + data.prop);
						return;
					}
					log.info("API", "Edit " + data.prop + " of " + st.firstname
						+ " " + st.lastname + ", from "
						+ st[data.prop] + " to " + data.value);
					st[data.prop] = data.value;
					st.save();
					res.end("ok");
				});
			} catch(e) {
				log.err("API", "profile_edit failed " + e);
				res.end("error: " + e);
			}
		}, function () {
			res.end("error: incorrect certificate");
		});
	});

	/**
	 * Deletes student completely from DB, picture on webcamserver remains though.
	 * Transactions won't be altered as well.
	 *
	 * master_hash --> student_delete 
	 * parameter: String (QR-ID), no JSON
	 *
	 * response value:
	 * "ok" or "error: <something>"
	 */
	register("student_delete", function (arg, res, req) {
		cert.check(["master_hash"], req, function () {
			db.students.getByQrid(arg, function (st) {
				if (st) {
					st.remove();
					res.end("ok");
				} else {
					res.end("error: invalid qrid")
				}

			});
		}, function () {
			res.end("error: incorrect certificate");
		});
	});

	// #################### GENERAL ####################
	/**
	 * Identifies a single student / person by his / her public public properties:
	 * qrid, firstname, lastname, special_name and type
	 * If multiple matches are found, this will just return "multiple" for privacy reasons.
	 * No certificate / password required.
	 * At least one property (firstname, lastname, special_name, qrid or type) must be
	 * specified to prevent DDOS-Style attacks.
	 *
	 * student_identify {
	 *	firstname : String (optional),
	 *	lastname : String (optional),
	 *	special_name : String (optional),
	 *	qrid : String (QR-ID, optional),
	 *	type : String (optional)
	 * }
	 *
	 * firstname, lastname, special_name and type are case-insensitive
	 * response value: JSON consisting of {
	 *	firstname : String,
	 *	lastname : String,
	 *	special_name : String,
	 *	qrid : String (QR-ID),
	 *	type : String,
	 *	birth : Date,
	 *	picname : String
	 * }
	 */
	register("student_identify", function (arg, res) {
		try {
			var data = JSON.parse(arg);
			if (!(data.firstname || data.lastname || data.special_name || data.qrid
				|| data.type)) {
				res.end("error: underspecification");
			}

			if (data.special_name)
				data.special_name = new RegExp("^" + data.special_name + "$", "i");
			if (data.firstname)
				data.firstname = new RegExp("^" + data.firstname + "$", "i");
			if (data.lastname)
				data.lastname = new RegExp("^" + data.lastname + "$", "i");
			if (data.type)
				data.type = new RegExp("^" + data.type + "$", "i");

			db.students.getByProperties(data, function (st) {
				if (!st[0]) { res.end("error: not found"); return; }
				if (st.length > 1) { res.end("multiple"); return; }
				res.end(JSON.stringify(student_public_only(st[0])));
			});
		} catch (e) {
			log.err("API", "student_identify failed " + e);
			res.end("error: " + e);
		}
	});

	/**
	 * Changes password of student (also, re-generates password salt).
	 * Student is given by his / her QR-ID, the new password by data.password.
	 * Either master_hash in POST data or old_password must be provided,
	 * if old_password is provided, uses it instead of certificate
	 *
	 * master_hash [option 1] --> password_change {
	 *	qrid : String (QR-ID),
	 *	password : String (Password),
	 *	old_password : String (Password, [option 2])
	 * }
	 *
	 * response value:
	 * "ok"
	 * invalid_qrid		--> the provided qrid doesn't exist
	 * invalid_password	--> provided old_password was wrong
	 * "error: <something>"
	 */
	function change_password (st, new_password) {
		log.info("API", "Changing Password of " + st.firstname + " " + st.lastname);
		var crypt = generate_pwdhash(new_password);
		st.pwdhash = crypt.hash;
		st.pwdsalt = crypt.salt;
		st.save();
	}

	register("password_change", function (arg, res, req) { try {
		var data = JSON.parse(arg);

		db.students.getByQrid(data.qrid, function (st) {
			if (!st) {
				res.end("invalid_qrid");
				return;
			}

			if ("old_password" in data) {
				if(common.check_password(st, data.old_password)) {
					change_password(st, data.password);
					res.end("ok");
				} else {
					res.end("invalid_password");
				}
			} else {
				cert.check(["master_hash"], req, function () {
					change_password(st, data.password);
					res.end("ok");
				}, function () {
					res.end("error: incorrect certificate");
				});
			}
		});
	} catch(e) {
		log.err("API", "password_change failed " + e);
		res.end("error: " + e);
	}});

	// #################### ENTRY CHECK ####################
	register("ec_checkin", function (arg, res, req) {
		cert.check(["ec_hash", "admin_hash"], req, function () {
			db.students.getByQrid(arg, function (st) {
				if (!st) { res.end("error: wrong qrid"); return; }
				log.info("API", "Checkin by " + st.firstname + " " + st.lastname);
				st.appear.push({type : "checkin", time : Date.now()});
				st.save();
				res.end("ok");
			});
		});
	});

	register("ec_checkout", function (arg, res, req) {
		cert.check(["ec_hash", "admin_hash"], req, function () {
			db.students.getByQrid(arg, function (st) {
				if (!st) { res.end("error: wrong qrid"); return; }
				log.info("API", "Checkout by " + st.firstname + " " + st.lastname);
				st.appear.push({type : "checkout", time : Date.now()});
				st.save();
				res.end("ok");
			});
		});
	});

	// #################### REGISTRATION ####################
	register("register_student", function (arg, res, req) {
		cert.check(["registration_hash"], req, function () {
			try {
				var data = JSON.parse(arg);
				log.info("API", "Registering: " + data.firstname + " " + data.lastname);

				// Type / School class:
				var type = data.sclass + data.subclass;

				// Birthday
				var bday_iso;
				if (type == "teacher")
					bday_iso = "1970-1-1"
				else
					bday_iso = data.birthyear + "-" + data.birthmonth + "-"
						+ data.birthday;
				var bday = new Date(bday_iso);

				// QR ID:
				var qrid = "";
				function regStudent(st) {
					// Generate new QR ID and check if new one exists
					if (st || qrid == "")
					{
						// If Preset QR ID is used, use it
						if (data.qrid) {
							qrid = data.qrid;
						} else {
							qrid = crypto.randomBytes(4).toString('hex');
							db.students.getByQrid(qrid, regStudent);
							return;
						}
					}

					// Otherwise: register student
					var crypt = generate_pwdhash(data.password);

					var info = {
						qrid : qrid,

						firstname : data.firstname,
						lastname : data.lastname,
						special_name : data.special_name,
						picname : data.picname,
						birth : bday,
						type : data.sclass + data.subclass,

						transactions : [],
						balance : 0,

						pwdhash : crypt.hash,
						pwdsalt : crypt.salt
					}

					db.students.add(info);
					res.end("ok");
				}

				// Check if given preset QR ID already exists
				if (data.qrid) { db.students.getByQrid(data.qrid, function (student) {
					if (student) {
						res.end("error: QR ID " + data.qrid
							+ " existiert bereits.");
					} else {
						regStudent();
					}
				});} else {
					regStudent();
				}
			} catch (e) {
				log.err("API", "register_student failed " + e);
				res.end("error: " + e);
			}
		}, function () {
			res.end("error: invalid certificate");
		});
	});
}
