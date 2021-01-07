const isFunction = (fn) => fn && {}.toString.call(fn) === '[object Function]';

const get = (obj, path) => path
   .split(/[\.\[\]\'\"]/)
   .filter(piece => piece)
   .reduce((it, piece) => it ? it[piece] : null, obj);

class SelectContext {
    constructor(values) {
  	    this._values = values;
    }
  
    from(source) {
  	    return new FromContext(this, source);
    }
  
    _getValues(entry) {
        return this._values
			.map(value => {
	        	if (typeof value === 'string') {
	            	if (value === '*') {
						return Object.values(entry);
		        	}

	  	        	return [get(entry, value)];
	        	} else if (isFunction(value)) {
	            	return [value(entry)];
	        	}

	        	throw 'unknown value type';
	    	})
			.reduce((all, it) => all.concat(it), []);
    }
}

class FromContext {
    constructor(parent, source) {
        this._parent = parent;
	    this._source = source;
    }
  
    where(condition) {
	    return new WhereContext(this, condition);
    }
  
    orderBy(...order) {
	    return new OrderByContext(this, order);
    }
	
	_getRawValues() {
		return this._source;
	}
	
	_getSelectedValues(entries) {
		return entries.map(entry => this._parent._getValues(entry));
	}
  
    eval() {
        return this._getSelectedValues(this._getRawValues());
    }
}

class WhereContext {
	constructor(parent, condition) {
		this._parent = parent;
		this._condition = condition;
	}
	
	orderBy(...order) {
		return new OrderByContext(this, order);
	}
	
	_getRawValues() {
		// TODO: Support non-func connditions
		return this._parent._getRawValues().filter(entry => this._condition(entry));
	}
	
	_getSelectedValues(entries) {
		return this._parent._getSelectedValues(entries);
	}
	
	eval() {
		return this._getSelectedValues(this._getRawValues());
	}
}


class OrderByContext {
	constructor(parent, orders) {
		this._parent = parent;
		this._orders = orders;
	}
	
	_getRawValues() {
		return this._parent._getRawValues().sort((a, b) => {
			for (let order of this._orders) {
				let o = 0;
				if (typeof order === 'string') {
					const lhs = get(a, order);
					const rhs = get(b, order);
					if (lhs > rhs) {
						o = 1;
					} else if (lhs < rhs) {
						o = -1;
					}
				} else if (isFunction(order)) {
					o = order(a, b);
				} else {
					throw 'unknown order type';
				}
				
				if (o !== 0) {
					return o;
				}
			}
			return 0;
		}).slice();
	}
	
	_getSelectedValues(entries) {
		return this._parent._getSelectedValues(entries);
	}
	
	eval() {
		return this._getSelectedValues(this._getRawValues());
	}
}

const select = (...values) => new SelectContext(values);

module.exports  = {
	select: select
};