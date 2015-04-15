function HGC_readable(val) {
	return (Math.round(val * 100) / 100).toFixed(2);
}

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

		var statement = $("#statement");
		statement.html("");

		// No transactions in history
		if (res.length === 0) {
			$("#nostatement").show();
			return;
		}

		for (var i = 0; i < res.length; i++) {
			var trans = res[i];
			var is_sender = (trans.sender === storage.get("qrid"));
			var amount = is_sender ? -trans.amount_sent : trans.amount_received;
			var typeclass = is_sender ? "outgoing" : "incoming";
			statement.append($('<div class="entry ' + typeclass + '">')
				.append($('<div class="qrid">')
					.text(is_sender ? trans.recipient.qrid : trans.sender.qrid))
				.append($('<div class="amount">')
					.text(HGC_readable(amount)))
			);
		}

		var balance_string = HGC_readable(storage.get("balance"));
		$("#balance_number").text(balance_string);
	});}, 200);
});
