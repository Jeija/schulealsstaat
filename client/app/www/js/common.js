function student2readable(st) {
	if (!st.type) return "Kontonummer '" + st.qrid + "'";

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

/**
 * action_app(name, payload, cb, cb_error)
 * Same as action(name, payload, cb),
 * but also handles connection errors
 */
function action_app(name, payload, cb, cb_error) {
	action(name, payload, function (res, status) {
		if (status == ERROR) {
			errorMessage("Verbindung zum Zentralbank-Server konnte nicht" +
				" aufgebaut werden (" + status + ")");
			if (cb_error) cb_error(status);
		} else if (status == ERROR_UNKNOWN) {
			errorMessage("Der Zentralbank-Server antwortet nicht auf die Anfrage" +
				" der App (" + status + ")");
			if (cb_error) cb_error(status);
		} else if (status == ERROR_SPOOF) {
			errorMessage("Konnte nicht mit dem echten Zentralbank-Server" +
				" kommunizieren. Bitte melde diesen Fehler! (" + status + ")");
			if (cb_error) cb_error(status);
		} else if (status == ERROR_ENCRYPTION) {
			errorMessage("Kommunikation mit Zentralbank-Server fehlgeschlagen: " +
				"Verschlüsselung nicht akzeptiert. Bitte schaue nach Updates " + 
				"für die App und lösche deinen Browsercache. " +
				"Besteht das Problem weiterhin, bitte melde es bei der Zentralbank.");
			if (cb_error) cb_error(status);
		} else if (status == SUCCESS_INTRANET || status == SUCCESS_INTERNET) {
			if (cb) cb(res);
		} else {
			errorMessage("Unbekannter Server-API-Statuscode: " + status);
			if (cb_error) cb_error(status);
		}
	});
}

function QridScan(cb) {
	if (typeof cordova !== "undefined" && cordova.plugins.barcodeScanner) {
		// Use native barcodeScanner (e.g. android)
		cordova.plugins.barcodeScanner.scan(
			function (result) {
				if (result.cancelled) return;
				if (result.format != "QR_CODE") {
					errorMessage("Ungültiger Code!");
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

function update_balance(cb) {
	var req = {
		password : storage.get("password"),
		qrid : storage.get("qrid")
	};

	action("get_balance", req, function (res) {
		var balance = parseFloat(res);
		if (isNaN(balance) || !balance) return;
		storage.set("balance", res);
		if (cb) cb();
	});
}

function errorMessage(message) {
	var error_dialog = $('<div id="error">').appendTo("body");
	$('<div id="error_heading">').text("Fehler").appendTo(error_dialog);
	$('<div id="error_message">').text(message).appendTo(error_dialog);
	var error_bottombuttons = $('<div class="bottombuttons">').appendTo(error_dialog);
	var error_ok = $('<a class="button full warning">').text("OK").appendTo(error_bottombuttons);
	error_ok.click(function () {
		error_dialog.remove();
	});	
}

function longpolling() {
	// Long-poll for new transactions
	Notification.requestPermission();
	var polling_active = false;

	setInterval(function () {
		if (polling_active) return;
		polling_active = true;

		if (!storage.get("qrid")) return;
		if (storage.get("password") === undefined) return;

		var last_sync = storage.get("last_sync");
		if (!last_sync) last_sync = 0;

		action_poll("transactions_poll", {
			qrid : storage.get("qrid"),
			password : storage.get("password"),
			date : last_sync
		}, function (res) {
			setTimeout(function () {
				polling_active = false;
			}, 300);

			// No visible reporting here, this is a background process
			if (typeof res !== "object") {
				console.log("polling error: " + res);
				return;
			}
			if (!res || res.length <= 0 || !res[0]) return;

			var new_sync = Date.parse(res[0].time);
			storage.set("last_sync", new_sync);
			update_balance();

			// Push notification
			res.forEach(function (tr) {
				new Notification("Du hast " + tr.amount_received.toFixed(2)
					+ " HGC von '" + student2readable(tr.sender)
					+ "' erhalten.", {
						icon : "res/icon128.png"
					});
			});
		});
	}, 3000);
	// (interval of 3000ms so that the app doesn't DoS the server in case it happens to close
	// the connection instantly)
	// Also, only start polling after having been on the page for 3000 ms, otherwise the app
	// would constantly create new polling requests when navigating

}

$(function () {
	var showbuttons = true;

	// Hide bottom box when focusing on textbox (--> keyboard visible)
	$('input[type="text"], input[type="password"], textarea, input[type="number"]').focus(function () {
		showbuttons = false;
		$(".bottombuttons").hide();
	});

	$('input[type="text"], input[type="password"], textarea, input[type="number"]').focusout(function () {
		showbuttons = true;
		setTimeout(function () {
			if (showbuttons) $(".bottombuttons").show();
		}, 500);
	});

	// On forms, when press the Go / Enter button on the keyboard, lose focus on the
	// text field to show buttons at bottom
	$(".losefocus").keypress(function (e) {
		if (e.which == 13) {
			$(".losefocus input").blur();
			$(".losefocus textarea").blur();
			return false;
		}
	});

	// Restart longpolling session since page has been changed
	if ("Notification" in window)
		longpolling();
});
