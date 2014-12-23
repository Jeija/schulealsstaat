var ZBARCAM = "zbarcam";
var WEBCAM = "/dev/video0";
var ZBC_FLAGS = "--prescale=640x480"
var COMMENT_MAXLEN = 300
var HGC_DECIMAL_PLACES = 5

//var process = require("child_process");

// Will be set to QR-ID values when student_identify is called for the relevant section
var current_sender = undefined;
var current_recipient = undefined;

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

function student_identify(data, sectionref) {
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

			if ($(complete).parent(".recipient").length) current_recipient = st.qrid;
			if ($(complete).closest(".sender").length) current_sender = st.qrid;
	
			complete.html(st.firstname + " " + st.lastname
				+ ", Klasse " + st.type.toUpperCase());
			incomplete.css("transform", "rotateY(180deg)");
			complete.css("transform", "rotateY(0deg)");

			setTimeout(function () {
				incomplete.height(incomplete.css("height"));
				incomplete.height(0);
			}, 300);
		} catch (e) {
			errorMessage("Konnte Person nicht finden:<br/>"
				+ "Die angegebenen Kriterien passen auf keine Person.");
			return;
		}
	});
}

$(function () {
	getConfig("tr_comment_maxlen", function (res) {
		COMMENT_MAXLEN = parseInt(res);
	});

	getConfig("hgc_decimal_places", function (res) {
		HGC_DECIMAL_PLACES = parseInt(res);
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

	/* Confirm */
	$(".confirm").click(function () {
		this.disabled = true;

		if (!current_sender) {
			errorMessage("Der Absender fehlt:<br/>"
				+ "Für jede Transaktion muss ein Absender angegeben werden.");
			return;
		}

		if (!current_recipient) {
			errorMessage("Der Empfänger fehlt:<br/>"
				+ "Für jede Transaktion muss ein Empfänger angegeben werden.");
			return;
		}

		var amount_str = $(".amount").val();
		amount_str.replace(",", ".");

		// Check if amount is parsable
		if (!$.isNumeric(amount_str)) {
			errorMessage("Betrag ist ungültig:<br/>"
			+ "Gültige Wert sind z.B.: 1,5 15.3 12e-2 0xa5");
			return;
		}

		var amount = parseFloat(amount_str);

		// Check if amount has more than HGC_DECIMAL_PLACES decimals
		if ((amount * Math.pow(10, HGC_DECIMAL_PLACES)) % 1 != 0) {
			errorMessage("Betrag enthält mehr als die erlaubten " + HGC_DECIMAL_PLACES
				+ " Dezimalstellen.");
			return;
		}

		var comment = $(".comment").val();
		var password = $(".password").val();

		var data = {
			sender : current_sender,
			sender_password : password,
			recipient : current_recipient,
			amount_sent : amount,
			comment : comment
		}

		var server_answered = false;
		action("transaction", JSON.stringify(data), function (res) {
			server_answered = true;
			switch(res) {
				case "ok":
					$("#success").fadeIn();
					$(".confirm").attr("disabled", false);
					break;

				case "nomoney":
					errorMessage("Der Sender hat nicht genug Geld"
						+ " auf seinem Account.");
					break;

				case "invalid_password":
					errorMessage("Das Passwort ist falsch.");
					break;

				case "invalid_amount":
					errorMessage("Der Betrag muss über 0 liegen.");
					break;

				case "comment_too_long":
					errorMessage("Der Länge des Kommentars überschreitet die "
						+ "zugelassenen " + COMMENT_MAXLEN + " Zeichen.");
					break;

				default:
					errorMessage("Unbekannter Fehler: " + res + "<br/>"
						+ "Bitte melde diesen Fehler bei der Zentralbank.");
					break;
			}
		});

		setTimeout(function () {
			if (!server_answered)
				errorMessage("Das Währungssystem ist zurzeit nicht verfügbar."
				+ "Bitte versuche es später noch einmal.");
		}, 1500)
	});

	/* Cancel */
	$(".cancel").click(resetAll);
});
