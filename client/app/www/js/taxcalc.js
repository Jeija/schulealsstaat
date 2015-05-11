var DECPLACES = 5;

function HGC_readable(value) {
	if (isNaN(value) || value < 0) return "Fehler";
	if (!isFinite(value)) return "Unendlicher Blödsinn";
	return value.toFixed(DECPLACES);
}

function HGC_roundup(value) {
	return Math.ceil(value * Math.pow(10, DECPLACES)) / Math.pow(10, DECPLACES);
}

function gross2tax(gross, tax_percent) {
	var tax = tax_percent / 100;
	return HGC_roundup(tax * gross / (1 + tax));
}

function net2tax(net, tax_percent) {
	var tax = tax_percent / 100;
	return HGC_roundup(tax * net);
}

function recalc() {
	var tax_percent = parseFloat($("#tax_percent").val());
	var from_gross = parseFloat($("#from_gross").val());
	var from_net = parseFloat($("#from_net").val());
	var tax_from_net = parseFloat($("#tax_from_net").val());
	var tax_from_gross = parseFloat($("#tax_from_gross").val());

	$("#to_net").val(HGC_readable(from_gross - gross2tax(from_gross, tax_percent)));
	$("#to_gross").val(HGC_readable(from_net + net2tax(from_net, tax_percent)));
	$("#net_to_tax").val(HGC_readable(net2tax(tax_from_net, tax_percent)));
	$("#gross_to_tax").val(HGC_readable(gross2tax(tax_from_gross, tax_percent)));
}

$(function () {
	$("#taxval_get").click(function () {
		action_app("config_get", "transaction_tax_percent", function (res) {
			$("#tax_percent").val(res);
			recalc();
		});
	});
	recalc();

	$("input").change(recalc);
});
