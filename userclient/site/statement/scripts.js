var current_qrid = undefined;

handleIdentifyAnswer = function(sectionref, st) {
	current_qrid = st.qrid;
}

function datetime_readable (datestring) {
	var d = new Date(datestring);
	return d.getDate() + "." + (d.getMonth() + 1)
		+ " " + ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
}

function render_transactions (tr) {
	var table = $("#transactions_table");
	table.html("");
	table.append($("<tr>")
		.append($('<th class="trt_type">')
			.text("Typ"))
		.append($('<th class="trt_time">')
			.text("Zeit"))
		.append($('<th class="trt_amount_sent">')
			.text("Brutto"))
		.append($('<th class="trt_amount_received">')
			.text("Netto"))
		.append($('<th class="trt_amount_tax">')
			.text("FTT"))
		.append($('<th class="trt_tax_percent">')
			.text("FTT %"))
		.append($('<th class="trt_sender">')
			.text("Sender"))
		.append($('<th class="trt_receiver">')
			.text("Empfänger"))
		.append($('<th class="trt_comment">')
			.text("Kommentar"))
		.append($('<th class="trt_balance">')
			.text("Kontostand"))
	);

	for (var i = 0; i < tr.length; i++) {
		var t = tr[i];

		table.append($('<tr class="' + (t.sender == current_qrid ? "dec" : "inc") + '">')
			.append($('<td class="trt_type">')
				.text((t.sender === current_qrid) ? "Zahlung" : "Eingang"))
			.append($('<td class="trt_time">')
				.text(datetime_readable(t.time)))
			.append($('<td class="trt_amount_sent">')
				.text(t.amount_sent))
			.append($('<td class="trt_amount_received">')
				.text(t.amount_received))
			.append($('<td class="trt_amount_tax">')
				.text(t.amount_tax))
			.append($('<td class="trt_tax_percent">')
				.text(t.percent_tax))
			.append($('<td class="trt_sender">')
				.text(t.sender))
			.append($('<td class="trt_receiver">')
				.text(t.recipient))
			.append($('<td class="trt_comment">')
				.text(t.comment))
		);
	}
}

$(function () {
	$("#header").load("../header.html", function () {
		$("#statement_link").addClass("link-selected");
	});

	$("#balance_box_ok").click(function () {
		$("#balance_box").fadeOut();
		resetAll();
	});

	$(".confirm").click(function () {
		// Check for client errors
		if (!current_qrid) { FIXME
			errorMessage("Keine Person angegeben. Wessen Kontoauszug soll"
				+ " angezeigt werden?");
			return;
		}

		var password = $(".password").val();

		var data = {
			qrid : current_qrid,
			password : password,
			amount : -1
		};

		// TODO include balance in bank statement
		/*action("get_balance", JSON.stringify(data), function (res) {
			var balance = parseFloat(res);
			if (res.indexOf("error") > -1 || isNaN(res)) {
				errorMessage("Unbekannter Fehler: " + res + "<br/>"
					+ "Bitte melde diesen Fehler bei der Zentralbank.");
				return;
			}
		});*/

		var server_answered = false;
		action("get_last_transactions", JSON.stringify(data), function (res) {
			server_answered = true;

			// Check for server errors
			if (res == "invalid_password") {
				errorMessage("Das Passwort ist falsch.");
				return;
			}

			// Try to parse transactions JSON or report error
			var tr = undefined;
			try {
				tr = JSON.parse(res);
			} catch(e) {
				errorMessage("Unbekannter Fehler: " + res + "<br/>"
					+ "Bitte melde diesen Fehler bei der Zentralbank.");
				return;
			}

			$("#input_all").hide();
			render_transactions(tr);
			$("#transactions").fadeIn();
		});

		setTimeout(function () {
			if (!server_answered)
				errorMessage("Das Währungssystem ist zurzeit nicht verfügbar."
				+ "Bitte versuche es später noch einmal.");
		}, 1500);
	});
});
