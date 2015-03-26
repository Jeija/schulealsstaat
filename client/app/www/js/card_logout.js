$(function () {
	$("#confirm").click(function () {
		storage.set("qrid", null);
		storage.set("password", null);
		storage.set("balance", null);
		window.location = "authenticate.html";
	});
});
