const { select } = require('./js-sql');

const values = [
	{ value: 'a', size: 3 },
	{ value: 'b', size: 2 },
	{ value: 'd', size: 4 },
	{ value: 'c', size: 4 }
];

const sizeCompare = (a, b) => a.size > b.size;

console.log(
	select('value', 'size')
		.from(values)
		.where((entry) => entry.size > 2)
		.orderBy(sizeCompare)
		.orderBy('value')
		.eval()
);