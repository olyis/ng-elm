(function(undefined){
    var app = angular.module('ngElm');
    
    app.elmController('ElmListController', [function(){
        return {
            elm: 'StringListController',
            ports: {
                add: "=> add_item",
                remove: "=> remove_item",
                current: ["-> set_current", ''],
                items: "<- output_list"
            }
        };
    }]);
})();