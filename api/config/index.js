var CONFIG_FILE = __dirname + "/config.json";

var fs = require("fs");
var cert = require("../cert");

var config = {}

var config_towrite = {};
var config_todelete = [];

var is_writing = false;

// (Re-)read config from file
function read() {
	config = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
}

// Save config file, may overwrite changes
function save() {
	is_writing = true;
	fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, "\t"), "utf8", function () {
		for (var k in config_towrite) config[i] = config_towrite[k];
		for (var i = 0; i <= config_todelete; i++) delete config[config_todelete[i]];
		is_writing = false;
		if (config_towrite.length > 0 || config_todelete.length > 0) {
			save();
			config_towrite = {};
			config_todelete = [];
		}
	});
}

// Set config entry to value
function set(key, value) {
	if (is_writing) {
		config_towrite[key] = value;
	} else {
		config[key] = value;
		save();
	}
}

// Delete config entry
function del(key) {
	if (is_writing) {
		config_todelete.push(key);
	} else {
		delete config[key];
		save();
	}
}

// Returns config value or alt_val if not found
function get(key, alt_val) {
	if (key in config)	return config[key];
	else			return alt_val;
}

function getAll() {
	return config;
}

read();

module.exports = {
	set : set,
	get : get,
	del : del,
	getAll : getAll
}
