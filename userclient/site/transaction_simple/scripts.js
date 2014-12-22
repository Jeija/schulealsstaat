var ZBARCAM = "zbarcam";
var WEBCAM = "/dev/video0";
var ZBC_FLAGS = "--prescale=640x480"
var COMMENT_MAXLEN = 300

var process = require("child_process");

$(function () {
	action("config_get", "tr_comment_maxlen", function (res) {
		if (res != "") COMMENT_MAXLEN = parseInt(res);
	});

	$("#header").load("../header.html", function () {
		$("#transaction_simple_link").addClass("link-selected");
	});

	$(".qrcode_scan").click(function () {
		process.exec("killall " + ZBARCAM, function () {
			var zbar = process.exec(ZBARCAM + " " + WEBCAM + " " + ZBC_FLAGS);

			zbar.stdout.on("data", function (read) {
				zbar.kill();
			});
		});
	});

	$(".comment").on("input", function () {
		if ($(".comment").val().length > COMMENT_MAXLEN) {
			$(this).css("box-shadow", "0 0 10px #f33");
			$(".comment_info").css("color", "#f00");
		} else {
			$(this).css("box-shadow", "none");
			$(".comment_info").css("color", "#fff");
		}
	});

	/* Sender */
	$(".name_ok").click(function () {
		// Get Sections
		var incomplete = $(this).closest(".section_incomplete");
		var complete = incomplete.siblings(".section_complete");

		// Retrieve property values from inputs
		var firstname = $(this).closest(".section").find(".firstname").val();
		var lastname = $(this).closest(".section").find(".lastname").val();
		var type = $(this).closest(".section").find(".class").val().toLowerCase();
		var data = {}
		if (firstname != "") data.firstname = firstname;
		if (lastname != "") data.lastname = lastname;
		if (type != "") data.type = type;

		// Ask server for identification of studnet by inputs
		action("student_identify", JSON.stringify(data), function (res) {
			if (res == "multiple") {
				// ambiguous data
				return;
			}

			try {
				var st = JSON.parse(res);
	
				complete.html(st.firstname + " " + st.lastname
					+ ", Klasse " + st.type.toUpperCase());
				incomplete.css("transform", "rotateY(180deg)");
				complete.css("transform", "rotateY(0deg)");

				setTimeout(function () {
					incomplete.height(incomplete.css("height"));
					incomplete.height(0);
				}, 300);
			} catch (e) {
				// Not found
				return;
			}
		});
	});
});
