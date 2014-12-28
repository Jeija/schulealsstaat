var log = require("../logging.js");
var cert = require("../cert");
var config = require("../config");

module.exports = function (register){
	// Warning: Reading configuration is unprotected!
	register("config_get", function (arg, res, req) {
		try {
			log.info("API", "config_get for " + arg);
			var value = config.get(arg, "");
			res.end(value.toString());
		} catch(e) {
			log.err("API", "config_get error: " + e);
			res.end("error: " + e);
		}
	});

	register("config_set", function (arg, res, req) {
		cert.check(["master_hash"], req, function () {
			try {
				var data = JSON.parse(arg);
				log.info("API", "config_set " + data.key + " = " + data.value);
				config.set(data.key, data.value);
				res.end("ok");
			} catch(e) {
				log.err("API", "config_set error: " + e);
				res.end("error: " + e);
			}
		});
	});

	register("config_del", function (arg, res, req) {
		cert.check(["master_hash"], req, function () {
			try {
				log.info("API", "config_del " + arg);
				config.del(arg);
				res.end("ok");
			} catch(e) {
				log.err("API", "config_del error: " + e);
				res.end("error: " + e);
			}
		});
	});

	register("config_getall", function (arg, res, req) {
		try {
			log.info("API", "config_getall");
			res.end(JSON.stringify(config.getAll()));
		} catch(e) {
			log.err("API", "config_getall error: " + e);
			res.end("error: " + e);
		}
	});
}
