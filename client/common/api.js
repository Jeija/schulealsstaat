var APISERVER = "api.saeu";
var APIPORT = 1337;

var WEBCAMSERVER = "cam.saeu";
var WEBCAMPORT = 1338;

var ACTIONURL = "http://" + APISERVER + ":" + APIPORT + "/action/";
var WEBCAMURL = "http://" + WEBCAMSERVER + ":" + WEBCAMPORT + "/";

$.ajaxSetup({
	xhr: function() {
		return new window.XMLHttpRequest({ mozSystem : true });
	}
});

/* Public Key Loading */
var pubkey = new JSEncrypt();
function load_pubkey(url) {
	var xhr = new XMLHttpRequest({ mozSystem : true });
	xhr.open("GET", url, true);
	xhr.onload = function () {
		if (xhr.responseText.indexOf("PUBLIC KEY") > -1) {
			pubkey.setPublicKey(xhr.responseText);
		}
	}
	xhr.send();
}

// Public key location may vary depending on the specific build details
// Therefore, search the public key at multiple places, such as www/pubkey.pem,
// the current directory and the parent directory
load_pubkey("/www/pubkey.pem");
load_pubkey("../pubkey.pem");
load_pubkey("pubkey.pem");

function encrypt_passphrase (passphrase) {
	return pubkey.encrypt(passphrase);
}

function encrypt_query(passphrase, query) {
	return GibberishAES.enc(query, passphrase);
}

function decrypt_answer(passphrase, answer) {
	var decrypted;
	try {
		decrypted = GibberishAES.dec(answer, passphrase);
	} catch (e) {
		console.log("Response decryption failed, error is:");
		console.log(answer);
		decrypted = "error: (while decrypting) " + answer;
	}

	return decrypted;
}

function randomString(length) {
	var s = ""
	for (var i = 0; i < length; i++)
		s += String.fromCharCode(32 + Math.floor(Math.random() * 94));
	return s;
}

function send_query(name, query, cb) {
	// Generate AES passphrase
	var passphrase = randomString(32);
	var passphrase_encrypted = encrypt_passphrase(passphrase);
	var query_encrypted = encrypt_query(passphrase, JSON.stringify(query));

	var post = JSON.stringify({
		passphrase : passphrase_encrypted,
		encrypted : query_encrypted
	});

	$.ajax({
		type : "POST",
		url : ACTIONURL + name,
		data : post,
		success : function (ans) {
			cb(JSON.parse(decrypt_answer(passphrase, ans)));
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

function webcamserv_get(picname, cb) {
	var url = WEBCAMURL + "get/" + picname;
	$.get("../cert/webcam_cert", function (cert) {
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
