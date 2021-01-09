const { test, itest, run, expect, Matchers } = require('./tester');
const { select } = require('./js-sql');

test('Select From', () => {
	const values = [
		{ value: 'a' },
		{ value: 'b' }
	];
	
	expect(
		select('*').from(values).eval()
	).to(Matchers.matchRows(['a'], ['b']));
});

test('Select From Where', () => {
	const values = [
		{ size: 1 },
		{ size: 2 }
	];
	
	expect(
		select('*').from(values).where((e) => e.size > 1).eval()
	).to(Matchers.matchRows([2]));
});

test('Select From OrderBy with comparator', () => {
	const values = [
		{ size: 2 },
		{ size: 1 }
	];
	
	const sizeCompare = (a, b) => a.size > b.size ? 1 : -1;
	
	expect(
		select('*').from(values).orderBy(sizeCompare).eval()
	).to(Matchers.matchRows([1], [2]));
});

test('Select From OrderBy with extractor', () => {
	const values = [
		{ size: 2 },
		{ size: 1 }
	];
	
	const sizeExtract = (it) => it.size;
	
	expect(
		select('*').from(values).orderBy(sizeExtract).eval()
	).to(Matchers.matchRows([1], [2]));
});

test('Select From OrderBy with value', () => {
	const values = [
		{ size: 2 },
		{ size: 1 }
	];
	
	expect(
		select('*').from(values).orderBy('size').eval()
	).to(Matchers.matchRows([1], [2]));
});

test('Select From OrderBy with multiple', () => {
	const values = [
		{ size: 2, other: 1 },
		{ size: 1, other: 2 },
		{ size: 1, other: 1 }
	];
	
	expect(
		select('*').from(values).orderBy('size').orderBy('other').eval()
	).to(Matchers.matchRows([1, 1], [1, 2], [2, 1]));
});

test('Select From OrderBy with direction', () => {
	const values = [
		{ size: 1 },
		{ size: 2 }
	];
	
	expect(
		select('*').from(values).orderBy('size', 'desc').eval()
	).to(Matchers.matchRows([2], [1]));
});

test('Select From Join', () =>  {
	const lhs = [
		{ id: 'a' },
		{ id: 'b' },
		{ id: 'c' }
	];
	
	const rhs = [
		{ id: 'a', value: 1 },
		{ id: 'a', value: 2 },
		{ id: 'b', value: 3 },
		{ id: 'd', value: 4 }
	];
	
	expect(
		select('*').from(lhs).join(rhs).on((lhs, rhs) => lhs.id === rhs.id).eval()
	).to(Matchers.matchRows(['a', 1], ['a', 2], ['b', 3]));
});

test('Select From LeftJoin', () =>  {
	const lhs = [
		{ id: 'a' },
		{ id: 'b' },
		{ id: 'c' }
	];
	
	const rhs = [
		{ id: 'a', value: 1 },
		{ id: 'a', value: 2 },
		{ id: 'b', value: 3 },
		{ id: 'd', value: 4 }
	];
	
	expect(
		select('*').from(lhs).leftJoin(rhs).on((lhs, rhs) => lhs.id === rhs.id).eval()
	).to(Matchers.matchRows(['a', 1], ['a', 2], ['b', 3], ['c']));
});

test('Select From RightJoin', () =>  {
	const lhs = [
		{ id: 'a' },
		{ id: 'b' },
		{ id: 'c' }
	];
	
	const rhs = [
		{ id: 'a', value: 1 },
		{ id: 'a', value: 2 },
		{ id: 'b', value: 3 },
		{ id: 'd', value: 4 }
	];
	
	expect(
		select('*').from(lhs).rightJoin(rhs).on((lhs, rhs) => lhs.id === rhs.id).eval()
	).to(Matchers.matchRows(['a', 1], ['a', 2], ['b', 3], ['d', 4]));
});

test('Select From OuterJoin', () =>  {
	const lhs = [
		{ id: 'a' },
		{ id: 'b' },
		{ id: 'c' }
	];
	
	const rhs = [
		{ id: 'a', value: 1 },
		{ id: 'a', value: 2 },
		{ id: 'b', value: 3 },
		{ id: 'd', value: 4 }
	];
	
	expect(
		select('*').from(lhs).outerJoin(rhs).on((lhs, rhs) => lhs.id === rhs.id).eval()
	).to(Matchers.matchRows(['a', 1], ['a', 2], ['b', 3], ['c'], ['d', 4]));
});

test('Select From CrossJoin', () => {
	const lhs = [
		{ lhs: 'a' },
		{ lhs: 'b' }
	];
	
	const rhs = [
		{ rhs: 'c' },
		{ rhs: 'd' }
	];
	
	expect(
		select('*').from(lhs).crossJoin(rhs).eval()
	).to(Matchers.matchRows(['a', 'c'], ['a', 'd'], ['b', 'c'], ['b', 'd']));
})

run();