(function(undefined){
    var app = angular.module('ngElm');
    
    app.elmController('TodoController', [function() {
        return {
            elm: 'TodoController',
            ports: {
                addNew: "=> add_new",
                remove: "=> remove_todo",
                toggle: "=> toggle_todo",
                new: ["set_new <-> output_new", ''],
                todos: "<- output_list",
                initialized: "<- $i"
            }
        };
    }]);
})();