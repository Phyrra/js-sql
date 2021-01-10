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
  
    _getValues(row) {
        return this._values
			.map((value, i) => {
	        	if (typeof value === 'string') {
	            	if (value === '*') {
						return row;
		        	}

	  	        	return { value: get(row, value) };
	        	} else if (isFunction(value)) {
	            	return { [`fn${i}`]: value(row) };
	        	}

	        	throw 'unknown value type';
	    	})
			.reduce((all, it) => Object.assign(all, it), {});
    }
}

class FromContext {
    constructor(parent, source) {
        this._parent = parent;
	    this._source = source;
		this._joinedSources = [];
    }
  
    where(condition) {
	    return new WhereContext(this, condition);
    }
  
    orderBy(order, dir) {
	    return new OrderByContext(this, order, dir);
    }
	
	join(source) {
		return new InnerJoinContext(this, source);
	}
	
	innerJoin(source) {
		return new InnerJoinContext(this, source);
	}
	
	leftJoin(source) {
		return new LeftJoinContext(this, source);
	}
	
	rightJoin(source) {
		return new RightJoinContext(this, source);
	}
	
	outerJoin(source) {
		return new OuterJoinContext(this, source);
	}
	
	crossJoin(source) {
		new CrossJoinContext(this, source);
		return this;
	}
	
	_addJoinedSource(join) {
		this._joinedSources.push(join);
	}
	
	_getRawValues() {
		return this._joinedSources.reduce((result, source) => source._evalJoin(result), this._source);
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
					if (order.sort.length === 1) {
						const lhs = order.sort(a);
						const rhs = order.sort(b);
						if (lhs > rhs) {
							o = 1;
						} else if (lhs < rhs) {
							o = -1;
						}
					} else if (order.sort.length === 2) {
						o = order.sort(a, b);
					} else {
						throw 'bad sorting function';
					}
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

class InnerJoinContext {
	constructor(parent, source) {
		this._parent = parent;
		this._source = source;
		this._parent._addJoinedSource(this);
		this._condition = (lhs, rhs) => false;
	}
	
	on(condition) {
		this._condition = condition;
		return this._parent;
	}
	
	_evalJoin(lhs) {
		return lhs
			.map(row =>
				this._source
					.filter(r => this._condition(row, r))
					.map(r => Object.assign({}, row, r))
			)
			.reduce((all, it) => all.concat(it), []);
	}
}

class LeftJoinContext {
	constructor(parent, source) {
		this._parent = parent;
		this._source = source;
		this._parent._addJoinedSource(this);
		this._condition = (lhs, rhs) => false;
	}
	
	on(condition) {
		this._condition = condition;
		return this._parent;
	}
	
	_evalJoin(lhs) {
	    return lhs
		    .map(row => {
			    const joined = this._source
				    .filter(r => this._condition(row, r))
				    .map(r => Object.assign({}, row, r));
					
				if (joined.length === 0) {
					return [row];
				}
				return joined;
		    })
		    .reduce((all, it) => all.concat(it), []);
	}
}

class RightJoinContext {
	constructor(parent, source) {
		this._parent = parent;
		this._source = source;
		this._parent._addJoinedSource(this);
		this._condition = (lhs, rhs) => false;
	}
	
	on(condition) {
		this._condition = condition;
		return this._parent;
	}
	
	_evalJoin(lhs) {
        return this._source
	        .map(row => {
		        const joined = lhs
			        .filter(r => this._condition(r, row))
			        .map(r => Object.assign({}, r, row));
				
			    if (joined.length === 0) {
				    return [row];
			    }
			    return joined;
	        })
	        .reduce((all, it) => all.concat(it), []);
	}
}

class OuterJoinContext {
	constructor(parent, source) {
		this._parent = parent;
		this._source = source;
		this._parent._addJoinedSource(this);
		this._condition = (lhs, rhs) => false;
	}
	
	on(condition) {
		this._condition = condition;
		return this._parent;
	}
	
	_evalJoin(lhs) {
        const leftJoin = lhs
	        .map(row => {
		        const joined = this._source
			        .filter(r => this._condition(row, r))
			        .map(r => Object.assign({}, row, r));
				
			    if (joined.length === 0) {
				    return [row];
			    }
			    return joined;
	        })
	        .reduce((all, it) => all.concat(it), []);
			
		const rightJoinRest = this._source
			.map(row => {
	            const joined = lhs
		            .filter(r => this._condition(r, row))
		            .map(r => Object.assign({}, r, row));
			
		        if (joined.length === 0) {
			        return row;
		        }
		        return null;
			})
			.filter(row => row != null);
			
		return leftJoin.concat(rightJoinRest);
	}
}

class CrossJoinContext {
	constructor(parent, source) {
		this._parent = parent;
		this._source = source;
		this._parent._addJoinedSource(this);
		this._condition = (lhs, rhs) => false;
	}
	
	_evalJoin(lhs) {
        return lhs
	        .map(row => this._source.map(r => Object.assign({}, row, r)))
	        .reduce((all, it) => all.concat(it), []);
	}
}

const select = (...values) => new SelectContext(values);

module.exports  = {
	select: select
};