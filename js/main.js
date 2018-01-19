const colors	= ['#94ac6c', '#d4b44c', '#ccc4bc', '#98DBC6', '#64bcdc', '#a46c54', '#c44434', '#fcb47c', '#bc6494'];

$.get('public/data.csv', ( read ) => {
	const raw		= d3.dsvFormat(';').parse(read).map((o) => _.assign(o, { anggaran: parseInt(o.anggaran) }));
	const unit		= _.chain(raw).map('kedeputian').uniq().value();
	// const formatted	= _.chain(raw).groupBy('kedeputian').mapValues((o) => (_.chain(o).groupBy('direktorat').mapValues((d) => (_.chain(d).keyBy('belanja').mapValues((m) => (parseInt(m.anggaran))).value())).value())).value();

	const sideData		= _.chain(raw).filter(['direktorat', 'Total']).groupBy('kedeputian').mapValues((o) => _.sumBy(o, 'anggaran')).value();
	const scatterData	= _.chain(raw).filter(['direktorat', 'Total']).map((o) => _.pick(o, ['kedeputian', 'belanja', 'anggaran'])).value();

	belanja			= _.chain(raw).map('belanja').uniq().value();
	barData			= _.chain(raw).filter(['direktorat', 'Total']).map((o) => _.pick(o, ['kedeputian', 'belanja', 'anggaran'])).groupBy('kedeputian').value();
	kedepData		= _.chain(raw).reject(['direktorat', 'Total']).groupBy('kedeputian').value();
	palette			= _.chain(unit).map((o, i) => ([o, colors[i]])).fromPairs().value();

	$( 'span#total-anggaran' ).text(nFormatter(_.chain(sideData).values().sum().value()));

	$( document ).ready(() => {
		createSide(unit, sideData);
		createScatter(belanja, scatterData);

		$( '#detil-bar, #compare-bar' ).hide();

		// ClickOnGroupBar(_.head(unit));
		// ClickOnGroupBar(_.last(unit));
	});
});
