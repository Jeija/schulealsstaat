RegExp.quote = require("regexp-quote");
var common = require("./common.js");
var log = require("../logging.js");
var crypto = require("crypto");
var cert = require("../cert");
var db = require("../db");

// Generate Salt / Hash combination from password
function generate_pwdhash(pwd) {
	var pwdsalt = crypto.randomBytes(32).toString("hex");
	var pwdhash = crypto.createHash("sha256").update(pwd + pwdsalt).digest("hex");
	return { salt : pwdsalt, hash : pwdhash };	
}

module.exports = function (register, register_cert) {
/**
 * Finds student by given key-value pairs in DB, also supports mongoose-style
 * properties like $ne, $or, ...
 *
 * admin_hash --> students_get {
 *	query : {
 *		key1 : value1 (both Strings),
 *		key2 : value2 (both Strings)
 *	},
 *	fields : <explanation see below>,
 *	limit : Number (if exists and positive, only returns that number of students)
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
register_cert("students_get", ["admin_hash"], function (payload, answer, info) {
	db.students.getByProperties(payload.query, payload.fields, payload.limit, answer,
			function (list) {
		info("found " + list.length + " matches");
		answer(list);
	});
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
register_cert("profile_edit", ["admin_hash"], function (payload, answer, info) {
	db.students.getByQrid(payload.qrid, answer, function (st) {
		if (!st) { answer("error: wrong qrid"); return; }
		var allow_edit = ["firstname", "lastname", "qrid", "picname",
			"birth", "type", "special_name", "country"];
		if (allow_edit.indexOf(payload.prop) <= -1) {
			answer("error: not allowed to edit " + payload.prop);
			return;
		}
		info("Edit " + payload.prop + " of " + common.student_readable(st) + ", from " +
			st[payload.prop] + " to " + payload.value);

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
register_cert("student_delete", ["master_hash"], function (payload, answer, info) {
	db.students.getByQrid(payload, answer, function (st) {
		if (st) {
			info("removed " + common.student_readable(st));
			st.remove();
			answer("ok");
		} else {
			answer("error: invalid qrid");
		}
	});
});

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
register("student_identify", function (payload, answer, info) {
	if (!(payload.firstname || payload.lastname || payload.special_name ||
		payload.qrid || payload.type)) {
		answer ("error: underspecification");
		return;
	}

	if (payload.special_name)
		payload.special_name = new RegExp("^" + RegExp.quote(payload.special_name) + "$", "i");
	if (payload.firstname)
		payload.firstname = new RegExp("^" + RegExp.quote(payload.firstname) + "$", "i");
	if (payload.lastname)
		payload.lastname = new RegExp("^" + RegExp.quote(payload.lastname) + "$", "i");
	if (payload.type)
		payload.type = new RegExp("^" + RegExp.quote(payload.type) + "$", "i");

	db.students.getByProperties(payload, common.student_public_fields, null,
			answer, function (st) {
		if (!st[0]) {
			answer("error: not found");
			return;
		}

		if (st.length > 1) {
			answer("multiple");
			return;
		}

		info("identified " + common.student_readable(st[0]));
		answer(st[0]);
	});
});

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
function change_password (st, new_password) {
	var crypt = generate_pwdhash(new_password);
	st.pwdhash = crypt.hash;
	st.pwdsalt = crypt.salt;
	st.save();
}

register("password_change", function (payload, answer, info) {
	db.students.getByQrid(payload.qrid, answer, function (st) {
		if (!st) {
			answer("invalid_qrid");
			return;
		}

		if(common.check_password(st, payload.old_password)) {
			change_password(st, payload.password);
			info("changing password of " + common.student_readable(st));
			answer("ok");
		} else {
			answer("invalid_password");
		}
	});
});

/**
 * Just like password_change, but requires master_hash instead of old_password
 */
register_cert("password_change_master", ["master_hash"], function (payload, answer, info) {
	db.students.getByQrid(payload.qrid, answer, function (st) {
		if (!st) {
			answer("invalid_qrid");
			return;
		}
		info("master-changing password of " + common.student_readable(st));
		change_password(st, payload.password);
		answer("ok");
	});
});

/**
 * Identifies student for getting to profile in the entrycheck client,
 * will also return entries in the appear field since appear_since,
 * requires entrycheck keyfile
 *
 * ec_student_get --> qrid (String)
 * }
 *
 * response value: JSON consisting of {
 *	firstname : String,
 *	lastname : String,
 *	special_name : String,
 *	qrid : String (QR-ID),
 *	type : String,
 *	birth : Date,
 *	picname : String,
 * }
 */
register_cert("ec_student_get", ["ec_hash", "admin_hash"], function (payload, answer, info) {
	db.students.getCertainByQridLean(payload, {
		firstname : 1,
		lastname : 1,
		type : 1,
		qrid : 1,
		birth : 1,
		appear : 1,
		picname : 1
	}, answer, function (st) {
		if (!st) {
			answer("error: not found");
			return;
		}

		info("identified " + common.student_readable(st));
		answer(st);
	});
});


/**
 * ec_checkin / ec_checkout
 * Checks student in or out, to report how long that student has been present at school.
 *
 * ec_checkin / ec_checkout --> qrid (String)
 *
 * response values:
 * "ok" or "error: <something>"
 */
register_cert("ec_checkin", ["ec_hash", "admin_hash"], function (payload, answer, info) {
	db.students.addAppear(payload, {
		type : "checkin",
		time : Date.now()
	}, answer, function (success) {
		if (success) {
			answer("ok");
			info("Checkin by " + payload);
		} else {
			answer("error: invalid qrid");
		}
	});
});

register_cert("ec_checkout", ["ec_hash", "admin_hash"], function (payload, answer, info) {
	db.students.addAppear(payload, {
		type : "checkout",
		time : Date.now()
	}, answer, function (success) {
		if (success) {
			answer("ok");
			info("Checkout by " + payload);
		} else {
			answer("error: invalid qrid");
		}
	});
});

register_cert("register_student", ["registration_hash"], function (payload, answer, info) {
	// Type / School class:
	var type = payload.sclass + payload.subclass;

	// Birthday
	var bday_iso;
	if (type == "teacher")
		bday_iso = "1970-1-1";
	else
		bday_iso = payload.birthyear + "-" + payload.birthmonth +
			"-" + payload.birthday;
	var bday = new Date(bday_iso);

	// QR ID:
	var qrid = "";
	function regStudent(st) {
		// Generate new QR ID and check if new one exists
		if (st || qrid === "")
		{
			// If Preset QR ID is used, use it
			if (payload.qrid) {
				qrid = payload.qrid;
			} else {
				qrid = crypto.randomBytes(4).toString("hex");
				db.students.getByQridLean(qrid, answer, regStudent);
				return;
			}
		}

		// Otherwise: register student
		var crypt = generate_pwdhash(payload.password);

		var regst = {
			qrid : qrid,

			firstname : payload.firstname,
			lastname : payload.lastname,
			special_name : payload.special_name,
			picname : payload.picname,
			country : payload.country,
			birth : bday,
			type : payload.sclass + payload.subclass,

			transactions : [],

			pwdhash : crypt.hash,
			pwdsalt : crypt.salt
		};

		db.students.add(regst, answer, function (st) {
			answer("ok");
			info("Registered successfully: " + common.student_readable(st));
		});
	}

	// Check if given preset QR ID already exists
	if (payload.qrid) {
		db.students.getByQridLean(payload.qrid, answer, function (student) {
			if (student)
				answer("error: QR ID " + payload.qrid + " already exists");
			else
				regStudent();
		});
	} else {
		regStudent();
	}
});
};
