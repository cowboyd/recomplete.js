const immstruct = window.immstruct;

export default class XComplete {
  constructor(source) {
    this.source = source || (()=> []);
    this.struct = immstruct({
      query: '',
      value: null,
      currentMatch: null,
      matches: []
    });
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
    return promise.then(function(result) {
      struct.cursor().update(function(attrs) {
        return attrs.merge({
          isPending: false,
          isRejected: false,
          isFulfilled: true,
          isSettled: true,
          matches: result
        });
      });
    }).catch(function(reason) {
      struct.cursor().update(function(attrs) {
        return attrs.merge({
          isPending: false,
          isRejected: true,
          isFulfilled: false,
          isSettled: true,
          reason: reason
        });
      });
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

  get data() {
    return this.struct.cursor().toJSON();
  }

  observe(fn) {
    return this.struct.reference().observe(()=> fn(this.data));
  }
}
