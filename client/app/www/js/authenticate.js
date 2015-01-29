$(function () {
	function onDeviceReady() {
		navigator.splashscreen.hide();
	}
	document.addEventListener("deviceready", onDeviceReady, false);

	$("#scan_card").click(function () {
		if (typeof cordova !== "undefined" && cordova.plugins.barcodeScanner) {
			// Use native barcodeScanner (e.g. android)
			cordova.plugins.barcodeScanner.scan(
				function (result) {
					if (result.format != "QR_CODE") {
						alert("Ungültiger Code!");
						return;
					}

					$("#qrid").val(result.text);
				}, 
				function (error) {}
			);
		} else {
			// Use builtin JS QRScanJS Scanner
			$("#scanner_popup").fadeIn();
			$("#scanner_abort").click(function () {
				$("#scanner_popup").hide();
			});
			QRReader.init("#scanner_webcam", "QRScanJS/");
			QRReader.scan(function (result) {
				$("#scanner_popup").hide();
				$("#qrid").val(result);
			});
		}
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
