const colums	= ['kedeputian', 'direktorat', 'belanja', 'detail'];
const shown		= ['Eselon I', 'Eselon II', 'Kategori', 'Keterangan'];
const svg_dest	= '#root';
const svg_id	= 'svg';

const colored	= 3;

let width, height, radius, svg, details, total, uniq, dups;

const ceil_size	= 24;
const box_size	= 15;

const lgnd_wdth	= 175;
const lgnd_val	= [
	{ class: 'min', text: 'Aggregate anggaran terkecil' },
	{ class: 'max', text: 'Aggregate anggaran terbesar' },
	{ class: 'duplicate', text: 'Keterangan terduplikasi' },
]

$( document ).ready(async function() {
	const raw	= await d3.dsv(';', '/public/data.csv');

	total		= _.chain(raw).map((o) => parseInt(o.anggaran)).sum().value();
	uniq		= _.chain(colums).map((o) => ([o, _.chain(raw).map(o).uniq().value()])).fromPairs().value();

	let left	= await constructTree(raw, colums[0], colums[1]);
	let right	= await constructTree(raw, colums[2], colums[3]);

	await setMinMax(left);
	await setMinMax(right);

	dups		= await findDuplicate(right);

	d3.select(svg_dest).selectAll('svg').remove();

	let canvasWidth		= $(svg_dest).outerWidth(true);
	let canvasHeight	= $(svg_dest).outerHeight(true);

	let margin 			= { top: 0, right: 20, bottom: 0, left: 20 };
	width				= canvasWidth - margin.right - margin.left;
	height				= canvasHeight - margin.top - margin.bottom;
	radius				= width / 10;

	svg					= d3.select(svg_dest).append('svg')
		.attr('id', svg_id)
    	.attr('width', canvasWidth)
        .attr('height', canvasHeight)
		.append('g')
			.attr('id', 'tree-wrapper')
			.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

	details				= d3.select(svg_dest + ' > svg').append('g')
		.attr('id', 'details-wrapper')
		.attr('transform', 'translate(10,' + ((height / 2) - 5) + ')');

	details.append('text')
		.attr('id', 'ceil')
		.attr('class', 'cursor-default')
		.style('font-size', ceil_size + 'px')
		.text('');

	details.append('text')
		.attr('id', 'floor')
		.attr('class', 'cursor-default')
		.attr('y', ceil_size)
		.style('font-size', (ceil_size / 3 * 2) + 'px')
		.text('');

	createTree(left, 'left');
	createTree(right, 'right');

	let legends	= d3.select(svg_dest+ ' > svg').append('g')
		.attr('id', 'legend-wrapper')
		.attr('transform', 'translate(10,' + (height - 40) + ')')
			.selectAll('.legend').data(lgnd_val).enter().append('g').attr('class', 'legend').attr('transform', (o, i) => ('translate(' + (i * lgnd_wdth) + ',0)'));

	legends.append('rect')
		.attr('x', 0)
		.attr('y', 0)
		.attr('width', box_size)
		.attr('height', box_size)
		.attr('class', (o) => (o.class));

	legends.append('text')
		.attr('transform', 'translate(' + (box_size + 5) + ',' + (box_size / 2 + 1) + ')')
		.attr('text-anchor', 'start')
		.attr('alignment-baseline', 'middle')
		.text((o) => (o.text));

});

function constructTree(data, first_col, second_col) {
	return new Promise((resolve, reject) => {
		resolve({ name: 'hidden', related: [], children: _.chain(data).groupBy(first_col).map((o, first) => _.assign({
			name: first,
			type: first_col,
			children: _.chain(o).groupBy(second_col).map((d, second) => _.assign({ name: second, type: second_col }, defaultValues(d, second_col))).sortBy('name').value()
		}, defaultValues(o, first_col))).sortBy('name').value()});
	});
}

function findMinMax(data) {
	return new Promise((resolve, reject) => {
		let formatted	= _.chain(data.children).flatMap((o) => o.children.map((m) => ({ name: o.name + ' - ' + m.name, percentage: m.percentage}))).orderBy(['percentage', 'name'], ['asc', 'asc']).value();

		let mins		= _.chain(formatted).take(colored).map((o) => ({ name: o.name, state: 'min' })).value()
		let maxs		= _.chain(formatted).takeRight(colored).map((o) => ({ name: o.name, state: 'max' })).value()

		resolve(mins.concat(maxs));
	});
}

function setMinMax(data) {
	return new Promise((resolve, reject) => {
		findMinMax(data).then((result) => {
			result.forEach((o) => {
				let dest	= o.name.split(' - ');
				_.chain(data.children).find(['name', dest[0]]).set('state', o.state).get('children').find(['name', dest[1]]).set('state', o.state).value();
			});
			resolve();
		});
	});
}

function findDuplicate(data) {
	return new Promise((resolve, reject) => {
		let formatted	= _.chain(data.children).flatMap((o) => o.children.map((m) => ({ parent: o.name, child: m.name }))).groupBy('child').filter((o) => (o.length > 1)).flatten().value();

		formatted.forEach((o) => {
			_.chain(data.children).find(['name', o.parent]).set('duplicate', 'duplicate').get('children').find(['name', o.child]).set('duplicate', 'duplicate').value();
		});

		resolve(_.chain(formatted).groupBy('child').mapValues((o) => (o.length)).value());
	});
}

