import Recomplete from '../src/recomplete';
import { describe, before, beforeEach, it } from 'mocha';
import { expect } from 'chai';

describe("Recomplete", function() {
  let recomplete = null;
  let source = null;
  let data = null;
  let defaultMatch = null;

  beforeEach(function() {
    recomplete = new Recomplete({
      source: source,
      observe: version => data = version,
      defaultMatch: defaultMatch
    });
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
      expect(data.currentMatch.value).to.equal(null);
      expect(data.currentMatch.isNull).to.equal(true);
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
      expect(data.matches.map((m)=> m.value)).to.deep.equal(['bob', 'bob bob', 3]);
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
          expect(data.currentMatch.value).to.equal('bob');
          expect(data.currentMatch.isCurrentMatch).to.equal(true);
        });
        describe(", then inspecting the previous match", function() {
          beforeEach(function() {
            recomplete.inspectPreviousMatch();
          });
          it("nulls out the current match", function() {
            expect(data.currentMatch.value).to.equal(null);
            expect(data.currentMatch.isNull).to.equal(true);
          });
          it("is no longer inspecting the first match at index 0", function() {
            expect(data.matches[0].isCurrentMatch).to.equal(false);
          });
        });
        describe(", then inspecting the next match", function() {
          beforeEach(function() {
            recomplete.inspectNextMatch();
          });
          it("considers the next match", function() {
            expect(data.currentMatch.value).to.equal('bob bob');
          });
          it("marks the second match as the current match", function() {
            expect(data.matches[1].isCurrentMatch).to.equal(true);
          });
        });
      });
      describe("immediately inspecting the previous match", function() {
        beforeEach(function() {
          recomplete.inspectPreviousMatch();
        });
        it("considers the last match", function() {
          expect(data.currentMatch.value).to.equal(3);
          expect(data.matches[2].isCurrentMatch).to.equal(true);
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
          expect(data.currentMatch.value).to.equal(null);
          expect(data.currentMatch.isNull).to.equal(true);
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
        expect(data.matches.map((m)=> m.value)).to.deep.equal(['bob', 'dobalina', 'mr bob dobalina']);
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

  describe("with a default match", function () {
    before(function() {
      source = (query)=> {
        return ["first", "second"];
      };
    });
    beforeEach(function() {
      return recomplete.setQuery("bob");
    });

    beforeEach(function() {
      recomplete.inspectNextMatch();
      recomplete.inspectNextMatch();
      recomplete.inspectNextMatch();
    });
    describe("that is a constant value", function() {
      before(function() {
        defaultMatch = "iamdefault";
      });
      it("uses the constant default as its match value", function() {
        expect(data.currentMatch.isNull).to.not.equal(true);
        expect(data.currentMatch.value).to.equal("iamdefault");
      });
    });
    describe("that is a function", function() {
      before(function() {
        defaultMatch = (query)=> `iamdefault 4 ${query}`;
      });
      it("passes the query to the function in order to yield its match value", function() {
        expect(data.currentMatch.value).to.equal("iamdefault 4 bob");
        expect(data.currentMatch.isDefault).to.equal(true);
      });
    });
  });
});
