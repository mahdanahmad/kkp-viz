const fs		= require('fs');

let file		= fs.createWriteStream('public/data.csv');
file.on('error', (err) => { throw err; });

file.write(['kedeputian', 'direktorat', 'belanja', 'anggaran'].join(';') + '\n');

let data		= [];
let lineReader	= require('readline').createInterface({ input: fs.createReadStream('public/raw.csv') });

let kedeputian	= [];
lineReader.on('line', (line) => {
	let parsed	= line.split(';').map((o) => (o.trim()));
	if (parsed.filter((o) => (o !== '')).length !== 0) {
		kedeputian.push(parsed);
	} else {
		data.push(kedeputian);
		kedeputian	= [];
	}
}).on('close', () => {
	data.forEach((kedeputian) => {
		let name		= kedeputian[0][0].capitalize();
		let direktorat	= kedeputian[0].splice(1).map((o) => (o.capitalize()));

		kedeputian.splice(1).forEach((anggaran) => {
			let belanja	= anggaran[0].substr(anggaran[0].indexOf('  ') + 2);
			direktorat.forEach((o, i) => {
				if (o !== '' && anggaran[i + 1] !== '') { file.write([name, o, belanja, anggaran[i + 1]].join(';') + '\n'); }
			});
		});
	});
});

String.prototype.capitalize	= function() { return this.toLowerCase().replace(/\b\w/g, l => l.toUpperCase()); }
