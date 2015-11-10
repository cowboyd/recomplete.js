class InitialState {
  constructor() {
    Object.assign(this, {
      query: '',
      value: null,
      currentMatch: this.nullMatch,
      matches: [],
      isInspectingMatches: false,
      isPending: false,
      isFulfilled: false,
      isRejected: false,
      isSettled: false
    });
  }
  update(change) {
    let next = new State(this);
    change.call(null, next);
    return next;
  }

  get currentMatchIndex() {
    if (this.currentMatch) {
      return this.currentMatch.index;
    } else {
      return -1;
    }
  }

  get nullMatch() {
    return new NullMatch(this);
  }
};

class State extends InitialState {
  constructor(prev) {
    super();
    Object.assign(this, {
      query: prev.query,
      value: prev.value,
      currentMatch: prev.currentMatch,
      matches: prev.matches.slice(),
      isInspectingMatches: prev.isInspectingMatches,
      isPending: prev.isPending,
      isFulfilled: prev.isFulfilled,
      isRejected: prev.isRejected,
      isSettled: prev.isSettled
    });
  }
}

export class Match {
  constructor(state, attrs = {}, overrides = {}) {
    this.state = state;
    this.attrs = Object.assign({
      isCurrentMatch: false,
      isDefault: false,
      value: null
    }, attrs, overrides);
  }

  get isNull() { return false; }

  get isCurrentMatch() {
    return this.attrs.isCurrentMatch;
  }

  get isDefault() {
    return this.attrs.isDefault;
  }

  get index() {
    return this.attrs.index;
  }

  get value() {
    return this.attrs.value;
  }

  get previous() {
    if (this.index === 0) {
      return this.state.nullMatch;
    } else {
      return this.state.matches[this.index - 1];
    }
  }

  get next() {
    if (this.index === (this.state.matches.length - 1)) {
      return this.state.nullMatch;
    } else {
      return this.state.matches[this.index + 1];
    }
  }

  inspect(state) {
    return new Match(state, this.attrs, {
      isCurrentMatch: true
    });
  }

  uninspect(state) {
    return new Match(state, this.attrs, {
      isCurrentMatch: false
    });
  }
}

export class NullMatch extends Match {
  constructor(state, isCurrentMatch = false) {
    super(state, {
      isCurrentMatch: isCurrentMatch
    });
  }

  get isNull() { return true; }

  get index() { return -1; }

  get value()  { return null; }

  get previous() {
    if (this.state.matches.length === 0) {
      return this;
    } else {
      return this.state.matches[this.state.matches.length - 1];
    }
  }

  get next() {
    if (this.state.matches.length === 0) {
      return this;
    } else {
      return this.state.matches[0];
    }
  }

  inspect(state) {
    return new NullMatch(state, true);
  }

  uninspect(state) {
    return new NullMatch(state, false);
  }
}

export default class Recomplete {
  constructor(options = {}) {
    this.source = options.source || (()=> []);
    this.observe = options.observe || function() {};
    this.data = new InitialState();
    if (!options.defaultMatch || !options.defaultMatch.call) {
      this.defaultMatch = function() { return options.defaultMatch; };
    } else {
      this.defaultMatch = options.defaultMatch;
    }
  }

  update(change) {
    let next = this.data.update(function(next) {
      if (change.call) {
        change.call(null, next);
      } else {
        Object.assign(next, change);
      }
    });
    this.data = next;
    this.observe.call(null, next, this);
  }

  setQuery(query) {
    let value = this.source.call(this, query);
    let promise = value.then ? value : Promise.resolve(value);
    this.update({
      query: query,
      isPending: true,
      isRejected: false,
      isFulfilled: false,
      isSettled: false
    });
    let originalData = this.data;
    let updateIfFresh = (attrs)=> {
      if (originalData === this.data) {
        this.update(attrs);
      }
    };

    let defaultMatch = this.defaultMatch(query);

    return promise.then(function(result) {
      updateIfFresh(function(next) {
        next.isPending = false;
        next.isRejected = false;
        next.isFulfiled = true;
        next.isSettled = true;
        next.isInspectingMatches = !!result.length;
        next.currentMatch = next.nullMatch;
        next.matches = result.map((item, i)=> new Match(next, {
          index: i, value: item
        }));
        if (defaultMatch != null) {
          next.matches.push(new Match(next, {
            index: result.length,
            value: defaultMatch,
            isDefault: true
          }));
        }
      });
    }).catch(function(reason) {
      updateIfFresh({
        isPending: false,
        isRejected: true,
        isFulfilled: false,
        isSettled: true,
        reason: reason
      });
    });
  }

  cancel() {
    this.selectValue(this.data.value);
  }

  selectCurrentMatch() {
    this.selectValue(this.data.currentMatch);
  }

  selectValue(value) {
    return this.update({
      isPending: false,
      isRejected: false,
      isFulfilled: false,
      isSettled: false,
      value: value,
      isInspectingMatches: false,
      matches: []
    });
  }

  inspectNextMatch() {
    this.advanceCurrentMatch(1);
  }

  inspectPreviousMatch() {
    this.advanceCurrentMatch(-1);
  }

  advanceCurrentMatch(distance) {
    let nextMatch;
    let currentMatch = this.data.currentMatch;
    if (distance > 0) {
      nextMatch = currentMatch.next;
    } else {
      nextMatch = currentMatch.previous;
    }
    if (nextMatch !== currentMatch) {
      this.update(function (next) {
        next.currentMatch = nextMatch.inspect(next);
        next.matches = next.matches.map(function(match, i) {
          if (match.index === nextMatch.index) {
            return next.currentMatch;
          } else {
            return match.uninspect(next);
          }
        });
      });
    }
  }
};
