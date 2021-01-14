const isFunction = (fn) => fn && {}.toString.call(fn) === '[object Function]';

const _suites = [];
let _currentSuite = null;

class Suite {
	constructor(name, fn) {
		this._name = name;
		this._fn = fn;
		this._specs = [];
	}
	
	_addSpec(spec) {
		this._specs.push(spec);
	}
	
	_run(...n) {
		console.log(this._name);
		_currentSuite = this;
		this._fn();
		
		if (n.length > 0) {
			n.forEach(i => {
				this._specs[i]._run();
			});
			return;
		}
	
		let success = 0;
		let fail = 0;
		let ignore = 0;
		this._specs.forEach((spec, i) => {
			const result = spec._run();
			if (spec._ignore) {
				++ignore;
			} else if (result) {
				++success;
			}  else {
				++fail;
			}
		});
		console.log(`\tRan ${this._specs.length} test${this._specs.length === 1 ? '' : 's'}`);
		if (fail === 0) {
			console.log('\tSuccess');
		} else {
			console.log(`\tFailed: ${fail}`);
		}
		if (ignore > 0) {
			console.log(`\tSkipped: ${ignore}`);
		}
		
		return fail === 0;
	}
}

class Spec {
	constructor(name, fn, ignore) {
		this._name = name;
		this._fn = fn;
		this._ignore = ignore;
	}
	
	_run() {
		const prefix = `\t`;
		if (this._ignore) {
			console.log(`${prefix}- ${this._name}`);
			return true;
		}
		
		try {
			this._fn();
			console.log('\x1b[32m%s\x1b[0m', `${prefix}✔ ${this._name}`);
			return true;
		} catch (e) {
			console.log('\x1b[31m%s\x1b[0m', `${prefix}× ${this._name}`);
			console.log(`\t\t${e}`);
			return false;
		}
	}
}

const suite = (name, fn) => _suites.push(new Suite(name, fn));

const test = (name, fn) => {
	_currentSuite._addSpec(new Spec(name, fn, false));
};

const itest = (name, fn) => {
	_currentSuite._addSpec(new Spec(name, fn, true));
};

const run = () => {
	const success = _suites.map(suite => suite._run()).reduce((all, suite) => all && suite, true);
    if (success) {
		console.log('-------\nSuccess\n-------');
	} else {
		console.log('-------\nFailure\n-------');
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
	suite: suite,
	test: test,
	itest: itest,
	run: run,
	expect: expect,
	Matchers: Matchers
};