const { test, run, expect } = require('./tester');
const { select } = require('./js-sql');

test('Select From', () => {
	const values = [
		{ value: 'a' },
		{ value: 'b' }
	];
	
	expect(
		select('*').from(values).eval()
	).toMatchRows(['a'], ['b']);
});

test('Select From Where', () => {
	const values = [
		{ size: 1 },
		{ size: 2 }
	];
	
	expect(
		select('*').from(values).where((e) => e.size > 1).eval()
	).toMatchRows([2]);
});

test('Select From OrderBy with comparator', () => {
	const values = [
		{ size: 2 },
		{ size: 1 }
	];
	
	const sizeCompare = (a, b) => a.size > b.size ? 1 : -1;
	
	expect(
		select('*').from(values).orderBy(sizeCompare).eval()
	).toMatchRows([1], [2]);
});

test('Select From OrderBy with value', () => {
	const values = [
		{ size: 2 },
		{ size: 1 }
	];
	
	expect(
		select('*').from(values).orderBy('size').eval()
	).toMatchRows([1], [2]);
});

test('Select From OrderBy with multiple', () => {
	const values = [
		{ size: 2, other: 1 },
		{ size: 1, other: 2 },
		{ size: 1, other: 1 }
	];
	
	expect(
		select('*').from(values).orderBy('size', 'other').eval()
	).toMatchRows([1, 1], [1, 2], [2, 1]);
});

run();