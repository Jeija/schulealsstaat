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
	$("#balance").text(storage.get("balance") + " HGC");
}, 200);
