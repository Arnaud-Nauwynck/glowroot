/*
 * Copyright 2012-2013 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* global informant, angular */

informant.controller('ConfigFineProfilingCtrl', [
  '$scope',
  '$http',
  'confirmIfHasChanges',
  'httpErrors',
  function ($scope, $http, confirmIfHasChanges, httpErrors) {
    var originalConfig;

    $scope.hasChanges = function () {
      return originalConfig && !angular.equals($scope.config, originalConfig);
    };
    $scope.$on('$locationChangeStart', confirmIfHasChanges($scope));

    $scope.save = function (deferred) {
      $http.post('backend/config/fine-profiling', $scope.config)
          .success(function (data) {
            $scope.config.version = data;
            originalConfig = angular.copy($scope.config);
            deferred.resolve('Saved');
          })
          .error(function (data, status) {
            if (status === 412) {
              // HTTP Precondition Failed
              deferred.reject('Someone else has updated this configuration, please reload and try again');
            } else {
              $scope.httpError = httpErrors.get(data, status);
              deferred.reject($scope.httpError.headline);
            }
          });
    };

    $http.get('backend/config/fine-profiling-section')
        .success(function (data) {
          $scope.loaded = true;
          $scope.config = data.config;
          originalConfig = angular.copy($scope.config);

          $scope.generalStoreThresholdMillis = data.generalStoreThresholdMillis;
          // set up calculated properties
          $scope.data = {};
          if ($scope.config.storeThresholdMillis !== -1) {
            $scope.data.fineStoreThresholdOverride = true;
            $scope.data.fineStoreThresholdMillis = $scope.config.storeThresholdMillis;
          } else {
            $scope.data.fineStoreThresholdOverride = false;
            $scope.data.fineStoreThresholdMillis = '';
          }
          $scope.$watch('[data.fineStoreThresholdOverride, data.fineStoreThresholdMillis]',
              function (newValue) {
                if (newValue[0]) {
                  if ($scope.data.fineStoreThresholdMillis === '') {
                    $scope.data.fineStoreThresholdMillis = $scope.generalStoreThresholdMillis;
                  }
                  $scope.config.storeThresholdMillis = $scope.data.fineStoreThresholdMillis;
                } else {
                  $scope.data.fineStoreThresholdMillis = '';
                  $scope.config.storeThresholdMillis = -1;
                }
              }, true);
        })
        .error(function (data, status) {
          $scope.httpError = httpErrors.get(data, status);
        });
  }
]);
