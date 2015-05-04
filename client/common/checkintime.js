/**
 * Calculate the time a student was checked in witin the selected period
 * st: The student to calculate the value for, whole db entry
 * begin: begin time since when to calculate presence
 * end: end time until when to calculate presence
 * returns: object of the form:
 * {
 *	time : Number, time the student spent checked in in seconds, rounded,
 *	present_at_end : Boolean, true if student is checked in at the given end time
 */
function calc_checkin_time(st, begin, end) {
	// Deep-copy array
	var checks = JSON.parse(JSON.stringify(st.appear));
	for (var i = 0; i < checks.length; i++) {
		// Store relative time values to checkin in seconds
		checks[i].time = (Date.parse(checks[i].time) - begin) / 1000;
	}

	// Sort checks array: later apperances to the higher indices
	checks.sort(function(a, b) {
		return a.time - b.time;
	});

	// Intervals in which the student was checked in
	var intervals = [];

	// Find first negative check time (--> status of student at checkin)
	// to determine wheter the student was checked in at the beginning
	var is_checkedin = false;		// Stores wheter student is inside at current iteration
	var last_check_before_begin = -1;	// Stores ID of last checkin with appear.time < begin
	var current_interval = 0;		// Stores ID of current interval, increment on checkout

	for (var i = checks.length - 1; i >= 0; i--) {
		if (checks[i].time < 0) {
			last_check_before_begin = i;
			if (checks[i].type == "checkin") {
				intervals[current_interval] = { checkin : 0 };
				is_checkedin = true;
			}
			break;
		}
	}

	var endtime_relative = (end - begin) / 1000;

	// Go through all check in / out events after begin and put them in the intervals table
	for (var i = last_check_before_begin + 1; i < checks.length; i++) {
		// Begin - End range has ended
		if (checks[i].time > endtime_relative) break;

		// Student is outside and checks in, add new interval
		if (checks[i].type == "checkin" && !is_checkedin) {
			intervals[current_interval] = { checkin : checks[i].time };
			is_checkedin = true;
		}

		// Student is inside and checks out, finish interval and go to next one
		if (checks[i].type == "checkout" && is_checkedin) {
			intervals[current_interval].checkout = checks[i].time;
			is_checkedin = false;
			current_interval++;
		}
	}

	// Finish interval ("force-checkout" when begin-end range ends)
	if (is_checkedin) {
		intervals[current_interval].checkout = endtime_relative;
	}

	// Add up all intervals to determine time of student spend inside in the begin-end range
	var time_inside = 0;
	for (var i = 0; i < intervals.length; i++) {
		time_inside += intervals[i].checkout - intervals[i].checkin;
	}

	return { time : Math.round(time_inside), present_at_end : is_checkedin };
}
