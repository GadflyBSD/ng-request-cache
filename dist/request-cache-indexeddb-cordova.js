/**
 * @license request-cache-indexeddb-cordova v1.0.0
 * (c) 2010-2017 Google, Inc. http://angularjs.org
 * License: GadflyBSD
 */
angular.module('request-cache-indexeddb', [])
	.factory('unitFactory', function(){
		var defaults = {
			allowOutsideClick: false,		// 如果设置为“true”，用户可以通过点击警告框以外的区域关闭警告框。
			confirmButtonColor: "#DD6B55",	// 该参数用来改变确认按钮的背景颜色（必须是一个HEX值）。
			confirmButtonText: "确定",		// 该参数用来改变确认按钮上的文字。如果设置为"true"，那么确认按钮将自动将"Confirm"替换为"OK"。
			type: 'info',					// 窗口的类型。有4种类型的图标动画："warning", "error", "success" 和 "info".可以将它放在"type"数组或通过第三个参数传递。
			title: null,					// 窗口的名称。可以通过对象的"title"属性或第一个参数进行传递。
			text: null,						// 窗口的描述。可以通过对象的"text"属性或第二个参数进行传递。
			showCancelButton: false,		// 如果设置为“true”，“cancel”按钮将显示，点击可以关闭警告框。
			showConfirmButton: true,		// 如果设置为“false”，“Confirm”按钮将不显示。
			cancelButtonText: '取消',		// 该参数用来改变取消按钮的文字。
			closeOnConfirm: true,			// 如果希望以后点击了确认按钮后模态窗口仍然保留就设置为"false"。该参数在其他SweetAlert触发确认按钮事件时十分有用。
			timer: null						// 警告框自动关闭的时间。单位是ms。
		}
		function getTitle(type, title){
			if(angular.isUndefined(title) || title === null){
				switch(type.toLowerCase()){
					case 'success':
						return '操作成功！';
					case 'error':
						return '操作失败！';
					case 'warning':
						return '操作警告！';
					case 'info':
						return '温馨提示！';
				}
			}else{
				return title;
			}
		}
		return {
			isEmptyObject: function(e){
				if(angular.isUndefined(e) || e === null){
					return true;
				}else{
					var t;
					for (t in e)
						return !true;
					return !false;
				}
			},
			in_array: function(search, array) {
				for(var i=0,k=array.length;i<k;i++){
					if(search == array[i]){
						return true;
					}
				}
				return false;
			},
			alert: function(param, callback){
				var config = {}
				config.type = (this.isEmptyObject(param.type))?'success':param.type.toLowerCase();
				config.title = getTitle(config.type, param.title);
				swal(angular.extend(defaults, param, config), function(){
					if(typeof(callback) == 'function') callback();
				});
			},
			close: function(){
				swal.close();
			},
			enableButtons: function(){
				swal.enableButtons();
			},
			disableButtons: function(){
				swal.disableButtons();
			}
		}
	})
	.factory('requestCacheFactory', function($q, $window, $cacheFactory, $indexedDB, $cordovaToast, $http, $ocLazyLoad, configs, unitFactory){
		return {
			/**
			 * 服务器返回的数据使用本地 IndexedDB 进行缓存
			 * @param data
			 * @param now
			 */
			indexeddbStorage: function(data, now){
				for (var p in data) {
					if(angular.isString(data[p]) && data[p].toLowerCase() == 'empty'){
						$window.sessionStorage.removeItem(p + '_request_dateline');
						$window.localStorage.removeItem(p + '_verify');
						this.indexeddb.clean(p);
						this.cache.remove(p);
					}else{
						this.indexeddb.write(p, data[p].data);
						this.cache.put(p, data[p].data);
						var verify = {key: p, name: data[p].name, md5: data[p].md5, sha1: data[p].sha1};
						$window.localStorage.setItem(p + '_verify', angular.toJson(verify));
						$window.sessionStorage.setItem(p + '_request_dateline', now);
					}
				}
			},
			/**
			 * 服务器返回的数据使用本地 localStorage 进行缓存
			 * @param data
			 */
			localStorage: function(data, now){
				for(var p in data) {
					if(angular.isString(data[p]) && data[p].toLowerCase() == 'empty'){
						$window.sessionStorage.removeItem(p + '_request_dateline');
						$window.localStorage.removeItem(p + '_verify');
						$window.localStorage.removeItem(p);
						this.cache.remove(p);
					}else{
						if(angular.isObject(data[p].data) || angular.isArray(data[p].data))
							var local = angular.toJson(data[p].data);
						else
							var local = data[p].data;
						var verify = {key: p, name: data[p].name, md5: data[p].md5, sha1: data[p].sha1};
						$window.localStorage.setItem(p + '_verify', angular.toJson(verify));
						$window.localStorage.setItem(p, local);
						this.cache.put(p, data[p].data);
						$window.sessionStorage.setItem(p + '_request_dateline', now);
					}
				}
			},
			/**
			 * 服务器返回的数据使用本地 sessionStorage 进行缓存
			 * @param data
			 * @param now
			 */
			sessionStorage: function(data, now){
				for(var p in data) {
					if(angular.isString(data[p]) && data[p].toLowerCase() == 'empty'){
						$window.sessionStorage.removeItem(p + '_request_dateline');
						$window.sessionStorage.removeItem(p + '_verify');
						$window.sessionStorage.removeItem(p);
						this.cache.remove(p);
					}else{
						if(angular.isObject(data[p].data) || angular.isArray(data[p].data))
							var session = angular.toJson(data[p].data);
						else
							var session = data[p].data;
						var verify = {key: p, name: data[p].name, md5: data[p].md5, sha1: data[p].sha1};
						$window.sessionStorage.setItem(p, session);
						$window.sessionStorage.setItem(p + '_verify', angular.toJson(verify));
						this.cache.put(p, data[p].data);
						$window.sessionStorage.setItem(p + '_request_dateline', now);
					}
				}
			},
			/**
			 * 服务器返回的数据使用本地 $cacheFactory 进行缓存
			 * @param data
			 * @param now
			 */
			cacheStorage: function(data, now){
				for (var p in data) {
					if (angular.isString(data[p]) && data[p].toLowerCase() == 'empty') {
						$window.sessionStorage.removeItem(p + '_request_dateline');
						$window.sessionStorage.removeItem(p + '_verify');
						this.cache.remove(p);
					} else {
						var verify = {key: p, name: data[p].name, md5: data[p].md5, sha1: data[p].sha1};
						$window.sessionStorage.setItem(p + '_verify', angular.toJson(verify));
						$window.sessionStorage.setItem(p + '_request_dateline', now);
						this.cache.put(p, data[p].data);
					}
				}
			},
			/**
			 * AngularJS $cacheFactory 操作方法集
			 */
			cache: {
				get: function(store) {
					var angularCache = $cacheFactory.get('angularCache') || $cacheFactory('angularCache');
					var angularCacheData = angularCache.get(store);
					if(angular.isUndefined(angularCacheData)){
						return {type: 'error', msg: store + '缓存不存在!'};
					}else{
						return {type: 'success', data: angularCacheData};
					}
				},
				put: function(store, data) {
					var angularCache = $cacheFactory.get('angularCache') || $cacheFactory('angularCache');
					angularCache.put(store, data);
				},
				remove: function(store){
					var angularCache = $cacheFactory.get('angularCache') || $cacheFactory('angularCache');
					angularCache.remove(store);
				},
				removeAll: function () {
					var angularCache = $cacheFactory.get('angularCache') || $cacheFactory('angularCache');
					angularCache.removeAll();
				},
			},
			/**
			 * IndexedDB 本地WEB数据库操作方法集
			 */
			indexeddb: {
				read: function(store) {
					var defer = $q.defer();
					$indexedDB.objectStore(store).getAll().then(function(results){
						defer.resolve(results);
					});
					return defer.promise;
				},
				write: function(store, data) {
					var defer = $q.defer();
					$indexedDB.objectStore(store).upsert(data).then(function(){
						defer.resolve(data);
					});
					return defer.promise;
				},
				clean: function(store){
				
				}
			},
			/**
			 * # 常规数据请求, 根据服务器返回值缓存数据或直接返回数据
			 * @param param		Object  请求参数, 服务器端具体方法所接收的请求参数
			 * @param router	Object  请求的服务器端路由参数,
			 对象成员action代表服务器控制器名,
			 对象成员model代表服务器模型名,
			 对象成员module代表服务器方法名,
			 对象成员key代表请求结果通过$cacheFactory进行缓存的KEY值(不设定则不做缓存),
			 默认"{action: 'Restful', module: 'getServiceData'}",
			 请求的服务器端路由参数如指定, action或model必须指定一个,
			 如果两个都指定, 服务器端调用model模型中的module方法返回数据.
			 * @param method	String  请求方法: get(默认), post, put, delete
			 */
			request: function(param, router, method) {
				var defer = $q.defer();
				var _self = this;
				var config = {
					url: configs.restful_url + '/Restful/angular.html',
					cache: false,
					timeout: 1000 * configs.http_timeout,
				}
				method = (method && unitFactory.in_array(method, ['get', 'put', 'post', 'delete']))?method:'get';
				if(unitFactory.isEmptyObject(router)){
					var params = {action: 'Restful', module: 'getServiceData'};
				}else if(angular.isUndefined(router.action) && angular.isUndefined(router.model) && !angular.isUndefined(router.module)){
					var params = {action: 'Restful', module: router.module};
				}else if(!angular.isUndefined(router.action) && angular.isUndefined(router.module)){
					var params = {action: router.action, module: 'getServiceData'};
				}else if(!angular.isUndefined(router.model) && angular.isUndefined(router.module)){
					var params = {model: router.model, module: 'getServiceData'};
				}else{
					var params = router;
				}
				params.data = (unitFactory.isEmptyObject(param.data))?{}:param.data;
				if($window.localStorage.getItem('user') && angular.isUndefined(param.uid)){
					var user = angular.fromJson($window.localStorage.getItem('user'));
					params.data.uid = user.uid;
				}
				if($window.localStorage.getItem('device') && angular.isUndefined(param.uuid)){
					var device = angular.fromJson($window.localStorage.getItem('device'));
					params.data.uuid = device.uuid;
				}
				if(!unitFactory.isEmptyObject(param.check)) params.check = param.check;
				if(!unitFactory.isEmptyObject(param.merge)) params.merge = param.merge;
				switch(method.toLowerCase()){
					case 'get':
					case 'delete':
						config.method = method.toLowerCase();
						config.params = params;
						break;
					case 'post':
					case 'put':
					default:
						config.method = method.toLowerCase();
						config.data = params;
				}
				/*$ocLazyLoad.load('lib/jsencrypt/bin/jsencrypt.min.js').then(function(){
					var crypt = new JSEncrypt();
					crypt.setPublicKey($window.localStorage.getItem('public_key'));
					console.log({rsa: crypt.encrypt(angular.toJson({name: 'test'}))});
				});*/
				$http(config).success(function(result){
					if(result.type.toLowerCase() == 'success'){
						var now = parseInt(new Date().getTime());
						if(!unitFactory.isEmptyObject(result.localStorage) && angular.isObject(result.localStorage)){
							_self.localStorage(result.localStorage, now);
						}
						if(!unitFactory.isEmptyObject(result.sessionStorage) && angular.isObject(result.sessionStorage)){
							_self.sessionStorage(result.sessionStorage, now);
						}
						if(!unitFactory.isEmptyObject(result.indexeddb) && angular.isObject(result.indexeddb)){
							_self.indexeddbStorage(result.indexeddb, now);
						}
						if(!unitFactory.isEmptyObject(result.cache) && angular.isObject(result.cache)){
							_self.cacheStorage(result.cache, now);
						}
						if(!unitFactory.isEmptyObject(result.merge)){
							var result_merge = {};
							var result_merge_data = {};
							if(!unitFactory.isEmptyObject(result.merge.data))
								result_merge = result.merge.data;
							else if(!unitFactory.isEmptyObject(result.merge.list))
								result_merge = result.merge.list;
							else
								result_merge = result.merge;
							if(!unitFactory.isEmptyObject(result.merge.key) || !unitFactory.isEmptyObject(params.merge.key)) {
								var key = 'data-' + now;
								if (!unitFactory.isEmptyObject(result.merge.key)) key = result.merge.key;
								if (!unitFactory.isEmptyObject(params.merge.key)) key = params.merge.key;
								_self.cache.put(key, result_merge);
								$window.sessionStorage.setItem(key + '_request_dateline', now);
								result_merge_data[key] = result_merge;
							}else{
								result_merge_data = result_merge;
							}
							result.merge = result_merge_data;
						}
						if(method.toLowerCase() == 'post'){
							$cordovaToast.showLongCenter(result.msg).then(function () {
								defer.resolve(result);
							});
						}else{
							defer.resolve(result);
						}
					}
				}).error(function(error){
					defer.reject(error);
				});
				return defer.promise;
			},
			/**
			 * 生成数据校验参数(私有)
			 * @param item
			 */
			verify: function (item) {
				var verify = [];
				if(angular.isArray(item)){
					angular.forEach(item, function(obj){
						var verify1 = $window.localStorage.getItem(obj + '_verify')||{};
						var verify2 = $window.sessionStorage.getItem(obj + '_verify')||{};
						this.push(angular.extend({key: obj, md5: 'md5', sha1: 'sha1'}, verify1, verify2));
					}, verify);
				}else{
					var verify1 = $window.localStorage.getItem(item + '_verify')||{};
					var verify2 = $window.sessionStorage.getItem(item + '_verify')||{};
					verify.push(angular.extend({key: item, md5: 'md5', sha1: 'sha1'}, verify1, verify2));
				}
				return angular.toJson(verify);
			},
			/**
			 * 请求获取服务器已缓存的指定数据(校验缓存)
			 * @param getItem
			 * merge: {			// 合并请求数据的请求参数, 不设定则不想服务器合并请求数据, 可以是字符串/数组或对象
			 * 			action: String, // 对应服务器控制器名,非必须
			 * 			model: String, 	// 对应服务器模型名,非必须
			 * 			module: String	// 对应服务器方法名,非必须
			 * 		},
			 */
			readonly: function(getItem, merge) {
				var _self = this;
				var defer = $q.defer();
				merge = merge || {};
				var param = {check: _self.verify(getItem)};
				var getRequestDateline = function (item){
					var returns = {verify: []};
					var dateline = $window.sessionStorage.getItem(item + '_request_dateline');
					dateline = (angular.isUndefined(dateline) || dateline === null)?0:parseInt(dateline);
					returns[item] = _self.cache.get(item);
					if(parseInt(new Date().getTime()) - dateline <= 1000*configs.cache_timeout && returns[item].type == 'success')
						returns.verify.push(false);
					else
						returns.verify.push(true);
					return returns;
				}
				var getCacheData = function (getItem) {
					var data = {};
					if(angular.isArray(getItem)) {
						angular.forEach(getItem, function (obj) {
							this[obj] = _self.cache.get(obj).data;
						}, data);
					}else{
						data[getItem] = _self.cache.get(getItem).data;
					}
					return angular.extend(data, {type: 'cache'});
				}
				if(angular.isArray(getItem)){
					var cache = {verify: []};
					angular.forEach(getItem, function(obj, index){
						var line = getRequestDateline(obj);
						this[obj] = line[obj];
						this.verify.push(line.verify[index]);
					}, cache)
				}else{
					var cache = getRequestDateline(getItem);
				}
				if(!unitFactory.isEmptyObject(merge) && angular.isObject(merge)){
					param.merge = merge;
					if(!unitFactory.isEmptyObject(merge.key)){
						if(angular.isArray(merge.key)){
							angular.forEach(merge.key, function(obj, index){
								var line = getRequestDateline(obj);
								this[obj] = line[obj];
								this.verify.push(line.verify[index]);
							}, cache)
						}else{
							var temp = getRequestDateline(merge.key);
							cache[merge.key] = temp[merge.key];
							cache.verify.push(temp.verify[0]);
						}
					}
				}
				if(unitFactory.in_array(true, cache.verify)){
					_self.request(param).then(function (result) {
						if(result.type.toLowerCase() == 'success'){
							var data = {};
							angular.forEach(result.cache, function(obj, key){
								this[key] = obj.data;
							}, data);
							if(unitFactory.isEmptyObject(param.merge)){
								defer.resolve(angular.extend(data, {request: 'http', type: 'success'}));
							}else{
								defer.resolve(angular.extend(data, {request: 'http', type: 'success', merge: result.merge}));
							}
						}else{
							unitFactory.alert({
								text: result.msg,
								type: result.type.toLowerCase(),
								closeOnConfirm: true,
								confirmButtonText: '确定',
								showCancelButton: false,
							},function(){
								defer.resolve(result);
							});
						}
					}, function(error){
						unitFactory.alert({
							text: 'HTTP请求失败! ' + error,
							type: 'error',
							closeOnConfirm: true,
							confirmButtonText: '确定',
							showCancelButton: false,
						},function(){
							defer.reject(error);
						});
					})
				}else{
					var data = getCacheData(getItem);
					if(unitFactory.isEmptyObject(param.merge)){
						defer.resolve(angular.extend(data, {request: 'cache', type: 'success'}));
					}else{
						var result_merge_data = {};
						if(!unitFactory.isEmptyObject(param.merge.key)){
							result_merge_data[param.merge.key] = _self.cache.get(param.merge.key).data;
							if(unitFactory.isEmptyObject(result_merge_data[param.merge.key])){
								_self.request(param).then(function (result) {
									defer.resolve(angular.extend(data, {request: 'http_again', type: 'success', merge: result.merge}));
								});
							}else{
								defer.resolve(angular.extend(data, {request: 'cache', type: 'success', merge: result_merge_data}));
							}
						}else{
							_self.request(param).then(function (result) {
								defer.resolve(angular.extend(data, {request: 'http_again', type: 'success', merge: result.merge}));
							});
						}
					}
				}
				return defer.promise;
			},
		}
	});