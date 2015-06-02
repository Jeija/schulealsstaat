function datetime_readable (datestring) {
	var d = new Date(datestring);
	return d.getDate() + "." + (d.getMonth() + 1)
		+ " " + ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
}

function render_students(list) {
	// Sort list by lastname
	list.sort(function (a, b) {
		if (a.lastname < b.lastname) return -1;
		if (a.lastname > b.lastname) return 1;
		return 0;
	});

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
		var begin = rome($("#time_begin")[0]).getDate().getTime();
		var end = rome($("#time_end")[0]).getDate().getTime();
		var spec = calc_checkin_time(st, begin, end);
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
		action_cert("students_get", condition, "admin_cert", function (res) {
			render_students(res);
		});
	});

	$("#details_close").click(function () {
		$(this).hide();
		$("#details_popup").fadeOut();
	});
});
