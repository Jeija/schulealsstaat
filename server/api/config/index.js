var db = require("../db");
var log = require("../logging");
var fs = require("fs");
var cert = require("../cert");
var settings = require("../settings.js");

var config = require("./defaults.json");

/**
 * Regularly read configuration from database
 * That way, multiple API instances can be synchronized and configuration
 * changes are logged in the database.
 */
function update_config() {
	db.config.load(function (cfg_new) {
		for (var i = 0; i < cfg_new.length; i++) {
			var key = cfg_new[i].key;
			var value = cfg_new[i].value;
			if (value === null && key in config) {
				log.info("Config", "Removed " + key);
				delete config[key];
			} else if (value !== null && config[key] !== value) {
				log.info("Config", "Set " + key + " to " + value);
				config[key] = value;
			}
		}
	});
}

// Set config entry to value
function set(key, value) {
	db.config.set(key, value);
}

// Delete config entry
function del(key) {
	db.config.set(key, null);
	delete config[key];
}

/**
 * Returns config value or alt_val if not found
 * Requested key-alt_val-pair is added to config if not found in db,
 * so that future requests with the same key will always get the same
 * value back (no matter their alt_val) and so that the config option
 * is user-visible in the adminpanel/config client.
 */
function get(key) {
	return config[key];
}

function getAll() {
	return config;
}

update_config();
setInterval(update_config, settings.config_load_interval);

module.exports = {
	set : set,
	get : get,
	del : del,
	getAll : getAll
}
