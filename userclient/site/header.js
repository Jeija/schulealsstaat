$(function () {
	// Disable dragging
	$("img").on("dragstart", function(e) {
		e.preventDefault();
	});
});
