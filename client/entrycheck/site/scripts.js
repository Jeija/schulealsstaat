var PASSIMG_SERVER = "127.0.0.1"
var PASSIMG_PORT = 1338

var APISERVER = "127.0.0.1"
var APIPORT = 1337

var CERTNAME = "ec_cert";

var ACTIONURL = "http://" + APISERVER + ":" + APIPORT + "/action/";

function showpic(picname) {
	webcamserv_get(picname, CERTNAME, function (imgbase64) {
		$("#pass").attr("src", "data:image/png;base64," + imgbase64);
	});
}

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

$(function() {
	QRReader.init("#webcam", "../QRScanJS/")
	var current_qrid;

	// #################### Check In / Check Out ####################
	function scan() {
		$("#credentials").hide();
		$("#webcam_popup").show();
		QRReader.scan(function (qrid) {
			$("#webcam_popup").hide();
			current_qrid = qrid;
			var data = { qrid : qrid };
			action("student_identify", data, function(student) {
				if (typeof student != "object") {
					alert("Account nicht gefunden!");
					scan();
					return;
				}
				$("#td_name").html(student.firstname + " " + student.lastname);
				$("#td_class").html(student.type);
				$("#td_age").html(calcAge(student.birth));
				$("#pass").attr("src", "");
				$("#credentials").show();
				showpic(student.picname);
			});
		})
	}
	scan();

	$("#checkin").click(function () {
		var response;
		action_cert("ec_checkin", current_qrid, CERTNAME, function (res) {
			response = res;
		});
		var interval = setInterval(function() {
			if (!response) return;
			if (response == "ok") {
				clearInterval(interval);
				scan();
			}
			else alert("Error: Server respone was \"" + response + "\"");
		}, 50);
	});

	$("#checkout").click(function () {
		var response;
		action_cert("ec_checkout", current_qrid, CERTNAME, function (res) {
			response = res;
		});
		var interval = setInterval(function() {
			if (!response) return;
			if (response == "ok") {
				clearInterval(interval);
				scan();
			}
			else alert("Error: Server respone was \"" + response + "\"");
		}, 50);
	});
})
