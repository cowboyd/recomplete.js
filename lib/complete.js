const immstruct = window.immstruct;

export default class XComplete {
  constructor(source) {
    this.source = source || (()=> []);
    this.struct = immstruct({
      query: '',
      value: null,
      currentMatch: null,
      currentMatchIndex: -1,
      matches: [],
      isInspectingMatches: false
    });
  }

  setQuery(query) {
    let value = this.source.call(this, query);
    let promise = value.then ? value : Promise.resolve(value);
    let struct = this.struct;
    let cursor = this.struct.cursor().update(function(attrs) {
      return attrs.merge({
        query: query,
        isPending: true,
        isRejected: false,
        isFulfilled: false,
        isSettled: false
      });
    });
    function update(attrs) {
      // only update if nothing changed
      if (cursor.deref() === struct.cursor().deref()) {
        cursor.update(function(map) {
          return map.merge(attrs);
        });
      }
    }
    return promise.then(function(result) {
      update({
        isPending: false,
        isRejected: false,
        isFulfilled: true,
        isSettled: true,
        matches: result,
        isInspectingMatches: !!result.length
      });
    }).catch(function(reason) {
      update({
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
    this.struct.cursor().update(function(map) {
      return map.merge({
        isPending: false,
        isRejected: false,
        isFulfilled: false,
        isSettled: false,
        value: value,
        isInspectingMatches: false,
        matches: []
      });
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
    let cursor = this.struct.cursor();
    function update(attrs) {
      cursor.update(function(map) {
        return map.merge(attrs);
      });
    }
    if (nextIndex < -1 && matches.length > 0) {
      update({
        currentMatchIndex: matches.length - 1,
        currentMatch: matches[matches.length - 1]
      });
    } else if (nextIndex >= matches.length || nextIndex < 0) {
      update({
        currentMatchIndex: -1,
        currentMatch: null
      });
    } else {
      update({
        currentMatchIndex: nextIndex,
        currentMatch: matches[nextIndex]
      });
    }
  }

  get data() {
    return this.struct.cursor().toJSON();
  }

  observe(fn) {
    let notify = ()=> fn(this.data);
    this.struct.on('swap', notify);
    return ()=> this.struct.off('swap', notify);
  }
}
