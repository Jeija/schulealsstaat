var current_profile = null;

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

function date_readable (birth) {
	var bdate = new Date(birth);
	return bdate.getDate() + "." + (bdate.getMonth() + 1) + "." + bdate.getFullYear();
}

function render_list(list) {
	$("#studentlist").html("");
	$("#studentlist").append($("<tr>")
		.append($("<th>")
			.text("Vorname"))
		.append($("<th>")
			.text("Nachname"))
		.append($("<th>")
			.text("jur. Person"))
		.append($("<th>")
			.text("Klasse"))
		.append($("<th>")
			.text("Land"))
		.append($("<th>")
			.text("Alter"))
		.append($("<th>")
			.text("Geburtstag"))
		.append($("<th>")
			.text("QR-ID"))
		.append($("<th>")
			.text("Kontostand"))
		.append($("<th>")
			.text("Aktionen"))
	);

	for (var i = 0; i < list.length; i++) {
		var st = list[i];

		$("#studentlist").append($("<tr>")
			.append($("<td>")
				.text(st.firstname))
			.append($("<td>")
				.text(st.lastname))
			.append($("<td>")
				.text(st.special_name))
			.append($("<td>")
				.text(st.type))
			.append($("<td>")
				.text(country_readable(st.country)))
			.append($("<td>")
				.text(calcAge(st.birth)))
			.append($("<td>")
				.text(date_readable(st.birth)))
			.append($("<td>")
				.text(st.qrid))
			.append($('<td class="num">')
				.text(st.balance.toFixed(3) + " HGC"))
			.append($("<td>")
				.append('<input type="button" value="ändern"' +
					'class="profile_open" data-listid="' + i + '">')
				.append('<input type="button" value="löschen"' +
					'class="student_delete" data-listid="' + i + '">'))
		);
	}

	// Show student's profile
	$(".profile_open").click(function () {
		var st = list[$(this).data("listid")];
		current_profile = st;
		$("#profile").fadeIn(200);

		$("#profile_pass").attr("src", "");
		$("#profile_table").html("");
		$("#profile_table")
			.append($("<tr>")
				.append($("<td>").text("QR-ID"))
				.append($("<td>").text(st.qrid)))
			.append($("<tr>")
				.append($("<td>").text("Vorname"))
				.append($("<td>").text(st.firstname)))
			.append($("<tr>")
				.append($("<td>").text("Nachname"))
				.append($("<td>").text(st.lastname)))
			.append($("<tr>")
				.append($("<td>").text("jur. Person"))
				.append($("<td>").text(st.special_name)))
			.append($("<tr>")
				.append($("<td>").text("Klasse / Typ"))
				.append($("<td>").text(st.type)))
			.append($("<tr>")
				.append($("<td>").text("Land"))
				.append($("<td>").text(country_readable(st.country) +
					(typeof st.country !== "undefined" ?
					" (" + st.country + ")" : "none" ))))
			.append($("<tr>")
				.append($("<td>").text("Geburtstag"))
				.append($("<td>").text(date_readable(st.birth))))
			.append($("<tr>")
				.append($("<td>").text("Alter"))
				.append($("<td>").text(calcAge(st.birth))))
			.append($("<tr>")
				.append($("<td>").text("Birth-ID"))
				.append($("<td>").text(st.birth)))
			.append($("<tr>")
				.append($("<td>").text("Bild-ID"))
				.append($("<td>").text(st.picname)));
	});

	$(".student_delete").click(function () {
		var st = list[$(this).data("listid")];
		if (window.confirm(st.firstname + " " + st.lastname + " wirklich löschen?")) {
			var selector = "#master_cert_input";
			action_mastercert("student_delete", st.qrid, selector, function (res) {
				if (res == "ok") alert(st.firstname + " " + st.lastname + " gelöscht.");
				else alert("Fehler: " + res);
			});
		}
	});
}

