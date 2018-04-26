const fs		= require('fs');

let file		= fs.createWriteStream('public/data_kementan.csv');
file.on('error', (err) => { throw err; });

file.write(['kedeputian', 'direktorat', 'belanja', 'anggaran'].join(';') + '\n');

const head		= ["Belanja Pegawai", "Belanja Barang Operasional", "Belanja Barang Non Operasional", 'Belanja Modal Non Operasional'];

// let data		= [];
let lineReader	= require('readline').createInterface({ input: fs.createReadStream('public/raw_kementan.csv') });

let kedeputian	= [];
lineReader.on('line', (line) => {
	let splitted	= line.split(';')

	let kedeputian	= splitted[0];
	let direktorat	= splitted[1];

	splitted.slice(2).map((o, i) => { if (o !== '0') { file.write([kedeputian, direktorat, head[i], o ].join(';') + '\n'); } });
}).on('close', () => {

});

String.prototype.capitalize	= function() { return this.toLowerCase().replace(/\b\w/g, l => l.toUpperCase()); }
