function wrap(text, width, isVertical) {
	text.each(function() {
		let text	= d3.select(this);
		let words 	= text.text().split(/\s+/).reverse();
		let word;
		let line = [];
		let lineNumber = 0;
		let lineHeight = 1.1; // ems
		let y = "" + lineHeight;
		let dy = parseFloat(y);
		let tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
		while (word = words.pop()) {
			line.push(word);
			tspan.text(line.join(" "));
			if (tspan.node().getComputedTextLength() > width) {
				line.pop();
				if (!isVertical && lineNumber == 3 && !_.isEmpty(words)) {
					tspan.text(_.dropRight(line.join(" "), 3).join('') + '...');
					words	= [];
				} else {
					tspan.text(line.join(" "));
					line = [word];

					tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
				}
			}
		}
		if (isVertical) { text.attr('transform', 'translate(-8, ' + (-((lineNumber * lineHeight + dy) / 2) * 10 - 4) + ')'); }
	});
}

function nFormatter(num) {
	let digits	= 2;
	let standar = [
		{ value: 1, symbol: "" },
		{ value: 1E3, symbol: "ribu" },
		{ value: 1E6, symbol: "juta" },
		{ value: 1E9, symbol: "milyar" },
		{ value: 1E12, symbol: "triliun" },
		{ value: 1E15, symbol: "kuadriliun" },
		{ value: 1E18, symbol: "kuantiliun" }
	];
	let re = /\.0+$|(\.[0-9]*[1-9])0+$/;
	let i;
	for (i = standar.length - 1; i > 0; i--) { if (num >= standar[i].value) { break; } }
	return (num / standar[i].value).toFixed(digits).replace(re, "$1") + ' ' + standar[i].symbol;
}
