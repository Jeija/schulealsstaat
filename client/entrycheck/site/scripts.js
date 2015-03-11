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
	action("student_identify", { qrid : qrid }, function(student) {
		// Show student information card
		var card = $("#card_prototype").clone(true).appendTo("#cardlist");
		card.show();
		card.attr("id", null);
		card.data("qrid", qrid);
		if (typeof student != "object") {
			card.find(".qrid").text(qrid);
			card.find(".notfound").show();
			return
		} else {
			card.find(".found").show();
		}

		// Load data into attribute card
		card.find(".td_name").html(student.firstname + " " + student.lastname);
		card.find(".td_class").html(student.type);
		card.find(".td_age").html(calcAge(student.birth));
		card.find(".pass").attr("src", "");
		webcamserv_get(student.picname, function (imgbase64) {
			card.find(".pass").attr("src", "data:image/png;base64," + imgbase64);
		});
	});
}

$(function() {
	QRReader.init("#webcam", "../QRScanJS/");

	function scan (qrid) {
		addActionCard(qrid);
		QRReader.scan(scan);
	}

	QRReader.scan(scan);

	$(".checkin").click(function () {
		var card = $(this).parent().parent();
		action_cert("ec_checkin", card.data("qrid"), "ec_cert", function (res) {
			if (res != "ok") alert("Fehler! Server-Antwort: " + res);
			else card.remove();
		});
	});

	$(".checkout").click(function () {
		var card = $(this).parent().parent();
		action_cert("ec_checkout", card.data("qrid"), "ec_cert", function (res) {
			if (res != "ok") alert("Fehler! Server-Antwort: " + res);
			else card.remove();
		});
	});

	$(".close").click(function () {
		$(this).parent().parent().remove();
	});
});
