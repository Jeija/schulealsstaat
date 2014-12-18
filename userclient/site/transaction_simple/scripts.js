var ZBARCAM = "LD_PRELOAD=/usr/lib/libv4l/v4l1compat.so zbarcam --raw";
var WEBCAM = "/dev/video0";
var ZBC_FLAGS = "--prescale=640x480"

var process = require("child_process");

$(function () {
	$("#scan_qr").click(function () {
		var zbar = process.exec(ZBARCAM + " " + WEBCAM + " " + ZBC_FLAGS, function () {
			console.log("terminate");
		});

		zbar.stdout.on("data", function (read) {
			console.log(read);
			zbar.kill();
		});
	});
});
