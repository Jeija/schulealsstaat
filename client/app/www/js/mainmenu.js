setInterval(function () {
	var balance = Math.floor(parseFloat(storage.get("balance")) * 100 + 0.5) / 100;
	$("#value").text(balance.toFixed(2).replace(".", ","));
	$(".mainheadline > .qrid").text("Konto: " + storage.get("qrid"));
}, 200);

$(function () {
	if (!storage.get("qrid")) {
		window.location = "authenticate.html";
	}

	/** Refresh balance **/
	$("#infocontainer").click(refresh_balance);

	function refresh_balance() {
		$("#infocontainer").unbind();
		$("#balance .showbalance").fadeOut(200, function () {
			$("#balance .showbalance").show();
			$("#balance .showbalance").css("opacity", "0.0");
		});
		$("#balance .loadbalance").fadeIn(200);
		var req = {
			password : storage.get("password"),
			qrid : storage.get("qrid")
		};

		setTimeout(function () {
			$("#infocontainer").click(refresh_balance);
			action_app("get_balance", req, function (res) {
				$("#balance .loadbalance").fadeOut(200, function () {
					$("#balance .showbalance").css("opacity", "1.0");
					$("#balance .showbalance").hide();
					$("#balance .showbalance").fadeIn(200);
				});
				if (isNaN(res) || !res) {
					errorMessage("Unbekannter Fehler: " + res);
				} else {
					storage.set("balance", res);
				}
			}, function () {
				$("#balance .loadbalance").hide();
				$("#balance .showbalance").css("opacity", "1.0");
			});
		}, 200);
	}
});
