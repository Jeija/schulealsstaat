var log = require("./logging.js");
var crypto = require("crypto");
var fs = require("fs");

var CERT_DIR = "/cert/";

module.exports = {
	// hashfiles = List of filenames for hashes in CERT_DIR that grant access
	// req = NodeJS request, to receive certificate via POST
	// cb = callback to be executed when validation is successful
	check: function(hashfiles, cert, ip, cb, cb_false) {
		var hash_correct = false;

		if (cert) {
			// Calculate hash of certificate in POST
			var hash = crypto.createHash("sha256")
				.update(cert.slice(0, -1)).digest("hex");

			// Compare all given hashfiles to the calculated hash
			for (var i = 0; i < hashfiles.length; i++) {
				var fn = hashfiles[i];
				var cmp_hash = fs.readFileSync(__dirname + CERT_DIR + fn, "utf8");
				if (cmp_hash.slice(0, -1) == hash) {
					cb();
					hash_correct = true;
				}
			}
		}

		if (!hash_correct) {
			log.warn("CERT", "False cert by " + ip);
			if (cb_false) cb_false();
		}
	}
};
