import immstruct from 'immstruct';

class XComplete {
  constructor(source) {
    this.source = source;
    this.struct = immstruct({
      query: '',
      value: null,
      currentMatchIndex: null,
      defaultMatch: null,
      matches: []
    });
  }

  inspectNextMatch() {
    this.struct.cursor().update(function(attrs) {
      return attrs.merge({

      });
    });
  }


  inspectPreviousMatch() {

  }

  selectCurrentMatch() {

  }

  setQuery(query) {
    let value = this.source.call(this, query);
    let promise = value.then ? value : Promise.resolve(value);
    let struct = this.struct;
    struct.cursor().update(function(attrs) {
      return attrs.merge({
        query: query,
        isPending: true,
        isRejected: false,
        isFulfilled: false,
        isSettled: false
      });
    });
    promise.then(function(result) {
      struct.cursor().update(function(attrs) {
        return attrs.merge({
          isPending: false,
          isRejected: false,
          isFulfilled: true,
          isSettled: true,
          result: result
        });
      });
    }).catch(function() {
      struct.cursor().update(function(reason) {
        return attrs.merged({
          isPending: false,
          isRejected: true,
          isFulfilled: false,
          isSettled: true,
          reason: reason
        });
      });
    });
  }

  get data() {
    return this.struct.toJSON();
  }

  subscribe(fn) {
    return this.struct.on('swap', ()=> fn(this.data));
  }
}
