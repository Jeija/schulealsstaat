var polling_active = false;

$(function () {
	storage.set("polling", false);

	if (!storage.get("qrid")) {
		$("#content_frame").attr("src", "authenticate.html");
	} else {
		$("#content_frame").attr("src", "mainmenu.html");
	}
	$("#loading").hide();
	$("#content_frame").show();

	// Long-poll for new transactions
	Notification.requestPermission();

	setInterval(function () {
		if (polling_active) return;
		if (!storage.get("qrid")) return;
		if (storage.get("password") === undefined) return;

		polling_active = true;
		var last_sync = storage.get("last_sync");
		if (!last_sync) last_sync = 0;

		action_poll("transactions_poll", {
			qrid : storage.get("qrid"),
			password : storage.get("password"),
			date : last_sync
		}, function (res) {
			polling_active = false;

			// No visible reporting here, this is a background process
			if (typeof res !== "object") {
				console.log("polling error: " + res);
				return;
			}
			if (!res || res.length <= 0 || !res[0]) return;

			var new_sync = Date.parse(res[0].time);
			storage.set("last_sync", new_sync);
			update_balance();

			// Push notification
			res.forEach(function (tr) {
				new Notification("Du hast " + tr.amount_received.toFixed(2) +
					" HGC von '" + student2readable(tr.sender) + "' erhalten.", {
						icon : "res/icon128.png"
					});
			});
		});
	}, 3000);
	// (interval of 3000ms so that the app doesn't DoS the server in case it happens to close
	// the connection instantly)
});
