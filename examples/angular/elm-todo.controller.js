(function(undefined){
    var app = angular.module('ngElm');
    
    app.elmController('TodoController', [function() {
        return {
            elm: 'TodoController',
            ports: {
                addNew: "=> add_new",
                remove: "=> remove_todo",
                toggle: "=> toggle_todo",
                new: ["output_new <-> set_new", ''],
                todos: "<- output_list",
                initialized: "<- $i"
            }
        };
    }]);
})();