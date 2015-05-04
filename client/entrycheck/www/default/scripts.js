/**
 * You can improve scanning performance by using ZBarCam, a compiled scanning application,
 * for QR Code Input. In order to do that, run the entrycheck application in NW.js
 * and install ZBarCam. You may need to edit the WEBCAM and ZBC_FLAGS variables
 * in this file. Otherwise, entrycheck falls back to QRScanJS.
 * Requires ZBar build from https://github.com/Jeija/ZBar, branch entrycheck.
 * You can e.g. use the saeubuild.sh script to build ZBarCam.
 */

var ZBARCAM = "zbarcam";
var ZBC_FLAGS = "--prescale=640x480";
var PRESENCE_SINCE = 12 * 60 * 60; // in seconds before now

// In node.js (nwjs) environment: Spawn ZBarCam instead of QRScanJS
var process = null;
if (typeof require !== "undefined") {
	var WEBCAM = prompt("Welche Webcam soll verwendet werden [/dev/video0]?");
	process = require("child_process");
	if (process === "") process = "/dev/video0";
}

// Prevent duplicate scanning by storing the last scanned ID cards for 5 seconds
var last_qrids = [];

function calcAge(bday) {
	var today = new Date();
	var birthDate = new Date(bday);
	var age = today.getFullYear() - birthDate.getFullYear();
	var m = today.getMonth() - birthDate.getMonth();
	if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
		age--;
	}
	return age;
}

function addActionCard(qrid) {
	// Make sure this is not a duplicate scan
	if (last_qrids.indexOf(qrid) > -1) return;
	last_qrids.push(qrid);
	setTimeout(function () {
		last_qrids.splice(last_qrids.indexOf(qrid), 1);
	}, 5000);

	// Get more information on the student based by sending the unique QR-ID to the
	// API Server
	action_cert("ec_student_get", qrid, "ec_cert", function(student) {
		// Show student information card
		var card = $("#card_prototype").clone(true).appendTo("#cardlist");
		card.show();
		card.attr("id", null);
		card.data("qrid", qrid);
		if (typeof student != "object") {
			card.find(".qrid").text(qrid);
			card.find(".notfound").show();
			return;
		} else {
			card.find(".found").show();
		}

		// Show information on attendance time and wheter the student is currently
		// checked in --> Make sure hardware clock is correct!!
		var now = Date.now();
		var since = now - PRESENCE_SINCE * 1000;
		var spec = calc_checkin_time(student, since, now);
		if (spec.present_at_end)
			card.addClass("inside");
		else
			card.addClass("outside");

		// Load data into attribute card
		card.find(".td_minutes").text(Math.floor(spec.time / 60));
		card.find(".td_name").text(student.firstname + " " + student.lastname);
		card.find(".td_class").text(student.type);
		card.find(".td_age").text(calcAge(student.birth));
		card.find(".pass").attr("src", "");
		webcamserv_get(student.picname, function (imgbase64) {
			card.find(".pass").attr("src", "data:image/png;base64," + imgbase64);
		});
	});
}

$(function() {
	// QRScanJS scanning function, used below
	function scan (qrid) {
		addActionCard(qrid);
		QRReader.scan(scan);
	}

	// NW.js - ZBarCam:
	if (process) {
		process.execSync("killall zbarcam || true");
		setTimeout(function () {
			$("#webcam_scanner").hide();
			var zbar = process.exec(ZBARCAM + " " + WEBCAM + " " + ZBC_FLAGS);
			zbar.stdout.on("data", function (qrid_raw) {
				var qrids = qrid_raw.split("\n");
				for (var i = 0; i < qrids.length - 1; i++)
					addActionCard(qrids[i]);
			});
		}, 1000);

	// Native JavaScript QRScanJS
	} else {
		setInterval(function () {
			if ($("#webcam")[0].paused) {
				$("#nowebcam").show()
			} else {
				$("#nowebcam").hide()
			}
		}, 100);

		QRReader.init("#webcam", "../QRScanJS/");
		QRReader.scan(scan);
	}


	$(".checkin").click(function () {
		var card = $(this).parent().parent();
		if (card.attr("id") == "card_prototype") return;
		action_cert("ec_checkin", card.data("qrid"), "ec_cert", function (res) {
			if (res != "ok") alert("Fehler! Server-Antwort: " + res);
			else card.remove();
		});
	});

	$(".checkout").click(function () {
		var card = $(this).parent().parent();
		if (card.attr("id") == "card_prototype") return;
		action_cert("ec_checkout", card.data("qrid"), "ec_cert", function (res) {
			if (res != "ok") alert("Fehler! Server-Antwort: " + res);
			else card.remove();
		});
	});

	$(".close").click(function () {
		$(this).parent().parent().remove();
	});

	$(document).keypress(function (ev) {
		// i key for checking all in, o key for checking all out
		if (ev.charCode == 105) $(".checkin").click();
		if (ev.charCode == 111) $(".checkout").click();
		console.log(ev);
	});
});
