(function(undefined){
    var app = angular.module('ngElm');
    
    app.elmController('TodoController', [function() {
        return {
            elm: 'TodoController',
            ports: {
                addNew: "=> add_new",
                remove: "=>",
                toggle: "=>",
                new: ["set_new <-> output_new", ''],
                todos: "<- output_list"
            }
        };
    }]);
})();