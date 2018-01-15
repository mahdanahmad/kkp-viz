function createSide(unit, palette, data) {
	d3.select("#side-bar").selectAll("svg").remove();

	let canvasWidth		= $('#side-bar').outerWidth(true);
	let canvasHeight	= $('#side-bar').outerHeight(true);

	let margin 			= { top: 15, right: 75, bottom: 40, left: 101 };
	let width			= canvasWidth - margin.right - margin.left;
	let height			= canvasHeight - margin.top - margin.bottom;

	let x 				= d3.scaleLinear().range([0, width]).domain([0, _.chain(data).values().max().value()]);
	let y 				= d3.scaleBand().range([0, height]).padding(0).domain(unit);

	let svg = d3.select("#side-bar").append("svg")
		.attr("id", "side-viz")
    	.attr("width", canvasWidth)
        .attr("height", canvasHeight)
		.append('g')
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	svg.append('g')
		.attr("id", "axis--x")
		.attr("class", "axis")
		.call(d3.axisLeft(y).tickSize(0))
		.selectAll(".tick text")
			.attr('id', function() { return _.kebabCase(d3.select(this).text()); })
			.attr('class', 'cursor-pointer')
			.call(wrap, (margin.left - 15), true)
			.on('mouseover', spotlightSpotter)
			.on('mouseout', spotlightWiper)
			.on('click', ClickOnGroupBar);

	let groupBar	= svg.append('g')
						.attr("id", "bar-wrapper")
						.attr("class", "cursor-pointer")
						.selectAll('group-bar')
						.data(unit)
						.enter().append('g')
							.attr('id', (o) => (_.kebabCase(o)))
							.attr('class', 'group-bar')
							.style('fill', (o) => (palette[o]));

	groupBar.append('rect')
		.attr('class', 'bar fill')
		// .attr('width', (o) => (x(data[o])))
		.attr('width', 0)
		.attr('height', y.bandwidth())
		.attr('y', (o) => (y(o)));

	groupBar.append('rect')
		.attr('class', 'bar cream')
		.attr('width', 4)
		.attr('height', y.bandwidth())
		.attr('y', (o) => (y(o)))
		.attr('x', 0);

	let textMargin	= 10;
	groupBar.append('text')
		.attr('class', 'detil-idr')
		.attr('y', (o) => (y(o) + (y.bandwidth() / 2) + 5))
		.attr('x', textMargin)
		.text((o) => (nFormatter(data[o])));

	groupBar.append('rect')
		.attr('class', 'bar overlay')
		.attr('width', width + margin.right)
		.attr('height', y.bandwidth())
		.attr('y', (o) => (y(o)))

	groupBar
		.on('mouseover', spotlightSpotter)
		.on('mouseout', spotlightWiper)
		.on('click', ClickOnGroupBar);

	svg.append('g')
		.attr('class', 'grid-wrapper')
		.selectAll('grid')
		.data(_.times(unit.length, (o) => ( (o + 1) * y.bandwidth() )))
			.enter().append('line')
			.attr('x1', 0)
			.attr('x2', width + margin.right)
			.attr('y1', (o) => (o))
			.attr('y2', (o) => (o));

	let time		= 500;
	let transition	= d3.transition()
        .duration(time)
        .ease(d3.easeLinear);

	svg.selectAll('.bar.fill').transition(transition)
        .attr('width', (o) => (x(data[o]) || 0));

	svg.selectAll('.bar.cream').transition(transition)
        .attr('x', (o) => (x(data[o]) - 1 || 0));

	svg.selectAll('text.detil-idr').transition(transition)
        .attr('x', (o) => (x(data[o]) || 0) + textMargin);
}

function ClickOnGroupBar(o) {

}
