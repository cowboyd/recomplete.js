class State {
  constructor(previous = {}) {
    this.query = previous.query || '';
    this.value = previous.value || null;
    this.currentMatch = previous.currentMatch || null;
    this.currentMatchIndex = previous.currentMatchIndex || -1;
    this.matches = previous.matches || [];
    this.isInspectingMatches = previous.isInspectingMatches || false;
  }

  update(object, attrs) {
    let next = new State(this);
    Object.assign(next, attrs);
    object.data = next;
    object.observe.call(null, next, object);
    return next;
  }
}

export default class Recomplete {
  constructor(options = {}) {
    this.source = options.source || (()=> []);
    this.observe = options.observe || function() {};
    this.data = new State();
  }

  setQuery(query) {
    let value = this.source.call(this, query);
    let promise = value.then ? value : Promise.resolve(value);
    this.data.update(this, {
      query: query,
      isPending: true,
      isRejected: false,
      isFulfilled: false,
      isSettled: false
    });
    let originalData = this.data;
    let updateIfFresh = (attrs)=> {
      if (originalData === this.data) {
        this.data.update(this, attrs);
      }
    };

    return promise.then(function(result) {
      updateIfFresh({
        isPending: false,
        isRejected: false,
        isFulfilled: true,
        isSettled: true,
        matches: result,
        isInspectingMatches: !!result.length
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
    return this.data.update(this, {
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

  advanceCurrentMatchIndex(distance) {
    let { currentMatchIndex, matches } = this.data;
    let nextIndex = currentMatchIndex + distance;

    if (nextIndex < -1 && matches.length > 0) {
      this.data.update(this, {
        currentMatchIndex: matches.length - 1,
        currentMatch: matches[matches.length - 1]
      });
    } else if (nextIndex >= matches.length || nextIndex < 0) {
      this.data.update(this, {
        currentMatchIndex: -1,
        currentMatch: null
      });
    } else {
      this.data.update(this, {
        currentMatchIndex: nextIndex,
        currentMatch: matches[nextIndex]
      });
    }
  }
};
