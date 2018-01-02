function createScatter(belanja, palette, data) {
	d3.select("#mein-bar").select("svg#scatter-viz").remove();

	let canvasWidth		= $('#mein-bar').outerWidth(true);
	let canvasHeight	= $('#mein-bar').outerHeight(true);

	let margin 			= { top: 25, right: 25, bottom: 50, left: 25 };
	let width			= canvasWidth - margin.right - margin.left;
	let height			= canvasHeight - margin.top - margin.bottom;

	let minData			= d3.min(data, (o) => (o.anggaran));
	let maxData			= d3.max(data, (o) => (o.anggaran));
	// let medData			= d3.median(data, (o) => (o.anggaran));

	let x 				= d3.scaleBand().range([0, width]).padding(0).domain(belanja);
	let y 				= d3.scaleLinear().range([height, 0]).domain([minData * 0.75, maxData * 1.10]);

	let svg = d3.select("#mein-bar").append("svg")
		.attr("id", "scatter-viz")
    	.attr("width", canvasWidth)
        .attr("height", canvasHeight)
		.append('g')
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	svg.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + height + ")")
			.call(d3.axisBottom(x).tickSize(0))
			.selectAll(".tick text")
				.call(wrap, x.bandwidth() - 5);

	let groupCircle	= svg.append("g").attr('id', 'dot-crowd').selectAll(".group-circle").data(data).enter().append("g");

	console.log(_.groupBy(data, 'belanja'));

	groupCircle.append("circle")
			.attr("class", (o) => (_.kebabCase(o.kedeputian) + " dot"))
			.attr("r", 4)
			.attr("fill", (o) => (palette[o.kedeputian]))
			.attr("cx", (o) => (x(o.belanja) + (x.bandwidth() / 2)))
			.attr("cy", (o) => (y(o.anggaran)));

	svg.append('g')
		.attr('class', 'grid-wrapper')
		.selectAll('grid')
		.data(_.times(belanja.length, (o) => ( (o + 1) * x.bandwidth() )))
			.enter().append('line')
			.attr('x1', (o) => (o))
			.attr('x2', (o) => (o))
			.attr('y1', 0)
			.attr('y2', height);
}
