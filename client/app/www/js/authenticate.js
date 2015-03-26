$(function () {
	function onDeviceReady() {
		navigator.splashscreen.hide();
	}
	document.addEventListener("deviceready", onDeviceReady, false);

	$("#scan_card").click(function () {
		QridScan(function (qrid) {
			$("#qrid").val(qrid);
		});
	});

	$("#register").click(function () {
		var password = $("#password").val();
		var qrid = $("#qrid").val();

		var req = {
			password : password,
			qrid : qrid
		};

		action("get_balance", req, function (res) {
			if (res == "invalid_qrid") {
				alert("Kontonummer nicht gefunden!");
			} else if (res == "invalid_password") {
				alert("Das Passwort ist falsch!");
			} else if (res.indexOf("error") > -1) {
				alert("Server-Error: " + res);
			} else {
				storage.set("qrid", qrid);
				storage.set("password", password);
				storage.set("balance", res);
				window.location = "index.html";
			}
		});
	});
});
