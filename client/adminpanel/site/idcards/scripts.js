var PAGE_W = 210;
var PAGE_H = 297;

// Cards
var CARD_W = 70;
var CARD_H = 50.8;
var CARD_MARGIN_X = 0;
var CARD_MARGIN_Y = 0;
var PAGE_OFFSET_X = 0;
var PAGE_OFFSET_Y = 21;

// QR Code
var QRCODE_OFFSET_X = 4;
var QRCODE_OFFSET_Y = 2;
var QRCODE_W = 41;
var QRCODE_H = 41;
var QRCODE_RESOLUTION = 10;

// Passport Image
var PASSPIC_OFFSET_X = 43;
var PASSPIC_OFFSET_Y = 2;
var PASSPIC_W = 21.333;
var PASSPIC_H = 16;

// Text
var TEXT_OFFSET_X = 43;
var TEXT_OFFSET_Y = 28;
var TEXT_FONTSIZE = 8;
var TEXT_LINEHEIGHT = 3;

// QR-ID
var QRID_OFFSET_X = 16;
var QRID_OFFSET_Y = 47;
var QRID_FONTSIZE = 10;

// Logo
var LOGO_OFFSET_X = 4;
var LOGO_OFFSET_Y = 41;
var LOGO_W = 9;
var LOGO_H = 9;

var AMOUNT_X = Math.floor((PAGE_W - PAGE_OFFSET_X + CARD_MARGIN_X) / (CARD_W + CARD_MARGIN_X));
var AMOUNT_Y = Math.floor((PAGE_H - PAGE_OFFSET_Y + CARD_MARGIN_Y) / (CARD_H + CARD_MARGIN_Y));

var passpics_to_load = 0;

function toJPEG (src, cb) {
	var canvas = document.createElement("canvas");
	var img = document.createElement("img");
	var ctx = canvas.getContext("2d");

	img.src = src;
	img.onload = function () {
		canvas.width = img.width;
    		canvas.height = img.height;

		ctx.beginPath();
		ctx.rect(0, 0, canvas.width, canvas.height);
		ctx.fillStyle = "#fff";
		ctx.fill();

		ctx.drawImage(img, 0, 0);
		cb(canvas.toDataURL("image/jpeg"));
	};
}

var saeulogo = null;
toJPEG("saeulogo.png", function (jpeg) {
	saeulogo = jpeg;
});

function assert(key, object) {
	if (!(key in object)) throw key + " fehlt!";
}

function date_readable (birth) {
	var bdate = new Date(birth);
	return bdate.getDate() + "." + (bdate.getMonth() + 1) + "." + bdate.getFullYear();
}

/**
 * Returns multiple lines of text that describe a student / an account,
 * e.g. containing name, class, birth date, etc.
 * Return value is in the form:
 *	[ line0, line1, line2, ... ]
 */
function student_readable(student) {
	var lines = [];
	if (!("type") in student) throw "type is missing";
	var cl = student.type.toUpperCase();
	if (cl == "LEGALENTITY") {
		assert("special_name", student);
		lines.push(student.special_name);
		lines.push("(juristische Person)");
	} else if (cl == "VISITOR") {
		lines.push("Besucher");
		lines.push("");
		lines.push("Diese Karte darf");
		lines.push("       NICHT");
		lines.push("weitergegeben");
		lines.push("werden.");
	} else {
		assert("firstname", student);
		assert("lastname", student);
		lines.push(student.firstname + " " + student.lastname);
		if (cl == "TEACHER") {
			lines.push("Lehrer / Lehrerin");
		} else if (cl == "OTHER") {
			if ("birth" in student)
				lines.push("* " + date_readable(student.birth));
		} else {
			lines.push(cl);
			if ("birth" in student)
				lines.push("* " + date_readable(student.birth));
		}
	}
	return lines;
}

function render_student_card(pdf, student, page, xpos, ypos) {
	//pdf.rect(xpos, ypos, CARD_W, CARD_H);

	// Render QR-Code
	var qrdat = qr.toDataURL({
		level : "m",
		mime : "image/jpeg",
		value : student.qrid,
		size : QRCODE_RESOLUTION
	});
	pdf.addImage(qrdat, "JPEG", xpos + QRCODE_OFFSET_X, ypos + QRCODE_OFFSET_Y,
		QRCODE_W, QRCODE_H);

	// Render passport photo
	if ("picname" in student) {
		passpics_to_load++;
		webcamserv_get(student.picname, function (res) {
			if (res === "") {
				passpics_to_load--;
				return;
			}

			toJPEG("data:image/png;base64," + res, function (jpeg) {
				passpics_to_load--;

				pdf.setPage(page + 1);
				pdf.addImage(jpeg, "JPEG", xpos + PASSPIC_OFFSET_X,
					ypos + PASSPIC_OFFSET_Y, PASSPIC_W, PASSPIC_H);
			});
		});
	}

	// Render Text
	var lines = student_readable(student);
	pdf.setFontSize(TEXT_FONTSIZE);
	for (var l = 0; l < lines.length; l++) {
		pdf.text(xpos + TEXT_OFFSET_X, ypos + TEXT_OFFSET_Y + TEXT_LINEHEIGHT * l,
			lines[l]);
	}

	// Render QR-ID
	assert("qrid", student);
	pdf.setFontSize(QRID_FONTSIZE);
	pdf.text(xpos + QRID_OFFSET_X, ypos + QRID_OFFSET_Y, student.qrid);

	// Render Logo
	pdf.addImage(saeulogo, "JPEG", xpos + LOGO_OFFSET_X, ypos + LOGO_OFFSET_Y,
		LOGO_W, LOGO_H);
}

function render_students(pdf, list) {
	passpics_to_load = 0;
	for (var page = 0;; page++) {
		for (var y = 0; y < AMOUNT_Y; y++) {
			for (var x = 0; x < AMOUNT_X; x++) {
				var index = AMOUNT_X * AMOUNT_Y * page + AMOUNT_X * y + x;
				if (!(index in list)) return;
				var student = list[index];
				var xpos = PAGE_OFFSET_X + (CARD_MARGIN_X + CARD_W) * x;
				var ypos = PAGE_OFFSET_Y + (CARD_MARGIN_Y + CARD_H) * y;
				render_student_card(pdf, student, page, xpos, ypos);
			}
		}
		pdf.addPage();
	}
}

function makepdf(list) {
	var pdf = new jsPDF();
	render_students(pdf, list);

	// Wait for async passport picture requests to complete
	var interval = setInterval(function () {
		if (passpics_to_load !== 0) return;
		clearInterval(interval);
		$("#pdf_preview").attr("src", pdf.output("bloburi"));
		$("#pdf_preview").show();
	}, 100);
}

$(function () {

$("#type_ok").click(function () {
	$("#type_popup").hide();
	var type = $("#type").val();
	var condition = {
		query : { type : type },
		fields : {"firstname" : 1, "type" : 1, "lastname" : 1,
			"qrid" : 1, "picname" : 1, "birth" : 1, "special_name" : 1}
	};
	if (type == "*") condition.query = {};
	action_cert("get_students", condition, "admin_cert", function (res) {
		makepdf(res);
	});
});

$("#upload").click(function () {
	$("<input type=\"file\" />").click().change(function(e) {
		var reader = new FileReader();
		reader.onload = function(event) {
			try {
				var list = JSON.parse(event.target.result);
				makepdf(list);
			} catch(e) {
				alert("JSON-Fehler: " + e);
			}
		};
		reader.readAsText(e.target.files[0]);
	});
});

});
