/**
 * settings.js
 * Settings are per-instance options that determine e.g. what database to connect to,
 * how often to check for new configuration options.
 * In comparison, configs are per-deployment settings that may be changed without
 * restarting the API server and that are usually useful for the client to know.
 *
 * If you invoke the server like
 *	node main.js production
 * production-mode settings are used.
 *
 * **This file must be edited to customize the sas server to your needs**
 */
var log = require("./logging.js");

var settings = {};

// Timeout after which the connection to the MongoDB database will be reset (milliseconds).
settings.config_load_timeout = 3000;

// Inteval in which the API will try to re-connect to the MongoDB server after a connection failure
settings.reconnect_interval = 3000;

// Interval in which config options are reloaded from the database (milliseconds).
// This also defines how often the server checks wheter the DB is up and running.
// A MongoDB connection reset will be performed after max.
// config_load_timeout + config_load_interval milliseconds
settings.config_load_interval = 7000;

// Interval in which transactions will be executed. This is necessary since transactions
// may get queued to ensure no invalid transactions are made, in milliseconds.
settings.transaction_interval = 50;

// Timeout for restarting a worker in case it crahsed, in milliseconds
settings.worker_restart = 2000;

/** Production-specific settings **/
if (process.argv[2] == "production") {
	log.info("API", "Running in production mode");
	// MongoDB connection string
	settings.mongodb_connection = "mongodb://10.10.5.10/sas";


/** Development-specific settings **/
} else {
	log.info("API", "Running in development mode");
	settings.mongodb_connection = "mongodb://localhost/sas";
}

module.exports = settings;
