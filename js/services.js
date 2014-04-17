/*
 * myApp
 */

/*globals angular, gapi, AWS*/

angular.module('myApp.services', [])
    .factory('UserService', function ($q, $http, AWSService) {
        'use strict';
        var service = {
            _user: null,
            UsersTable: "Users",
            UserItemsTable: "UsersItems",
            ChargeTable: "UserCharges",
            Bucket: 'ng-app-test',
            setCurrentUser: function (u) {
                if (u && !u.error) {
                    AWSService.setToken(u.id_token);
                    return service.currentUser();
                } else {
                    var d = $q.defer();
                    d.reject(u.error);
                    return d.promise;
                }
            },
            currentUser: function () {
                var d = $q.defer();
                if (service._user) {
                    d.resolve(service._user);
                } else {
                    AWSService.credentials().then(function () {
                        gapi.client.oauth2.userinfo.get().execute(function (e) {
                            var email = e.email;
                            AWSService.dynamo({
                                params: {TableName: service.UsersTable}
                            }).then(function (table) {
                                table.getItem({
                                    Key: {
                                        'User email': {
                                            S: email
                                        }
                                    }
                                }, function (err, data) {
                                      if (Object.keys(data).length === 0) {
                                          // User didn't previously exist
                                          var itemParams = {
                                              Item: {
                                                  'User email': {S: email},
                                                  data: {
                                                      S: JSON.stringify(e)
                                                  }
                                              }
                                          };
                                          table.putItem(itemParams, function (err, data) {
                                              service._user = e;
                                              d.resolve(e);
                                          });
                                      } else {
                                          service._user = JSON.parse(
                                              data.Item.data.S
                                          );
                                          d.resolve(service._user);
                                      }
                              });
                            });
                        });
                    });
                }
                return d.promise;
            },
            itemsForSale: function () {
                var d = $q.defer();
                service.currentUser().then(function (user) {
                    AWSService.dynamo({
                        params: {TableName: service.UserItemsTable}
                    }).then(function (table) {
                        table.query({
                            TableName: service.UserItemsTable,
                            KeyConditions: {
                                "User email": {
                                    "ComparisonOperator": "EQ",
                                    "AttributeValueList": [
                                        {S: user.email}
                                    ]
                                }
                            }
                        }, function (err, data) {
                            var items = [];
                            if (data) {
                                angular.forEach(data.Items, function (item) {
                                    items.push(JSON.parse(item.data.S));
                                });
                                d.resolve(items);
                            } else {
                                d.reject(err);
                            }
                        });
                    });
                });
                return d.promise;
            },
            uploadItemForSale: function (items) {
                var d = $q.defer();
                service.currentUser().then(function (user) {
                    AWSService.s3({
                        params: {
                            Bucket: service.Bucket
                        }
                    }).then(function (s3) {
                        var file = items[0]; // only one at a time
                        var params = {
                            Key: file.name,
                            Body: file,
                            ContentType: file.type
                        };

                        s3.putObject(params, function (err, data) {
                            // Also, let's get a url
                            var params = {
                                Bucket: service.Bucket,
                                Key: file.name,
                                Expires: 900 * 4 // 1 hour
                            };
                            s3.getSignedUrl('getObject', params, function (err, url) {
                                AWSService.dynamo({
                                    params: {TableName: service.UserItemsTable}
                                }).then(function (table) {
                                    var itemParams = {
                                        Item: {
                                            'ItemId': {S: file.name},
                                            'User email': {S: user.email},
                                            data: {
                                                S: JSON.stringify({
                                                    itemId: file.name,
                                                    itemSize: file.size,
                                                    itemUrl: url
                                                })
                                            }
                                        }
                                    };
                                    table.putItem(itemParams, function (err, data) {
                                        d.resolve(data);
                                    });
                                });
                            });
                        });
                    });
                });
                return d.promise;
            }
        };
        return service;
    })
    .provider('AWSService', function () {
        'use strict';
        var self = this;
        AWS.config.region = 'us-east-1';
        self.arn = null;
        self.setArn = function (arn) {
            if (arn) self.arn = arn;
        };
        self.setRegion = function (region) {
            if (region) AWS.config.region = region;
        };
        self.setLogger = function (logger) {
            if (logger) AWS.config.logger = logger;
        };
        self.$get = function ($q, $cacheFactory) {
            var s3Cache = $cacheFactory('s3Cache'),
                dynamoCache = $cacheFactory('dynamo'),
                snsCache = $cacheFactory('sns'),
                sqsCache = $cacheFactory('sqs'),
                credentialsDefer = $q.defer(),
                credentialsPromise = credentialsDefer.promise;
            return {
                credentials: function () {
                    return credentialsPromise;
                },
                setToken: function (token, providerId) {
                    var config = {
                        RoleArn: self.arn,
                        WebIdentityToken: token,
                        RoleSessionName: 'web-id'
                    }
                    if (providerId) {
                        config['ProviderId'] = providerId;
                    }
                    self.config = config;
                    AWS.config.credentials = new AWS.WebIdentityCredentials(config);
                    credentialsDefer.resolve(AWS.config.credentials);
                },
                s3: function (params) {
                    var d = $q.defer();
                    credentialsPromise.then(function () {
                        var s3Obj = s3Cache.get(JSON.stringify(params));
                        if (!s3Obj) {
                            var s3Obj = new AWS.S3(params);
                            s3Cache.put(JSON.stringify(params), s3Obj);
                        }
                        d.resolve(s3Obj);
                    });
                    return d.promise;
                },
                dynamo: function (params) {
                    var d = $q.defer();
                    credentialsPromise.then(function () {
                        var table = dynamoCache.get(JSON.stringify(params));
                        if (!table) {
                            var table = new AWS.DynamoDB(params);
                            dynamoCache.put(JSON.stringify(params), table);
                        }
                        d.resolve(table);
                    });
                    return d.promise;
                },
                sns: function (params) {
                    var d = $q.defer();
                    credentialsPromise.then(function () {
                        var sns = snsCache.get(JSON.stringify(params));
                        if (!sns) {
                            sns = new AWS.SNS(params);
                            snsCache.put(JSON.stringify(params), sns);
                        }
                        d.resolve(sns);
                    });
                    return d.promise;
                },
                sqs: function (params) {
                    var d = $q.defer();
                    credentialsPromise.then(function () {
                        var url = sqsCache.get(JSON.stringify(params)),
                            queued = $q.defer();
                        if (!url) {
                            var sqs = new AWS.SQS();
                            sqs.createQueue(params, function (err, data) {
                                if (data) {
                                    url = data.QueueUrl;
                                    sqsCache.put(JSON.stringify(params), url);
                                    queued.resolve(url);
                                } else {
                                    queued.reject(err);
                                }
                            });
                        } else {
                            queued.resolve(url);
                        }
                        queued.promise.then(function (url) {
                            var queue = new AWS.SQS({params: {QueueUrl: url}});
                            d.resolve(queue);
                        });
                    });
                    return d.promise;
                }
            };
        };
    });