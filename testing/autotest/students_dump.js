var NUM_QUERIES = 2;

var api = require("./api_autotest");
var i = 0;
var active_queries = 0;

function query() {
	if (active_queries >= NUM_QUERIES) return;
	active_queries++;
	api.action_cert("students_dump", null, "admin_cert", function (res, servertime_ms) {
		i++;
		active_queries--;
		console.log(servertime_ms.toFixed(1));
	});
}
setInterval(query, 5);
