export default class Recomplete {
  constructor(options = {}) {
    this.source = options.source || (()=> []);
    this.observe = options.observe || function() {};
    this.data = {
      query: '',
      value: null,
      currentMatch: null,
      currentMatchIndex: -1,
      matches: [],
      isInspectingMatches: false
    };
  }

  setQuery(query) {
    let value = this.source.call(this, query);
    let promise = value.then ? value : Promise.resolve(value);
    update(this, {
      query: query,
      isPending: true,
      isRejected: false,
      isFulfilled: false,
      isSettled: false
    });
    let originalData = this.data;
    let updateIfFresh = (attrs)=> {
      if (originalData === this.data) {
        update(this, attrs);
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
    return update(this, {
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
      update(this, {
        currentMatchIndex: matches.length - 1,
        currentMatch: matches[matches.length - 1]
      });
    } else if (nextIndex >= matches.length || nextIndex < 0) {
      update(this, {
        currentMatchIndex: -1,
        currentMatch: null
      });
    } else {
      update(this, {
        currentMatchIndex: nextIndex,
        currentMatch: matches[nextIndex]
      });
    }
  }
};

function update(object, attributes) {
  let data = object.data;
  object.data = {};
  Object.keys(data).forEach(function(key) {
    object.data[key] = data[key];
  });
  Object.keys(attributes).forEach(function(key) {
    object.data[key] = attributes[key];
  });
  object.observe.call(null, object.data, object);
}
