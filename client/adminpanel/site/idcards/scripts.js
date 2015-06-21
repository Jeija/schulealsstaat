var PAGE_W = 210;
var PAGE_H = 297;

// Cards
var CARD_W = 70;
var CARD_H = 50.8;
var CARD_MARGIN_X = 0;
var CARD_MARGIN_Y = 0;
var PAGE_OFFSET_X = 0;
var PAGE_OFFSET_Y = 23;

// QR Code
var QRCODE_OFFSET_X = 4;
var QRCODE_OFFSET_Y = 7;
var QRCODE_W = 41;
var QRCODE_H = 41;
var QRCODE_RESOLUTION = 10;

// Passport Image
var PASSPIC_OFFSET_X = 43;
var PASSPIC_OFFSET_Y = 7;
var PASSPIC_W = 23;
var PASSPIC_H = 17.25;

// Text
var TEXT_OFFSET_X = 51;
var TEXT_OFFSET_Y = 28.5;
var TEXT_FONTSIZE = 6;
var TEXT_LINEHEIGHT = 3;

// Title
var TITLE_OFFSET_X = CARD_W / 2;
var TITLE_OFFSET_Y = 5;
var TITLE_FONTSIZE = 13;
var TITLE_FONTSIZE_TOOLONG = 8;

// QR-ID
var QRID_OFFSET_X = QRCODE_OFFSET_X + QRCODE_W / 2;
var QRID_OFFSET_Y = 49;
var QRID_FONTSIZE = 10;

// Logo
var LOGO_OFFSET_X = 43.5;
var LOGO_OFFSET_Y = 26;
var LOGO_W = 6;
var LOGO_H = 6;

// Wunderland Logo
var WUNDERLAND_OFFSET_X = 43;
var WUNDERLAND_OFFSET_Y = 35;
var WUNDERLAND_W = 22.96;
var WUNDERLAND_H = 8.568;

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

/**
 * Taken from http://stackoverflow.com/questions/21060876/is-there-any-way-to-center-text-with-jspdf,
 * user Tsilis
 **/
(function(API) {
	API.centerText = function(x, y, txt) {
		var fontSize = this.internal.getFontSize();
		var pageWidth = this.internal.pageSize.width;
		txtWidth = this.getStringUnitWidth(txt) * fontSize / this.internal.scaleFactor;
		x = x - txtWidth / 2;
		this.text(txt, x, y);
	}
})(jsPDF.API);

var saeulogo = null;
toJPEG("saeulogo.png", function (jpeg) {
	saeulogo = jpeg;
});

var wunderland = null;
toJPEG("wunderland.png", function (jpeg) {
	wunderland = jpeg;
});

var passpic_visitors = null;
toJPEG("passpic_visitors.png", function (jpeg) {
	passpic_visitors = jpeg;
});

var passpic_legalentity = null;
toJPEG("passpic_legalentity.png", function (jpeg) {
	passpic_legalentity = jpeg;
});

var passpic_replacement = null;
toJPEG("passpic_replacement.png", function (jpeg) {
	passpic_replacement = jpeg;
});


function assert(key, object) {
	if (!(key in object)) throw key + " fehlt!";
}

function date_readable (birth) {
	var bdate = new Date(birth);
	return bdate.getDate() + "." + (bdate.getMonth() + 1) + "." + bdate.getFullYear();
}

function country_readable (countrycode) {
	if (countrycode == "de") return "Deutschland";
	if (countrycode == "fr") return "Frankreich";
	if (countrycode == "tr") return "Türkei";
	if (countrycode == "gb") return "Großbritannien";
	if (countrycode == "it") return "Italien";
	return "Kein Land";
}

/**
 * Returns title and lines of additional information per account:
 * {
 *	title : String,
 *	lines : [ String, String, ... ]
 * }
 */
function student_readable(student) {
	var title = "";
	var lines = [];
	if (!("type") in student) throw "type is missing";
	var cl = student.type.toLowerCase();
	if (cl == "replacement") {
		title = "Name:                                      ";
		lines.push("Ersatzkarte /");
		lines.push("Sonderkarte");
	} else if (cl == "legalentity") {
		assert("special_name", student);
		title = student.special_name;
		lines.push("juristische");
		lines.push("Person");
	} else if (cl == "visitor") {
		title = "Besucherausweis";
		lines.push("Herzlich");
		lines.push("Willkommen in...");
	} else {
		assert("firstname", student);
		assert("lastname", student);
		title = student.firstname + " " + student.lastname;
		if (cl == "teacher") {
			lines.push("Lehrer / Lehrerin");
		} else if (cl == "other") {
			lines.push("Sonderausweis");
		} else {
			lines.push("Klasse " + cl.toUpperCase());
			if ("birth" in student)
				lines.push("* " + date_readable(student.birth));
		}
		lines.push(country_readable(student.country ? student.country.toLowerCase() : ""));
	}
	return { title : title, lines : lines };
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
	} else if (student.type == "visitor") {
		pdf.addImage(passpic_visitors, "JPEG", xpos + PASSPIC_OFFSET_X,
			ypos + PASSPIC_OFFSET_Y, PASSPIC_W, PASSPIC_H);
	} else if (student.type == "replacement") {
		pdf.addImage(passpic_replacement, "JPEG", xpos + PASSPIC_OFFSET_X,
			ypos + PASSPIC_OFFSET_Y, PASSPIC_W, PASSPIC_H);
	}

	if (student.type == "legalentity") {
		pdf.addImage(passpic_legalentity, "JPEG", xpos + PASSPIC_OFFSET_X,
			ypos + PASSPIC_OFFSET_Y, PASSPIC_W, PASSPIC_H);
	}

	var readable = student_readable(student);

	// Render Title
	pdf.setFontSize(TITLE_FONTSIZE);
	if (readable.title.length > 25) pdf.setFontSize(TITLE_FONTSIZE_TOOLONG);
	pdf.setFont("helvetica", "bold");
	pdf.centerText(xpos + TITLE_OFFSET_X, ypos + TITLE_OFFSET_Y, readable.title);

	// Render Text
	pdf.setFontSize(TEXT_FONTSIZE);
	pdf.setFont("helvetica", "normal");

	for (var l = 0; l < readable.lines.length; l++) {
		pdf.text(xpos + TEXT_OFFSET_X, ypos + TEXT_OFFSET_Y + TEXT_LINEHEIGHT * l,
			readable.lines[l]);
	}

	// Render QR-ID
	assert("qrid", student);
	pdf.setFontSize(QRID_FONTSIZE);
	pdf.centerText(xpos + QRID_OFFSET_X, ypos + QRID_OFFSET_Y, student.qrid);

	// Render Logo
	pdf.addImage(saeulogo, "JPEG", xpos + LOGO_OFFSET_X, ypos + LOGO_OFFSET_Y,
		LOGO_W, LOGO_H);

	// Render Wunderland
	pdf.addImage(wunderland, "JPEG", xpos + WUNDERLAND_OFFSET_X, ypos +WUNDERLAND_OFFSET_Y,
		WUNDERLAND_W, WUNDERLAND_H);
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

	// Sort list by type
	list.sort(function (a, b) {
		if (a.type < b.type) return -1;
		if (a.type > b.type) return 1;
		return 0;
	});

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
			"qrid" : 1, "picname" : 1, "birth" : 1, "special_name" : 1,
			"country" : 1}
	};
	if (type == "*") condition.query = {};
	action_cert("students_get", condition, "admin_cert", function (res) {
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
