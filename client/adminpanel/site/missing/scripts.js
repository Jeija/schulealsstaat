function datetime_readable (datestring) {
	var d = new Date(datestring);
	return d.getDate() + "." + (d.getMonth() + 1)
		+ " " + ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
}

/**
 * Calculate the time a student was checked in witin the selected period
 * \param st The student to calculate the value for, whole db entry
 * \return time the student spent checked in in seconds, rounded
 */
function calc_checkin_time(st) {
	var begin = rome($("#time_begin")[0]).getDate().getTime();
	var end = rome($("#time_end")[0]).getDate().getTime();

	// Deep-copy array
	var checks = JSON.parse(JSON.stringify(st.appear));
	for (var i = 0; i < checks.length; i++) {
		// Store relative time values to checkin in seconds
		checks[i].time = (Date.parse(checks[i].time) - begin) / 1000;
	}

	// Sort checks array: later apperances to the higher indices
	checks.sort(function(a, b) {
		return a.time - b.time;
	});

	// Intervals in which the student was checked in
	var intervals = [];

	// Find first negative check time (--> status of student at checkin)
	// to determine wheter the student was checked in at the beginning
	var is_checkedin = false;		// Stores wheter student is inside at current iteration
	var last_check_before_begin = -1;	// Stores ID of last checkin with appear.time < begin
	var current_interval = 0;		// Stores ID of current interval, increment on checkout

	for (var i = checks.length - 1; i >= 0; i--) {
		if (checks[i].time < 0) {
			last_check_before_begin = i;
			if (checks[i].type == "checkin") {
				intervals[current_interval] = { checkin : 0 };
				is_checkedin = true;
			}
			break;
		}
	}

	var endtime_relative = (end - begin) / 1000;

	// Go through all check in / out events after begin and put them in the intervals table
	for (var i = last_check_before_begin + 1; i < checks.length; i++) {
		// Begin - End range has ended
		if (checks[i].time > endtime_relative) break;

		// Student is outside and checks in, add new interval
		if (checks[i].type == "checkin" && !is_checkedin) {
			intervals[current_interval] = { checkin : checks[i].time };
			is_checkedin = true;
		}

		// Student is inside and checks out, finish interval and go to next one
		if (checks[i].type == "checkout" && is_checkedin) {
			intervals[current_interval].checkout = checks[i].time;
			is_checkedin = false;
			current_interval++;
		}
	}

	// Finish interval ("force-checkout" when begin-end range ends)
	if (is_checkedin) {
		intervals[current_interval].checkout = endtime_relative;
	}

	// Add up all intervals to determine time of student spend inside in the begin-end range
	var time_inside = 0;
	for (var i = 0; i < intervals.length; i++) {
		time_inside += intervals[i].checkout - intervals[i].checkin;
	}

	return { time : Math.round(time_inside), present_at_end : is_checkedin };
}

function render_students(list) {
	$("#studentlist").html("");
	$("#studentlist").append($("<tr>")
		.append($("<th>")
			.text("Vorname"))
		.append($("<th>")
			.text("Nachname"))
		.append($("<th>")
			.text("Klasse"))
		.append($("<th>")
			.text("Anwesenheit (Minuten)"))
		.append($("<th>")
			.text("Am Ende"))
	);

	for (var i = 0; i < list.length; i++) {
		var st = list[i];

		// In minutes, rounded up
		var spec = calc_checkin_time(st);
		var checkin_time = Math.ceil(spec.time / 60);
		var present_at_end = spec.present_at_end;

		var group = "";
		if (checkin_time >= $("#selector_time").val()) {
			group = "ok";
			if ($("#selector_missingonly").is(":checked")) continue;
		} else if (checkin_time > 0) {
			group = "wasthere";
		} else {
			group = "notthere";
		}

		$("#studentlist").append($('<tr class="student ' + group + '" data-studentid="'
			+ i + '">')
			.append($("<td>")
				.text(st.firstname))
			.append($("<td>")
				.text(st.lastname))
			.append($("<td>")
				.text(st.type))
			.append($("<td>")
				.text(checkin_time))
			.append($('<td class="' + (present_at_end ? "end_present" : "end_notpresent") + '">')
				.text(present_at_end ? "Anwesend" : "Abwesend"))
		);
	}

	$(".student").click(function() {
		var studentid = $(this).data("studentid");
		var st = list[studentid];

		$("#details").html("");
		$("#details_popup").fadeIn();
		$("#details_close").show();

		$("#details").append($("<tr>")
			.append($("<th>")
				.text("Zeit"))
			.append($("<th>")
				.text("Typ"))
		);

		// Sort checks array: later apperances to the higher indices
		var checks = JSON.parse(JSON.stringify(st.appear));
		checks.sort(function(a, b) {
			return new Date(a.time) - new Date(b.time);
		});
		for (var i = 0; i < checks.length; i++) {
			var type = ((checks[i].type == "checkin") ? "Check In" : "Check Out");

			$("#details").append($('<tr class="detail_' + checks[i].type + '">')
				.append($("<td>")
					.text(datetime_readable(checks[i].time)))
				.append($("<td>")
					.text(type))
			);
		}
	});
}

$(function () {
	render_students([]);

	rome($("#time_begin")[0], {
		dateValidator: rome.val.beforeEq($("#time_end")[0]),
		timeValidator: rome.val.beforeEq($("#time_end")[0]),
		timeInterval: 300
	});

	rome($("#time_end")[0], {
		dateValidator: rome.val.afterEq($("#time_begin")[0]),
		timeValidator: rome.val.afterEq($("#time_begin")[0]),
		timeInterval: 300
	});

	$("#query").click(function () {
		// Load all students matching the given type
		var condition = {
			query : {
				type : $("#selector_class").val()
			},
			fields : {"firstname" : 1, "lastname" : 1, "type" : 1, "appear" : 1}
		};
		action_cert("get_students", condition, "admin_cert", function (res) {
			render_students(res);
		});
	});

	$("#details_close").click(function () {
		$(this).hide();
		$("#details_popup").fadeOut();
	});
});
