$(function () {
	// Wait for PubKey to be downloaded + processed
	setTimeout(function () {
	action("get_last_transactions", {
		qrid : storage.get("qrid"),
		password : storage.get("password"),
		amount : 5
	}, function (res) {
		if (typeof res != "object") {
			alert("Error: " + res);
			return;
		}

		var table = $("#statement");
		table.html("");

		// No transactions in history
		if (res.length == 0) {
			$("#nostatement").show();
			return;
		}

		table.append($("<tr>")
			.append($('<th>')
				.text("Handelspartner"))
			.append($('<th>')
				.text("Betrag"))
		);

		for (var i = 0; i < res.length; i++) {
			alert(JSON.stringify(res[i]));
			var trans = res[i];
			var is_sender = (trans.sender === storage.get("qrid"));
			table.append($("<tr>")
				.append($('<td>')
					.text(is_sender ? trans.recipient : trans.sender))
				.append($('<td>')
					.text(is_sender ? -trans.amount_sent : trans.amount_received))
			);
		}
	});}, 200);
});
