var ZBARCAM = "zbarcam";
var WEBCAM = "/dev/video0";
var ZBC_FLAGS = "--prescale=640x480"
var COMMENT_MAXLEN = 300

var process = require("child_process");

$(function () {
	action("config_get", "tr_comment_maxlen", function (res) {
		if (res != "") COMMENT_MAXLEN = parseInt(res);
	});

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

	$(".comment").on("input", function () {
		if ($(".comment").val().length > COMMENT_MAXLEN) {
			$(this).css("box-shadow", "0 0 10px #f33");
			$(".comment_info").css("color", "#f00");
		} else {
			$(this).css("box-shadow", "none");
			$(".comment_info").css("color", "#fff");
		}
	});
});
