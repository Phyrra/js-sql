const { test, itest, run, expect, Matchers } = require('./tester');
const { select } = require('./js-sql');

test('Select From', () => {
	const values = [
		{ value: 'a' },
		{ value: 'b' }
	];
	
	expect(
		select('*').from(values).eval()
	).to(Matchers.matchRows({ value: 'a' }, { value: 'b' }));
});

test('Select From Where', () => {
	const values = [
		{ size: 1 },
		{ size: 2 }
	];
	
	expect(
		select('*').from(values).where((e) => e.size > 1).eval()
	).to(Matchers.matchRows({ size: 2 }));
});

test('Select From OrderBy with comparator', () => {
	const values = [
		{ size: 2 },
		{ size: 1 }
	];
	
	const sizeCompare = (a, b) => a.size > b.size ? 1 : -1;
	
	expect(
		select('*').from(values).orderBy(sizeCompare).eval()
	).to(Matchers.matchRows({ size: 1 }, { size: 2 }));
});

test('Select From OrderBy with extractor', () => {
	const values = [
		{ size: 2 },
		{ size: 1 }
	];
	
	const sizeExtract = (it) => it.size;
	
	expect(
		select('*').from(values).orderBy(sizeExtract).eval()
	).to(Matchers.matchRows({ size: 1 }, { size: 2 }));
});

test('Select From OrderBy with value', () => {
	const values = [
		{ size: 2 },
		{ size: 1 }
	];
	
	expect(
		select('*').from(values).orderBy('size').eval()
	).to(Matchers.matchRows({ size: 1 }, { size: 2 }));
});

test('Select From OrderBy with multiple', () => {
	const values = [
		{ size: 2, other: 1 },
		{ size: 1, other: 2 },
		{ size: 1, other: 1 }
	];
	
	expect(
		select('*').from(values).orderBy('size').orderBy('other').eval()
	).to(Matchers.matchRows({ size: 1, other: 1 }, { size: 1, other: 2 }, { size: 2, other: 1 }));
});

test('Select From OrderBy with direction', () => {
	const values = [
		{ size: 1 },
		{ size: 2 }
	];
	
	expect(
		select('*').from(values).orderBy('size', 'desc').eval()
	).to(Matchers.matchRows({ size: 2 }, { size: 1 }));
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
	).to(Matchers.matchRows({ id: 'a', value: 1 }, { id: 'a', value: 2 }, { id: 'b', value: 3 }));
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
	).to(Matchers.matchRows({ id: 'a', value: 1 }, { id: 'a', value: 2 }, { id: 'b', value: 3 }, { id: 'c' }));
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
	).to(Matchers.matchRows({ id: 'a', value: 1 }, { id: 'a', value: 2 }, { id: 'b', value: 3 }, { id: 'd', value: 4 }));
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
	).to(Matchers.matchRows({ id: 'a', value: 1 }, { id: 'a', value: 2 }, { id: 'b', value: 3 }, { id: 'c' }, { id: 'd', value: 4 }));
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
	).to(Matchers.matchRows({ lhs: 'a', rhs: 'c' }, { lhs: 'a', rhs: 'd' }, { lhs: 'b', rhs: 'c' }, { lhs: 'b', rhs: 'd' }));
});

test('Select From Join Join', () => {
	const main = [
		{ id: 'a' },
		{ id: 'b' }
	];
	
	const joinA = [
		{ id: 'a', valueA: 1 },
		{ id: 'b', valueA: 2 }
	];
	
	const joinB = [
		{ id: 'a', valueB: 3 },
		{ id: 'b', valueB: 4 }
	];
	
	const joinCondition = (lhs, rhs) => lhs.id === rhs.id;
	
	expect(
		select('*').from(main).join(joinA).on(joinCondition).join(joinB).on(joinCondition).eval()
	).to(Matchers.matchRows({ id: 'a', valueA: 1, valueB: 3 }, { id: 'b', valueA: 2, valueB: 4 }));
});

test('Select From Limit', () => {
	const values = [];
	for (let i = 0; i < 10; ++i) {
		values.push({ value: i });
	}
	
	expect(
		select('*').from(values).limit(3).eval()
	).to(Matchers.matchRows({ value: 0 }, { value: 1 }, { value: 2 }));
});

test('Select From Limit Offset', () => {
	const values = [];
	for (let i = 0; i < 10; ++i) {
		values.push({ value: i });
	}
	
	expect(
		select('*').from(values).limit(3).offset(2).eval()
	).to(Matchers.matchRows({ value: 2 }, { value: 3 }, { value: 4 }));
});

run();