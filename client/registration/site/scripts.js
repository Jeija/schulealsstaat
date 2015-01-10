var WEBCAM_WIDTH = 800;
var WEBCAM_HEIGHT = 600;

var PWD_MINLEN = 10;

$(function() {
	$("#pwd_minlen").html(PWD_MINLEN);

	var webcam = document.querySelector("#webcam");
	var webcam_shot = document.querySelector("#webcam_shot");

	webcam.setAttribute('width', WEBCAM_WIDTH);
	webcam.setAttribute('height', WEBCAM_HEIGHT);
	webcam_shot.width = WEBCAM_WIDTH;
	webcam_shot.height = WEBCAM_HEIGHT;

	navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia
				|| navigator.mozGetUserMedia || navigator.msGetUserMedia
				|| navigator.oGetUserMedia;

	function handleVideo(stream) {
		webcam.src = window.URL.createObjectURL(stream);
		$("#webcam_trigger").click(function() {
			webcam_shot.getContext("2d").drawImage(webcam, 0, 0,
				WEBCAM_WIDTH, WEBCAM_HEIGHT);
		});
	}

	navigator.getUserMedia({video: true}, handleVideo, function (err){alert(err);});

	$("#class").on("keydown change", function() {
		var subclass = $("#subclass");
		subclass.empty();
		if(this.value == "ks") {
			subclass[0].add(new Option("1", "1"));
			subclass[0].add(new Option("2", "2"));
			subclass.show();
		} else if (this.value == "teacher" || this.value == "other") {
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

		if (this.value == "teacher") {
			$("#birth_container").hide();
		} else {
			$("#birth_container").show();
		}
	});

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
		if (pwd != $("#password_repeat").val())
		{
			alert("Fehler: Die Passwörter stimmen nicht überein.");
			return;
		}

		if (pwd.length < PWD_MINLEN)
		{
			alert("Fehler: Das Passwort muss mindestens " + PWD_MINLEN
				+ " Zeichen lang sein.");
			return;
		}

		var pictureData = $("#webcam_shot")[0].toDataURL();
		var picname = (Math.random()*1e17+Math.random()*1e35).toString(36);

		var photo_result = false;
		var api_result = false;

		// Send Picture
		webcamserv_upload(picname, pictureData, function (res) {
			photo_result = res;
		});

		// Send Data
		var regdata = {
			password : $("#password").val(),
			firstname : $("#firstname").val(),
			lastname : $("#lastname").val(),
			birthday : $("#birthday").val(),
			birthmonth : $("#birthmonth").val(),
			birthyear : $("#birthyear").val(),
			sclass : $("#class").val(),
			subclass : $("#subclass").val(),
			picname : picname
		};

		action_cert("register_student", regdata, "registration_cert", function (res) {
			api_result = res;
		});

		var interval = setInterval(function () {
			if (photo_result !== false && api_result !== false) {
				if (photo_result === "ok" && api_result === "ok") {
					alert("Registrierung erfolgreich!");
					$("#main_form")[0].reset();
					highlight_pwd();
					webcam_shot.getContext("2d").clearRect(0, 0,
						webcam_shot.width, webcam_shot.height);
					window.scrollTo(0, 0);
				} else {
					if  (photo_result !== "ok") {
						alert("Fehler: Foto konnte nicht hochgeladen werden: "
							+ photo_result);	
					}
					if (api_result !== "ok") {
						alert("Registrierung fehlgeschlagen: " + api_result);
					}
				}
				clearInterval(interval);
			}
		}, 200);
	});
});
