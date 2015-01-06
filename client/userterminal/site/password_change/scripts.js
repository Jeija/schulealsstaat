var current_qrid = undefined;

handleIdentifyAnswer = function(sectionref, st) {
	current_qrid = st.qrid;
}

$(function () {
	$("#header").load("../header.html", function () {
		$("#password_change").addClass("link-selected");
	});

	$(".confirm").click(function () {
		// Check for client errors
		if (!current_qrid) {
			errorMessage("Keine Person angegeben. Wessen Guthaben soll"
				+ " abgefragt werden?");
			return;
		}

		var old_password = $(".old_password").val();
		var new_password1 = $(".new_password1").val();
		var new_password2 = $(".new_password2").val();
		if (new_password1 != new_password2) {
			errorMessage("Die Passwörter stimmen nicht überein!");
			return;
		}

		var data = {
			qrid : current_qrid,
			old_password : old_password,
			password : new_password1
		};

		// Ask server for balance
		var server_answered = false;
		action("password_change", data, function (res) {
			console.log(res);
			server_answered = true;

			// Check for server errors
			if (res == "invalid_password") {
				errorMessage("Das alte Passwort ist falsch.");
				return;
			}

			if (res == "ok") {
				// Success message
				$("#success").fadeIn();
				return;
			}

			errorMessage("Unbekannter Fehler: " + res + "<br/>"
				+ "Bitte melde diesen Fehler bei der Zentralbank.");
		});

		setTimeout(function () {
			if (!server_answered)
				errorMessage("Das Währungssystem ist zurzeit nicht verfügbar. "
				+ "Bitte versuche es später noch einmal.");
		}, 1500);
	});
});
