function showError(msg) {
	$("#error_message").text(msg);
	$("#error").fadeIn();
}

function student2readable(st) {
	if (!st.type) return "Keine genaue Beschreibung verfügbar";

	if (st.type != "visitor" && st.type != "teacher" && st.type != "legalentity"
		&& st.type != "other")
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

function QridScan(cb) {
	if (typeof cordova !== "undefined" && cordova.plugins.barcodeScanner) {
		// Use native barcodeScanner (e.g. android)
		cordova.plugins.barcodeScanner.scan(
			function (result) {
				if (result.format != "QR_CODE") {
					alert("Ungültiger Code!");
					return;
				}
				cb(result.text);
			}, 
			function (error) {}
		);
	} else {
		// Use builtin JS QRScanJS Scanner
		var scanner_popup = $('<div id="scanner_popup" hidden>').appendTo("body");
		var scanner_video = $('<video autoplay="true" id="scanner_webcam" width="100%">').appendTo(scanner_popup);
		var scanner_button_container = $('<div class="bottombuttons">').appendTo(scanner_popup);
		var scanner_abort = $('<input type="button" class="button full" id="scanner_abort" value="Abbrechen" />')
			.appendTo(scanner_button_container);
		scanner_popup.fadeIn();
		scanner_abort.click(function () {
			scanner_popup.remove();
		});
		QRReader.init("#scanner_webcam", "QRScanJS/");
		QRReader.scan(function (result) {
			scanner_popup.remove();
			cb(result);
		});
	}
}

function update_balance() {
	var req = {
		password : storage.get("password"),
		qrid : storage.get("qrid")
	};

	action("get_balance", req, function (res) {
		var balance = parseFloat(res);
		if (isNaN(balance) || !balance) return;
		storage.set("balance", res);
	});
}

$(function () {
	$("#error_ok").click(function () {
		$("#error").fadeOut();
	});

	// Hide bottom box when focusing on textbox (--> keyboard visible)
	$('input[type="text"], input[type="password"], textarea, input[type="number"]').focus(function () {
		$(".bottombuttons").hide();
	});

	$('input[type="text"], input[type="password"], textarea, input[type="number"]').focusout(function () {
		$(".bottombuttons").show();
	});
});
