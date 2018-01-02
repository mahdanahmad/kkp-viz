const colors	= ['#94ac6c', '#d4b44c', '#ccc4bc', '#6c1414', '#64bcdc', '#a46c54', '#c44434', '#fcb47c', '#bc6494'];

$.get('public/data.csv', ( read ) => {
	const raw		= d3.dsvFormat(';').parse(read);
	const unit		= _.chain(raw).map('kedeputian').uniq().value();
	const palette	= _.chain(unit).map((o, i) => ([o, colors[i]])).fromPairs().value();
	const belanja	= _.chain(raw).map('belanja').uniq().value();
	const formatted	= _.chain(raw).groupBy('kedeputian').mapValues((o) => (_.chain(o).groupBy('direktorat').mapValues((d) => (_.chain(d).keyBy('belanja').mapValues((m) => (parseInt(m.anggaran))).value())).value())).value();

	$( document ).ready(() => {
		createSide(unit, palette, _.mapValues(formatted, (o) => (_.chain(o).get('Total').values().sum().value())));
	});
});
