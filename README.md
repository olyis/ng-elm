# ng-elm
Simple integration for elm in angular.js

This is a work in progress, intended to provide access to Elm from within Angular in a fluent and familiar way.

The heart of the functionality is provided in `ng-elm.js`, accessed thus:

```html
<script src=".../ng-elm.js"></script>
```

and by using `ng-elm-extend.js`, thus

```html
<script src=".../ng-elm-extend.js"></script>
```

the familiar Angular API is augmented in such ways as

```javascript
angular.module('myModule')
  .elmController('MyElmController', ['inject1', 'inject2', ..., function(inject1, inject2, ...) {...}]
```

which produces a controller accessible in the usual angular way via `ng-controller='MyElmController'`.

Elm modules are bound via their ports by specifying an options object, like that for an angular directive.

They take a shape like this, with the `ports` option designed to resemble the bindings in the `scope` option from regular angular directives:

```javascript
{
  elm: 'ModuleName',
  ports: {
    initialized: '<- $i',
    launchRockets: '=>',
    rocketPlan: ['fromElmRocketPlan <-> toElmRocketPlan', {planet:Jupiter, ...}],
    requiredItems: '<- fromElmItemsPort',
    launchRocketsWithResult: 'reportRocketLaunchResult <=> launchRockets'
  }
}
```

## Port bindings

Each field of the `ports` object is a port binding and gives rise to a field with the same name exposed on the resulting controller.

A port binding is specified by a binding type and (at present) zero to two Elm port name references, as well as, optionally, a default value.
Each port binding type requires either one or two port references. Like the angular scope options object, if these are omitted, the name of the field is used by default.

The binding types are
```javascript
'=>' - function binding
'->' - write binding
'<=' - sequence binding
'<-' - read binding
'<=>' - promise binding (two-way experimental)
'<->' - model binding (two-way)
```

**Function-bind** (`=>`)
This binding requires a single `.send`-enabled Elm port.
The resulting controller field is a void function, which, when called, passes the arguments to the specified port.

**Write-bind** (`->`)
This binding requires a single `.send`-enabled Elm port.
Whenever the resulting controller field is written to, the value is passed to the specified port.

**Sequence-bind** (`<=`)
This binding requires a single `.subscribe`-enabled Elm port.
Any value the elm code sends via the corresponding command is passed to any subscribers to the resulting controller field.
This binding type can have a default value, which is passed immediately to any subscriber.

**Read-bind** (`<-`)
This binding requires a single `.subscribe`-enabled Elm port.
Any value the Elm code sends via the corresponding command is immediately written to the resulting controller field.
This binding type can have a default value, which is assigned to the resulting field on initialization.

**Promise-bind** (`<=>`) *EXPERIMENTAL*
This binding requires one each of `.send`- and `.subscribe`-enabled Elm ports.
The resulting controller field is a Promise-valued function, which, when called, passes the arguments to the specified send port.
The promise is resolved with the next value provided by Elm from the subscribe port.
WARNING: race-conditions apply

**Model-bind** (`<->`)
This binding requires one each of `.send`- and `.subscribe`-enabled Elm ports.
Any value the Elm code sends via the corresponding subscribe port is immediately written to the resulting controller field.
Whenever the resulting controller field is written to, the value is passed to the specified send port.
This binding type can have a default value, which is assigned to the resulting field on initialization (and sent to Elm).

## 'System' ports
*EXPERIMENTAL*

There are currently two available system ports
```javascript```
'$i' - initialization
'$e' - initialization errors
```

**Initialization** (`$i`)
This 'port' represents the completion of the `ng-elm` port binding process.
It can be used with a read (`<-`) or sequence (`<=`) binding.
As a read binding, it is `false` until all port bindings have been completed successfully, whereupon it is `true`.
The 'sequence' version of this port is actually a Promise. If errors are encountered, it is rejected with an array of string error messages.

**Errors** (`$e`)
This 'port' represents the error status of the `ng-elm` port binding process.
It can be used with a read (`<-`) or sequence (`<=`) binding.
As a read binding, it is empty `[]` until the port-binding intialization rejects, whereupon it is an array of string error messages.
The 'sequence' version of this port is actually a Promise. If no errors are encountered, it is resolved with an empty array.
