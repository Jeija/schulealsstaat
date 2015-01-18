$(function () {
	function onDeviceReady() {
		navigator.splashscreen.hide();
	}
	document.addEventListener("deviceready", onDeviceReady, false);

	$("#scan_card").click(function () {
		if (cordova.plugins.barcodeScanner) {
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
		} // TODO: use JS QR Scanner if plugin doesn't exist
	});

	$("#register").click(function () {
		var password = $("#password").val();
		var qrid = $("#qrid").val();

		var req = {
			password : password,
			qrid : qrid
		}

		action("get_balance", req, function (res) {
			alert(res);
		});
	});
});
