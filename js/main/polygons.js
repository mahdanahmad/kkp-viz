const deputiPadd	= 2;
const direktPadd	= 1;
const baseWidth		= 13;
const baseRadius	= 2;

const textWidth		= 100;
const tooltipMarg	= 10;

const margin		= { top: 15, right: 0 + textWidth, bottom: 0, left: 25 + textWidth };

function createPolygonRatio(data, color) {
	d3.select(polyDest).selectAll("svg").remove();

	let canvasWidth		= $(polyDest).outerWidth(true);
	let canvasHeight	= $(polyDest).outerHeight(true);

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
			constructBase(belanjaPos, 'belanja', width);
			constructPoly(direktoratPos, belanjaPos, width);
		});
	//

}

function createPolyScale(data, column, height, callback) {
	let total	= _.sumBy(data, 'anggaran');
	let grouped	= _.chain(data).groupBy(column);
	let summed	= grouped.mapValues((o) => (_.sumBy(o, 'anggaran'))).value();
	let count	= grouped.mapValues((o) => (o.length)).value();
	let child	= grouped.value();

	constructPosition(summed, total, height, deputiPadd, 0, (result) => {
		async.map(result, (o, eachCallback) => {
			let child_value	= _.chain(child[o.key]).keyBy(column == 'direktorat' ? 'belanja' : 'direktorat').mapValues('anggaran').value();
			constructPosition(child_value, o.anggaran, o.length, direktPadd, o.pos[0], (child_node) => {
				eachCallback(null, _.assign(o, { node: child_node.map((d) => ({ dest: d.key, src: o.key, pos: d.pos, length: d.length, anggaran: d.anggaran })) }));
			});
		}, (err, results) => callback(err, results));
	});
}

function constructPosition(data, total, height, padding, ahead, callback) {
	let avail_height	= height - (padding * (_.size(data) - 1));
	let ordered			= _.chain(data).map((o, key) => ({
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
			.attr('class', prefix + '-group cursor-pointer');

	wrapper.append('rect')
		.attr('x', (xPos == 0) ? xPos : (xPos - baseWidth))
		.attr('y', (o) => (o.pos[0] || 0))
		.attr('rx', baseRadius)
		.attr('ry', baseRadius)
		.attr('width', baseWidth)
		.attr('height', (o) => (o.length));

	let textMargin	= 10;
	wrapper.append('text')
		.attr('text-anchor', (xPos == 0 ? 'end' : 'start'))
		.attr('x', (xPos == 0 ? (xPos - textMargin) : (xPos + textMargin)))
		.attr('y', (o) => ((o.pos[0] + (o.length / 2)) + 4 || 0))
		.text((o) => (o.length > 15 ? (o.key.length > 15 ? o.key.substring(0, 15) + '...' : o.key) : ''));

	wrapper.append('rect')
		.attr('x', (xPos == 0) ? (xPos - textWidth) : (xPos - baseWidth))
		.attr('y', (o) => (o.pos[0] || 0))
		.attr('width', baseWidth + textWidth)
		.attr('height', (o) => (o.length))
		.style('fill', 'transparent');

	wrapper
		.on('click', (o) => { setPolyActive(o.key); })
		.on('mouseover', (o) => {
			let position	= {
				top: o.pos[0] + (o.length / 2),
				left: (xPos == 0 ? margin.left + baseWidth + tooltipMarg : 'unset'),
				right: (xPos !== 0 ? margin.right + baseWidth + tooltipMarg : 'unset'),
			};

			$( '#detil-tooltips > #detil-name' ).text(o.key);
			$( '#detil-tooltips > #detil-anggaran' ).text(nFormatter(o.anggaran));

			$( '#detil-tooltips' ).removeClass('hidden').addClass((xPos == 0) ? 'left' : 'right').css(position);
		})
		.on('mouseout', (o) => { $( '#detil-tooltips' ).addClass('hidden').removeClass('left right'); });
}

function constructPoly(left, right, width) {
	let svg		= d3.select( polyDest + ' > svg#' + polyId + ' > g' );
	// let width	= d3.select('svg#' + polyId).node().getBBox().width;

	let dest	= _.chain(right).flatMap('node').keyBy((o) => (o.src + ' - ' + o.dest)).mapValues('pos').value();
	let data	= _.chain(left).flatMap('node').map((o) => ({
		class: [o.src, o.dest].map((o) => (_.kebabCase(o))).join(' '),
		anggaran: o.anggaran,
		length: o.length,
		points: _.concat(o.pos.map((d) => ([baseWidth, d])), o.pos.map((d) => ([width / 2, d])), (dest[o.dest + ' - ' + o.src] || []).map((d) => ([width - baseWidth, d])))
	})).value();

	svg.append('g')
		.attr('id', 'polygons-wrapper')
		.selectAll('polygons')
		.data(data).enter()
		.append('polygon')
			.attr('class', (o) => ('polygons hidden ' + o.class))
			.attr('points', (o) => (constructPolyPoint(o.points)));

	setPolyActive(_.head(left).key);
}

function constructPolyPoint(points) { return [points[0], points[2], points[4], points[5], points[3], points[1]].map((o) => o.join(',')).join(' '); }

function setPolyActive(id) {
	let svg		= d3.select( polyDest + ' > svg#' + polyId + ' > g' );

	svg.selectAll('polygon.' + _.kebabCase(id)).classed('hidden', false);
	svg.selectAll('polygon:not(.' + _.kebabCase(id) + '):not(.hidden)').classed('hidden', true);
}
