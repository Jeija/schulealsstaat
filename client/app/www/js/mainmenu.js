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
	function onDeviceReady() {
		navigator.splashscreen.hide();
	}
	document.addEventListener("deviceready", onDeviceReady, false);

	if (!storage.get("qrid")) {
		window.location = "authenticate.html";
	}
});

setInterval(function () {
	var balance = Math.floor(parseFloat(storage.get("balance")) * 100 + 0.5) / 100;
	$("#balance").text("Guthaben: " + balance + " HGC");
	$("#qrid").text("Konto: " + storage.get("qrid"));
}, 200);
