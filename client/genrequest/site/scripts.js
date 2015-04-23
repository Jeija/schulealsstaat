function printMessageReadable(msg) {
		var res_readable = JSON.stringify(msg).replace(/(.{60})/g, "$1\n");
		$("#response").text(res_readable);
}

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
		$("#response").text("");
		action($("#action_name").val(), getMessage(), function (res) {
			printMessageReadable(res);
		});
	});

	$("#confirm_polling").click(function () {
		$("#response").text("");
		action_poll($("#action_name").val(), getMessage(), function (res) {
			printMessageReadable(res);
		});
	});

	$("#confirm_cert").click(function () {
		$("#response").text("");
		action_mastercert($("#action_name").val(), getMessage(), "#cert_input", function (res) {
			printMessageReadable(res);
		});
	});
});
