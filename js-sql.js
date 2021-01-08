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
  
    orderBy(order, dir) {
	    return new OrderByContext(this, order, dir);
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
	
	orderBy(order, dir) {
		return new OrderByContext(this, order, dir);
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
	constructor(parent, order, dir) {
		this._parent = parent;
		this._orders = [];
		this.orderBy(order, dir);
	}
	
	orderBy(order, dir) {
		if (dir != null && (dir !== 'asc' && dir !== 'desc')) {
			throw 'unknown order direction';
		}
		
		this._orders.push({ sort: order, asc: dir !== 'desc' });
		return this;
	}
	
	_getRawValues() {
		return this._parent._getRawValues().slice().sort((a, b) => {
			for (let order of this._orders) {
				let o = 0;
				if (typeof order.sort === 'string') {
					const lhs = get(a, order.sort);
					const rhs = get(b, order.sort);
					if (lhs > rhs) {
						o = 1;
					} else if (lhs < rhs) {
						o = -1;
					}
				} else if (isFunction(order.sort)) {
					o = order.sort(a, b);
				} else {
					throw 'unknown order type';
				}
				
				if (o !== 0) {
					return order.asc ? o : -o;
				}
			}
			return 0;
		});
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