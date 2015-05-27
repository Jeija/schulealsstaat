var transactions = [];
var DEFAULT_TAX_PERCENT = 10;
var HGC_PER_EURO = NaN;

/**
 * Transaction object:
 * {
 *	state : String,
 *	sender : String (QR-ID),
 *	recipient : String (QR-ID),
 *	sender_password : String,
 *	comment : String,
 *	amount_sent OR amount_received OR amount : Number,
 *	errorcode : String --> added, if API action fails
 * }
 *
 * amount_sent: Gross value
 * amount_received : Net value
 * amount: Tax-free transaction, requires taxfree certificate
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
		return (tr.amount_sent - gross2tax(tr.amount_sent, DEFAULT_TAX_PERCENT)).toFixed(2);
	return "error";
}

function amount_sent_readable(tr) {
	if ("amount" in tr) return tr.amount.toFixed(2);
	if ("amount_sent" in tr) return tr.amount_sent.toFixed(2);
	if ("amount_received" in tr)
		return (tr.amount_received + net2tax(tr.amount_received, DEFAULT_TAX_PERCENT)).toFixed(2);
	return "error";
}

function downloadData(filename, data) {
	var dl = $("<a>").attr("href", "data:text/plain;charset=utf-8," + encodeURIComponent(data));
	dl.attr("download", filename);
	$(document.body).append(dl);
	dl[0].click();
	dl.remove();
}

function render_transactions () {
	$("#transactions").html("");
	$("#transactions").append($("<tr>")
		.append($("<th>").text("Status"))
		.append($("<th>").text("Absender"))
		.append($("<th>").text("Empfänger"))
		.append($("<th>").text("Bruttowert"))
		.append($("<th>").text("Nettowert"))
		.append($("<th>").text("Steuerfrei"))
		.append($("<th>").text("Kommentar"))
		.append($("<th>").text("Aktionen"))
	);

	for (var i = 0; i < transactions.length; i++) {
		var tr = transactions[i];
		$("#transactions").append($('<tr class="state_' + tr.state + '">')
			.append($("<td>").text(state_readable(tr.state, tr.errorcode)))
			.append($("<td>").text(tr.sender))
			.append($("<td>").text(tr.recipient))
			.append($('<td class="num">').text(amount_sent_readable(tr)))
			.append($('<td class="num">').text(amount_received_readable(tr)))
			.append($("<td>").text("amount" in tr ? "Ja" : "Nein")) // TODO
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
			total_tax += gross2tax(trs.amount_sent, DEFAULT_TAX_PERCENT);
			total_received += trs.amount_sent - gross2tax(trs.amount_sent,
				DEFAULT_TAX_PERCENT);

		// If net value is provided
		} else if ("amount_received" in trs) {
			total_received += trs.amount_received;
			total_tax += net2tax(trs.amount_received, DEFAULT_TAX_PERCENT);
			total_sent += trs.amount_received + net2tax(trs.amount_received,
				DEFAULT_TAX_PERCENT);
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

function update_exchange_rate() {
	action("config_get", "hgc_per_euro", function (res) {
		if (res != "") HGC_PER_EURO = res;
		$("#exrate_value").text(parseFloat(res).toFixed(4));
	});
}

$(function () {

// SetTimeout: Wait for private key to be loaded
setTimeout(function () {
	action("config_get", "transaction_tax_percent", function (res) {
		if (res != "") DEFAULT_TAX_PERCENT = res;
	});
	update_exchange_rate();
}, 400);

$("#add_transaction").click(function () {
	// Load amount values
	$("#amount_sent").val($("#amount_sent").val().replace(",", "."));
	$("#amount_received").val($("#amount_received").val().replace(",", "."));
	var amount_sent = $("input:radio[name=amounttype]:checked").val() == "sent" ?
		parseFloat($("#amount_sent").val()) : undefined;
	var amount_received = $("input:radio[name=amounttype]:checked").val() == "received" ?
		parseFloat($("#amount_received").val()) : undefined;
	var amount = $("input:radio[name=amounttype]:checked").val() == "taxfree" ?
		parseFloat($("#amount_taxfree").val()) : undefined;

	if ((amount_sent !== undefined && isNaN(amount_sent)) ||
		(amount_received !== undefined && isNaN(amount_received))) {
		alert("Ungültiger Wert für Transaktionssumme!");
		return;
	}

	// Load other transaction data
	var sender = $("#sender").val();
	var recipient = $("#recipient").val();
	var sender_password = $("#password").val();
	var comment = $("#comment").val();

	var tr = {
		amount_sent : amount_sent,
		amount_received : amount_received,
		amount : amount,
		sender : sender,
		recipient : recipient,
		sender_password : sender_password,
		comment : comment,
		state : "pending"
	};

	addCleanTransaction(tr);
	render_transactions();
});

function makeTransaction(trquery, tid) {
	// Clean up query before sending it
	if ("state" in trquery) delete trquery.state;

	console.log(trquery);

	/*** Tax-free transaction: Requires taxfree certificate ***/
	if ("amount" in trquery) {
		var taxfreecert = "#taxfree_cert_input";
		if (!$(taxfreecert)[0].files[0]) {
			alert("Kein Steuerfrei-Zertifikat gewählt!");
			return;
		}

		trquery.amount_sent = trquery.amount;
		delete trquery.amount;

		action_mastercert("transaction_taxfree", trquery, taxfreecert, function (res) {
			if (res == "ok") transactions[tid].state = "complete";
			else {
				transactions[tid].state = "error";
				transactions[tid].errorcode = res;
			}
			render_transactions();
		});

	/*** Normal, non-taxfree transaction ***/
	} else {
		action("transaction", trquery, function (res) {
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

/**
 * Exchange rate calculator
 */
$("#exrate").click(function () {
	$("#exrate_value").text("Neu laden...");
	setTimeout(function () {
		update_exchange_rate();
	}, 200);
});

function eur2hgc() {
	var eur = parseFloat($("#euro").val().replace(",", "."));
	var hgc = eur * HGC_PER_EURO;
	$("#hgc").val(hgc.toFixed(3));
}

function hgc2eur() {
	var hgc = parseFloat($("#hgc").val().replace(",", "."));
	var eur = hgc / HGC_PER_EURO;
	console.log(eur);
	$("#euro").val(eur.toFixed(4));
}

$("#euro").change(eur2hgc);
$("#hgc").change(hgc2eur);
$("#euro").keyup(eur2hgc);
$("#hgc").keyup(hgc2eur);

render_transactions();

});
