var log = require("../logging.js");
var cert = require("../cert");
var config = require("../config");

module.exports = function (register, register_cert) {
	// Warning: Reading configuration is unprotected!
	register("config_get", function (payload, answer) {
		log.info("API", "config_get for " + payload);
		var value = config.get(payload, "");
		answer(value.toString());
	});

	register_cert("config_set", ["master_hash"], function (payload, answer) {
		log.info("API", "config_set " + payload.key + " = " + payload.value);
		config.set(payload.key, payload.value);
		answer("ok");
	});

	register_cert("config_del", ["master_hash"], function (payload, answer) {
		log.info("API", "config_del " + payload);
		config.del(payload);
		answer("ok");
	});

	register("config_getall", function (payload, answer) {
		log.info("API", "config_getall");
		answer(config.getAll());
	});
}
