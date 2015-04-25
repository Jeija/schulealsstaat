/**
 * Logs both new value of configuration (in case it is not the default value)
 * and the date of the change, so that e.g. different tax values can be traced
 * back.
 */

var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var log = require("../logging.js");

var configSchema = new Schema({
	key : String,
	value : Schema.Types.Mixed,
	time : Date
});

var Config = mongoose.model("Config", configSchema);

module.exports = {
	set : function (key, value) {
		var entry = new Config({ key : key, value : value, time : Date.now() });
		entry.save(function (err) {
			if (err) log.err("MongoDB", "cfgDb.changeConfig failed: " + err);
		});
	},

	load : function (cb) {
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
			if (err) log.err("MongoDB", "cfgDb.loadConfig failed: " + err);
			cb(cfg);
		});
	}
};
