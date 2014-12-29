var crypto = require("crypto");

module.exports = {
	/**
	 * Check a given password for a student
	 * \param st The database entry for the student
	 * \param pwd The provided password to check
	 * \return True, if password is correct, otherwise false
	 */
	check_password : function (st, pwd) {
		return (crypto.createHash("sha256").update(pwd + st.pwdsalt).digest("hex") == st.pwdhash);
	}
}
