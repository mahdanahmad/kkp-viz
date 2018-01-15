function spotlightSpotter(id) {
	d3.selectAll('.group-bar:not(#' + _.kebabCase(id) + ')').classed('shadow', true);
	d3.selectAll('.tick text:not(#' + _.kebabCase(id) + ')').classed('shadow', true);
	d3.selectAll('.dot:not(.' + _.kebabCase(id) + ')').classed('shadow', true);

	d3.select('.group-bar#' + _.kebabCase(id)).classed('spotlight', true);
	d3.select('.dot.' + _.kebabCase(id)).classed('spotlight', true);

	d3.selectAll('text.scatter-idr.' + _.kebabCase(id)).classed('hidden', false);
}

function spotlightWiper() {
	d3.selectAll('.group-bar, .dot, .tick text').classed('shadow', false).classed('spotlight', false);
	d3.selectAll('text.scatter-idr:not(.hidden)').classed('hidden', true);
}
