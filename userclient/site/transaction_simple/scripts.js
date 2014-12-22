var ZBARCAM = "zbarcam";
var WEBCAM = "/dev/video0";
var ZBC_FLAGS = "--prescale=640x480"
var COMMENT_MAXLEN = 300

var process = require("child_process");

function student_identify(data, sectionref) {
	// Get Sections
	var incomplete = $(sectionref).closest(".section_incomplete");
	var complete = incomplete.siblings(".section_complete");

	// Ask server for identification of student by inputs
	action("student_identify", JSON.stringify(data), function (res) {
		if (res == "multiple") {
			$("#messagebox_msg").html("Die Eingabe ist nicht eindeutig:<br/>"
				+ "Es gibt mehrere Personen, die auf die Kriterien passen.");
			$("#messagebox").fadeIn();
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
			$("#messagebox_msg").html("Konnte Person nicht finden:<br/>"
				+ "Die angegebenen Kriterien passen auf keine Person.");
			$("#messagebox").fadeIn();
			return;
		}
	});
}

$(function () {
	action("config_get", "tr_comment_maxlen", function (res) {
		if (res != "") COMMENT_MAXLEN = parseInt(res);
	});

	$("#header").load("../header.html", function () {
		$("#transaction_simple_link").addClass("link-selected");
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

	/* Student by QR Code Scan */
	$(".qrcode_scan").click(function () {
		var sectionref = this;
		process.exec("killall " + ZBARCAM, function () {
			var zbar = process.exec(ZBARCAM + " " + WEBCAM + " " + ZBC_FLAGS);

			zbar.stdout.on("data", function (read) {
				zbar.kill();
				student_identify({qrid : read}, sectionref);
			});
		});
	});

	/* Student by firstname / lastname / type */
	$(".name_ok").click(function () {
		// Retrieve property values from inputs
		var firstname = $(this).closest(".section").find(".firstname").val();
		var lastname = $(this).closest(".section").find(".lastname").val();
		var type = $(this).closest(".section").find(".class").val();
		var data = {}
		if (firstname != "") data.firstname = firstname;
		if (lastname != "") data.lastname = lastname;
		if (type != "") data.type = type;

		student_identify(data, this);
	});

	/* Student by QR Code Input */
	$(".qrid_ok").click(function () {
		student_identify({qrid : $(this).siblings(".qrid").val()}, this);
	});

	/* MessageBox */
	$("#messagebox_ok").click(function () {
		$("#messagebox").fadeOut();
	});

	/* Change sender / recipient value */
	$(".section_complete").click(function () {
		// Get Sections
		var complete = $(this);
		var incomplete = complete.siblings(".section_incomplete");

		complete.html("");
		incomplete.css("transform", "rotateY(0deg)");
		complete.css("transform", "rotateY(-180deg)");

		incomplete.height("auto");
	});
});
