var mongoose = require("mongoose");
var log = require("../logging.js");
var reconnect_interval;
var failedstate = false;
var settings = require("../settings.js");

var db_connect = function () {
	mongoose.connect(settings.mongodb_connection, {
		server : {
			auto_reconnect : true,
			socketTimeoutMS : 1000
		}
	}, function (err) {
		if (err) {
			if (!failedstate) {
				log.err("MongoDB", "Connection: " + err)
				reconnect_interval = setInterval(db_connect, 2000);
			}
			failedstate = true;
		}
	});
}

mongoose.connection.on("error", function (err) {
	if (!failedstate) {
		log.err("MongoDB", "Common: " + err)
		reconnect_interval = setInterval(db_connect, 2000);
	}
	failedstate = true;
});

mongoose.connection.on("open", function () {
	log.ok("MongoDB", "Connection established " + "(Worker " + process.pid + ")");

	if (failedstate) {
		clearInterval(reconnect_interval);
	}
	failedstate = false;
});

mongoose.connection.on("disconnect", function () {
	if (!failedstate) {
		log.err("MongoDB", "No connection to database!");
		reconnect_interval = setInterval(db_connect, 2000);
	}
	failedstate = true;
});

mongoose.connection.on("reconnected", function () {
	if (failedstate) {
		log.ok("MongoDB", "Database connection re-established");
		clearInterval(reconnect_interval);
	}
	failedstate = false;
});

/**
 * This function takes care of the error reporting for all database queries
 * In case a database query fails, it also re-establishes the connection to the database
 * since that is usually the cause of the error
 */
function DB_error(component, answer, err) {
	if (answer) answer("error: database error [" + component + "] " + err);
	if (!failedstate) {
		mongoose.connection.close();
		log.err("MongoDB", "[" + component + "] " + err + ", reconnecting");
		reconnect_interval = setInterval(db_connect, 2000);
	}
	failedstate = true;
}

module.exports.students = require("./students.js")(DB_error);
module.exports.config = require("./config.js")(DB_error);
module.exports.transactions = require("./transactions.js")(DB_error);

db_connect();
