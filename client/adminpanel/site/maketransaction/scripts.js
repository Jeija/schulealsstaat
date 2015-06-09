var transactions = [];
var DEFAULT_TAX_PERCENT = 10;
/**
 * Transaction object:
 * {
 *	state : String,
 *	spawn_money : Boolean,
 *	destroy_money : Boolean,
 *	sender : String (QR-ID),
 *	recipient : String (QR-ID),
 *	tax_percent : Number or "default",
 *	comment : String,
 *	amount_sent OR amount_received OR amount : Number,
 *	errorcode : String --> added, if API action fails
 * }
 *
 * amount_sent for gross value, amount_received for net value
 * amount is only used for spawn_money and destroy_money
 *
 * If spawn_money:
 *	--> sender is magic_account
 *	--> tax_percent is 0
 *	--> comment is prefixed by "spawn_money - "
 *	--> amount is used instead of amount_received / amount_sent
 *
 * If destroy_money:
 *	--> recipient is magic_account
 *	--> tax_percent is 0
 *	--> comment is prefixed by "destroy money - "
 *	--> amount is used instead of amount_received / amount_sent
 */

function addCleanTransaction(tr) {
	for (var i in tr)
		if (tr[i] === null || tr[i] === undefined)
			delete tr[i];
	transactions.push(tr);
}

function getTableVal(selector) {
	return ($(selector).find(".matters").is(":checked")) ?
		$(selector).find(".value").val() : undefined;
}

function state_readable(state, errorcode) {
	if (state == "pending") return "Ausstehend";
	if (state == "complete") return "Fertig";
	if (state == "nonsense") return "Unsinn";
	if (state == "error") return "Error: " + errorcode;
	return "Error: " + state;
}

function type_readable(spawn_money, destroy_money) {
	if (spawn_money && destroy_money) return "Erschaffen + Zerstören";
	if (destroy_money) return "Zerstören";
	if (spawn_money) return "Erschaffen";
	return "Transaktion";
}

function getTax(tr) {
	var tr_tax = 0;
	if ("tax_percent" in tr) tr_tax = (tr.tax_percent == "default") ?
		DEFAULT_TAX_PERCENT : tr.tax_percent;
	return tr_tax;
}

function gross2tax(gross, tax_percent) {
	var tax = tax_percent / 100;
	return tax * gross / (1 + tax);
}

function net2tax(net, tax_percent) {
	var tax = tax_percent / 100;
	return tax * net;
}

function amount_received_readable(tr) {
	if ("amount" in tr) return tr.amount.toFixed(2);
	if ("amount_received" in tr) return tr.amount_received.toFixed(2);
	if ("amount_sent" in tr)
		return (tr.amount_sent - gross2tax(tr.amount_sent, getTax(tr))).toFixed(2);
	return "error";
}

function amount_sent_readable(tr) {
	if ("amount" in tr) return tr.amount.toFixed(2);
	if ("amount_sent" in tr) return tr.amount_sent.toFixed(2);
	if ("amount_received" in tr)
		return (tr.amount_received + net2tax(tr.amount_received, getTax(tr))).toFixed(2);
	return "error";
}

