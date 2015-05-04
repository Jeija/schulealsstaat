var crypto = require("crypto");

module.exports = {
	/**
	 * Check a given password for a student
	 * st: The database entry for the student
	 * pwd: The provided password to check
	 * returns true, if password is correct, otherwise false
	 */
	check_password : function (st, pwd) {
		return (crypto.createHash("sha256").update(pwd + st.pwdsalt).digest("hex") == st.pwdhash);
	},

	/**
	 * Generate a readable string from a student object for logging purposes
	 * st: Student object
	 * returns: Readable string
	 */
	student_readable : function (st) {
		return st.qrid + ": " +
			(st.firstname ? (st.firstname + "/") : "") +
			(st.lastname ? (st.lastname + "/") : "") +
			(st.special_name ? (st.special_name + "/") : "") +
			(st.type ? st.type : "");
	},

	/**
	 * Removes all private / security-related data from a student Object
	 * st: Student object
	 * returns: Student object with private data removed
	 */
	student_public_only : function(st) {
		if (!st) return null;
		return {
			special_name :	st.special_name,
			firstname :	st.firstname,
			lastname :	st.lastname,
			country :	st.country,
			birth :		st.birth,
			type :		st.type,
			qrid :		st.qrid
		};
	},

	/**
	 * Fields to be extracted from the database that can be public,
	 * e.g. when calling student_identify
	 */
	student_public_fields : {
		special_name :	1,
		firstname :	1,
		lastname :	1,
		picname :	1,
		country :	1,
		birth :		1,
		type :		1,
		qrid :		1
	}
};
