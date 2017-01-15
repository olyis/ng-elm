(function(document, console, undefined){
    Object.map = f => o => Object.keys(o).reduce((p, k) => {p[k] = f(o[k]); return p}, {});
    var app = angular.module('ngElm', []);

    app.service('ElmService', ['$q', function($q) {

        return {
            getSrc: getSrc,
            activateElm: activateElm,
            embedElm: embedElm,
            activateSrc: activateSrc,
            interpretPorts: interpretPorts,
            translateController: translateController
        };

        // ((() -> a), a -> b, String) ~> b
        // ((() -> a), String) ~> a
        function qHelper(thunk, transform, errorMessage) {
            if (errorMessage == undefined) {
                if (transform != undefined) errorMessage = transform;
                transform = x => x;
            }
            return $q((resolve, reject) => {
                var obj = thunk();
                if (obj) resolve(transform(obj));
                else reject(errorMessage);
            })
        }

        // String ~> Elm
        function getSrc(moduleName) {
            return qHelper(
                () => Elm,
                'Elm is not set up'
            ).then(Elm => qHelper(
                () => Elm[moduleName],
                'Can not find module \'' + moduleName + '\''));
        }

        // Elm ~> ActiveElm!
        function activateElm(elm) {
            return qHelper(
                () => elm.embed,
                f => f(document.createElement("DIV")),
                'Can not instantiate module'
            );
        }

        // (Elm, Element) ~> ActiveElm!
        function embedElm(elm, elem) {
            return qHelper(
                () => elm.embed,
                f => f(elem),
                'Can not instantiate module'
            );
        }

        // String ~> ActiveElm!
        function activateSrc(src) {
            return getSrc(src).then(activateElm);
        }

        // Object String ~> Object {mode: String, sendPort: String?, subscribePort: String?}
        function interpretPorts(portsDescription) {
            return $q.all(Object.map(parsePortInterpretation)(portsDescription))
        }

        function parsePortInterpretation(values) {
            if (angular.isArray(values)) {
                var [value, initial] = values;
                return parsePortInterpretationImpl(value, initial);
            } else if (angular.isString(values)) {
                return parsePortInterpretationImpl(values);
            } else return $q.reject();
        }

        // (String, Any?) ~> {mode: String, sendPort: String?, subscribePort: String?, initial: Any?}
        function parsePortInterpretationImpl(value, initial) {
            const fPattern = /^=>\s*([\w_]+)$/;
            const wPattern = /^->\s*([\w_]+)$/;
            const sPattern = /^<=\s*([\w_]+)$/;
            const rPattern = /^<-\s*([\w_]+)$/;
            const pPattern = /^([\w_]+)\s*<=>\s*([\w_]+)$/;
            const mPattern = /^([\w_]+)\s*<->\s*([\w_]+)$/;
            return $q(resolve => 
                resolve((() => {
                    var match;
                    if (match = fPattern.exec(value)) {
                        return {mode: "=>", sendPort: match[1]}
                    } else if (match = wPattern.exec(value)) {
                        return {mode: "->", sendPort: match[1], initial}
                    } else if (match = sPattern.exec(value)) {
                        return {mode: "<=", subscribePort: match[1]}
                    } else if (match = rPattern.exec(value)) {
                        return {mode: "<-", subscribePort: match[1], initial}
                    } else if (match = pPattern.exec(value)) {
                        return {mode: "<=>", sendPort: match[1], subscribePort: match[2]}
                    } else if (match = mPattern.exec(value)) {
                        return {mode: "<->", sendPort: match[1], subscribePort: match[2], initial}
                    } else {
                        return {mode: "none"}
                    }
                })())
            );
        }

        // Observable a -> Promise a
        function next(s) {return $q(subscribeOne(s))}

        // Observable a -> Action a -> Subscription
        function subscribeOne(s) {
            return onNext => {
                var sub = s.subscribe(val => {sub.unsubscribe(); onNext(val);});
                return sub;
            }
        }

        // [...args : String, (...args) -> ElmControllerDef] -> AngularControllerDef
        // ((...args) -> ElmControllerDef) -> AngularControllerDef
        function translateController(arrOrFunc) {
            if (angular.isFunction(arrOrFunc))
                return translateControllerImpl([arrOrFunc]);
            else if (angular.isArray(arrOrFunc)) {
                var ctor = arrOrFunc[arrOrFunc.length - 1];
                if (angular.isFunction(ctor)) // is function
                    return translateControllerImpl(arrOrFunc);
                else
                    return; // throw
            }
        }

        // [...args : String, ctor : (...args) -> ElmControllerDef] -> AngularControllerDef
        function translateControllerImpl(arr) {
            return ['$scope', '$injector', '$q', function($scope, $injector, $q) {
                const ctrl = this;
                const { ports, elm } = $injector.invoke(arr);
                var init = // Promise Bool [String]
                    interpretPorts(ports).then(interpretedPorts =>
                    activateSrc(elm).then(a => a.ports).then(activePorts => {
                    var errors = []; //TODO only enable ports if no errors
                    angular.forEach(interpretedPorts, ({ mode, sendPort, subscribePort, initial }, key) => {
                        sendPort = sendPort || key;
                        subscribePort = subscribePort || key;
                        sendAction = activePorts[sendPort] && activePorts[sendPort].send;
                        observable = activePorts[subscribePort];
                        const _key = _ => ctrl[key];
                        const apply = val => {
                            ctrl[key] = val;
                            $scope.$apply();
                        };
                        switch(mode) {
                            case '=>':
                                ctrl[key] = sendAction;
                                break;
                            case '->':
                                ctrl[key] = initial;
                                $scope.$watch(_key, sendAction);
                                break;
                            case '<=':
                                ctrl[key] = observable;
                                break;
                            case '<-':
                                ctrl[key] = initial;
                                observable.subscribe(apply);
                                break;
                            case '<=>':
                                ctrl[key] = (...vals) =>
                                    $q(resolve => resolve(sendAction(...vals)))
                                        .then(_ => next(observable));
                                break;
                            case '<->':
                                ctrl[key] = initial;
                                observable.subscribe(apply);
                                $scope.$watch(_key, sendAction);
                                break;
                            case '<=i':
                                ctrl[key] = init;
                                break;
                            case '<-i':
                                ctrl[key] = false;
                                init.then(apply);
                                break;
                            case '<=e':
                                ctrl[key] = [];
                                ctrl[key] = init.then(_ => []).catch($q.resolve);
                                break;
                            case '<-e':
                                init.catch(apply);
                                break;
                            default:
                                errors.push("unexpected mode: '" + mode + "' for key: '" + key + "'");
                                break;
                        }
                    });
                    if (errors.length) return $q.reject(errors);
                    return $q.resolve(true);}));
            }];
        }

    }]);
})(document, console);