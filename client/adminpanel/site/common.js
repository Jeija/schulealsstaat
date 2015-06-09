function country_readable (country) {
	if (typeof country === "undefined") return "";
	if (country == "gb") return "Großbritannien";
	if (country == "de") return "Deutschland";
	if (country == "fr") return "Frankreich";
	if (country == "it") return "Italien";
	if (country == "tr") return "Türkei";
	return country;
}

function getConfig(config, cb) {
	action("config_get", config, function (res) {
		if (res != "") cb(res);
	});
}

function downloadData(filename, data) {
	// nw.js
	if (typeof require !== "undefined") {
		var file = $("<input>").attr("type", "file").attr("nwsaveas", filename);
		file.change(function (e) {
			var fs = require("fs");
			fs.writeFileSync($(this).val(), data);
		});
		file.click();

	// Normal Browser
	} else {
		var dl = $("<a>").attr("href", "data:text/plain;charset=utf-8," + encodeURIComponent	(data));
		dl.attr("download", filename);
		$(document.body).append(dl);
		dl[0].click();
		dl.remove();
	}
}