function render_transactions () {
	$("#transactions").html("");
	$("#transactions").append($("<tr>")
		.append($("<th>").text("Status"))
		.append($("<th>").text("Typ"))
		.append($("<th>").text("Absender"))
		.append($("<th>").text("Empfänger"))
		.append($("<th>").text("Bruttowert"))
		.append($("<th>").text("Nettowert"))
		.append($("<th>").text("Steuersatz"))
		.append($("<th>").text("Kommentar"))
		.append($("<th>").text("Aktionen"))
	);

	for (var i = 0; i < transactions.length; i++) {
		var tr = transactions[i];
		var tax_percent_readable = "tax_percent" in tr ? tr.tax_percent : "";
		if (tr.destroy_money || tr.spawn_money) tax_percent_readable = 0;
		if (tax_percent_readable == "default") tax_percent_readable = "Standard";

		$("#transactions").append($('<tr class="state_' + tr.state + '">')
			.append($("<td>").text(state_readable(tr.state, tr.errorcode)))
			.append($("<td>").text(type_readable(tr.spawn_money, tr.destroy_money)))
			.append($("<td>").text("sender" in tr ? tr.sender.qrid : ""))
			.append($("<td>").text("recipient" in tr ? tr.recipient.qrid : ""))
			.append($('<td class="num">').text(amount_sent_readable(tr)))
			.append($('<td class="num">').text(amount_received_readable(tr)))
			.append($("<td>").text(tax_percent_readable + " %"))
			.append($("<td>").text(tr.comment))
			.append($('<td class="transaction_delete">')
				.text("Löschen")
				.data("listid", i)
			)
		);
	}

	$(".transaction_delete").click(function () {
		var listid = $(this).data("listid");
		transactions.splice(listid, 1);
		render_transactions();
	});

	// Calculate statistics
	var total_number = 0;
	var total_sent = 0;
	var total_received = 0;
	var total_tax = 0;
	for (var j = 0; j < transactions.length; j++) {
		var trs = transactions[j];

		// For spawn/destroy_money
		if ("amount" in trs) {
			total_sent += trs.amount;
			total_received += trs.amount;

		// If gross value is provided
		} else if ("amount_sent" in trs) {
			total_sent += trs.amount_sent;
			total_tax += gross2tax(trs.amount_sent, getTax(trs));
			total_received += trs.amount_sent - gross2tax(trs.amount_sent, getTax(trs));

		// If net value is provided
		} else if ("amount_received" in trs) {
			total_received += trs.amount_received;
			total_tax += net2tax(trs.amount_received, getTax(trs));
			total_sent += trs.amount_received + net2tax(trs.amount_received, getTax(trs));
		}
		total_number++;
	}

	var average_received = total_number ? total_received / total_number : 0;
	var average_sent = total_number ? total_sent / total_number : 0;
	var average_tax = total_number ? total_tax / total_number : 0;

	$("#total_number").text(total_number);
	$("#total_sent").text(total_sent.toFixed(3));
	$("#total_received").text(total_received.toFixed(3));
	$("#total_tax").text(total_tax.toFixed(3));
	$("#average_sent").text(average_sent.toFixed(3));
	$("#average_received").text(average_received.toFixed(3));
	$("#average_tax").text(average_tax.toFixed(3));
		
}

