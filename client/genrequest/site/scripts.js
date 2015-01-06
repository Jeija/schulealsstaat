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
			$("#response").text(res);
		});
	});
});
