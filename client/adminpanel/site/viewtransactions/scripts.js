$(function () {

function addTableVal (query, name, selector) {
	if ($(selector).find(".matters").is(":checked"))
		query[name] = $(selector).find(".value").val();
}

function datetime_readable (datestring) {
	var d = new Date(datestring);
	return d.getDate() + "." + (d.getMonth() + 1)
		+ " " + ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
}

function render_transactions (trlist) {
	$("#transactions").html("");
	$("#transactions").append($("<tr>")
		.append($("<th>").text("Zeit"))
		.append($("<th>").text("Absender"))
		.append($("<th>").text("Empfänger"))
		.append($("<th>").text("Brutto"))
		.append($("<th>").text("Netto"))
		.append($("<th>").text("Steuersatz"))
		.append($("<th>").text("Steuer"))
		.append($("<th>").text("Kommentar"))
		.append($("<th>").text("Absender IP"))
	);

	for (var i = 0; i < trlist.length; i++) {
		var tr = trlist[i];
		$("#transactions").append($("<tr>")
			.append($('<td>').text(datetime_readable(tr.time)))
			.append($('<td>').text(tr.sender))
			.append($('<td>').text(tr.recipient))
			.append($('<td class="num">').text(tr.amount_sent.toFixed(3)))
			.append($('<td class="num">').text(tr.amount_received.toFixed(3)))
			.append($('<td class="num">').text(tr.percent_tax))
			.append($('<td class="num">').text(tr.amount_tax.toFixed(3)))
			.append($('<td>').append($('<div class="showcomment">')
				.attr("comment-id", i)
				.text("anzeigen")
			))
			.append($("<td>").text(tr.sender_ip))
		);
	}

	$(".showcomment").click(function () {
		$("#comment_text").text(trlist[$(this).attr("comment-id")].comment);
		$("#comment_preview").fadeIn();
	});
}

$("#comment_preview_ok").click(function () {
	$("#comment_preview").fadeOut();
});

$("#query").click(function () {
	var amount = $("#n_transactions").val();
	amount = amount == "all" ? -1 : parseInt(amount);
	var payload = {
		amount : amount,
		query : {
			amount_sent : {},
			amount_tax : {}
		}
	};

	// Load query from UI
	addTableVal(payload.query, "sender", "#sender");
	addTableVal(payload.query, "sender_country", "#sender_country");
	addTableVal(payload.query, "recipient", "#recipient");
	addTableVal(payload.query, "recipient_country", "#recipient_country");
	addTableVal(payload.query, "percent_tax", "#percent_tax");
	addTableVal(payload.query.amount_sent, "$gt", "#minimal_sent");
	addTableVal(payload.query.amount_sent, "$lt", "#maximal_sent");
	addTableVal(payload.query.amount_tax, "$gt", "#minimal_tax");
	addTableVal(payload.query.amount_tax, "$lt", "#maximal_tax");

	if ($.isEmptyObject(payload.query.amount_sent)) delete payload.query.amount_sent;
	if ($.isEmptyObject(payload.query.amount_tax)) delete payload.query.amount_tax;

	console.log(payload);
	action_cert("find_transactions", payload, "admin_cert", function (tr) {
		render_transactions(tr);
	});
});

});
