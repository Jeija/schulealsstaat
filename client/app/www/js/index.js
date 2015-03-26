$(function () {
	function onDeviceReady() {
		navigator.splashscreen.hide(); 
	} 
	document.addEventListener("deviceready", onDeviceReady, false);
	if (!storage.get("qrid")) {
		window.location = "authenticate.html";
	}
	else {
		window.location = "mainmenu.html";
	}
});
