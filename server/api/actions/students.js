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

module.exports = function (register, register_cert) {
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
	register_cert("students_dump", ["admin_hash"], function (payload, answer) {
		log.info("API", "students_dump: this may take a while");
		var fields = payload;
		if (fields) {
			db.students.getCertainAll(fields, function (list) {
				answer(list);
			});
		} else {
			db.students.getAll(function (list) {
				answer(list);
			});
		}
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
	register_cert("get_students", ["admin_hash"], function (payload, answer) {
		// Payload contains an attribute list that may fit none, one or multiple students
		if ("fields" in payload) {
			db.students.getCertainByProperties(payload, payload.fields, function (st) {
				answer(st);
			});
		} else {
			db.students.getByProperties(payload, function (st) {
				answer(st);
			});
		}
	});

	/**
	 * Changes given value in student's profile entry in DB.
	 * Student is given by his / her QR-ID, key by payload.prop and new value by payload.value.
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
	register_cert("profile_edit", ["admin_hash"], function (payload, answer) {
		db.students.getByQrid(payload.qrid, function (st) {
			if (!st) { answer("error: wrong qrid"); return; }
			var allow_edit = ["firstname", "lastname", "qrid", "picname", "birth",
				"type", "special_name"];
			if (allow_edit.indexOf(payload.prop) <= -1) {
				answer("error: not allowed to edit " + payload.prop);
				return;
			}
			log.info("API", "Edit " + payload.prop + " of " + st.firstname
				+ " " + st.lastname + ", from "
				+ st[payload.prop] + " to " + payload.value);

			// If qrid was edited, change it in transactions DB
			if (payload.prop == "qrid")
				db.transactions.updateAllQrid
					(st[payload.prop], payload.value);

			st[payload.prop] = payload.value;
			st.save();
			answer("ok");
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
	register("student_delete", ["master_hash"], function (payload, answer) {
		db.students.getByQrid(payload, function (st) {
			if (st) {
				st.remove();
				answer("ok");
			} else {
				answer("error: invalid qrid")
			}
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
	register("student_identify", function (payload, answer) {
		if (!(payload.firstname || payload.lastname || payload.special_name
				|| payload.qrid || payload.type)) {
			answer ("error: underspecification");
			return;
		}

		if (payload.special_name)
			payload.special_name = new RegExp("^" + payload.special_name + "$", "i");
		if (payload.firstname)
			payload.firstname = new RegExp("^" + payload.firstname + "$", "i");
		if (payload.lastname)
			payload.lastname = new RegExp("^" + payload.lastname + "$", "i");
		if (payload.type)
			payload.type = new RegExp("^" + payload.type + "$", "i");

		db.students.getByProperties(payload, function (st) {
			if (!st[0]) { answer("error: not found"); return; }
			if (st.length > 1) { answer("multiple"); return; }
			answer(student_public_only(st[0]));
		});
	});

	function change_password (st, new_password) {
		log.info("API", "Changing Password of " + st.firstname + " " + st.lastname);
		var crypt = generate_pwdhash(new_password);
		st.pwdhash = crypt.hash;
		st.pwdsalt = crypt.salt;
		st.save();
	}

	/**
	 * Changes password of student (also, re-generates password salt).
	 * Student is given by his / her QR-ID, the new password by payload.password.
	 * Either master_hash in POST data cert or old_password must be provided,
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
	register("password_change", function (payload, answer) {
		db.students.getByQrid(payload.qrid, function (st) {
			if (!st) {
				answer("invalid_qrid");
				return;
			}

			if(common.check_password(st, payload.old_password)) {
				change_password(st, payload.password);
				answer("ok");
			} else {
				answer("invalid_password");
			}
		});
	});

	/**
	 * Just like password_change, but requires master_hash instead of old_password
	 */
	register("password_change_master", function (payload, answer) {
		db.students.getByQrid(payload.qrid, function (st) {
			if (!st) {
				answer("invalid_qrid");
				return;
			}
			change_password(st, payload.password);
		});
	});

	// #################### ENTRY CHECK ####################
	register_cert("ec_checkin", ["ec_hash", "admin_hash"], function (payload, answer) {
		db.students.getByQrid(payload, function (st) {
			if (!st) { answer("error: wrong qrid"); return; }
			log.info("API", "Checkin by " + st.firstname + " " + st.lastname);
			st.appear.push({type : "checkin", time : Date.now()});
			st.save();
			answer("ok");
		});
	});

	register_cert("ec_checkout", ["ec_hash", "admin_hash"], function (payload, answer) {
		db.students.getByQrid(payload, function (st) {
			if (!st) { answer("error: wrong qrid"); return; }
			log.info("API", "Checkout by " + st.firstname + " " + st.lastname);
			st.appear.push({type : "checkout", time : Date.now()});
			st.save();
			answer("ok");
		});
	});

	// #################### REGISTRATION ####################
	register_cert("register_student", ["registration_hash"], function (payload, answer) {
		log.info("API", "Registering: " + payload.firstname + " " + payload.lastname);

		// Type / School class:
		var type = payload.sclass + payload.subclass;

		// Birthday
		var bday_iso;
		if (type == "teacher")
			bday_iso = "1970-1-1"
		else
			bday_iso = payload.birthyear + "-" + payload.birthmonth + "-"
				+ payload.birthday;
		var bday = new Date(bday_iso);

		// QR ID:
		var qrid = "";
		function regStudent(st) {
			// Generate new QR ID and check if new one exists
			if (st || qrid == "")
			{
				// If Preset QR ID is used, use it
				if (payload.qrid) {
					qrid = payload.qrid;
				} else {
					qrid = crypto.randomBytes(4).toString('hex');
					db.students.getByQrid(qrid, regStudent);
					return;
				}
			}

			// Otherwise: register student
			var crypt = generate_pwdhash(payload.password);

			var info = {
				qrid : qrid,

				firstname : payload.firstname,
				lastname : payload.lastname,
				special_name : payload.special_name,
				picname : payload.picname,
				birth : bday,
				type : payload.sclass + payload.subclass,

				transactions : [],
				balance : 0,

				pwdhash : crypt.hash,
				pwdsalt : crypt.salt
			}

			db.students.add(info);
			answer("ok");
		}

		// Check if given preset QR ID already exists
		if (payload.qrid) {
			db.students.getByQrid(payload.qrid, function (student) {
				if (student)
					answer("error: QR ID " + payload.qrid + " already exists");
				else
					regStudent();
			});
		} else {
			regStudent();
		}
	});
}
