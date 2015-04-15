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
	student_redable : function (st) {
		return st.qrid + ": " +
			(st.firstname ? (st.firstname + "/") : "") +
			(st.lastname ? (st.lastname + "/") : "") +
			(st.special_name ? (st.special_name + "/") : "") +
			(st.type ? st.type : "");
	}
}
