const toggle	= ['Expand belanja', 'Shrink belanja'];

function createScatter(belanja, palette, data) {
	d3.select("#mein-bar").select("svg#scatter-viz").remove();

	let canvasWidth		= $('#mein-bar').outerWidth(true);
	let canvasHeight	= $('#mein-bar').outerHeight(true);

	let margin 			= { top: 15, right: 0, bottom: 60, left: 25 };
	let width			= canvasWidth - margin.right - margin.left;
	let height			= canvasHeight - margin.top - margin.bottom;

	let minData			= d3.min(data, (o) => (o.anggaran));
	let maxData			= d3.max(data, (o) => (o.anggaran));
	// let medData			= d3.median(data, (o) => (o.anggaran));

	let x 				= d3.scaleBand().range([0, width]).padding(0).domain(belanja);
	let y 				= d3.scaleLinear().range([height, 0]).domain([minData * 0.75, maxData * 1.10]);
	let yByBelanja		= _.chain(data).groupBy('belanja').mapValues((o) => {
		let minByBel	= d3.min(o, (d) => (d.anggaran));
		let maxByBel	= d3.max(o, (d) => (d.anggaran));

		return d3.scaleLinear().range([height, 0]).domain([minByBel * 0.75, maxByBel * 1.10]);
	}).value();

	let voronoiNorm		= _.chain(belanja).map((o, i) => ([o, d3.voronoi().x((o) => (o.xRand)).y((o) => (o.yNorm)).extent([[x.bandwidth() * i, 0], [x.bandwidth() * (i + 1), height]]) ])).fromPairs().value();
	let voronoiStrc		= _.chain(belanja).map((o, i) => ([o, d3.voronoi().x((o) => (o.xRand)).y((o) => (o.yStrc)).extent([[x.bandwidth() * i, 0], [x.bandwidth() * (i + 1), height]]) ])).fromPairs().value();

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

	data	= data.map((o) => (_.assign(o, {
		xNorm: x(o.belanja) + (x.bandwidth() / 2),
		xRand: x(o.belanja) + (_.random(6, x.bandwidth() - 6)),
		yNorm: y(o.anggaran),
		yStrc: yByBelanja[o.belanja](o.anggaran),
	})));

	_.chain(data).groupBy('belanja').forEach((o, i) => {
		let polyNorm	= voronoiNorm[i](o).polygons();
		let polyStrc	= voronoiStrc[i](o).polygons();

		o.map((d, j) => (_.assign(d, { polyNorm: polyNorm[j], polyStrc: polyStrc[j] })));
	}).value();
	// let polyStrc	= voronoiStrc(data).polygons();

	// data	= data.map((o, i) => (_.assign(o, { polyNorm: polyNorm[i], polyStrc: polyStrc[i] })));

	let groupCircle	= svg.append("g").attr('id', 'dot-crowd').selectAll(".group-circle").data(data).enter().append("g");

	groupCircle.append("circle")
			.attr("class", (o) => (_.kebabCase(o.kedeputian) + " dot"))
			.attr("r", 4)
			.attr("fill", (o) => (palette[o.kedeputian]))
			.attr("cx", (o) => (o.xRand))
			.attr("cy", height);

	groupCircle.append("path")
			.attr("class", "polygons normal")
			.attr("d", (o) => (o.polyNorm ? "M" + o.polyNorm.join("L") + "Z" : null));

	groupCircle.append("path")
			.attr("class", "polygons streched")
			.attr("d", (o) => (o.polyStrc ? "M" + o.polyStrc.join("L") + "Z" : null));

	svg.append('g')
		.attr('class', 'grid-wrapper')
		.selectAll('grid')
		.data(_.times(belanja.length, (o) => ( (o + 1) * x.bandwidth() )))
			.enter().append('line')
			.attr('x1', (o) => (o))
			.attr('x2', (o) => (o))
			.attr('y1', 0)
			.attr('y2', height);


	function changeScatterHeight() {
		let current	= $( '#expand-toggler' ).html();
		let next	= (_.indexOf(toggle, current) + 1) % 2;

		let time		= 500;
		let transition	= d3.transition()
	        .duration(time)
	        .ease(d3.easeLinear);

		if (next == 0) {
			svg.selectAll('.dot').transition(transition)
				.attr('cy', (o) => (y(o.anggaran)));

			d3.selectAll('.polygons.normal').classed('hidden', false);
			d3.selectAll('.polygons.streched').classed('hidden', true);
		} else {
			svg.selectAll('.dot').transition(transition)
				.attr('cy', (o) => (yByBelanja[o.belanja](o.anggaran)));

			d3.selectAll('.polygons.normal').classed('hidden', true);
			d3.selectAll('.polygons.streched').classed('hidden', false);
		}

		$( '#expand-toggler' ).html(toggle[next]);
	}

	changeScatterHeight();
	$( '#expand-toggler' ).click(() => { changeScatterHeight(); });
}
