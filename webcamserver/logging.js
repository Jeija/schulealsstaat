/*
	Make sure output messages are well-formatted
*/

var colors = require("colors/safe");

module.exports = {
	ok : function (mod, msg) {
		console.log(colors.green("[ OK ] ") + mod + ": " + msg);
	},

	info : function (mod, msg) {
		console.log("[INFO] " + mod + ": " + msg);
	},

	warn : function (mod, msg) {
		console.log(colors.yellow("[WARN] ") + mod + ": " + msg);
	},

	err : function (mod, msg) {
		console.log(colors.red("[FAIL] ") + mod + ": " + msg);
	}
}
