function HGC_readable(val) {
	return (Math.round(val * 100) / 100).toFixed(2);
}

function date_readable(datestring) {
	var d = new Date(datestring);
	return d.getDate() + "." + (d.getMonth() + 1);
}

function time_readable(datestring) {
	var d = new Date(datestring);
	return ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
}

$(function () {
	var balance_updated = false;

	// Wait for PubKey to be downloaded + processed
	setTimeout(function () {
	update_balance(function () {
		balance_updated = true;
	});
	action_app("get_last_transactions", {
		qrid : storage.get("qrid"),
		password : storage.get("password"),
		amount : 10
	}, function (res) {
		if (typeof res != "object") {
			errorMessage("Error: " + res);
			$("#loading").hide();
			$("#statement_container").hide();
			$("#complete").show();
			return;
		}

		var statement = $("#statement");
		statement.html("");

		// No transactions in history
		if (!res.length) {
			$("#loading").fadeOut(200);
			$("#nostatement").fadeIn(200);
			return;
		}

		for (var i = 0; i < res.length; i++) {
			$("#loading").fadeOut();
			$("#complete").fadeIn();
			var trans = res[i];
			var is_sender = (trans.sender.qrid === storage.get("qrid"));

			// Corner case: Tax income account makes non-taxfree transaction and
			// receives tax income from itself
			if (trans.transformed_taxinc && is_sender) is_sender = false;

			var amount = is_sender ? -trans.amount_sent : trans.amount_received;
			var typeclass = is_sender ? "outgoing" : "incoming";
			statement.prepend($('<div class="entry ' + typeclass + '" data-listid="' + i + '">')
				.append($('<div class="description">')
					.text(student2readable(is_sender ? trans.recipient : trans.sender)))
				.append($('<div class="qrid">')
					.text(is_sender ? trans.recipient.qrid : trans.sender.qrid))
				.append($('<div class="amount">')
					.text(HGC_readable(amount) + " HGC"))
			);
		}

		// Display balance value once loaded
		var balint = setInterval(function () {
			if (!balance_updated) return;
			var balance_string = HGC_readable(storage.get("balance"));
			$("#balance_number").text(balance_string);
			clearInterval(balint);
		}, 100);

		/** Comment previews **/
		$(".entry").click(function () {
			var tr = res[$(this).data("listid")];
			$("#entry_details_comment").text(tr.comment);
			if (tr.comment.length <= 0) {
				$("#entry_details_comment").html("<i>(Kein Kommentar)</i>");
			}
			$("#entry_details_time").text("Transaktion vom " + date_readable(tr.time) +
				" um " + time_readable(tr.time) + " Uhr");
			$("#entry_details").show();
		});

		$("#entry_details").click(function () {
			$(this).hide();
		});
	}, function () {
		$("#loading").hide();
		$("#statement_container").hide();
		$("#complete").show();
	});}, 200);
});
