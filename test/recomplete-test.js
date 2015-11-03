/*global describe, beforeEach, afterEach, before, it */

import Recomplete from '../src/recomplete';
import { expect } from 'chai';

describe("Complete", function() {
  let recomplete = null;
  let source = null;
  let data = null;

  beforeEach(function() {
    recomplete = new Recomplete(source);
    this.unsubscribe = recomplete.subscribe(version => data = version);
  });
  afterEach(function() {
    this.unsubscribe();
  });
  describe("with no source", function() {
    beforeEach(function() {
      return recomplete.setQuery('bob');
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
    it("is not currentlyInspectingMatches", function() {
      expect(data.isInspectingMatches).to.equal(false);
    });
  });
  describe("with a source that returns a list of synchronous values", function() {
    before(function() {
      source = function(query) {
        return [query, `${query} ${query}`, 3];
      };
    });
    beforeEach(function() {
      return recomplete.setQuery('bob');
    });
    it("indicates that it is now inspecting matches", function() {
      expect(data.isInspectingMatches).to.equal(true);
    });
    it("updates the matches", function() {
      expect(data.matches).to.deep.equal(['bob', 'bob bob', 3]);
    });

    describe("cancelling out", function() {
      beforeEach(function() {
        recomplete.cancel();
      });
      it("it markes it as not inspecting matches anymore", function() {
        expect(data.isInspectingMatches).to.equal(false);
      });
      it("is no longer pending", function() {
        expect(data.isPending).to.equal(false);
      });
    });
    describe(". Match inspection:", function() {
      describe("inspecting the first match", function() {
        beforeEach(function() {
          recomplete.inspectNextMatch();
        });
        it("updates the current match to be the one at index 0", function() {
          expect(data.currentMatch).to.equal('bob');
        });
        describe(", then inspecting the previous match", function() {
          beforeEach(function() {
            recomplete.inspectPreviousMatch();
          });
          it("nulls out the current match", function() {
            expect(data.currentMatch).to.equal(null);
          });
        });
        describe(", then inspecting the next match", function() {
          beforeEach(function() {
            recomplete.inspectNextMatch();
          });
          it("considers the next match", function() {
            expect(data.currentMatch).to.equal('bob bob');
          });
        });
      });
      describe("immediately inspecting the previous match", function() {
        beforeEach(function() {
          recomplete.inspectPreviousMatch();
        });
        it("considers the last match", function() {
          expect(data.currentMatch).to.equal(3);
        });

      });
      describe("inspecting past the last match", function() {
        beforeEach(function() {
          recomplete.inspectNextMatch();
          recomplete.inspectNextMatch();
          recomplete.inspectNextMatch();
          recomplete.inspectNextMatch();
        });
        it("nulls out the current match", function() {
          expect(data.currentMatch).to.equal(null);
        });
      });
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
      recomplete.setQuery('bob');
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
    describe("with one that is cancelled before resolving", function() {
      beforeEach(function() {
        recomplete.cancel();
        this.resolve(['hey', 'buddy']);
        return this.promise;
      });
      it("ignores the matches", function() {
        expect(data.matches).to.deep.equal([]);
      });
      it("is not pending", function() {
        expect(data.isPending).to.equal(false);
      });
    });
  });
});
