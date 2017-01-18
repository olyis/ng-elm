(function(){
    const oldModule = angular.module;
    const $injector = angular.injector(['ng', 'ngElm'], true);
    const ElmService = $injector.get('ElmService');
    angular.module = (...args) => {
        var app = oldModule(...args);
        app.elmController = function(ctrlName, ctrlDef) {
            var translatedCtrlDef = ElmService.translateController(ctrlDef);
            app.controller(ctrlName, translatedCtrlDef);
        }
        return app;
    }
})();