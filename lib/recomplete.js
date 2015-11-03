'use strict';

var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _Promise = require('babel-runtime/core-js/promise')['default'];

var _Object$keys = require('babel-runtime/core-js/object/keys')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});

var Recomplete = (function () {
  function Recomplete(source) {
    _classCallCheck(this, Recomplete);

    this.source = source || function () {
      return [];
    };
    this.subscribers = [];
    this.data = {
      query: '',
      value: null,
      currentMatch: null,
      currentMatchIndex: -1,
      matches: [],
      isInspectingMatches: false
    };
  }

  _createClass(Recomplete, [{
    key: 'setQuery',
    value: function setQuery(query) {
      var _this = this;

      var value = this.source.call(this, query);
      var promise = value.then ? value : _Promise.resolve(value);
      update(this, {
        query: query,
        isPending: true,
        isRejected: false,
        isFulfilled: false,
        isSettled: false
      });
      var originalData = this.data;
      var updateIfFresh = function updateIfFresh(attrs) {
        if (originalData === _this.data) {
          update(_this, attrs);
        }
      };

      return promise.then(function (result) {
        updateIfFresh({
          isPending: false,
          isRejected: false,
          isFulfilled: true,
          isSettled: true,
          matches: result,
          isInspectingMatches: !!result.length
        });
      })['catch'](function (reason) {
        updateIfFresh({
          isPending: false,
          isRejected: true,
          isFulfilled: false,
          isSettled: true,
          reason: reason
        });
      });
    }
  }, {
    key: 'cancel',
    value: function cancel() {
      this.selectValue(this.data.value);
    }
  }, {
    key: 'selectCurrentMatch',
    value: function selectCurrentMatch() {
      this.selectValue(this.data.currentMatch);
    }
  }, {
    key: 'selectValue',
    value: function selectValue(value) {
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
  }, {
    key: 'inspectNextMatch',
    value: function inspectNextMatch() {
      this.advanceCurrentMatchIndex(1);
    }
  }, {
    key: 'inspectPreviousMatch',
    value: function inspectPreviousMatch() {
      this.advanceCurrentMatchIndex(-1);
    }
  }, {
    key: 'advanceCurrentMatchIndex',
    value: function advanceCurrentMatchIndex(distance) {
      var _data = this.data;
      var currentMatchIndex = _data.currentMatchIndex;
      var matches = _data.matches;

      var nextIndex = currentMatchIndex + distance;

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
  }, {
    key: 'subscribe',
    value: function subscribe(fn) {
      var _this2 = this;

      var subscribers = this.subscribers;
      var notify = function notify() {
        return fn(_this2.data);
      };
      subscribers.push(notify);
      return function () {
        return subscribers.splice(subscribers.indexOf(notify), 1);
      };
    }
  }]);

  return Recomplete;
})();

exports['default'] = Recomplete;
;

function update(object, attributes) {
  var data = object.data;
  object.data = {};
  _Object$keys(data).forEach(function (key) {
    object.data[key] = data[key];
  });
  _Object$keys(attributes).forEach(function (key) {
    object.data[key] = attributes[key];
  });
  object.subscribers.forEach(function (fn) {
    fn.call(null, object.data, object);
  });
}
module.exports = exports['default'];