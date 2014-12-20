var ZBARCAM = "zbarcam";
var WEBCAM = "/dev/video0";
var ZBC_FLAGS = "--prescale=640x480"

var process = require("child_process");

$(function () {
	$("#header").load("../header.html", function () {
		$("#transaction_simple_link").addClass("link-selected");
	});

	$(".qrcode_scan").click(function () {
		process.exec("killall " + ZBARCAM, function () {
			var zbar = process.exec(ZBARCAM + " " + WEBCAM + " " + ZBC_FLAGS, function () {
				console.log("terminate");
			});

			zbar.stdout.on("data", function (read) {
				console.log(read);
				zbar.kill();
			});
		});
	});
});
