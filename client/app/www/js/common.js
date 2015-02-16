function showError(msg) {
	$("#error_message").text(msg);
	$("#error").fadeIn();
}

function student2readable(st) {
	if (!st.type) return "Keine genaue Beschreibung verfügbar";

	if (st.type != "visitor" && st.type != "teacher" && st.type != "legalentity"
		&& st.type != "other")
		return st.firstname + " " + st.lastname + ", Klasse " + st.type.toUpperCase();

	if (st.type == "visitor")
		return "Besucher mit Kontonummer " + st.qrid;

	if (st.type == "teacher")
		return st.firstname + " " + st.lastname + " (Lehrer/Lehrerin)";

	if (st.type == "legalentity")
		return st.special_name + " (juristische Person)";

	if (st.type == "other")
		return st.firstname + " " + st.lastname;

	return st.firstname + "/" + st.lastname + "/" + st.type + "/" + st.special_name;
}

function update_balance() {
	var req = {
		password : storage.get("password"),
		qrid : storage.get("qrid")
	};

	action("get_balance", req, function (res) {
		var balance = parseFloat(res);
		if (isNaN(balance) || !balance) return;
		storage.set("balance", res);
	});
}

$(function () {
	$("#error_ok").click(function () {
		$("#error").fadeOut();
	});
});
