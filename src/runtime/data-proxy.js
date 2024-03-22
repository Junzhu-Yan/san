/**
 * Copyright (c) Baidu Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license.
 * See LICENSE file in the project root for license information.
 *
 * @file 数据类
 */

var ExprType = require('../parser/expr-type');
var evalExpr = require('./eval-expr');
var DataChangeType = require('./data-change-type');
var parseExpr = require('../parser/parse-expr');


function dataProxy(data) {
    var proxies = {items: {}};
    return getPropProxy(data);

    function getPropProxy(data, basePaths, prop) {
        var proxyWrap = proxies;
        if (basePaths) {
            for (var i = 0; i < basePaths.length; i++) {
                proxyWrap = proxyWrap.items[basePaths[i].value];
            }
        }

        if (prop) {
            if (!proxyWrap.items[prop]) {
                proxyWrap.items[prop] = {items: {}};
            }

            proxyWrap = proxyWrap.items[prop];
        }

        if (proxyWrap.proxy == null) {
            var paths = basePaths 
                ? basePaths.concat({
                    type: ExprType.STRING,
                    value: prop
                })
                : [];
    
            var obj = basePaths
                ? data.get({
                    type: ExprType.ACCESSOR,
                    paths: paths
                })
                : data.raw;

            proxyWrap.proxy = typeof obj === 'object'
                ? new Proxy(obj, {
                    get: function (obj, prop) {
                        var proxy = getPropProxy(data, paths, prop);
                        return proxy;
                    },
    
                    set: function (obj, prop, value) {
                        proxies.proxy && (proxies = {items: {}});
                        data.set(
                            {
                                type: ExprType.ACCESSOR,
                                paths: paths.concat({
                                    type: ExprType.STRING,
                                    value: prop
                                })
                            },
                            value
                        );
                    }
                })
                : obj;
        }

        return proxyWrap.proxy;
    }
}

exports = module.exports = dataProxy;