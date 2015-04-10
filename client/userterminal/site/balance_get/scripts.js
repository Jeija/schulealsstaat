var current_qrid = undefined;

handleIdentifyAnswer = function(sectionref, st) {
	current_qrid = st.qrid;
}

$("#balance_box_ok").click(function () {
	$("#balance_box").fadeOut();
	resetAll();
});

$(".confirm").click(function () {
	// Check for client errors
	if (!current_qrid) {
		errorMessage("Keine Person angegeben. Wessen Guthaben soll"
			+ " abgefragt werden?");
		return;
	}

	var password = $(".password").val();

	var data = {
		qrid : current_qrid,
		password : password
	};

	// Ask server for balance
	var server_answered = false;
	action("get_balance", data, function (res) {
		server_answered = true;
		// Check for server errors
		if (res == "invalid_password") {
			errorMessage("Das Passwort ist falsch.");
			return;
		}

		var balance = parseFloat(res);
		if (res.indexOf("error") > -1 || isNaN(res)) {
			errorMessage("Unbekannter Fehler: " + res + "<br/>"
				+ "Bitte melde diesen Fehler bei der Zentralbank.");
			return;
		}

		// Write answer to balance messagebox
		$("#balance_box_value").html(balance.toFixed(2).replace(".", ","));
		$("#balance_box").fadeIn();
	});

	setTimeout(function () {
		if (!server_answered)
			errorMessage("Das Währungssystem ist zurzeit nicht verfügbar."
			+ "Bitte versuche es später noch einmal.");
	}, 1500);
});
