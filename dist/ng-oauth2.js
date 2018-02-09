angular.module('ng-oauth2', [])
	.factory('oauth2Factory', function($q, $window, $state, $ocLazyLoad, app_config, unitFactory, requestCacheFactory){
		return {
			/**
			 * 发送短信验证码服务
			 * @param param
			 * @param $event
			 * @param callback
			 */
			sendSms: function(param, $event, callback){
				var wait = app_config.sendSmsWait || 60;
				var sendSmsTimer = function(ele){
					var dom = angular.element(ele)
					if (wait == 0) {
						dom.removeAttr('disabled').text("重新获取验证码");
						wait = 60;
					} else {
						dom.attr('disabled', 'disabled').text(wait + "秒后重发验证码");
						wait--;
						setTimeout(function(){
							sendSmsTimer(ele);
						}, 1000)
					}
				}
				unitFactory.http({router: app_config.router.server.sendSmsCode, data: {
						mobile: param.mobile,
						action: unitFactory.isEmptyObject(param.action)?'register':param.action
					}}, 'post').then(function(resp){
					sendSmsTimer($event.target);
					if(typeof(callback) == 'function') callback(resp);
				});
			},
			/**
			 * 微信扫码跳转
			 */
			weixinCode: function(){
				function urlencode (str) {
					str = (str + '').toString();
					return encodeURIComponent(str).replace(/!/g, '%21').replace(/'/g, '%27').replace(/\(/g, '%28').
					replace(/\)/g, '%29').replace(/\*/g, '%2A').replace(/%20/g, '+');
				}
				$ocLazyLoad.load('weixin_sdk').then(function(){
					new WxLogin({
						id:"login_container",
						appid: app_config.token.weixin_appid,
						scope: "snsapi_login",
						redirect_uri: urlencode(app_config.url.domain + '#!/main/weixinLogin'),
						state: "STATE",
					});
				});
			},
			/**
			 * 微信登录
			 * @param code
			 * @param callback  如果定义回调函数,则自动跳转不生效
			 */
			weixinLogin: function(code, callback){
				requestCacheFactory.request({data: {code: code}}, app_config.router.server.weixinLogin).then(function(result){
					if(result.status.toLowerCase() == 'loginsuccess'){
						requestCacheFactory.getUserState({}, function(user, identity){
							if(typeof(callback) == 'function') callback({result: result, user: user, identity: identity});
							else $state.go(app_config.router.local.home, {}, { reload: true });
						});
					}else if(result.status.toLowerCase() == 'notbind'){
						if(typeof(callback) == 'function') callback(result);
						else $state.go(app_config.router.local.weixin_register, {}, { reload: true });
					}else{
						unitFactory.alert(result);
					}
				})
			},
			/**
			 * 普通登录
			 * @param param 如果定义回调函数,则自动跳转不生效
			 * @param callback  如果定义回调函数,则自动跳转不生效
			 */
			login: function(param, callback){
				requestCacheFactory.request({data: param}, app_config.router.server.login, 'post').then(function(result){
					requestCacheFactory.getUserState({}, function(user, identity){
						if(typeof(callback) == 'function') callback({result: result, user: user, identity: identity});
						else $state.go(app_config.router.local.home, {}, { reload: true });
					});
				});
			},
			/**
			 * 普通注册
			 * @param param
			 * @param callback  如果定义回调函数,则自动跳转不生效
			 */
			register: function (param, callback) {
				requestCacheFactory.request({data: param}, app_config.router.server.register, 'post').then(function(result){
					requestCacheFactory.getUserState({}, function(user, identity){
						if(typeof(callback) == 'function') callback({result: result, user: user, identity: identity});
						else $state.go(app_config.router.local.home, {}, { reload: true });
					});
				});
			},
			/**
			 * 用户退出系统
			 * @param callback  如果定义回调函数,则自动跳转不生效
			 */
			logout: function (callback) {
				unitFactory.confirm(app_config.alert.logout, function(){
					unitFactory.close();
					requestCacheFactory.request({}, app_config.router.server.logout, 'post').then(function(result){
						requestCacheFactory.getUserState({}, function(user, identity){
							if(typeof(callback) == 'function') callback({result: result, user: user, identity: identity});
							else $state.go(app_config.router.local.home, {}, { reload: true });
						});
					});
				});
			},
			/**
			 * 找回密码
			 * @param param
			 * @param callback  如果定义回调函数,则自动跳转不生效
			 */
			forgotPassword: function(param, callback){
				requestCacheFactory.request({data: param}, app_config.router.server.forgotPassword, 'post').then(function(result){
					if(typeof(callback) == 'function') callback(result);
					else $state.go(app_config.router.local.home, {}, { reload: true });
				});
			},
			/**
			 * 重置密码
			 * @param param
			 * @param callback  如果定义回调函数,则自动跳转不生效
			 */
			setPassword: function (param, callback) {
				requestCacheFactory.request({data: param}, app_config.router.server.setPassword, 'post').then(function(result){
					if(typeof(callback) == 'function') callback(result);
					else $state.go(app_config.router.local.home, {}, { reload: true });
				});
			},
			/**
			 * 重复用户手机号码
			 * @param param
			 * @param callback  如果定义回调函数,则自动跳转不生效
			 */
			setMobile: function (param, callback) {
				requestCacheFactory.request({data: param}, app_config.router.server.setMobile, 'post').then(function(result){
					requestCacheFactory.getUserState({}, function(user, identity){
						if(typeof(callback) == 'function') callback({result: result, user: user, identity: identity});
						else $state.go(app_config.router.local.home, {}, { reload: true });
					});
				});
			},
			/**
			 * 设置用户昵称
			 * @param param
			 * @param callback  如果定义回调函数,则自动跳转不生效
			 */
			setNickname: function (param, callback) {
				requestCacheFactory.request({data: param}, app_config.router.server.setNickname, 'post').then(function(result){
					requestCacheFactory.getUserState({}, function(user, identity){
						if(typeof(callback) == 'function') callback({result: result, user: user, identity: identity});
						else $state.go(app_config.router.local.home, {}, { reload: true });
					});
				});
			},
			/**
			 * 设置用户头像
			 * @param file
			 * @param uid
			 * @param callback  如果定义回调函数,则自动跳转不生效
			 */
			setHeadimg: function(file, uid, callback){
				unitFactory.upload(file, '上传头像图片', 'headimg', uid).then(function(resp){
					requestCacheFactory.request({data: {headimg: resp.data.data[0].id}}, app_config.router.server.setHeadimg, 'post').then(function(result){
						requestCacheFactory.getUserState({}, function(user, identity){
							if(typeof(callback) == 'function') callback({result: result, user: user, identity: identity});
							else $state.go(app_config.router.local.home, {}, { reload: true });
						});
					});
				});
			},
			/**
			 * 实名认证申请
			 * @param idcard
			 * @param uid
			 * @param form
			 * @param callback  如果定义回调函数,则自动跳转不生效
			 */
			applyRealname: function (idcard, uid, form, callback) {
				unitFactory.upload(idcard, '上传身份证图片', 'applyRealname', uid).then(function(resp){
					form.idcard1 = resp.data.data[0].id;
					form.idcard2 = resp.data.data[1].id;
					requestCacheFactory.request({data: form}, app_config.router.server.applyRealname, 'post').then(function(result){
						requestCacheFactory.getUserState({}, function(user, identity){
							if(typeof(callback) == 'function') callback({result: result, user: user, identity: identity});
							else $state.go(app_config.router.local.home, {}, { reload: true });
						});
					});
				})
			}
		}
	});