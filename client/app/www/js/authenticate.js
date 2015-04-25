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

		action_app("get_balance", req, function (res) {
			if (res == "invalid_qrid") {
				errorMessage("Kontonummer nicht gefunden!");
				return;
			} else if (res == "invalid_password") {
				errorMessage("Das Passwort ist falsch!");
				return;
			} else if (res.indexOf("error") > -1) {
				errorMessage("Server-Error: " + res);
				return;
			}

			action_app("student_identify", { qrid : qrid }, function (idres) {
				if (typeof idres !== "object") {
					errorMessage("Server-Error: " + idres);
					return;
				}

				storage.set("qrid", qrid);
				storage.set("password", password);
				storage.set("balance", res);
				storage.set("profile", idres);
				window.location = "index.html";
			});
		});
	});
});
