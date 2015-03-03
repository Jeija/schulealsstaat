var COLUMNS = 3;
var QRCODE_SIZE = 5;

function render_student_card(student, td) {
	var idcard = $('<div class="idcard">').appendTo(td);
	var qrimg = $('<img class="qrcode">').appendTo(idcard);
	qr.image({
		level : "m",
		image : qrimg[0],
		value : student.qrid,
		size : QRCODE_SIZE
	});
	$('<div class="name">')
		.text(student.firstname + " " + student.lastname)
		.appendTo(idcard);
	var passpic = $('<img class="passpic" hidden>')
		.appendTo(idcard);

	webcamserv_get(student.picname, function (res) {
		if (res == "") return;
		passpic.attr("src", "data:image/png;base64," + res);
		passpic.show();
	});
}

function render_students(list) {
	$("#studentlist").html("");

	for (var y = 0;; y++) {
		var row = $("<tr>").appendTo($("#studentlist"));
		for (var x = 0; x < COLUMNS; x++) {
			var listnum = y * COLUMNS + x;
			if (listnum >= list.length) return;
			var student = list[listnum];
			var td = $('<td class="idcard-container">').appendTo(row);
			render_student_card(student, td);
		}
	}
}

$(function () {
	$("#type_ok").click(function () {
		$("#type_popup").hide();
		var type = $("#type").val();
		var condition = {
			query : { type : type },
			fields : {"firstname" : 1, "lastname" : 1, "qrid" : 1, "picname" : 1}
		};
		if (type == "*") condition.query = {};
		action_cert("get_students", condition, "admin_cert", function (res) {
			render_students(res);
		});
	});
});
