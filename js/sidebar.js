function createSide(unit, data) {
	d3.select(sideDest).selectAll("svg").remove();

	let canvasWidth		= $(sideDest).outerWidth(true);
	let canvasHeight	= $(sideDest).outerHeight(true);

	let margin 			= { top: 15, right: 75, bottom: 60, left: 101 };
	let width			= canvasWidth - margin.right - margin.left;
	let height			= canvasHeight - margin.top - margin.bottom;

	let x 				= d3.scaleLinear().range([0, width]).domain([0, _.chain(data).values().max().value()]);
	let y 				= d3.scaleBand().range([0, height]).padding(0).domain(unit);

	let svg = d3.select(sideDest).append("svg")
		.attr("id", sideId)
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
	if (selected.length < 3 || _.includes(selected, o)) {
		let svg	= d3.select(sideDest + ' > svg#' + sideId + ' > g');

		if (_.includes(selected, o)) {
			_.pull(selected, o);

			svg.select('.group-bar#' + _.kebabCase(o)).classed('selected', false);
			svg.select('.tick text#' + _.kebabCase(o)).classed('selected', false);
		} else {
			selected.push(o);

			svg.select('.group-bar#' + _.kebabCase(o)).classed('selected', true);
			svg.select('.tick text#' + _.kebabCase(o)).classed('selected', true);
		}

		svg.selectAll('.group-bar:not(.selected), .tick text:not(.selected)').classed('unintended', true);

		switch (selected.length) {
			case 0:
				$( '#selection-remover' ).addClass('hidden');

				$( '#detil-bar, #compare-bar' ).slideUp();
				$( '#mein-bar' ).slideDown();

				svg.selectAll('.group-bar, .tick text').classed('unintended', false);
				break;
			case 1:
				$( '#selection-remover' ).removeClass('hidden');

				d3.select(polyDest).select("svg#" + polyId).remove()
				$( '#mein-bar, #compare-bar' ).slideUp(() => { });
				$( '#detil-bar' ).slideDown(() => { createPolygonRatio(kedepData[selected[0]], palette[selected[0]]); });
				break;
			default:
				$( '#selection-remover' ).removeClass('hidden');

				d3.select(barDest).select("svg#" + barId).remove()
				$( '#mein-bar, #detil-bar' ).slideUp(() => { });
				$( '#compare-bar' ).slideDown(() => { createBarComparation(_.pick(barData, selected), _.pick(palette, selected)); });
		}
	}
}

function removeSelection() {
	selected	= [];

	$( '#detil-bar, #compare-bar' ).slideUp();
	$( '#mein-bar' ).slideDown();
	$( '#selection-remover' ).addClass('hidden');
	
	d3.select(sideDest + ' > svg#' + sideId + ' > g').selectAll('.group-bar, .tick text').classed('unintended', false).classed('selected', false);
}
