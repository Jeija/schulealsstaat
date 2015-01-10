var APISERVER = "127.0.0.1";
var APIPORT = 1337;

var WEBCAMSERVER = "127.0.0.1";
var WEBCAMPORT = 1338;

var ACTIONURL = "http://" + APISERVER + ":" + APIPORT + "/action/";
var WEBCAMURL = "http://" + WEBCAMSERVER + ":" + WEBCAMPORT + "/";

// Load public key
var pubkey = new JSEncrypt();
$.get("../pubkey.pem", function (pubkey_str) {
	pubkey.setPublicKey(pubkey_str);
});

function encrypt_passphrase (passphrase) {
	return pubkey.encrypt(passphrase);
}

function encrypt_query(passphrase, query) {
	return sjcl.encrypt(passphrase, query);
}

function decrypt_answer(passphrase, answer) {
	try {
		return JSON.parse(sjcl.decrypt(passphrase, answer));
	} catch (e) {
		return answer;
	}
}

function send_query(name, query, cb) {
	// Generate random AES passphrase (no cryptographically secure randomness, but should be
	// enough for this use case)
	function rnd () {
		return Math.random().toString(36).substring(7);
	}
	var passphrase = rnd() + rnd() + rnd();
	var passphrase_encrypted = encrypt_passphrase(passphrase);

	var post = JSON.stringify({
		passphrase : passphrase_encrypted,
		encrypted : encrypt_query(passphrase, JSON.stringify(query))
	});

	$.ajax({
		type : "POST",
		url : ACTIONURL + name,
		data : post,
		success : function (ans) {
			cb(decrypt_answer(passphrase, ans));
		}
	});
}

function action(name, payload, cb) {
	send_query(name, { payload : payload }, cb);
}

function action_cert(name, payload, certname, cb) {
	$.get("../cert/" + certname, function (cert) {
		send_query(name, { payload : payload, cert : cert }, cb);
	});
}

function action_mastercert(name, payload, certfile_selector, cb) {
	var file = $(certfile_selector)[0].files[0];
	if (!file) {
		alert("Kein Master-Zertifikat gewählt!");
		return;
	}
	var reader = new FileReader();
	reader.onload = function(e) {
		send_query(name, { payload : payload, cert : reader.result }, cb);
	};
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

function webcamserv_upload(picname, pictureData, cb) {
	$.ajax({
		type:		"POST",
		url:		WEBCAMURL + "upload/",
		data:		JSON.stringify({name : picname, pic : pictureData})
	}).done(cb);
}
