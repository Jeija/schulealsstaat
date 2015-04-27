var WEBCAM_WIDTH = 800;
var WEBCAM_HEIGHT = 600;

var PWD_MINLEN = 6;

$(function() {

$("#pwd_minlen").html(PWD_MINLEN);

var webcam = document.querySelector("#webcam");
var webcam_shot = document.querySelector("#webcam_shot");

webcam.setAttribute('width', WEBCAM_WIDTH);
webcam.setAttribute('height', WEBCAM_HEIGHT);
webcam_shot.width = WEBCAM_WIDTH;
webcam_shot.height = WEBCAM_HEIGHT;

navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia ||
	navigator.mozGetUserMedia || navigator.msGetUserMedia || navigator.oGetUserMedia;

function handleVideo(stream) {
	webcam.src = window.URL.createObjectURL(stream);
	$("#webcam_trigger").click(function() {
		webcam_shot.getContext("2d").drawImage(webcam, 0, 0,
			WEBCAM_WIDTH, WEBCAM_HEIGHT);
	});
}

navigator.getUserMedia({video: true}, handleVideo, function (err) {
	alert("Webcam konnte nicht gefunden werden!");
});

function update_subclass() {
	var subclass = $("#subclass");
	var mainclass = $("#class");
	subclass.empty();
	if(mainclass.val() == "ks") {
		subclass[0].add(new Option("1", "1"));
		subclass[0].add(new Option("2", "2"));
		subclass.show();
	} else if (mainclass.val() == "teacher" || mainclass.val() == "other") {
		subclass[0].add(new Option("none", ""));
		subclass.hide();
	} else {
		subclass[0].add(new Option("a", "a"));
		subclass[0].add(new Option("b", "b"));
		subclass[0].add(new Option("c", "c"));
		subclass[0].add(new Option("d", "d"));
		subclass[0].add(new Option("e", "e"));
		subclass.show();
	}

	if (mainclass.val() == "teacher")
		$("#birth_container").hide();
	else
		$("#birth_container").show();
}
$("#class").change(update_subclass);
update_subclass();

function highlight_pwd() {
	if ($("#password").val().length < PWD_MINLEN)
	{
		$("#password").css("box-shadow", "0px 0px 5px #d00");
		$("#password_repeat").css("box-shadow", "0px 0px 5px #d00");
	}
	else if ($("#password").val() != $("#password_repeat").val())
	{
		$("#password").css("box-shadow", "0px 0px 5px #0d0");
		$("#password_repeat").css("box-shadow", "0px 0px 5px #d00");
	}
	else
	{
		$("#password").css("box-shadow", "0px 0px 5px #0d0");
		$("#password_repeat").css("box-shadow", "0px 0px 5px #0d0");
	}

	if ($("#password_repeat").val().length < 1)
		$("#password_repeat").css("box-shadow", "none");
	if ($("#password").val().length < 1)
		$("#password").css("box-shadow", "none");
}

$("#password").on("input", highlight_pwd);

$("#password_repeat").on("input", highlight_pwd);

$("#send").click(function() {
	// Retrieve & Check password before sending anything
	var pwd = $("#password").val();
	if (pwd != $("#password_repeat").val()) {
		alert("Fehler: Die Passwörter stimmen nicht überein.");
		return;
	}

	if (pwd.length < PWD_MINLEN) {
		alert("Fehler: Das Passwort muss mindestens " + PWD_MINLEN +
			" Zeichen lang sein.");
		return;
	}

	var pictureData = $("#webcam_shot")[0].toDataURL();
	var picname = (Math.random()*1e17+Math.random()*1e35).toString(36);

	// Send Data
	var rgdat = {
		password : $("#password").val(),
		firstname : $("#firstname").val(),
		lastname : $("#lastname").val(),
		birthday : $("#birthday").val(),
		birthmonth : $("#birthmonth").val(),
		birthyear : $("#birthyear").val(),
		sclass : $("#class").val(),
		subclass : $("#subclass").val(),
		country : $("#country").val(),
		picname : picname
	};

	// Send Picture, then API registration
	webcamserv_upload(picname, pictureData, function (photores) {
		if  (photores !== "ok") {
			alert("Passfoto-Upload-Error: " + photores);
			return;
		}

		action_cert("register_student", rgdat, "registration_cert", function (apires) {
			if (apires !== "ok") {
				alert("Registrierung fehlgeschlagen, API-Fehler: " +
					apires);
				return;
			}

			alert("Registrierung erfolgreich!");
			$("#main_form")[0].reset();
			highlight_pwd();
			webcam_shot.getContext("2d").clearRect(0, 0,
				webcam_shot.width, webcam_shot.height);
			window.scrollTo(0, 0);
		});
	});
});

});
