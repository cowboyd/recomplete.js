class InitialState {
  constructor() {
    Object.assign(this, {
      query: '',
      value: null,
      currentMatch: new NullMatch(),
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
  constructor(defaults = {}, attrs = {}) {
    this.attrs = Object.assign({
      isCurrentMatch: false,
      value: null,
      matches: []
    }, defaults, attrs);
  }

  get isNull() { return false; }

  get isCurrentMatch() {
    return this.attrs.isCurrentMatch;
  }

  get index() {
    return this.attrs.index;
  }

  get value() {
    return this.attrs.value;
  }

  get previous() {
    if (this.index === 0) {
      return this.nullMatch;
    } else {
      return this.matches[this.index - 1];
    }
  }

  get next() {
    if (this.index === (this.matches.length - 1)) {
      return this.nullMatch;
    } else {
      return this.matches[this.index + 1];
    }
  }
}

export class NullMatch extends Match {

  get isNull() { return true; }

  get index() { return -1; }

  get value()  { return null; }

  get previous() {
    if (this.matches.length === 0) {
      return this;
    } else {
      return this.matches[this.matches.length - 1];
    }
  }

  get next() {
    if (this.matches.length === 0) {
      return this;
    } else {
      return this.matches[0];
    }
  }
}

export default class Recomplete {
  constructor(options = {}) {
    this.source = options.source || (()=> []);
    this.observe = options.observe || function() {};
    this.data = new InitialState();
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

    return promise.then(function(result) {
      var attrs = {
        isPending: false,
        isRejected: false,
        isFulfilled: true,
        isSettled: true,
        matches: result.reduce((matches, item, i) => {
          matches.push(new Match({index: i, value: item, matches: matches}));
          return matches;
        }, []),
        isInspectingMatches: !!result.length
      };
      updateIfFresh(attrs);
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
    this.advanceCurrentMatchIndex(1);
  }

  inspectPreviousMatch() {
    this.advanceCurrentMatchIndex(-1);
  }

  // advanceCurrentMatch(distance) {

  // }

  advanceCurrentMatchIndex(distance) {
    let { currentMatchIndex, matches } = this.data;
    let nextIndex = currentMatchIndex + distance;

    if (nextIndex < -1 && matches.length > 0) {
      this.update({
        currentMatch: matches[matches.length - 1]
      });
    } else if (nextIndex >= matches.length || nextIndex < 0) {
      this.update({
        currentMatch: new NullMatch({
          matches: matches
        })
      });
    } else {
      this.update({
        currentMatch: matches[nextIndex]
      });
    }
  }
};
