function createBarComparation(data, color) {
	d3.select(barDest).select("svg#" + barId).remove();

	let canvasWidth		= $(barDest).outerWidth(true);
	let canvasHeight	= $(barDest).outerHeight(true);

	let margin 			= { top: 15, right: 0, bottom: 60, left: 25 };
	let width			= canvasWidth - margin.right - margin.left;
	let height			= canvasHeight - margin.top - margin.bottom;

	let constructed		= _.chain(data).flatMap().groupBy('belanja').map((o, key) => {
		let current	= _.chain(o).map((d) => ([d.kedeputian, d.anggaran])).concat([['belanja', key]]).fromPairs().value();
		return _.chain(selected).concat('belanja').map((o) => [o, (current[o] || 0)]).fromPairs().value();
	}).value()
	let maxvalue		= _.chain(constructed).map((o) => (_.chain(o).filter(_.isInteger).sum().value())).max().value();

	let x 				= d3.scaleBand().rangeRound([0, width]).paddingInner(0.05).align(0.1).domain(_.intersection(belanja, _.map(constructed, 'belanja')));
	let y 				= d3.scaleLinear().range([height, 0]).domain([0, maxvalue]);
	let colors			= d3.scaleOrdinal().range(selected.map((o) => (palette[o]))).domain(selected);

	let svg = d3.select(barDest).append("svg")
		.attr("id", barId)
    	.attr("width", canvasWidth)
        .attr("height", canvasHeight)
		.append('g')
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	svg.append('g')
		.selectAll('g')
		.data(d3.stack().keys(selected)(constructed)).enter()
		.append('g')
			.attr("fill", (o) => (colors(o.key)))
			.selectAll("rect")
			.data((o) => (o)).enter()
			.append('rect')
				.attr("x", (o) => (x(o.data.belanja)))
				.attr("y", (o) => (y(o[1])))
				.attr("height", (o) => (y(o[0]) - y(o[1])))
				.attr("width", x.bandwidth());

	svg.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + height + ")")
			.call(d3.axisBottom(x).tickSize(0))
			.selectAll(".tick text")
				.call(wrap, x.bandwidth() - 5);
}
