# recomplete.js

[![npm version](https://badge.fury.io/js/recomplete.svg)](https://badge.fury.io/js/recomplete)
[![Build Status](https://travis-ci.org/cowboyd/recomplete.js.svg?branch=master)](https://travis-ci.org/cowboyd/recomplete.js)


A plain old JavaScript completion model for any UI

## Why?

Alright. So you're working hard on your current project and the time
comes when you need to implement some sort of autocomplete. Maybe
you're using Ember or React. Maybe you're using Backbone or
JQuery. Heck, maybe you're just making a console application that
needs TAB completion. So you ask yourself "what is the best
autocomplete library for
`[Ember|React|Backbone|Bootstrap|JQuery|FrameworkX|FrameworkY|FrameworkZ|etc....]`?
And you google around, and you find the one that happens to be the
most popular for your framework at the moment (in most cases that
amounts to wrapped hairball of a JQuery plugin.)

So you try out a number of these solutions, but you find that extending them
and customizing them for your particular corner cases to be
painful. Even those that were written just for the framework you're
using don't always fit quite right.

That's where recomplete comes in. It seeks to make the question of
"what's the best completion plugin for framework X?"  obsolete.

That's because autocompletion isn't a widget, it's a workflow. It's a
workflow that exists outside the scope of any one UI framework, and
Recomplete.js seeks to capture that workflow in a simple JavaScript
model that can be represented in any medium, visual or otherwise..

In other words, Recomplete doesn't give you an autocomplete widget,
but what it does do is make building your own that is custom-fit
straightforward.

## API

Recomplete models completion via a set of actions coupled with a
single data structure representing the current state of the
workflow. As the state changes, recomplete will emit a new version of
its model that can be used to render.

> Note: There is no concept of fine-grained events in
> recomplete. Every time there is a state change, it re-emits
> the workflow's model in its entirety. The data structure
> representing the state is immutable in the sense that any changes
> made to it will not have any effect on workflow state.

```js
import Recomplete from 'recomplete';

// create a new instance passing a data source. The datasource is a
// function that takes a query and returns either an array of matches
// or a promise that yields an array of matches
let recomplete = new Recomplete({
  // this function will be invoked whenever a new query is available
  // it should return a promise that yields matches for the query.
  // If it returns a synchronous value, it will be wrapped in a promise that
  // resolves immediately.

  source: function(query) {
    return new Promise(function(resolve, reject) {
      makeRequestForMatchesFromSomewhere(resolve, reject);
    });
  },
  // this function will be invoked whenever the completion changes state
  observe: function(state) {
    currentState = state;
  }
});
```

At some point The user will enter some query. How this happens is
system dependent, but once it does, you can call the `setQuery()`
method. For example, if this was in JQuery we might see something
like:

```js
$('input').on('change', function() {
  recomplete.setQuery($(this).val());
});
```

This will invoke the data source and indicate that you have a set of
matches pending:

```js
currentState.isPending //=> true
currentState.isResolved //=> false
currentState.isSettled //=> false
```

At some point, the datasource promise will resolve:

```js
currentState.isPending //=> false
currentstate.isResolved //=> true
currentstate.isSettled //=> true
currentState.matches //=> [..array of your match objects]
currentState.isInspectingMatches //=> true
```

You are now considered to be "inspecting" matches. This corresponds to
a user having been presented a set of matches, usually in the form of
a popoup list. Now they are considering which one to go to
with. Recomplete provides actions to understand those decisions. Let's
say they don't like the first
:

```js
recomplete.inspectNextMatch()
currentState.currentMatch //=> advanced one match
```

Maybe you want to cancel. To continue our JQuery example, maybe you
hit the `ESC` key. In that case, you would invoke:

```js
$(this).on('keyup', function(event) {
  if (event.keyCode === 27) {
    recomplete.cancel();
    currentState.isInspectingMatches //=> false
  }
});

```

Or maybe they don't cancel, instead they hit the enter key, and you
want that to mean selecting the currently selected match. In either
case, after a selection is made, the workflow is no longer considered
to be inspecting matches.

```js
$(this).on('keyup', function() {
  if (event.keyCode === 13) {
    recomplete.selectCurrentMatch();
    currentState.value //=> the value that was just selected
    currentState.isInpsectingMatches //=> false
  }
});
```


## Development

Recomplete is written using ES6 and follows [this template][1] for
distributing NPM packages containing ES6 source.

checkout the source and run the tests:

```
$ git clone https://github.com/cowboyd/recomplete.js.git
$ cd recomplete.js
$ npm install
$ npm test
```

[1]: https://github.com/benjamn/jsnext-skeleton
