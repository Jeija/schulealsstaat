$(function () {
	$(".external_url").click(function () {
		window.open($(this).data("location"), "_system");
	});
});
