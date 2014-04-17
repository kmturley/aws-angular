/*
 * myApp
 * Example using guide from: http://www.ng-newsletter.com/posts/aws-js-sdk.html
 */

/*globals angular, window, document, gapi*/

angular.module('myApp', ['ngRoute', 'myApp.controllers', 'myApp.services', 'myApp.directives'])
    .config(function (AWSServiceProvider) {
        'use strict';
        // set your ARN here and the app client ID in main.html
        AWSServiceProvider.setArn('arn:aws:iam::XXXXXXXXXXXXX:role/google-web-role');
    })
    .config(function ($routeProvider) {
        'use strict';
        $routeProvider.when('/', {
            controller: 'MainCtrl',
            templateUrl: 'html/main.html'
        }).otherwise({
            redirectTo: '/'
        });
    });

window.onLoadCallback = function () {
    'use strict';
    angular.element(document).ready(function () {
        gapi.client.load('oauth2', 'v2', function () {
            angular.bootstrap(document, ['myApp']);
        });
    });
};