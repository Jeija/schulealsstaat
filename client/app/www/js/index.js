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

document.addEventListener("deviceready", onDeviceReady, false);
function onDeviceReady() {
	navigator.splashscreen.hide();
}

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

				var queryData = {
					qrid : result.text
				};

				action("student_identify", queryData, function (res) {
					if (typeof res !== "object") {
						alert("Der QR-Code ist ungültig");
					} else {
						alert("Dein Name ist " + st.firstname + " "
							+ st.lastname);
					}
				});
			}, 
			function (error) {}
		);
	} // TODO: use JS QR Scanner if plugin doesn't exist
});

});
