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

setInterval(function () {
	var balance = Math.floor(parseFloat(storage.get("balance")) * 100 + 0.5) / 100;
	$("#value").text(balance);
	$("#qrid").text("Konto: " + storage.get("qrid"));
}, 200);

$(function () {

function onDeviceReady() {
	navigator.splashscreen.hide();
}
document.addEventListener("deviceready", onDeviceReady, false);

if (!storage.get("qrid")) {
	window.location = "authenticate.html";
}

$("#infocontainer").click(function () {
	var req = {
		password : storage.get("password"),
		qrid : storage.get("qrid")
	};

	action("get_balance", req, function (res) {
		if (isNaN(res)) {
			alert("Unbekannter Fehler: " + res);
		} else {
			storage.set("balance", res);
		}
	});
});

});
