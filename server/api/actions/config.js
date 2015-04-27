var log = require("../logging.js");
var cert = require("../cert");
var config = require("../config");

module.exports = function (register, register_cert) {
	// Warning: Reading configuration is unprotected!
	// There shouldn't be any relevant data inside anyways
	register("config_get", function (payload, answer) {
		var value = config.get(payload);
		answer(value);
		log.info("request " + payload + " answered with " + JSON.stringify(value));
	});

	register_cert("config_set", ["master_hash"], function (payload, answer, error, info) {
		config.set(payload.key, payload.value);
		answer("ok");
		info("set " + payload.key + " to " + payload.value);
	});

	register_cert("config_del", ["master_hash"], function (payload, answer, error, info) {
		config.del(payload);
		answer("ok");
		info("deleting " + payload);
	});

	register("config_getall", function (payload, answer, error, info) {
		answer(config.getAll());
		info("done");
	});
}