$(function () {

// SetTimeout: Wait for private key to be loaded
setTimeout(function () {
	getConfig("transaction_tax_percent", function (res) {
		DEFAULT_TAX_PERCENT = res;
	});
}, 400);

$("#add_transaction").click(function () {
	var spawn_money = $("#spawn").is(":checked");
	var destroy_money = $("#destroy").is(":checked");

	// Load transaction
	var comment = $("#comment").val();
	$("#amount_sent").val($("#amount_sent").val().replace(",", "."));
	$("#amount_received").val($("#amount_received").val().replace(",", "."));
	var amount_sent = $("input:radio[name=amounttype]:checked").val() == "sent" ?
		parseFloat($("#amount_sent").val()) : undefined;
	var amount_received = $("input:radio[name=amounttype]:checked").val() == "received" ?
		parseFloat($("#amount_received").val()) : undefined;
	var amount;

	if ((amount_sent !== undefined && isNaN(amount_sent)) ||
		(amount_received !== undefined && isNaN(amount_received))) {
		alert("Ungültiger Wert für Transaktionssumme!");
		return;
	}

	// Load sender
	var sender_firstname = getTableVal("#sender_firstname");
	var sender_lastname = getTableVal("#sender_lastname");
	var sender_type = getTableVal("#sender_type");
	var sender_qrid = getTableVal("#sender_qrid");

	// Load recipient
	var recipient_firstname = getTableVal("#recipient_firstname");
	var recipient_lastname = getTableVal("#recipient_lastname");
	var recipient_type = getTableVal("#recipient_type");
	var recipient_qrid = getTableVal("#recipient_qrid");

	// Load taxes (if spawn_money, destory_money, value will be discarded)
	var tax_percent;
	var tax_setting = $("input:radio[name=tax]:checked").val();
	if (tax_setting == "free") {
		cert_required = true;
		tax_percent = 0;
	} else if (tax_setting == "default") {
		tax_percent = "default";
	} else {
		$("#tax_percent").val($("#tax_percent").val().replace(",", "."));
		tax_percent = parseFloat($("#tax_percent").val());
		cert_required = true;
		if (isNaN(tax_percent) || tax_percent < 0) {
			alert("Ungültiger %-Wert für Steuern!");
			return;
		}
	}

	// Prepare identification queries
	var sender_query = {
		firstname : sender_firstname,
		lastname : sender_lastname,
		type : sender_type,
		qrid : sender_qrid
	};

	var recipient_query = {
		firstname : recipient_firstname,
		lastname : recipient_lastname,
		type : recipient_type,
		qrid : recipient_qrid
	};

	var sender, recipient;

	// First identify sender, then recipient, then add the action
	function getSender(cb) {
		if (spawn_money) { cb(); return; }

		action("student_identify", sender_query, function (st) {
			if (typeof st != "object") {
				alert("Absender konnte nicht / nicht " +
					"eindeutig gefunden werden! (" + st + ")");
				return;
			}
			sender = st;
			cb();
		});
	}

	function getRecipient(cb) {
		if (destroy_money) { cb(); return; }

		action("student_identify", recipient_query, function (st) {
			if (st !== true && typeof st != "object") {
				alert("Empfänger konnte nicht / nicht " +
					"eindeutig gefunden werden! (" + st + ")");
				return;
			}
			recipient = st;
			cb();
		});
	}

	getSender(function () {
		getRecipient(function () {
			if (spawn_money || destroy_money) {
				if (amount_received) amount = amount_received;
				else if (amount_sent) amount = amount_sent;
				amount_sent = undefined;
				amount_received = undefined;
				tax_percent = undefined;
			}

			if (spawn_money) sender = undefined;
			if (destroy_money) recipient = undefined;

			var tr = {
				amount_sent : amount_sent,
				amount_received : amount_received,
				spawn_money : spawn_money,
				destroy_money : destroy_money,
				tax_percent : tax_percent,
				amount : amount,
				sender : sender,
				recipient : recipient,
				comment : comment,
				state : "pending"
			};

			addCleanTransaction(tr);
			render_transactions();
		});
	});
});

function makeTransaction(trquery, tid) {
	var spawn_money = trquery.spawn_money;
	var destroy_money = trquery.destroy_money;

	// That doesn't even make any sense
	if (spawn_money && destroy_money) {
		transactions[tid].state = "nonsense";
		render_transactions();
		return;
	}

	// Clean up query before sending it
	if ("spawn_money" in trquery) delete trquery.spawn_money;
	if ("destroy_money" in trquery) delete trquery.destroy_money;
	if ("state" in trquery) delete trquery.state;
	if ("recipient" in trquery) trquery.recipient = trquery.recipient.qrid;
	if ("sender" in trquery) trquery.sender = trquery.sender.qrid;

	var mascert = "#master_cert_input";

	if (spawn_money) {
		action_mastercert("spawn_money", trquery, mascert, function (res) {
			if (res == "ok") transactions[tid].state = "complete";
			else {
				transactions[tid].state = "error";
				transactions[tid].errorcode = res;
			}
			render_transactions();
		});
	} else if (destroy_money) {
		action_mastercert("destroy_money", trquery, mascert, function (res) {
			if (res == "ok") transactions[tid].state = "complete";
			else {
				transactions[tid].state = "error";
				transactions[tid].errorcode = res;
			}
			render_transactions();
		});
	} else {
		if (trquery.tax_percent == "default") delete trquery.tax_percent;
		action_mastercert("master_transaction", trquery, mascert, function (res) {
			if (res == "ok") transactions[tid].state = "complete";
			else {
				transactions[tid].state = "error";
				transactions[tid].errorcode = res;
			}
			render_transactions();
		});
	}
}

$("#start").click(function () {
	// Make sure you cannot hit the button twice by accident
	$("#start").prop("disabled", true);
	setTimeout(function () {
		$("#start").prop("disabled", false);
	}, 1000);

	/*** Make sure a master_cert file is selected before starting ***/
	if (!$("#master_cert_input")[0].files[0]) {
		alert("Kein Master-Zertifikat gewählt!");
		return;
	}

	for (var i = 0; i < transactions.length; i++) {
		var tr = transactions[i];
		if (tr.state != "pending") continue;

		// Copy tr from table, make transaction
		makeTransaction(JSON.parse(JSON.stringify(tr)), i);

	}
});

$("#download").click(function () {
	downloadData("transactions.json", JSON.stringify(transactions, null, 2));
});

$("#upload").click(function () {
	$("<input type=\"file\" />")
		.click()
		.change(function(e) {
			var reader = new FileReader();
			reader.onload = function(event) {
				transactions = $.parseJSON(event.target.result);
				render_transactions();
			};
			reader.readAsText(e.target.files[0]);
	});
});

$("#make_pending").click(function () {
	for (var i = 0; i < transactions.length; i++)
		transactions[i].state = "pending";
	render_transactions();
});

$(".qrid_scan").click(function () {
	var qrid_scan_target = $(this).parent().parent().find(".qrid_scan_target");
	QRReader.init("#qr_webcam", "../QRScanJS/");
	$("#qr_popup").fadeIn(200);
	QRReader.scan(function (qrid) {
		$("#qr_popup").fadeOut(200);
		qrid_scan_target.val(qrid);
	});
});

$("#qr_popup_abort").click(function() {
	$("#qr_popup").fadeOut(200);
});

render_transactions();

});
