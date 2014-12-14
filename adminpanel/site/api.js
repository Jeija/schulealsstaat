var APISERVER = "127.0.0.1"
var APIPORT = 1337

var WEBCAMSERVER = "127.0.0.1"
var WEBCAMPORT = 1338

var ACTIONURL = "http://" + APISERVER + ":" + APIPORT + "/action/";
var WEBCAMURL = "http://" + WEBCAMSERVER + ":" + WEBCAMPORT + "/";

function action(name, data, cb) {
	$.get(ACTIONURL + name + "/?data=" + data, cb);
}

function action_cert(name, data, certname, cb) {
	var url;
	if (data) url = ACTIONURL + name + "/?data=" + data;
	else url = ACTIONURL + name;
	$.get("../cert/" + certname, function (cert) {
		$.ajax({
			type : "POST",
			url : url,
			success : cb,
			data : cert
		});
	});
}

function action_mastercert(name, data, certfile_selector, cb) {
	var file = $(certfile_selector)[0].files[0];
	if (!file) {
		alert("Kein Master-Zertifikat gewählt!");
		return;
	}
	var reader = new FileReader();
	reader.onload = function(e) {
		var url;
		if (data) url = ACTIONURL + name + "/?data=" + data;
		else url = ACTIONURL + name;

		$.ajax({
			type : "POST",
			url : url,
			data : reader.result,
			success : cb
		});
	}
	reader.readAsText(file, "utf-8");
}

function webcamserv_get(picname, certname, cb) {
	var url = WEBCAMURL + "get/" + picname;
	$.get("../cert/" + certname, function (cert) {
		$.ajax({
			type : "POST",
			url : url,
			success : cb,
			data : cert
		});
	});
}
