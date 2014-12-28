var PASSIMG_SERVER = "127.0.0.1"
var PASSIMG_PORT = 1338

var APISERVER = "127.0.0.1"
var APIPORT = 1337

var CERTNAME = "cert/ec_cert";

var ACTIONURL = "http://" + APISERVER + ":" + APIPORT + "/action/";

function showpic(picname) {
	var passimgServer = "http://" + PASSIMG_SERVER + ":" + PASSIMG_PORT + "/get/";

	$.get(CERTNAME, function (cert) {
		$.ajax({
			type:		"POST",
			url:		passimgServer + picname,
			data:		cert
		}).done(function (imgbase64) {
			$("#pass").attr("src", "data:image/png;base64," + imgbase64);
		});
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
			var data = JSON.stringify({ qrid : qrid });
			$.ajax({
				url:	ACTIONURL + "student_identify/?data=" + data
			}).done(function(res) {
				var student = JSON.parse(res);
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
		$.get(CERTNAME, function (cert) {
			$.ajax({
				type : "POST",
				url : ACTIONURL + "ec_checkin/?data=" + current_qrid,
				success : function (res) {
					response = res;
				},
				data : cert
			});
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
		$.get(CERTNAME, function (cert) {
			$.ajax({
				type : "POST",
				url : ACTIONURL + "ec_checkout/?data=" + current_qrid,
				success : function (res) {
					response = res;
				},
				data : cert
			});
		});z
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
