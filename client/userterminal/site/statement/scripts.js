var current_qrid = undefined;

handleIdentifyAnswer = function(sectionref, st) {
	current_qrid = st.qrid;
}

function datetime_readable (datestring) {
	var d = new Date(datestring);
	return d.getDate() + "." + (d.getMonth() + 1)
		+ " " + ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
}

function render_transactions (tr, balance) {
	var table = $("#transactions_table");
	$("#balance").text(balance + " HGC");

	table.html("");

	var bal_now = balance;
	for (var i = tr.length - 1; i >= 0; i--) {
		var t = tr[i];
		var is_sender = (t.sender === current_qrid);
		var comment = "(kein Kommentar)";
		if (t.comment)
			comment = t.comment.replace(/\n/g, "<br/>");

		table.prepend($('<tr class="' + (is_sender ? "dec" : "inc") + '">')
			.append($('<td class="trt_type">')
				.text(is_sender ? "Zahlung" : "Eingang"))
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
			.append($('<td class="trt_sender" data-qrid="' + t.sender + '">')
				.text(t.sender))
			.append($('<td class="trt_recipient" data-qrid="' + t.recipient + '">')
				.text(t.recipient))
			.append($('<td class="trt_comment" data-listid="' + i + '">')
				.text("Anzeigen"))
			.append($('<td class="trt_balance">')
				.text(bal_now))
		);

		bal_now += is_sender ? t.amount_sent : -t.amount_received;
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
		}, 0);
	});

	$(".trt_recipient").hover(function () {
		var qrid = $(this).data("qrid");
		data = { qrid : qrid };
		action("student_identify", JSON.stringify(data), function (res) {
			var st = JSON.parse(res);
			$(".recipient_popup").text(student2readable(st));
		});
	});

	$(".trt_sender").hover(function () {
		var qrid = $(this).data("qrid");
		data = { qrid : qrid };
		action("student_identify", JSON.stringify(data), function (res) {
			var st = JSON.parse(res);
			$(".sender_popup").text(student2readable(st));
		});
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
		if (!current_qrid) {
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

		var server_answered = false;
		action("get_balance", JSON.stringify(data), function (res) {
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

			action("get_last_transactions", JSON.stringify(data), function (res) {
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
				render_transactions(tr, balance);
				$("#transactions").fadeIn();
			});
		});

		setTimeout(function () {
			if (!server_answered)
				errorMessage("Das Währungssystem ist zurzeit nicht verfügbar."
				+ "Bitte versuche es später noch einmal.");
		}, 1500);
	});
});
