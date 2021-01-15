const isFunction = (fn) => fn && {}.toString.call(fn) === '[object Function]';

const _suites = [];
const _activeSuites = [];

class Suite {
	constructor(name, fn) {
		this._name = name;
		this._fn = fn;
	}
	
	_addSpec(spec) {
		this._specs.push(spec);
	}
	
	_run() {
		this._specs = [];
		
		_activeSuites.push(this);
		this._fn();
		_activeSuites.pop();
		
		return {
			suite: this._name,
			specs: this._specs.map(spec => spec._run())
		};
	}
}

class Spec {
	constructor(name, fn, ignore) {
		this._name = name;
		this._fn = fn;
		this._ignore = ignore;
	}
	
	_run() {
		const result = {
			spec: this._name
		};
		
		if (this._ignore) {
			result.ignore = true;
		} else {
			try {
				this._fn();
				result.success = true;
			} catch (e) {
				result.failure = true;
				result.error = e;
			}
		}
		return result;
	}
}

const suite = (name, fn) => _suites.push(new Suite(name, fn));

const test = (name, fn) => {
	_activeSuites[_activeSuites.length - 1]._addSpec(new Spec(name, fn, false));
};

const itest = (name, fn) => {
	_activeSuites[_activeSuites.length - 1]._addSpec(new Spec(name, fn, true));
};

const logSuccess = (text, prefix) => console.log('\x1b[32m%s\x1b[0m', `${prefix ? prefix : ''}✔ ${text}`);
const logError = (text, prefix) => console.log('\x1b[31m%s\x1b[0m', `${prefix ? prefix : ''}× ${text}`);

const run = () => {
	const results = _suites.map(suite => suite._run());
	
	results.forEach(suite => {
		const suiteSuccess = suite.specs.every(spec => spec.success || spec.ignore);
		if (suiteSuccess) {
			logSuccess(suite.suite);
		} else {
			logError(suite.suite);
		}
		
		suite.specs.forEach(spec => {
			if (spec.ignore) {
				console.log(`\t- ${spec.spec}`);
			} else if (spec.success) {
				logSuccess(spec.spec, '\t');
			} else if (spec.failure) {
				logError(spec.spec, '\t');
				if (spec.error) {
					console.log(`\t\t${spec.error}`);
				}
			}
		});
		
		const numSuccess = suite.specs.reduce((sum, spec) => spec.success ? sum + 1 : sum, 0);
		const numFailure = suite.specs.reduce((sum, spec) => spec.failure ? sum + 1 : sum, 0);
		const numIgnore = suite.specs.reduce((sum, spec) => spec.ignore ? sum + 1 : sum, 0);
		console.log(`\tRan ${suite.specs.length} test${suite.specs.length === 1 ? '' : 's'}`);
		if (numFailure === 0) {
			console.log('\tSuccess');
		} else {
			console.log(`\tFailed: ${numFailure}`);
		}
		if (numIgnore > 0) {
			console.log(`\tSkipped: ${numIgnore}`);
		}
	});
	
	const success = results.every(suite => suite.specs.every(spec => spec.success || spec.ignore));
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