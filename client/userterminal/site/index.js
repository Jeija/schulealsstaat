function load_subdir (dir) {
	$("#page").hide();
	$('.mainlink').removeClass("link-selected");
	$('.mainlink[data-subdir="' + dir + '"]').addClass("link-selected");
	$("#page").load(dir + "/index.html", function () {
		load_common_events();
		$("<link>", {
			rel: "stylesheet",
			type: "text/css",
			href: dir + "/styles.css"
		}).appendTo("head");
		$.getScript(dir + "/scripts.js")
	});
}

$(function () {
	load_subdir("transaction_simple");

	$(".mainlink").click(function() {
		load_subdir($(this).data("subdir"));
	});
});
