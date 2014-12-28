var actions = {};

function register_action(name, action)
{
	actions[name] = action;
}

function execute(name, arg, res, req)
{
	if (!actions[name]) return false;
	actions[name](arg, res, req);
	return true;
}

require("./misc.js")(register_action)
require("./config.js")(register_action)
require("./students.js")(register_action)
require("./transactions.js")(register_action)

module.exports = {
	execute: execute
}
