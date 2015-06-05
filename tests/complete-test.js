import Complete from 'complete';
const { expect } = chai;

describe("Complete", function() {
  let complete = null;
  let source = null;
  let data = null;

  beforeEach(function() {
    complete = new Complete(source);
    this.unobserve = complete.observe(version => data = version);
  });
  afterEach(function() {
    this.unobserve();
  });
  describe("with no source", function() {
    beforeEach(function() {
      return complete.setQuery('bob');
    });
    it("has no matches", function() {
      expect(data.matches).to.be.empty;
    });
    it("does not have a value", function() {
      expect(data.value).to.be.null;
    });
    it("does not have a currently inspected match", function() {
      expect(data.currentMatch).to.be.null;
    });
  });
  describe("with a source that returns a list of synchronous values", function() {
    before(function() {
      source = function(query) {
        return [query, `${query} ${query}`, 3];
      };
    });
    beforeEach(function() {
     return complete.setQuery('bob');
    });
    it("updates the matches", function() {
      expect(data.matches).to.deep.equal(['bob', 'bob bob', 3]);
    });
  });
  describe("with a source that returns a promise of values", function() {
    before(function() {
      source = (query)=> {
        this.promise = new Promise((resolve, reject)=> {
          this.resolve = resolve;
          this.reject = reject;
        });
        return this.promise;
      };
    });
    beforeEach(function() {
      complete.setQuery('bob');
    });
    describe("that resolves to an array", function() {
      beforeEach(function() {
        this.resolve(['bob', 'dobalina', 'mr bob dobalina']);
        return this.promise;
      });
      it("gets that array", function() {
        expect(data.matches).to.deep.equal(['bob', 'dobalina', 'mr bob dobalina']);
      });
    });
    describe("that is rejected", function() {
      beforeEach(function(){
        this.reject('could not communicate with the server');
        return this.promise.catch(e => {});
      });
      it("sets the reason for rejection", function() {
        expect(data.reason).to.equal('could not communicate with the server');
      });
    });
  });
});
