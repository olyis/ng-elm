(function(console, undefined){
    const oldModule = angular.module;
    const $injector = angular.injector(['ng', 'ngElm'], true);
    const ElmService = $injector.get('ElmService');
    angular.module = (...args) => {
        var app = oldModule(...args);
        app.elmController = function(ctrlName, ctrlDef) {
            var translatedCtrlDef = ElmService.translateController(ctrlDef);
            console.log('registering Elm Controller: ' + ctrlName);
            app.controller(ctrlName, translatedCtrlDef);
        }
        console.log('returning module: ' + args);
        return app;
    }
})(console);