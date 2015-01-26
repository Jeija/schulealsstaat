function getMessage() {
	var msg;
	try {
		msg = JSON.parse($("#payload").val());
	} catch (e) {
		msg = $("#payload").val();
	}
	return msg;
}

$(function () {
	$("#confirm").click(function () {
		action($("#action_name").val(), getMessage(), function (res) {
			$("#response").text(res);
		});
	});

	$("#confirm_cert").click(function () {
		action_mastercert($("#action_name").val(), getMessage(), "#cert_input", function (res) {
			var res_readable = JSON.stringify(res).replace(/(.{60})/g, "$1\n");
			$("#response").text(res_readable);
		});
	});
});