function defaultValues(data, col) {
	let count	= _.chain(data).map((o) => parseInt(o.anggaran)).sum().value()
	return ({
		total: count,
		percentage: _.round(count / total * 100, 2),
		related: _.chain(data).flatMap((o) => (_.chain(o).pick(_.difference(colums, [col])).values().value())).uniq().value(),
	});
}

function tree(data) {
	// return d3.tree()
	// 		.size([2 * Math.PI, radius])
	// 		.separation((a, b) => (a.parent == b.parent ? 1 : 2) / a.depth)
	// 	(d3.hierarchy(data));
	return d3.tree().size([width, height / 3])(d3.hierarchy(data));
}


function createTree(data, align) {
	let link	= d3.linkVertical()
		.x(d => (d.x))
		.y(d => (align == 'right' ? height - d.y : d.y));

	let root	= tree(data);
	let canvas	= svg.append('g').attr('id', align)

	canvas.selectAll('.link')
		.data(root.links()).enter().append('path')
		.attr('class', (o) => (_.chain(o.target.data.related).concat([o.target.data.name, o.target.data.state, o.target.data.duplicate, o.target.data.type]).map((d) => _.kebabCase(d)).join(' ').value()))
		.attr('d', link)

	let node	= canvas.selectAll('.node')
		.data(root.descendants()).enter().append('g')
	    .attr('class', (o) => (_.chain(o.data.related).concat([o.data.name, o.data.state, o.data.duplicate, o.data.type]).pull('hidden').map((d) => _.kebabCase(d)).join(' ').value()))
	    .attr('transform', (o) => ('translate(' + o.x + ',' + (align == 'right' ? height - o.y : o.y) + ')'));

	node.append('circle').attr('r', 3);

	node.append('text')
	  .attr('dy', '.31em')
	  .attr('class', (o) => 'noselect cursor-default ' + (o.children ? '' : 'childless'))
	  .attr('text-anchor', (o) => (o.children ? 'middle' : 'start'))
	  .attr('transform', (o) => (o.children ? '' : 'rotate(' + (align == 'right' ? '270' : '90') + ')'))
	  .attr('y', (o) => (o.children ? (o.data.name == 'hidden' && align == 'left' ? 20 : -20) : 0))
	  .attr('x', (o) => (o.children ? 0 : 10))
	  .text((o) => (o.data.name == 'hidden' ? (align == 'right' ? 'Mata Anggaran' : 'Struktur Organisasi') : o.data.name))
	  	// .clone(true).lower().attr('stroke', '#eee');

	node.selectAll('text.childless')
		.call(anotherWrap, (height / 9));

	node
		.on('mouseover', onMouseover)
		.on('mouseout', onMouseout);
}

function onMouseover(o) {
	if (o.data.name !== 'hidden') {
		svg.selectAll('g.' + _.kebabCase(o.data.name)).classed('active', true);
		svg.selectAll('g:not(.' + _.kebabCase(o.data.name) + ')').classed('unintended', true);

		svg.selectAll('path.' + _.kebabCase(o.data.name)).classed('active', true);
		svg.selectAll('path:not(.' + _.kebabCase(o.data.name) + ')').classed('unintended', true);

		details.select('#ceil').text((o.parent.data.name !== 'hidden' ? (o.parent.data.name + ' > ') : '') + o.data.name + '. Total anggaran: ' + nFormatter(o.data.total) + ' (' + o.data.percentage + '%)');
		details.select('#floor').text('Ditemukan dalam ' + constructDetailFloor((colums.indexOf(o.data.type) < 2 ? [2,3] : [0,1])) + '.' + (_.chain(dups).keys().includes(o.data.name).value() ? (' Terduplikasi dalam ' + dups[o.data.name] + ' kategori.') : ''));
	}
}

function onMouseout() {
	svg.selectAll('g, path').classed('active', false).classed('unintended', false);
	details.selectAll('text').text('');
}

function constructDetailFloor(selected) {
	return _.chain(selected).map((o) => {
		let count	= svg.selectAll('g.active.' + colums[o]).size();

		return (count + ' ' + shown[o] + ' (' + _.round(count / uniq[colums[o]].length * 100, 2) + '%)');
	}).join(' dan ').value();
}

function anotherWrap(text, width) {
	text.each(function() {
		let text	= d3.select(this);
		let words 	= text.text().split(/\s+/).reverse();
		let word;
		let line = [];
		let lineNumber = 0;
		let lineHeight = 1.1; // ems
		let y = "" + lineHeight;
		// let dy = parseFloat(y) * 2;
		let x = text.attr("x");
		let dy = parseFloat(text.attr("dy"));
		let tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");
		while (word = words.pop()) {
			line.push(word);
			tspan.text(line.join(" "));
			if (tspan.node().getComputedTextLength() > width) {
				line.pop();
				if (lineNumber == 0 && !_.isEmpty(words)) {
					tspan.text(_.dropRight(line.join(" "), 3).join('') + '...');
					words	= [];
				} else {
					tspan.text(line.join(" "));
					line = [word];

					tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
				}
			}
		}
	});
}
