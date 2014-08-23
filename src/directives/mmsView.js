'use strict';

angular.module('mms.directives')
.directive('mmsView', ['ViewService', '$templateCache', 'growl', mmsView]);

/**
 * @ngdoc directive
 * @name mms.directives.directive:mmsView
 *
 * @requires mms.ViewService
 * @requires $templateCache
 *
 * @restrict E
 *
 * @description
 * Given a view id, renders the view according to the json given by mms.ViewService
 * The view have a text edit mode, where transclusions can be clicked. The view's last 
 * modified time and author is the latest of any transcluded element modified time. 
 * For available api methods, see methods section.
 *
 * ## Example
 * ### controller (js)
 *  <pre>
    angular.module('app', ['mms.directives'])
    .controller('ViewCtrl', ['$scope', function($scope) {
        $scope.api = {}; //empty object to be populated by the view directive
        $scope.handler = function(elementId) {
            //element with elementId clicked in view
        };
        $scope.showComments = function() {
            $scope.api.setShowComments(true);
        };
    }]);
    </pre>
 * ### template (html)
 *  <pre>
    <div ng-controller="ViewCtrl">
        <button ng-click="showComments()">Show Comments</button>
        <mms-view mms-vid="view_element_id" mms-cf-clicked="handler(elementId)" mms-view-api="api"></mms-view>
    </div>
    </pre>
 * ## Example view at a certain time
 *  <pre>
    <mms-view mms-vid="view_element_id" mms-version="2014-07-01T08:57:36.915-0700"></mms-view>
    </pre>
 *
 * @param {string} mmsVid The id of the view
 * @param {string=master} mmsWs Workspace to use, defaults to master
 * @param {string=latest} mmsVersion Version can be alfresco version number or timestamp, default is latest
 * @param {expression=} mmsCfClicked The expression to handle transcluded elements 
 *     in the view being clicked, this should be a function whose argument is 'elementId'
 */
function mmsView(ViewService, $templateCache, growl) {
    var template = $templateCache.get('mms/templates/mmsView.html');

    var mmsViewCtrl = function($scope) {
        this.getViewElements = function() {
            return ViewService.getViewElements($scope.mmsVid, false, $scope.mmsWs, $scope.mmsVersion);
        };
        this.transcludeClicked = function(elementId) {
            if ($scope.mmsCfClicked)
                $scope.mmsCfClicked({elementId: elementId});
        };
        this.elementTranscluded = function(elem) {
            if (elem.lastModified > $scope.lastModified) { 
                $scope.lastModified = elem.lastModified;
                $scope.author = elem.author;
            }
        };
        this.getWsAndVersion = function() {
            return {
                workspace: $scope.mmsWs, 
                version: $scope.mmsVersion
            };
        };
    };

    var mmsViewLink = function(scope, element, attrs) {
        var changeView = function(newVal, oldVal) {
            if (!newVal)
                return;
            ViewService.getView(scope.mmsVid, false, scope.mmsWs, scope.mmsVersion)
            .then(function(data) {
                scope.view = data;
                scope.lastModified = data.lastModified;
                scope.author = data.author;
            }, function(reason) {
                growl.error('Getting View Error: ' + reason.message);
            });
        };
        scope.$watch('mmsVid', changeView);
        scope.showElements = false;
        scope.showComments = false;
        /**
         * @ngdoc function
         * @name mms.directives.directive:mmsView#toggleShowElements
         * @methodOf mms.directives.directive:mmsView
         * 
         * @description 
         * toggle elements highlighting 
         */
        scope.toggleShowElements = function() {
            scope.showElements = !scope.showElements;
            element.toggleClass('editing');
        };
        /**
         * @ngdoc function
         * @name mms.directives.directive:mmsView#toggleShowComments
         * @methodOf mms.directives.directive:mmsView
         * 
         * @description 
         * toggle comments visibility
         */
        scope.toggleShowComments = function() {
            scope.showComments = !scope.showComments;
            element.toggleClass('reviewing');
        };

        if (angular.isObject(scope.mmsViewApi)) {
            var api = scope.mmsViewApi;
            api.toggleShowElements = scope.toggleShowElements;
            /**
             * @ngdoc function
             * @name mms.directives.directive:mmsView#setShowElements
             * @methodOf mms.directives.directive:mmsView
             * 
             * @description 
             * self explanatory
             *
             * @param {boolean} mode arg
             */
            api.setShowElements = function(mode) {
                scope.showElements = mode;
                if (mode)
                    element.addClass('editing');
                else
                    element.removeClass('editing');
            };
            api.toggleShowComments = scope.toggleShowComments;
            /**
             * @ngdoc function
             * @name mms.directives.directive:mmsView#setShowComments
             * @methodOf mms.directives.directive:mmsView
             * 
             * @description 
             * self explanatory
             *
             * @param {boolean} mode arg
             */
            api.setShowComments = function(mode) {
                scope.showComments = mode; 
                if (mode)
                    element.addClass('reviewing');
                else
                    element.removeClass('reviewing');
            };
            api.changeView = function(vid) {
                scope.changeView(vid);
            };
        }
    };

    return {
        restrict: 'E',
        template: template,
        scope: {
            mmsVid: '@',
            mmsWs: '@',
            mmsVersion: '@',
            mmsCfClicked: '&',
            mmsViewApi: '='
        },
        controller: ['$scope', mmsViewCtrl],
        link: mmsViewLink
    };
}