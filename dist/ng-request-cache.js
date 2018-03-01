angular.module('ng-request-cache', [])
	.factory('requestCacheFactory', function($q, $http, $window, $state, $cacheFactory, $indexedDB, $filter, $ocLazyLoad, app_config, unitFactory){
		/**
		 * 构造缓存的校验数据
		 * @param item
		 * @param data
		 */
		function configuration_verify(item, data, storage, now) {
			var dateline = parseInt(new Date().getTime());
			var key = unitFactory.isEmptyObject(data.key)?item:data.key;
			var type = key.split('-');
			var pk = angular.isUndefined(type[1])?0:type[1];
			return {
				key: key,
				pk: unitFactory.isEmptyObject(data.pk)?pk:data.pk,
				type: unitFactory.isEmptyObject(data.type)?type[0]:data.type,
				storage: storage,
				md5: unitFactory.isEmptyObject(data.md5)?'md5':data.md5,
				sha1: unitFactory.isEmptyObject(data.sha1)?'md5':data.sha1,
				request: unitFactory.isEmptyObject(now)?dateline:now,
				dateline: unitFactory.isEmptyObject(data.dateline)?dateline:data.dateline
			};
		}
		var angularCache = $cacheFactory.get('angularCache') || $cacheFactory('angularCache');
		return {
			request: function(param, router, method, rsa, isSpin) {
				rsa = rsa || false;
				isSpin = angular.isUndefined(isSpin)?true:isSpin;
				var defer = $q.defer();
				var _self = this;
				var params = {};
				if(isSpin){
					if(app_config.spin.type == 'spinner') var spinner = unitFactory.spinner();
					if(app_config.spin.type == 'loading') unitFactory.loading();
				}
				method = (method && _.indexOf(['get', 'put', 'post', 'delete'], method) >= 0)?method:'get';
				if(rsa) params.rsa = true;
				if(unitFactory.isEmptyObject(router)){
					params.router = {action: 'Restful', module: 'getServiceData'};
				}else if(angular.isUndefined(router.action) && angular.isUndefined(router.model) && !angular.isUndefined(router.module)){
					params.router = {action: 'Restful', module: router.module};
				}else if(!angular.isUndefined(router.action) && angular.isUndefined(router.module)){
					params.router = {action: router.action, module: 'getServiceData'};
				}else if(!angular.isUndefined(router.model) && angular.isUndefined(router.module)){
					params.router = {model: router.model, module: 'getServiceData'};
				}else{
					params.router = router;
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
				function http_response_cache(response) {
					if(!unitFactory.isEmptyObject(response.cache)){
						_self.cacheStorage(null, 'default', response.cache);
					}
					if(!unitFactory.isEmptyObject(response.localStorage)){
						_self.localStorage(response.localStorage);
					}
					if(!unitFactory.isEmptyObject(response.sessionStorage)){
						_self.sessionStorage(response.sessionStorage);
					}
					if(!unitFactory.isEmptyObject(response.IndexedDB)){
						console.log(response.IndexedDB);
						_self.indexeddbStorage(null, 'default', response.IndexedDB);
					}
					if(!unitFactory.isEmptyObject(response.merge)){
						var now = unitFactory.timestamp();
						var result_merge = {};
						var result_merge_data = {};
						if(!unitFactory.isEmptyObject(response.merge.data))
							result_merge = response.merge.data;
						else if(!unitFactory.isEmptyObject(response.merge.list))
							result_merge = response.merge.list;
						else
							result_merge = response.merge;
						if(!unitFactory.isEmptyObject(response.merge.key) || !unitFactory.isEmptyObject(params.merge.key)) {
							var key = 'data-' + now;
							if (!unitFactory.isEmptyObject(response.merge.key)) key = response.merge.key;
							if (!unitFactory.isEmptyObject(params.merge.key)) key = params.merge.key;
							_self.cache.put(key, result_merge);
							$window.sessionStorage.setItem(key + '_request_dateline', now);
							result_merge_data[key] = result_merge;
						}else{
							result_merge_data = result_merge;
						}
						response.merge = result_merge_data;
					}
				}
				unitFactory.http(params, method).then(function(result){
					http_response_cache(result);
					if(isSpin){
						if(app_config.spin.type == 'spinner') unitFactory.spinner_stop(spinner);
						if(app_config.spin.type == 'loading') unitFactory.loading_stop();
					}
					defer.resolve(result);
				}, function(error){
					if(isSpin){
						if(app_config.spin.type == 'spinner') unitFactory.spinner_stop(spinner);
						if(app_config.spin.type == 'loading') unitFactory.loading_stop();
					}
					defer.reject(error);
				});
				return defer.promise;
			},
			readCache: function(getItem, merge, rsa, isSpin){
				var _self = this;
				var defer = $q.defer();
				merge = merge || {};
				rsa = rsa || false;
				isSpin = angular.isUndefined(isSpin)?true:isSpin;
				app_config.cache_timeout = app_config.cache_timeout || 5*60*1000;
				if(isSpin){
					if(app_config.spin.type == 'spinner') var spinner = unitFactory.spinner();
					if(app_config.spin.type == 'loading') unitFactory.loading();
				}
				var getRequestVerify = function(item){
					var key = item.split('-');
					var verify = _self.cacheStorage(key[0] + '_verify_cache', 'get');
					var returns = {verify: [], check: {}, data: {}};
					var dateline = (!unitFactory.isEmptyObject(verify) && !unitFactory.isEmptyObject(verify.data))?parseInt(verify.data.request):0;
					var storage = (!unitFactory.isEmptyObject(verify) && !unitFactory.isEmptyObject(verify.storage))?verify.storage:'cache';
					returns.check[item] = configuration_verify(item, verify||{}, storage);
					if(!unitFactory.isEmptyObject(returns.check[item])){
						returns.data[item] = _self.cacheStorage(item, 'get').data;
						if(parseInt(new Date().getTime()) - dateline <= app_config.cache_timeout && returns.check[item].type == 'success'){
							returns.verify.push(false);
						}else{
							returns.verify.push(true);
						}
					}else{
						returns.verify.push(true);
						returns.data[item] = {};
					}
					return returns;
				}
				var getCacheData = function(cache, getItem){
					var data = {};
					angular.forEach(cache, function(obj, key){
						var item = key.split('-');
						if(angular.isObject(getItem)) {
							if(angular.isString(getItem[key])){
								if(key == getItem[key]){
									this[item[0]] = obj.data;
								}else{
									this[item[0]] = $filter('filter')(obj.data, function(value){
										return value.category_name == getItem[key];
									});
								}
							}else if(angular.isObject(getItem[key])){
								for (var p in getItem[key]){
									this[item[0]] = $filter('filter')(obj.data, function(value){
										return value[p] == getItem[key][p];
									});
								}
							}else{
								this[item[0]] = obj.data;
							}
						}else{
							this[item[0]] = obj.data;
						}
					}, data);
					return data;
				}
				_self.syncEmptyCache().then(function(result){
					if(angular.isArray(getItem)) {
						var cache = {verify: [], check: {}, data: {}};							// 参数 ['document', 'category'] 形式
						angular.forEach(getItem, function (obj) {
							var verify = getRequestVerify(obj);
							this.check[obj] = verify.check[obj];
							this.check[obj].data = verify.data[obj];
							this.verify.push(verify.verify[0]);
						}, cache);
					}else if(angular.isString(getItem) && getItem.split(',').length > 1) {		// 参数 'document, category' 形式
						var cache = {verify: [], check: {}, data: {}};
						angular.forEach(getItem.split(','), function (objs) {
							var obj = objs.replace(/(^\s*)|(\s*$)/g, "");
							var verify = getRequestVerify(obj);
							this.check[obj] = verify.check[obj];
							this.check[obj].data = verify.data[obj];
							this.verify.push(verify.verify[0]);
						}, cache);
					}else if(angular.isObject(getItem)){										// 参数 {document: 'document', category: 'category'} 形式
						var cache = {verify: [], check: {}, data: {}};
						angular.forEach(getItem, function (obj, key) {
							var verify = getRequestVerify(key);
							this.check[key] = verify.check[key];
							this.check[key].data = verify.data[key];
							this.verify.push(verify.verify[0]);
						}, cache);
					}else{																		// 参数 'document'
						var cache = getRequestVerify(getItem);
						cache.check[getItem].data = cache.data[getItem];
					}
					var param = {check: {}};
					if(!unitFactory.isEmptyObject(merge) && angular.isObject(merge)){
						param.merge = merge;
					}
					if(_.indexOf(cache.verify, true) >= 0) {
						angular.forEach(cache.check, function(obj, key){
							var check = obj;
							delete check.data;
							param.check[key] = check;
						});
						_self.request(param, {}, 'get', rsa, false).then(function (result) {
							var data = getCacheData(result.cache, getItem);
							if(isSpin){
								if(app_config.spin.type == 'spinner') unitFactory.spinner_stop(spinner);
								if(app_config.spin.type == 'loading') unitFactory.loading_stop();
							}
							if(unitFactory.isEmptyObject(param.merge)){
								defer.resolve(angular.extend(data, {request: 'http', type: 'success'}));
							}else{
								defer.resolve(angular.extend(data, {request: 'http_merge', type: 'success', merge: result.merge}));
							}
						});
					}else{
						var data = getCacheData(cache.check, getItem);
						if(unitFactory.isEmptyObject(param.merge)){
							if(isSpin){
								if(app_config.spin.type == 'spinner') unitFactory.spinner_stop(spinner);
								if(app_config.spin.type == 'loading') unitFactory.loading_stop();
							}
							defer.resolve(angular.extend(data, {request: 'cache', type: 'success'}));
						}else{
							_self.request(param, {}, 'get', rsa, false).then(function (result) {
								if(isSpin){
									if(app_config.spin.type == 'spinner') unitFactory.spinner_stop(spinner);
									if(app_config.spin.type == 'loading') unitFactory.loading_stop();
								}
								defer.resolve(angular.extend(data, {request: 'http_again', type: 'success', merge: result.merge}));
							});
						}
					}
				});
				return defer.promise;
			},
			/**
			 * 服务器返回的数据使用本地 localStorage 做一级缓存, $cacheFactory 做二级缓存, 进行缓存
			 * @param data
			 */
			localStorage: function(data){
				var _self = this;
				for(var p in data) {
					if(angular.isString(data[p]) && data[p].toLowerCase() == 'empty'){
						_self.indexeddbStorage('verify_cache', 'delete', p).then(function(){
							_self.cacheStorage('verify_cache', 'remove', p + '_verify_cache');
							_self.cacheStorage(p, 'removeAll');
							$window.localStorage.removeItem(p);
						});
					}else{
						if(angular.isObject(data[p].data) || angular.isArray(data[p].data))
							var local = angular.toJson(data[p].data);
						else
							var local = data[p].data;
						var verify_cache = configuration_verify(p, data[p], 'local');
						_self.indexeddbStorage('verify_cache', 'write', verify_cache).then(function (result) {
							_self.cacheStorage('verify_cache', 'put', verify_cache);
							_self.cacheStorage(p, 'put', data[p].data);
							$window.localStorage.setItem(p, local);
						});
					}
				}
			},
			/**
			 * 服务器返回的数据使用本地 sessionStorage 做一级缓存, $cacheFactory 做二级缓存, 进行缓存
			 * @param data
			 */
			sessionStorage: function(data){
				var _self = this;
				for(var p in data) {
					if(angular.isString(data[p]) && data[p].toLowerCase() == 'empty'){
						_self.indexeddbStorage('verify_cache', 'delete', p).then(function(){
							_self.cacheStorage('verify_cache', 'remove', p + '_verify_cache');
							_self.cacheStorage(p, 'removeAll');
							$window.sessionStorage.removeItem(p);
						});
					}else{
						if(angular.isObject(data[p].data) || angular.isArray(data[p].data))
							var local = angular.toJson(data[p].data);
						else
							var local = data[p].data;
						var verify_cache = configuration_verify(p, data[p], 'session');
						_self.indexeddbStorage('verify_cache', 'write', verify_cache).then(function (result) {
							_self.cacheStorage('verify_cache', 'put', verify_cache);
							_self.cacheStorage(p, 'put', data[p].data);
							$window.sessionStorage.setItem(p, local);
						});
					}
				}
			},
			cacheStorage: function(store, type, data){
				var _self = this;
				var defer = $q.defer();
				switch (type){
					case 'get':
						var angularCacheData = angularCache.get(store);
						if(angular.isUndefined(angularCacheData)){
							/*_self.indexeddbStorage(store, 'readVerifyCache').then(function(result){
								_self.indexeddbStorage(store, 'read').then(function(results){
									return {type: 'success', keys: store, data: angularCacheData};
									console.log(angular.extend(result, {data: results}));
								});
							});*/
							return {type: 'error', keys: store, msg: store + '缓存不存在!'};
						}else{
							return {type: 'success', keys: store, data: angularCacheData};
						}
						break;
					case 'put':
						angularCache.put(store, data);
						break;
					case 'remove':
						angularCache.remove(store);
						break;
					case 'removeAll':
						angularCache.removeAll();
						break;
					case 'syncToCache':
						_self.indexeddbStorage(store, 'readVerifyCache').then(function(result){
							if(result.type.toLowerCase() == 'success'){
								angularCache.put(store + '_verify_cache', result.verify);
								switch (result.verify.storage){
									case 'cache':
										_self.indexeddbStorage(store, 'read').then(function (results) {
											angularCache.put(store, results);
											defer.resolve({type: 'success', key: store, verify: result.verify, data: results});
										});
										break;
									case 'local':
										var resolve = {
											type: 'success',
											key: store,
											verify: result.verify,
											data: angular.fromJson($window.localStorage.getItem(store))
										};
										angularCache.put(store, resolve.data);
										defer.resolve(resolve);
										break;
									case 'session':
										var resolve = {
											type: 'success',
											key: store,
											verify: result.verify,
											data: angular.fromJson($window.sessionStorage.getItem(store))
										};
										angularCache.put(store, resolve.data);
										defer.resolve(resolve);
										break;
								}
							}
						});
					default:
						/**
						 * 服务器返回的数据仅使用本地 $cacheFactory 进行缓存
						 */
						for (var p in data) {
							if (angular.isString(data[p]) && data[p].toLowerCase() == 'empty') {
								angularCache.remove(p + '_verify_cache');
								angularCache.remove(p);
								_self.indexeddbStorage('verify_cache', 'delete', p);
								_self.indexeddbStorage(p, 'clear');
							} else {
								var verify_cache = configuration_verify(p, data[p], 'cache');
								angularCache.put(p + '_verify_cache', verify_cache);
								angularCache.put(p, data[p].data);
								_self.indexeddbStorage('verify_cache', 'write', verify_cache);
								switch (verify_cache.storage){
									case 'cache':
										var key = p.split('-');
										_self.indexeddbStorage(key[0], 'write', data[p].data);
										break;
									case 'local':
										$window.localStorage.setItem(p, angular.toJson(data[p].data));
										break;
									case 'session':
										$window.sessionStorage.setItem(p, angular.toJson(data[p].data));
										break;
								}
							}
						}
				}
				return defer.promise;
			},
			indexeddbStorage: function(store, type, data){
				var _self = this;
				var defer = $q.defer();
				switch (type){
					case 'read':
						$indexedDB.openStore(store, function(db){
							db.getAll().then(function(results) {
								defer.resolve(results);
							});
						});
						break;
					case 'write':
						$indexedDB.openStore(store, function(db){
							db.upsert(data).then(function() {
								defer.resolve(data);
							});
						});
						break;
					case 'delete':
						$indexedDB.openStore(store, function(db){
							db.delete(data).then(function(){
								defer.resolve(store, key);
							});
						});
						break;
					case 'clear':
						$indexedDB.openStore(store, function(db){
							db.clear().then(function(){
								defer.resolve(store);
							})
						});
						break;
					case 'readVerifyCache':
						$indexedDB.openStore('verify_cache', function(db){
							db.find(store).then(function(result){
								defer.resolve({type: 'success', keys: store, verify: result});
							})
						});
						break;
					case 'writeVerifyCache':
						$indexedDB.openStore('verify_cache', function(db){
							var verify = configuration_verify(store, data[store], 'indexeddb');
							db.upsert(verify).then(function () {
								defer.resolve({type: 'success', keys: store, verify: verify});
							});
						});
						break;
					case 'writeDataAndVerifyCache':
						$indexedDB.openStore('verify_cache', function(db){
							var verify = configuration_verify(store, data[store], 'indexeddb');
							db.upsert(verify).then(function () {
								$indexedDB.openStore(store, function(store_data){
									store_data.upsert(data[store].data).then(function() {
										defer.resolve({type: 'success', keys: store, verify: verify, data: data[store].data});
									});
								});
							});
						});
						break;
					default:
						for (var p in data) {
							if (angular.isString(data[p]) && data[p].toLowerCase() == 'empty') {
								_self.indexeddbStorage('verify_cache', 'delete', p);
								_self.indexeddbStorage(p, 'clear');
							} else {
								$indexedDB.openStore('verify_cache', function(db){
									var verify = configuration_verify(p, data[p], 'indexeddb');
									db.upsert(verify).then(function () {
										$indexedDB.openStore(p, function(store_data){
											store_data.upsert(data[p].data).then(function() {
												console.log({type: 'success', keys: p, verify: verify, data: data[p].data});
												defer.resolve({type: 'success', keys: p, verify: verify, data: data[p].data});
											});
										});
									});
								});
							}
						}
				}
				return defer.promise;
			},
			syncEmptyCache: function () {
				var _self = this;
				var defer = $q.defer();
				if(angularCache.info().size > 0){
					defer.resolve(true);
				}else{
					$indexedDB.databaseInfo().then(function(result){
						var syncDefer = {name: [], value: []};
						angular.forEach(_.pluck(result.objectStores, 'name'), function(obj){
							this.name.push(obj);
							this.value.push(_self.indexeddbStorage(obj, 'read'));
						}, syncDefer);
						$q.all(syncDefer.value).then(function(resp){
							var resolve = [];
							angular.forEach(resp, function(objs, index){
								if(syncDefer.name[index] == 'verify_cache'){
									angular.forEach(objs, function(cache){
										angularCache.put(cache.key + '_verify_cache', cache);
									});
								}else{
									angularCache.put(syncDefer.name[index], objs);
								}
								this.push(true);
							}, resolve);
							if(_.indexOf(resolve, true)) defer.resolve(true);
							else defer.resolve(false);
						});
					});
				}
				return defer.promise;
			},
			initialize: function (cache, refresh) {
				refresh = angular.isUndefined(refresh)?false:refresh;
				var defer = $q.defer();
				var initialize = $window.localStorage.getItem("initialize_APP");
				if(angular.isUndefined(initialize) || initialize != 'true' || refresh){
					this.request({check: cache}).then(function(result){
						$window.localStorage.setItem("initialize_APP", "true");
						$window.localStorage.setItem("initialize_datetime", unitFactory.datetime());
						defer.resolve(result);
					});
				}else{
					defer.reject();
				}
				return defer.promise;
			},
			getUserState: function (param, callback) {
				param.rule = param.rule || 'list';
				param.alert = param.alert || true;
				var config = {jump: false};
				var storage = $window.localStorage.getItem('user');
				var user = unitFactory.isEmptyObject(storage)?false:angular.fromJson(storage);
				var identity = {
					isLogin: (!user || unitFactory.isEmptyObject(user.mobile))?false:true,
					isRealname: (!user || unitFactory.isEmptyObject(user.is_realname) || user.is_realname == 0)?false:true,
					isBindweixin: (!user || unitFactory.isEmptyObject(user.is_bindweixin) || user.is_bindweixin == 0)?false:true,
					isBindweibo: (!user || unitFactory.isEmptyObject(user.is_bindweibo) || user.is_bindweibo == 0)?false:true,
					isBindqq: (!user || unitFactory.isEmptyObject(user.is_bindqq) || user.is_bindqq == 0)?false:true,
					isEngineer: (!user || unitFactory.isEmptyObject(user.is_engineer) || user.is_engineer == 0)?false:true,
				}
				if(!identity.isLogin)
					user = {headimg: 'img/no-avatar.jpg'};
				switch(param.rule){
					case 'login':
						if(!identity.isLogin){
							config = {
								jump: true,
								text: '您尚未注册或登录！',
								button: '现在登录',
								to: 'login'
							}
						}
						break;
					case 'register':
						if(!identity.isLogin){
							config = {
								jump: true,
								text: '您尚未注册或登录！',
								button: '现在登录',
								to: 'login'
							}
						}
						break;
					case 'realname':
						if(!identity.isLogin){
							config = {
								jump: true,
								text: '您尚未注册或登录！',
								button: '现在登录',
								to: 'login'
							}
						}else{
							if(!identity.isRealname){
								config = {
									jump: true,
									text: '您尚未进行实名认证！',
									button: '去认证',
									to: 'apply-realname'
								}
							}else{
								if(user.is_realname == 1){
									config = {
										jump: true,
										text: '您的实名认证正在审核中！',
										button: '等待审核',
										to: 'app.my'
									}
								}
							}
						}
						break;
					case 'engineer':
						if(!identity.isLogin){
							config = {
								jump: true,
								text: '您尚未注册或登录！',
								button: '现在登录',
								to: 'login'
							}
						}else{
							if(!identity.isRealname){
								config = {
									jump: true,
									text: '您尚未进行实名认证！',
									button: '去认证',
									to: 'apply-realname'
								}
							}else{
								if(!identity.isEngineer){
									config = {
										jump: true,
										text: '您尚未进行工程师认证！',
										button: '现在申请',
										to: 'apply-engineer'
									}
								}else{
									if(user.is_engineer == 1){
										config = {
											jump: true,
											text: '您的工程师认证正在审核中！',
											button: '等待审核',
											to: 'app.my'
										}
									}
								}
							}
						}
						break;
					case 'bindweixin':
						if(!identity.isLogin){
							config = {
								jump: true,
								text: '您尚未注册或登录！',
								button: '现在登录',
								to: 'login'
							}
						}else{
							if(!identity.isBindweixin){
								config = {
									jump: true,
									text: '您尚未绑定微信！',
									button: '现在绑定',
									to: 'app.bindweixin'
								}
							}
						}
						break;
					case 'bindweibo':
						if(!identity.isLogin){
							config = {
								jump: true,
								text: '您尚未注册或登录！',
								button: '现在登录',
								to: 'login'
							}
						}else{
							if(!identity.isBindweibo){
								config = {
									jump: true,
									text: '您尚未绑定微博！',
									button: '现在绑定',
									to: 'app.bindweibo'
								}
							}
						}
						break;
					case 'bindqq':
						if(!identity.isLogin){
							config = {
								jump: true,
								text: '您尚未注册或登录！',
								button: '现在登录',
								to: 'login'
							}
						}else {
							if (!identity.isBindqq) {
								config = {
									jump: true,
									text: '您尚未绑定QQ！',
									button: '现在绑定',
									to: 'app.bindqq'
								}
							}
						}
						break;
					case 'list':
						config = { jump: false};
				}
				if(config.jump){
					if(param.alert){
						unitFactory.confirm({
							text: config.text,
							type: "warning",
							confirmButtonText: config.button,
							cancelButtonText: "返回",
							closeOnConfirm: true
						}, function(){
							//ngSwal.close();
							$state.go(config.to, {}, {reload: true});
						}, function(){
							//ngSwal.close();
							$state.go(configs.router.my, {}, { reload: true });
						});
					}else{
						if(typeof(callback) == 'function') callback(user, identity);
					}
				}else{
					if(typeof(callback) == 'function') callback(user, identity);
				}
			}
		}
	});