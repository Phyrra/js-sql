const isFunction = (fn) => fn && {}.toString.call(fn) === '[object Function]';

const tests = [];

const test = (name, fn) => tests.push({ name: name, fn: fn });

const run = (n) => {
	if (n != null) {
		tests[n].fn();
		return;
	}
	
	let success = 0;
	let fail = 0;
	tests.forEach((test, i) => {
		const prefix = `Test '${test.name}' (${i + 1}/${tests.length}):`
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
}

class Matcher {
	constructor(actual) {
		this._actual = actual;
	}
	
	toEqual(expected) {
		if (this._actual === expected) {
			return true;
		}
		
		throw `expected ${this._actual} to equal ${expected}`;
	}
	
	toMatch(expected) {
		if (this._actual == expected) {
			return true;
		}
		
		throw `expected ${this._actual} to match ${expected}`;
	}
	
	toMatchElements(...elements) {
		if (elements.length != this._actual.length) {
			throw `expected array with length ${elements.length} but got ${this._actual.length}`;
		}
		
		return elements.every((el, i) => {
			if (isFunction(el)) {
				if (el(this._actual[i])) {
					return true;
				}
				
				throw `expected ${this._actual[i]} to match`;
			} else {
				if (el == this._actual[i]) {
					return true;
				}
				
				throw `expected ${this._actual[i]} to match ${el}`;
			}
		});
	}
	
	toMatchRows(...rows) {
		if (rows.length != this._actual.length) {
			throw `expected ${rows.length} but got ${this._actual.length}`;
		}
		
		return rows.every((row, r) => {
			const actualRow = this._actual[r];
			return row.every((col, c) => {
				const actualCol = actualRow[c];
				
				if (isFunction(col)) {
					if (col(actualCol)) {
						return true;
					}
					
					throw `expected ${actualCol} to match`;
				} else {
					if (col == actualCol) {
						return true;
					}
					
					throw `expected ${actualCol} to match ${col}`;
				}
			});
		});
	}
}

const expect = (actual) => new Matcher(actual);

module.exports = {
	test: test,
	run: run,
	expect: expect
};