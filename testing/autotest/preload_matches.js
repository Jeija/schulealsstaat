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
	api.action_cert("spawn_money", {
		amount : PRELOAD_AMOUNT,
		recipient : qrid,
		comment : "Startguthaben"
	}, "master_cert", function (res) {
		if (res == "ok") {
			console.log("Preload of", qrid, "completed, number", i);
			completed++;
		} else {
			console.log("WARNING: Error preloading", qrid, "number", i);
		}

		if (completed == maxlen) {
			console.log("All accounts successfully preloaded!");
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

