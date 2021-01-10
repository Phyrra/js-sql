const isFunction = (fn) => fn && {}.toString.call(fn) === '[object Function]';

const tests = [];

const test = (name, fn) => tests.push({ name: name, fn: fn, ignore: false });
const itest = (name, fn) => tests.push({ name: name, fn: fn, ignore: true });

const run = (...n) => {
	if (n.length > 0) {
		n.forEach(i => {
			const prefix = `Test '${tests[i].name}' (${i}):`;
			try {
				tests[i].fn();
				console.log(`${prefix} Success`);
			} catch (e) {
				console.log(`${prefix} Failed with '${e}'`);
			}
		});
		return;
	}
	
	let success = 0;
	let fail = 0;
	let ignore = 0;
	tests.forEach((test, i) => {
		const prefix = `Test '${test.name}' (${i + 1}/${tests.length}):`;
		if (test.ignore) {
			++ignore;
			console.log(`${prefix} Skipped`);
			return;
		}
		try {
			test.fn();
			++success;
			console.log(`${prefix} Success`);
		} catch (e) {
			++fail;
			console.log(`${prefix} Failed with '${e}'`);
		}
	});
	console.log(`Ran ${tests.length} test${tests.length === 1 ? '' : 's'}`);
	if (fail === 0) {
		console.log('Success');
	} else {
		console.log(`Failed: ${fail}`);
	}
	if (ignore > 0) {
		console.log(`Skipped: ${ignore}`);
	}
};

class Expectation {
	constructor(actual) {
		this._actual = actual;
	}
	
	to(matcher) {
		return matcher(this._actual);
	}
}

const Matchers = {
	equal: (exected) => {
		return (actual) => {
			if (actual === expected) {
				return true;
			}
		
			throw `expected ${actual} to equal ${expected}`;
		};
	},
	
	match: (expected) => {
		return (actual) => {
		    if (actual == expected) {
			    return true;
		    }
		
		    throw `expected ${actual} to match ${expected}`;
		};
	},
	
	matchElements: (...elements) => {
		return (actual) => {
			if (elements.length != actual.length) {
				throw `expected array with length ${elements.length} but got ${actual.length}`;
			}
		
			return elements.every((el, i) => {
				if (isFunction(el)) {
					if (el(actual[i])) {
						return true;
					}
				
					throw `expected ${actual[i]} to match`;
				} else {
					if (el == this._actual[i]) {
						return true;
					}
				
					throw `expected ${actual[i]} to match ${el}`;
				}
			});
		};
	},
	
	matchRows: (...rows) => {
		return (actual) => {
			if (rows.length != actual.length) {
				throw `expected ${rows.length} rows but got ${actual.length}`;
			}
		
			return rows.every((row, r) => {
				const actualRow = actual[r];
				return Object.keys(row).every(colKey => {
					const expectedCol = row[colKey];
					const actualCol = actualRow[colKey];
				
					if (isFunction(expectedCol)) {
						if (expectedCol(actualCol)) {
							return true;
						}
					
						throw `expected ${actualCol} to match for ${colKey}`;
					} else {
						if (expectedCol == actualCol) {
							return true;
						}
					
						throw `expected ${actualCol} to match ${expectedCol} for ${colKey}`;
					}
				});
			});
		};
	}
};

const expect = (actual) => new Expectation(actual);

module.exports = {
	test: test,
	itest: itest,
	run: run,
	expect: expect,
	Matchers: Matchers
};