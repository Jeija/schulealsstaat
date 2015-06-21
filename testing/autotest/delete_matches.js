var api = require("./api_autotest");
var DELETE_INTERVAL = 30;
var completed = 0;

var query = {
	type : "visitor"
};

function delstudent(qrid, i, maxlen) {
	api.action_cert("student_delete", qrid, "master_cert", function (res) {
		if (res == "ok") {
			console.log("Deleting", qrid, "completed, number", i);
			completed++;
		} else {
			console.log("WARNING: Error deleting", qrid, "number", i, res);
		}

		if (completed == maxlen) {
			console.log("All matching accounts successfully deleted!");
			process.exit(0);
		}
	});
}

api.action_cert("students_get", {
	query : query,
	fields : { "qrid" : 1 }
}, "admin_cert", function (list) {
	if (list.length === 0) {
		console.log("No matches found!");
		return;
	}
	var i = 0;
	var interval = setInterval(function () {
		if (!list[i]) {
			return;
			clearInterval(interval);
		}
		delstudent(list[i].qrid, i, list.length);
		i++;
	}, DELETE_INTERVAL);
});

