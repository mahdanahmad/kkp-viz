const colors	= ['#94ac6c', '#d4b44c', '#ccc4bc', '#98DBC6', '#64bcdc', '#a46c54', '#c44434', '#fcb47c', '#bc6494', '#ffeaa4', '#e4b6e1'];

$.get('public/data.csv', ( read ) => {
	const raw		= d3.dsvFormat(';').parse(read).map((o) => _.assign(o, { anggaran: parseInt(o.anggaran) }));
	const coalesce	= _.chain(raw).groupBy((o) => ([o.kedeputian, o.direktorat, o.belanja].join('-'))).map((o) => (_.chain(o).first().pick(['kedeputian', 'direktorat', 'belanja']).assign({ anggaran: _.sumBy(o, 'anggaran') }).value())).value()
	const unit		= _.chain(coalesce).map('kedeputian').uniq().value();
	// const formatted	= _.chain(coalesce).groupBy('kedeputian').mapValues((o) => (_.chain(o).groupBy('direktorat').mapValues((d) => (_.chain(d).keyBy('belanja').mapValues((m) => (parseInt(m.anggaran))).value())).value())).value();

	const sideData		= _.chain(coalesce).groupBy('kedeputian').mapValues((o) => _.sumBy(o, 'anggaran')).value();
	const scatterData	= _.chain(coalesce).groupBy((o) => (o.kedeputian + '|' + o.belanja)).mapValues((o) => (_.sumBy(o, 'anggaran'))).map((o, key) => ({ kedeputian: key.split('|')[0], belanja: key.split('|')[1], anggaran: o })).value();

	belanja			= _.chain(coalesce).map('belanja').uniq().value();
	barData			= _.groupBy(scatterData, 'kedeputian');
	kedepData		= _.groupBy(coalesce, 'kedeputian');
	palette			= _.chain(unit).map((o, i) => ([o, colors[i]])).fromPairs().value();

	$( 'span#total-anggaran' ).text(nFormatter(_.chain(sideData).values().sum().value()));

	$( document ).ready(() => {
		createSide(unit, sideData);
		createScatter(belanja, scatterData);

		$( '#detil-bar, #compare-bar' ).hide();
	});
});
