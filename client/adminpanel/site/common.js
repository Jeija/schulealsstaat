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
