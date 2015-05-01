var mongoose = require("mongoose");
var log = require("../logging.js");

mongoose.connect("mongodb://10.10.5.10/sas");
var db = mongoose.connection;

db.on("error", function (err) {
	log.err("MongoDB", "Common: " + err)
});

db.once("open", function () {
	log.ok("Worker", "(" + process.pid + ")" + " MongoDB Connection established");
});

module.exports = {
	config : require("./config.js"),
	students : require("./students.js"),
	transactions : require("./transactions.js")
};
