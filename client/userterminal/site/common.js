var ZBARCAM = "zbarcam";
var WEBCAM = "/dev/video20";
var ZBC_FLAGS = "--prescale=640x480";

var process = null;
var fs = null;

// Only in node.js (nwjs) environment
if (typeof require !== "undefined") {
	process = require("child_process");
	fs = require("fs");
}

/* Common utils */
function student2readable(st) {
	if (!st.type) return "Keine genaue Beschreibung verfügbar";

	if (st.type != "visitor" && st.type != "teacher" && st.type != "legalentity" &&
			st.type != "other")
		return st.firstname + " " + st.lastname + ", Klasse " + st.type.toUpperCase();

	if (st.type == "visitor")
		return "Besucher mit Kontonummer " + st.qrid;

	if (st.type == "teacher")
		return st.firstname + " " + st.lastname + " (Lehrer/Lehrerin)";

	if (st.type == "legalentity")
		return st.special_name + " (juristische Person)";

	if (st.type == "other")
		return st.firstname + " " + st.lastname;

	return st.firstname + "/" + st.lastname + "/" + st.type + "/" + st.special_name;
}


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
		if (res !== "") cb(res);
	});
}

function resetAll() {
	if ($("#form_all")[0]) $("#form_all")[0].reset();
	window.scrollTo(0, 0);
	load_subdir($(".link-selected").data("subdir"));
}

function student_identify(data, sectionref, cb) {
	// Get Sections
	var incomplete = $(sectionref).closest(".section_incomplete");
	var complete = incomplete.siblings(".section_complete");

	// Ask server for identification of student by inputs
	action("student_identify", data, function (st) {
		if (st === "multiple") {
			errorMessage("Die Eingabe ist nicht eindeutig:<br/>" +
				"Es gibt mehrere Personen, die auf die Kriterien passen.");
			return;
		}

		if (typeof st !== "object") {
			errorMessage("Konnte Person nicht finden:<br/>" +
				"Die angegebenen Kriterien passen auf keine Person.");
			return;
		}

		complete.text(student2readable(st));
		incomplete.css("transform", "rotateY(180deg)");
		complete.css("transform", "rotateY(0deg)");

		setTimeout(function () {
			incomplete.height(incomplete.css("height"));
			incomplete.height(0);
		}, 300);

		cb(st);
	});
}

function load_common_events() {
	// Disable dragging
	$("img").on("dragstart", function(e) {
		e.preventDefault();
	});

	$(".studentselector").load("section_student.html", function () {
		/* Student by QR Code Scan */
		$(".qrcode_scan").off("click").on("click", function () {
			// Non-node.js environment
			if (!process) return;
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
		$(".name_ok").off("click").on("click", function () {
			// Retrieve property values from inputs
			var firstname = $(this).closest(".section").find(".firstname").val();
			var lastname = $(this).closest(".section").find(".lastname").val();
			var type = $(this).closest(".section").find(".class").val();
			var data = {};
			if (firstname !== "") data.firstname = firstname;
			if (lastname !== "") data.lastname = lastname;
			if (type !== "") data.type = type;

			var sectionref = this;
			student_identify(data, sectionref, function (st) {
				handleIdentifyAnswer(sectionref, st);
			});
		});

		/* Student by QR Code Input */
		$(".qrid_ok").off("click").on("click", function () {
			var sectionref = this;
			student_identify({qrid : $(this).siblings(".qrid").val()}, this, function (st) {
				handleIdentifyAnswer(sectionref, st);
			});
		});

		/* MessageBox */
		$("#messagebox_ok").off("click").on("click", function () {
			$("#messagebox").fadeOut();
		});

		/* Success MessageBox */
		$("#success_ok").off("click").on("click", function () {
			$("#success").fadeOut();
			resetAll();
		});

		/* Change sender / recipient value */
		$(".section_complete").off("click").on("click", function () {
			// Get Sections
			var complete = $(this);
			var incomplete = complete.siblings(".section_incomplete");

			complete.html("");
			incomplete.css("transform", "rotateY(0deg)");
			complete.css("transform", "rotateY(-180deg)");

			incomplete.height("auto");
		});

		/* Cancel */
		$(".cancel").off("click").on("click", resetAll);

		// Show page when finished loading:
		$("#page").fadeIn(300);

		if (!fs || !fs.existsSync(WEBCAM)) {
			$(".by_qr").hide();
			$(".or.left").hide();
		}
	});
}
