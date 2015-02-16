$(function () {
	// [ { reqTime : Timestamp (sec), reqSize : Number (Bytes),
	//     resTime : Timestamp (sec), resSize : Number (Bytes) } ]
	var requests;
	var reqN;
	var resN;
	var beginTime;
	var updateInterval;
	var reqInterval;

	function update_stats () {
		var req_per_sec = reqN / (Date.now() / 1000 - beginTime);
		var res_per_sec = resN / (Date.now() / 1000 - beginTime);
		var perc_res = reqN == 0 ? 0 : resN / reqN * 100;

		// Calculate average response size in bytes
		var total_res_size = 0;
		for (var i = 0; i < reqN; i++) {
			if (requests[i].resSize)
				total_res_size += requests[i].resSize;
		}
		var avg_res_size = resN == 0 ? 0 : total_res_size / resN;

		// Calculate average respone time in seconds
		var total_res_time = 0;
		for (var i = 0; i < reqN; i++) {
			if (requests[i].resTime)
				total_res_time += requests[i].resTime
								- requests[i].reqTime;
		}
		var avg_res_time = resN == 0 ? 0 : total_res_time / resN;

		// Output calculated values to stats table
		$("#req_per_sec").text(req_per_sec);
		$("#res_per_sec").text(res_per_sec);
		$("#perc_res").text(perc_res);
		$("#avg_res_size").text(avg_res_size);
		$("#avg_res_time").text(avg_res_time);
	}

	function reset () {
		reqN = 0;
		resN = 0;
		requests = [];
		beginTime = Date.now() / 1000;
		if (reqInterval) clearInterval(reqInterval);
		if (updateInterval) clearInterval(updateInterval);
		updateInterval = setInterval(function () {
			update_stats();
		}, 100);
	}

	$("#student_identify").click(function () {
		reset();
		var payload = { firstname : "Tux" };
		reqInterval = setInterval(function () {
			var thisn = reqN;
			reqN++;
			requests[thisn] = {};
			requests[thisn].reqTime = Date.now() / 1000;
			requests[thisn].reqSize = JSON.stringify(payload).length;
			action("student_identify", payload, function (res) {
				if (!requests[thisn]) return;
				resN++;
				requests[thisn].resTime = Date.now() / 1000;
				requests[thisn].resSize = JSON.stringify(res).length;
			});
		}, 1);
	});

	$("#students_dump").click(function () {
		reset();
		reqInterval = setInterval(function () {
			var thisn = reqN;
			reqN++;
			requests[thisn] = {};
			requests[thisn].reqTime = Date.now() / 1000;
			requests[thisn].reqSize = 0;
			action_cert("students_dump", null, "admin_cert", function (res) {
				if (!requests[thisn]) return;
				resN++;
				requests[thisn].resTime = Date.now() / 1000;
				requests[thisn].resSize = JSON.stringify(res).length;
			});
		}, 1);
	});

	$("#stop_requests").click(function () {
		if (reqInterval) clearInterval(reqInterval);
	});

	$("#reset").click(reset);
});
