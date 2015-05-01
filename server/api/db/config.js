/**
 * Logs both new value of configuration (in case it is not the default value)
 * and the date of the change, so that e.g. different tax values can be traced
 * back.
 */

var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var log = require("../logging.js");
var settings = require("../settings.js");

var configSchema = new Schema({
	key : String,
	value : Schema.Types.Mixed,
	time : Date
}, { bufferCommands : false });

var Config = mongoose.model("Config", configSchema);

module.exports = function (error) { return {
	set : function (key, value) {
		var entry = new Config({ key : key, value : value, time : Date.now() });
		entry.save(function (err) {
			if (err) error("cfgdb.changeConfig", null, err);
		});
	},

	/**
	 * Mongoose doesn't handle broken connections to MongoDB well,
	 * it basically just buffers all request for later execution and does not
	 * report any error AT ALL.
	 * Since that is a horrible thing to do, e.g. if the cable to the Database
	 * is accidentally removed, cfgdb.load is also used to make sure the
	 * connection from the API server to the database server is working.
	 */
	load : function (cb) {
		var loadconfig_timeout = setTimeout(function () {
			error("cfgdb.load", null, "timeout elapsed");
		}, settings.config_load_timeout);

		Config.aggregate([
			{ $sort: { key : 1, time : 1 } },
			{ $group : {
				_id: "$key",
				key : { $last: "$key" },
				value : {$last: "$value" }
			}},
			{ $project : {
				_id : false,
				key : true,
				value : true
			}}
		], function (err, cfg) {
			clearTimeout(loadconfig_timeout);
			if (err) {
				error("cfgdb.load", null, err);
			} else {
				cb(cfg);
			}
		});
	}
}};
