const _		= require('lodash');
const fs	= require('fs');
const csv	= require('fast-csv');
const util	= require('util')

const path	= 'public/data.csv';

let data	= [];

csv.
	fromPath(path, { headers: true, delimiter: ';' })
	.on('data', (o) => { data.push(o); })
	.on('finish', () => {
		let tree	= _.chain(data).groupBy('kedeputian').mapValues((kedeputian) => (
			_.chain(kedeputian).groupBy('direktorat').mapValues((direktorat) => (
				_.chain(direktorat).groupBy('belanja').mapValues((belanja) => (
					_.chain(belanja).groupBy('detail').mapValues((o) => ({ length: o.length, anggaran: _.sumBy(o, 'anggaran') })).value()
				)).value()
			)).value()
		)).value();

		// fs.writeFileSync('results/tree.json', JSON.stringify(tree), 'utf8');
	});
