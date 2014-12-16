var log = require("../logging.js");
var db = require("../db");
var cert = require("../cert");
var crypto = require("crypto");

// Removes all private / security-related data from a student Object
function student_public_only(st) {
	if (!st) return null;
	return {
		firstname :	st.firstname,
		lastname :	st.lastname,
		picname :	st.picname,
		birth :		st.birth,
		type :		st.type
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
	register("students_dump", function (arg, res, req) {
		log.info("API", "students_dump: this may take a while");
		cert.check(["admin_hash"], req, function () {
			db.students.getAll(function (list) {
				res.end(JSON.stringify(list));
			});
		});
	});

	register("get_students", function (arg, res, req) {
		// Data contains an attribute list that may fit none, one or multiple students
		cert.check(["admin_hash"], req, function () {
			try {
				var data = JSON.parse(arg);
				db.students.getByProperties(data, function (st) {
					res.end(JSON.stringify(st));
				});
			} catch(e) {
				log.err("API", "get_students failed " + e);
			}
		});
	});

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

	register("password_change", function (arg, res, req) {
		cert.check(["master_hash"], req, function () {
			try {
				var data = JSON.parse(arg);
				db.students.getByQrid(data.qrid, function (st) {
					if (!st) { res.end("error: wrong qrid"); return; }
					log.info("API", "Changing Password of " + st.firstname
						+ " " + st.lastname);
					var crypt = generate_pwdhash(data.password);
					st.pwdhash = crypt.hash;
					st.pwdsalt = crypt.salt;
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

	// #################### ENTRY CHECK ####################
	register("ec_get_by_qrid", function (arg, res, req) {
		cert.check(["ec_hash"], req, function () {
			// arg is the qrid of the one requested student
			db.students.getByQrid(arg, function (st) {
				res.end(JSON.stringify(student_public_only(st)));
			});
		});
	});

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
