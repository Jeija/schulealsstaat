var api = require("./api_autotest");
var PRELOAD_INTERVAL = 30;
var PRELOAD_AMOUNT = 10;
var completed = 0;

var query = {
	$and : [
		{ type : { $ne : "legalentity" }},
		{ type : { $ne : "visitor" }},
		{ type : { $ne : "testing" }}
	]
};

function preload(qrid, i, maxlen) {
	api.action_cert("password_change_master", {
		password : "asdf",
		qrid : qrid
	}, "master_cert", function (res) {
		if (res == "ok") {
			console.log("Password change of", qrid, "completed, number", i);
			completed++;
		} else {
			console.log("WARNING: Error password changing", qrid, "number", i, res);
		}

		if (completed == maxlen) {
			console.log("All accounts successfully password-changed!");
			process.exit(0);
		}
	});
}

api.action_cert("students_get", {
	query : query,
	fields : { "qrid" : 1 }
}, "admin_cert", function (list) {
	var i = 0;
	var interval = setInterval(function () {
		if (!list[i]) {
			return;
			clearInterval(interval);
		}
		preload(list[i].qrid, i, list.length);
		i++;
	}, PRELOAD_INTERVAL);
});

