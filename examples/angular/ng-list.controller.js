(function(undefined){
    var app = angular.module('ngElm');

    app.controller('NgListController', [function(){
        var ctrl = this;
        ctrl.items = [];
        ctrl.current = '';
        ctrl.add = function() {
            ctrl.items.push(ctrl.current);
        }
        ctrl.remove = function(index) {
            ctrl.items.splice(index, 1);
        }
    }]);
})();