$(function() {
	// #################### Prepare page ####################
	var forms = ["firstname", "lastname", "type", "country"];
	forms.forEach(function (f) {
		$(	'<td><input type="text" class="criterium"></td>' +
			'<td><input type="radio" name="yesno_' + f + '" value="yes" /></td>' +
			'<td><input type="radio" name="yesno_' + f + '" value="no" /></td>' +
			'<td><input type="radio" name="yesno_' + f + '" value="ignore" checked /></td>'
		).appendTo("#"+f);
	});

	$(	'<td><input type="text" class="criterium qrid_scan_target"></td>' +
		'<td><input type="radio" name="yesno_qrid" value="yes" /></td>' +
		'<td><input type="radio" name="yesno_qrid" value="no" /></td>' +
		'<td><input type="radio" name="yesno_qrid" value="ignore" checked /></td>' +
		'<td><input type="button" value="Scan" class="qrid_scan"></td>'
	).appendTo("#qrid");

	var forms_compare = ["birth", "balance"];
	forms_compare.forEach(function (f) {
		$(	'<td><input type="text" class="criterium"></td>' +
			'<td><input name="compare_' + f + '" type="radio" value="greater"></td>' +
			'<td><input name="compare_' + f + '" type="radio" value="smaller"></td>' +
			'<td><input name="compare_' + f + '" type="radio" value="equal"></td>' +
			'<td><input name="compare_' + f + '" type="radio" value="unequal"></td>' +
			'<td><input name="compare_' + f + '" type="radio" value="ignore" checked></td>'
		).appendTo("#"+f);
	});
	$('input[value="unequal"][name="compare_birth"]').attr("disabled", true);


	function cond_yesno(cond, crit) {
		var value = $("#" + crit + " input[type=text]").val();
		if($('input[name=yesno_' + crit + ']:checked').val() == "yes") {
			cond[crit] = value;
		} else if ($('input[name=yesno_' + crit + ']:checked').val() == "no") {
			cond[crit] = {$ne : value};
		}
	}

	function cond_compare(cond, crit) {
		var value = $("#" + crit + " input[type=text]").val();
		var flip = false; // flip greater than / smaller than

		var birth = new Date();
		if (crit == "birth") {
			birth.setFullYear(birth.getFullYear() - value);
			value = new Date(birth);
			flip = true;
		}

		var checkopt = $('input[name=compare_' + crit + ']:checked').val();

		if ((checkopt == "greater" && !flip) || (checkopt == "smaller" && flip))
			cond[crit] = {$gt : value};
		if ((checkopt == "smaller" && !flip) || (checkopt == "greater" && flip))
			cond[crit] = {$lt : value};

		if (checkopt == "equal") {
			if (crit == "birth") {
				birth.setFullYear(birth.getFullYear() - 1);
				var year_after_bday = new Date(birth);
				year_after_bday.setFullYear(birth.getFullYear() + 1);
				cond[crit] = {$gt : birth, $lt : year_after_bday};
			} else cond[crit] = value;
		} else if (checkopt == "unequal") {
			cond[crit] = value;
		}
	}

	$("#loadfilter").click(function () {
		var condition = {};
		cond_yesno(condition, "firstname");
		cond_yesno(condition, "lastname");
		cond_yesno(condition, "qrid");
		cond_yesno(condition, "type");
		cond_yesno(condition, "country");
		cond_compare(condition, "balance");
		cond_compare(condition, "birth");

		var cond = {}, crit, tc;
		var operator = $('input[name=operator]:checked').val();
		if (operator == "and") cond = condition;
		else if (operator == "or") {
			cond.$or = [];
			for (crit in condition) {
				tc = {};
				tc[crit] = condition[crit];
				cond.$or.push(tc);
			}
		} else if (operator == "nor") {
			cond.$nor = [];
			for (crit in condition) {
				tc = {};
				tc[crit] = condition[crit];
				cond.$nor.push(tc);
			}
		}

		var req = {query : cond};
		action_cert("get_students", req, "admin_cert", function (res) {
			var students = res;
			render_list(students);
		});	
	});

	$("#query_go").click(function () {
		var req = {query : JSON.parse($("#mongoose_query").val())};
		action_cert("get_students", req, "admin_cert", function (res) {
			var students = res;
			render_list(students);
		});
	});

	$("#profile_close").click(function () {
		$("#profile").fadeOut(200);
		$("#qr_popup").fadeOut(200);
	});

	$("#profile_pass_load").click(function () {
		webcamserv_get(current_profile.picname, "admin_cert", function (res) {
			$("#profile_pass").attr("src", "data:image/png;base64," + res);
		});
	});

	$(".qrid_scan").click(function () {
		var qrid_scan_target = $(this).parent().parent().find(".qrid_scan_target");
		QRReader.init("#qr_webcam", "../QRScanJS/");
		$("#qr_popup").fadeIn(200);
		QRReader.scan(function (qrid) {
			$("#qr_popup").fadeOut(200);
			qrid_scan_target.val(qrid);
		});
	});

	$(".profile_edit").click(function () {
		var change = {
			qrid : current_profile.qrid,
			prop : $(this).data("profile_property"),
			value : $(this).parent().parent().find(".profile_value").val()
		};

		action_cert("profile_edit", change, "admin_cert", function (res) {
			if(res == "ok") alert("Wert geändert");
			else alert("Fehler " + res);
		});
	});

	$("#profile_pwd_edit").click(function () {
		var data = {
			qrid : current_profile.qrid,
			password : $("#profile_pwd").val()
		};

		action_mastercert("password_change_master", data, "#master_cert_input",
				function (res) {
			if(res == "ok") alert("Passwort geändert");
			else alert("Fehler " + res);
		});
	});

	$("#profile_checkin").click(function () {
		var qrid = current_profile.qrid;
		action_cert("ec_checkin", qrid, "admin_cert", function (res) {
			var fullname = current_profile.firstname + " " + current_profile.lastname;
			if(res == "ok") alert("Checkin" + 
				(fullname.length > 1 ? " von " + fullname : "") + " erfolgreich!");
			else alert("Fehler " + res);
		});
	});

	$("#profile_checkout").click(function () {
		var qrid = current_profile.qrid;
		action_cert("ec_checkout", qrid, "admin_cert", function (res) {
			var fullname = current_profile.firstname + " " + current_profile.lastname;
			if(res == "ok") alert("Checkout" +
				(fullname.length > 1 ? " von " + fullname : "") + " erfolgreich!");
			else alert("Fehler " + res);
		});
	});

	$("#qr_popup_abort").click(function() {
		$("#qr_popup").fadeOut(200);
	});
});
