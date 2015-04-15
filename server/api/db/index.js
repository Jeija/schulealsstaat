var mongoose = require("mongoose");
var log = require("../logging.js");

mongoose.connect("mongodb://localhost/sas");
var db = mongoose.connection;

db.on("error", function (err) {
	log.err("MongoDB", "Common: " + err)
});

db.once("open", function () {
	log.ok("MongoDB", "Connection established");
});

module.exports = {
	students : require("./students.js"),
	transactions : require("./transactions.js")
};
