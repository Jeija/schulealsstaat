function reload_config() {
	action("config_getall", false, function (res) {
		render_config(res);
	});
}

function render_config(conf) {
	$("#config").html("");
	$("#config").append($("<tr>")
		.append($("<th>")
			.text("Name"))
		.append($("<th>")
			.text("Wert"))
		.append($("<th>")
			.text("Aktion"))
	);

	for (var key in conf) {
		var value = conf[key];

		$("#config").append($("<tr>")
			.append($("<td>")
				.text(key))
			.append($("<td>")
				.append('<input type="text" value="' + value + '" id="property_'
					+ key + '">'))
			.append($("<td>")
				.append('<input type="button" value="Ändern" data-property="'
					+ key + '" class="edit">')
				.append('<input type="button" value="Löschen" data-property="'
					+ key + '" class="delete">'))
		);
	}

	$(".edit").click(function () {
		var key = $(this).data("property");
		var value = $("#property_" + key).val();
		var arg = {
			key : key,
			value : value
		};
		action_mastercert("config_set", arg, "#master_cert_input", function (res) {
			if (res == "ok") {
				reload_config();
			} else {
				alert("error: " + res);
			}
		});
	});

	$(".delete").click(function () {
		var key = $(this).data("property");
		action_mastercert("config_del", key, "#master_cert_input", function (res) {
			if (res == "ok") {
				reload_config();
			} else {
				alert("error: " + res);
			}
		});
	});
}

$(function () {
	$("#loadconfig").click(function () {
		reload_config();
	});

	$("#add_submit").click(function () {
		var key = $("#add_key").val();
		var value = $("#add_value").val();
		var arg = {
			key : key,
			value : value
		};
		action_mastercert("config_set", arg, "#master_cert_input", function (res) {
			if (res == "ok") {
				reload_config();
			} else {
				alert("error: " + res);
			}
		});
	});
});
