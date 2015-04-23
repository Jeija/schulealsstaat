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
			errorMessage("Error: " + res);
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
			var amount = is_sender ? -trans.amount_sent : trans.amount_received;
			var typeclass = is_sender ? "outgoing" : "incoming";
			statement.prepend($('<div class="entry ' + typeclass + '">')
				.append($('<div class="description">')
					.text(student2readable(is_sender ? trans.recipient : trans.sender)))
				.append($('<div class="qrid">')
					.text(is_sender ? trans.recipient.qrid : trans.sender.qrid))
				.append($('<div class="amount">')
					.text(HGC_readable(amount) + " HGC"))
			);
		}

		var balance_string = HGC_readable(storage.get("balance"));
		$("#balance_number").text(balance_string);
	});}, 200);
});
