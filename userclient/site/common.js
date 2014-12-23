var ZBARCAM = "zbarcam";
var WEBCAM = "/dev/video0";
var ZBC_FLAGS = "--prescale=640x480"

var process = require("child_process");

var handleIdentifyAnswer = function (sectionref, st) {
	// To be re-defined by the script that includes common.js
	// Works as student_identify callback
};

function errorMessage(msg) {
	$("#messagebox_msg").html(msg);
	$("#messagebox").fadeIn();
	$(".confirm").attr("disabled", false);
}

function getConfig(config, cb) {
	action("config_get", config, function (res) {
		if (res != "") cb(res);
	});
}

function resetAll() {
	$('#form_all')[0].reset();
	window.scrollTo(0, 0);
	location.reload();
}

function student_identify(data, sectionref, cb) {
	// Get Sections
	var incomplete = $(sectionref).closest(".section_incomplete");
	var complete = incomplete.siblings(".section_complete");

	// Ask server for identification of student by inputs
	action("student_identify", JSON.stringify(data), function (res) {
		if (res == "multiple") {
			errorMessage("Die Eingabe ist nicht eindeutig:<br/>"
				+ "Es gibt mehrere Personen, die auf die Kriterien passen.");
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

			cb(st);
		} catch (e) {
			errorMessage("Konnte Person nicht finden:<br/>"
				+ "Die angegebenen Kriterien passen auf keine Person.");
			return;
		}
	});
}

$(function () {
	// Disable dragging
	$("img").on("dragstart", function(e) {
		e.preventDefault();
	});

	/* Student by QR Code Scan */
	$(".qrcode_scan").click(function () {
		var sectionref = this;
		process.exec("killall " + ZBARCAM, function () {
			var zbar = process.exec(ZBARCAM + " " + WEBCAM + " " + ZBC_FLAGS);

			zbar.stdout.on("data", function (read) {
				zbar.kill();
				student_identify({qrid : read}, sectionref, function (st) {
					handleIdentifyAnswer(sectionref, st);
				});
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

		var sectionref = this;
		student_identify(data, sectionref, function (st) {
			handleIdentifyAnswer(sectionref, st);
		});
	});

	/* Student by QR Code Input */
	$(".qrid_ok").click(function () {
		var sectionref = this;
		student_identify({qrid : $(this).siblings(".qrid").val()}, this, function (st) {
			handleIdentifyAnswer(sectionref, st);
		});
	});

	/* MessageBox */
	$("#messagebox_ok").click(function () {
		$("#messagebox").fadeOut();
	});

	/* Success MessageBox */
	$("#success_ok").click(function () {
		$("#success").fadeOut();
		resetAll();
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

	/* Cancel */
	$(".cancel").click(resetAll);
});
