const deputiPadd	= 2;
const direktPadd	= 1;
const baseWidth		= 10;
const baseRadius	= 2;

function createPolygonRatio(data, color) {
	d3.select(polyDest).selectAll("svg").remove();

	let canvasWidth		= $(polyDest).outerWidth(true);
	let canvasHeight	= $(polyDest).outerHeight(true);

	let margin 			= { top: 15, right: 0, bottom: 0, left: 25 };
	let width			= canvasWidth - margin.right - margin.left;
	let height			= canvasHeight - margin.top - margin.bottom;

	let svg = d3.select(polyDest).append("svg")
		.attr("id", polyId)
    	.attr("width", canvasWidth)
        .attr("height", canvasHeight)
		.append('g')
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
			.style('fill', color);

	d3.queue()
		.defer(createPolyScale, data, 'direktorat', height)
		.defer(createPolyScale, data, 'belanja', height)
		.await((error, direktoratPos, belanjaPos) => {
			// if (error) throw error;

			constructBase(direktoratPos, 'direktorat', 0);
			constructBase(belanjaPos, 'belanja', width - baseWidth);
			constructPoly(direktoratPos, belanjaPos);
		});
	//

}

function createPolyScale(data, column, height, callback) {
	let total	= _.sumBy(data, 'anggaran');
	let grouped	= _.chain(data).groupBy(column);
	let summed	= grouped.mapValues((o) => (_.sumBy(o, 'anggaran'))).value();
	let count	= grouped.mapValues((o) => (o.length)).value();
	let child	= grouped.value();

	let avail_height	= height - (deputiPadd * (_.size(summed) - 1));
	constructPosition(summed, total, avail_height, deputiPadd, 0, (result) => {
		async.map(result, (o, eachCallback) => {
			let child_value	= _.chain(child[o.key]).keyBy(column == 'direktorat' ? 'belanja' : 'direktorat').mapValues('anggaran').value();
			constructPosition(child_value, o.anggaran, o.length, direktPadd, o.pos[0], (child_node) => {
				eachCallback(null, _.assign(o, { node: child_node.map((d) => ({ dest: d.key, src: o.key, pos: d.pos, length: d.length, anggaran: d.anggaran })) }));
			});
		}, (err, results) => callback(err, results));
	});
}

function constructPosition(data, total, avail_height, padding, ahead, callback) {
	let ordered		= _.chain(data).map((o, key) => ({
		key,
		anggaran: o,
		length: o / total * avail_height
	})).orderBy('length', 'desc').value();

	let currentPos	= 0;
	callback(_.times(ordered.length, (o) => {
		let start	= currentPos;
		if (start) { start += padding; }
		currentPos	= start + ordered[o].length;

		return ({ key: ordered[o].key, anggaran: ordered[o].anggaran, length: ordered[o].length, pos: [ ahead + start, ahead + currentPos ] });
	}));
}

function constructBase(data, prefix, xPos) {
	let svg	= d3.select( polyDest + ' > svg#' + polyId + ' > g' );

	let wrapper	= svg.append('g')
		.attr('id', prefix + '-wrapper')
		.selectAll(prefix + '-group')
		.data(data).enter()
		.append('g')
			.attr('id', (o) => ('base-' + _.kebabCase(o.key)))
			.attr('class', prefix + '-group');

	wrapper.append('rect')
		.attr('class', 'cursor-pointer')
		.attr('x', xPos)
		.attr('y', (o) => (o.pos[0] || 0))
		.attr('rx', baseRadius)
		.attr('ry', baseRadius)
		.attr('width', baseWidth)
		.attr('height', (o) => (o.length));
}

function constructPoly(left, right) {
	let svg	= d3.select( polyDest + ' > svg#' + polyId + ' > g' );

	// console.log(left);
	// console.log(right);
}
