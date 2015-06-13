var current_qrid = null;

handleIdentifyAnswer = function(sectionref, st) {
	current_qrid = st.qrid;
};

function datetime_readable (datestring) {
	var d = new Date(datestring);
	return d.getDate() + "." + (d.getMonth() + 1) + ". " +
		("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
}

function render_transactions (tr, balance) {
	var table = $("#transactions_table");
	$("#balance").text(balance.toFixed(2).replace(".", ",") + " HGC");

	table.html("");

	var bal_now = 0;
	for (var i = tr.length - 1; i >= 0; i--) {
		var t = tr[i];
		var is_sender = (t.sender.qrid === current_qrid);
		var is_recipient = (t.recipient.qrid === current_qrid);
		var comment = "(kein Kommentar)";
		if (t.comment)
			comment = t.comment.replace(/\n/g, "<br/>");

		// Corner case: Tax income account makes non-taxfree transaction and
		// receives tax income from itself
		if (t.transformed_taxinc && is_sender) is_sender = false;

		/* Also handle transactions to yourself - even though that doesn't event
			make any sense */
		if (is_sender) bal_now -= t.amount_sent;
		if (is_recipient) bal_now += t.amount_received;

		var description = "Veraltet";
		if (is_sender) description = "Zahlung";
		if (is_recipient) description = "Eingang";
		if (is_sender && is_recipient) description = "Unsinn";

		table.append($('<tr class="' + (is_sender ? "dec" : "inc") + '">')
			.append($('<td class="trt_type">')
				.text(description))
			.append($('<td class="trt_time">')
				.text(datetime_readable(t.time)))
			.append($('<td class="trt_amount_sent num">')
				.text(t.amount_sent.toFixed(2).replace(".", ",")))
			.append($('<td class="trt_amount_received num">')
				.text(t.amount_received.toFixed(2).replace(".", ",")))
			.append($('<td class="trt_amount_tax num">')
				.text(t.amount_tax.toFixed(2).replace(".", ",")))
			.append($('<td class="trt_tax_percent">')
				.text(t.percent_tax))
			.append($('<td class="trt_sender" data-listid="' + i + '">')
				.text(t.sender.qrid))
			.append($('<td class="trt_recipient" data-listid="' + i + '">')
				.text(t.recipient.qrid))
			.append($('<td class="trt_comment" data-listid="' + i + '">')
				.text("Anzeigen"))
			.append($('<td class="trt_balance num">')
				.text((Math.round(bal_now * 100) / 100).toFixed(2).
					replace(".", ",") + " HGC"))
		);
	}

	$(".trt_comment").webuiPopover({
		title : "Kommentar",
		trigger : "hover",
		placement : "left",
		content : '<div class="comment_popup"></div>'
	});

	$(".trt_recipient").webuiPopover({
		title : "Empfänger",
		trigger : "hover",
		placement : "left",
		content : '<div class="recipient_popup"></div>'
	});

	$(".trt_sender").webuiPopover({
		title : "Absender",
		trigger : "hover",
		placement : "left",
		content : '<div class="sender_popup"></div>'
	});

	$(".trt_comment").hover(function () {
		var listid = parseInt($(this).data("listid"));
		setTimeout(function () {
			$(".comment_popup").text(tr[listid].comment);
		}, 100);
	});

	$(".trt_recipient").hover(function () {
		var listid = parseInt($(this).data("listid"));
		setTimeout(function () {
			$(".recipient_popup").text(student2readable(tr[listid].recipient));
		}, 100);
	});

	$(".trt_sender").hover(function () {
		var listid = parseInt($(this).data("listid"));
		setTimeout(function () {
			$(".sender_popup").text(student2readable(tr[listid].sender));
		}, 100);
	});

	table.prepend($("<tr>")
		.append($('<th class="trt_type">')
			.text("Typ"))
		.append($('<th class="trt_time">')
			.text("Zeit"))
		.append($('<th class="trt_amount_sent">')
			.text("Brutto"))
		.append($('<th class="trt_amount_received">')
			.text("Netto"))
		.append($('<th class="trt_amount_tax">')
			.text("Steuer"))
		.append($('<th class="trt_tax_percent">')
			.text("Steuer %"))
		.append($('<th class="trt_sender">')
			.text("Sender"))
		.append($('<th class="trt_receiver">')
			.text("Empfänger"))
		.append($('<th class="trt_comment">')
			.text("Kommentar"))
		.append($('<th class="trt_balance">')
			.text("Kontostand"))
	);
}

$("#balance_box_ok").click(function () {
	$("#balance_box").fadeOut();
	resetAll();
});

$(".confirm").click(function () {
	// Check for client errors
	if (!current_qrid) {
		errorMessage("Keine Person angegeben. Wessen Kontoauszug soll" +
			" angezeigt werden?");
		return;
	}

	var password = $(".password").val();

	var data = {
		qrid : current_qrid,
		password : password,
		amount : -1
	};

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
			errorMessage("Unbekannter Fehler: " + res + "<br/>" +
				"Bitte melde diesen Fehler bei der Zentralbank.");
			return;
		}

		action("get_last_transactions", data, function (tr) {
			if (typeof tr !== "object") {
				errorMessage("Unbekannter Fehler: " + tr + "<br/>" +
					"Bitte melde diesen Fehler bei der Zentralbank.");
				return;
			}

			$("#input_all").hide();
			render_transactions(tr, balance);
			$("#transactions").fadeIn();
		});
	});

	setTimeout(function () {
		if (!server_answered)
			errorMessage("Das Währungssystem ist zurzeit nicht verfügbar." +
				"Bitte versuche es später noch einmal.");
	}, 1500);
});
