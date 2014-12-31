function flashLightOn() {
	window.plugins.flashlight.available(function(isAvailable) {
		if (isAvailable) {
			window.plugins.flashlight.switchOn();
		}
	});
}

function flashLightOff() {
	window.plugins.flashlight.available(function(isAvailable) {
		if (isAvailable) {
			window.plugins.flashlight.switchOn();
		}
	});
}

$(function () {

$("#authenticate").click(function () {
	if (cordova.plugins.barcodeScanner) {
		cordova.plugins.barcodeScanner.scan(
			function (result) {
				if (result.format != "QR_CODE") {
					alert("Ungültiger Code!");
					return;
				}
				storage.set("qrid", result.text);
				alert(storage.get("qrid"));

				var queryData = JSON.stringify({
					qrid : result.text
				});

				action("student_identify", queryData, function (res) {
					var st = undefined;
					try {
						st = JSON.parse(res);
					} catch (e) {
						alert("Der QR-Code ist ungültig");
					}

					alert("Dein Name ist " + st.firstname + " " + st.lastname);
				});
			}, 
			function (error) {}
		);
	} // TODO: use JS QR Scanner if plugin doesn't exist
});

});
