/**
 * # ng-unit unitFactory for web PC 工具类自定义服务
 * * 需要在`index.html`入口页面引入的CSS文件
 ```html
 <link href="https://cdn.bootcss.com/toastr.js/latest/css/toastr.min.css" rel="stylesheet">
 <link href="https://cdn.bootcss.com/sweetalert/1.1.3/sweetalert.css" rel="stylesheet">
 ```
 * * 需要在`index.html`入口页面引入的JS文件
 ```html
 <script type="text/javascript" src="https://cdn.bootcss.com/underscore.js/1.8.3/underscore-min.js"></script>
 <script type="text/javascript" src="https://cdn.bootcss.com/spin.js/2.3.2/spin.min.js"></script>
 <script type="text/javascript" src="https://cdn.bootcss.com/toastr.js/latest/js/toastr.min.js"></script>
 <script type="text/javascript" src="https://cdn.bootcss.com/sweetalert/1.1.3/sweetalert.min.js"></script>
 <script type="text/javascript" src="https://cdn.bootcss.com/angular.js/1.6.9/angular.js"></script>
 <script type="text/javascript" src="https://cdn.bootcss.com/angular-filter/0.5.17/angular-filter.js"></script>
 <script type="text/javascript" src="https://cdn.bootcss.com/oclazyload/1.1.0/ocLazyLoad.min.js"></script>
 <script type="text/javascript" src="node_modules/angular-indexedDB/angular-indexed-db.min.js"></script>
 <script type="text/javascript" src="node_modules/ng-request-cache/ng-unit-webpc.js"></script>
 <script type="text/javascript" src="node_modules/ng-request-cache/ng-request-cache.js"></script>
 ```
 * * 加载到你的模块, 并进行的配置.
 ```javascript
 var app = angular.module('myApp', ['oc.lazyLoad', 'angular.filter', 'xc.indexedDB', 'ng-unit', 'ng-request-cache']);
 app.constant('app_config', {
    db_name: 'myIndexedDB',
    swal: {
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
    },
    spin: {
        type: 'spinner',
        opts: {
            lines: 13,                  // The number of lines to draw
			length: 38,                 // The length of each line
			width: 22,                  // The line thickness
			radius: 49,                 // The radius of the inner circle
			scale: 1,                   // Scales overall size of the spinner
			corners: 1,                 // Corner roundness (0..1)
			color: '#333333',           // CSS color or array of colors
			fadeColor: 'transparent',   // CSS color or array of colors
			opacity: 0.3,               // Opacity of the lines
			rotate: 0,                  // The rotation offset
			direction: 1,               // 1: clockwise, -1: counterclockwise
			speed: 1,                   // Rounds per second
			trail: 60,                  // Afterglow percentage
			fps: 20,                    // Frames per second when using setTimeout() as a fallback in IE 9
			zIndex: 2e9,                // The z-index (defaults to 2000000000)
			className: 'spinner',       // The CSS class to assign to the spinner
			top: '50%',                 // Top position relative to parent
			left: '50%',                // Left position relative to parent
			shadow: 'none',             // Box-shadow for the lines
			position: 'absolute'        // Element positioning
        }
    },
    sendSmsWait: 60,
    extended_timeout: 2000,
    duration_timeout: 10000,
    hint_type: 'toastr',
    restful: {
        url: 'http://www.yoursite.com/app.php?s=/Api/angular.html',
		cache: false,
		timeout: 1000 * 15,
    },
    cache_timeout: 5*60*1000,
 });
 ```
 */
angular.module('ng-unit', [])
	.factory('unitFactory', function($q, $http, $window, $injector, $ocLazyLoad, $timeout, app_config, toastr){
		var getTitle = function(type, title){
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
			inArray: function(search, array) {
				for(var i in array){
					if(array[i].toString() == search) return true;
				}
				return false;
			},
			isArray: function (value) {
				return value &&
					typeof value === 'object' &&
					typeof value.length === 'number' &&
					typeof value.splice === 'function' &&
					!(value.propertyIsEnumerable('length'));
			},
			isJson: function (str) {
				try {
					JSON.parse(str);
				} catch (e) {
					return false;
				}
				return true;
			},
			timestamp: function(){
				return parseInt(new Date().getTime());
			},
			datetime: function () {
				var date = new Date();
				var year = date.getFullYear();
				var month = date.getMonth()+1;
				var day = date.getDate();
				var hour = date.getHours();
				var minute = date.getMinutes();
				var second = date.getSeconds();
				return year+'年'+month+'月'+day+'日 '+hour+':'+minute+':'+second;
			},
			imgToBase64: function (url, callback, outputFormat){
				var canvas = document.createElement('CANVAS'),
					ctx = canvas.getContext('2d'),
					img = new Image;
				img.crossOrigin = 'Anonymous';
				img.onload = function(){
					canvas.height = img.height;
					canvas.width = img.width;
					ctx.drawImage(img,0,0);
					var dataURL = canvas.toDataURL(outputFormat || 'image/png');
					callback.call(this, {url: url, base64: dataURL, status: 200});
					canvas = null;
				};
				img.onerror = function(){
					callback.call(this, {url: url, base64: null, status:404});
				}
				img.src = url;
			},
			alert: function(param, callback){
				var config = {}
				config.type = (this.isEmptyObject(param.type))?'success':param.type.toLowerCase();
				config.title = getTitle(config.type, param.title);
				swal(angular.extend(app_config.swal, param, config), function(){
					if(typeof(callback) == 'function') callback();
				});
			},
			popup: function(param){
				var type = (angular.isUndefined(param.type) || this.isEmptyObject(param.type))?'success':param.type.toLowerCase();
				var config = {
					type: type,
					title: getTitle(type, param.title),
					showConfirmButton: false,
					timer: app_config.timeout.extended || 2000,
				}
				swal(angular.extend(config, param));
			},
			confirm: function(param, callback_ok, callback_cancel){
				var config = {}
				config.type = (this.isEmptyObject(param.type))?'warning':param.type.toLowerCase();
				config.title = getTitle(config.type, param.title);
				config.showCancelButton = true;
				swal(angular.extend(app_config.swal, param, config), function(isConfirm){
					if (isConfirm) {
						if(typeof(callback_ok) == 'function') callback_ok();
					}else{
						if(typeof(callback_cancel) == 'function') callback_cancel();
					}
				});
			},
			progress: function(param){
				var config = {
					type: 'info',
					html: true,
					title: getTitle('info'),
					text: '<h5 style="color: #797979">正在 <span class="progressText">'+param.text+'</span> 请等待！</h5><div class = "progress progress-striped active">' +
					'<div class = "progress-bar progress-bar-success" role="progressbar" style="width: '+param.width+'%;"></div></div>',
					showLoaderOnConfirm: true,
				};
				swal(angular.extend(app_config.swal, config));
				swal.disableButtons();
			},
			prompt: function (param, callback) {
				var config ={}
				config.type = (this.isEmptyObject(param.type))?'input':param.type.toLowerCase();
				config.showCancelButton = true;
				config.closeOnConfirm= false;
				config.disableButtonsOnConfirm = true;
				config.animation = "slide-from-top";
				swal(angular.extend(app_config.swal, config, param), function(inputValue){
					swal.close();
					if(inputValue) if(typeof(callback) == 'function') callback(inputValue);
				});
			},
			loading: function(text){
				app_config.duration_timeout = app_config.duration_timeout || 10000;
				text = text || '加载数据';
				var config = {
					type: 'info',
					html: true,
					title: getTitle('info'),
					text: '<h5 style="color: #797979">正在 <span class="progressText">'+text+'</span> 请等待！</h5>',
					showLoaderOnConfirm: true,
					timer: app_config.timeout.duration || 10000
				};
				swal(angular.extend(app_config.swal, config));
				swal.disableButtons();
			},
			loading_stop: function(){
				swal.close();
			},
			spinner: function(id){
				id = id || 'spinner';
				var opts = {
					lines: app_config.spin.lines || 13,
					length: app_config.spin.length || 38,
					width: app_config.spin.width || 22,
					radius: app_config.spin.radius || 49,
					scale: app_config.spin.scale || 1,
					corners: app_config.spin.corners || 1,
					color: app_config.spin.color || '#333333',
					fadeColor: app_config.spin.fadeColor || 'transparent',
					opacity: app_config.spin.opacity || 0.3,
					rotate: app_config.spin.rotate || 0,
					direction: app_config.spin.direction || 1,
					speed: app_config.spin.speed || 1,
					trail: app_config.spin.trail || 60,
					fps: app_config.spin.fps || 20,
					zIndex: app_config.spin.zIndex || 2e9,
					className: app_config.spin.className || 'spinner',
					top: app_config.spin.top || '50%',
					left: app_config.spin.left || '50%',
					shadow: app_config.spin.shadow || 'none',
					position: app_config.spin.position || 'absolute'
				};
				var _self = this;
				var target = document.getElementById(id);
				target.style.display = 'inline';
				target.style.position = 'fixed';
				target.style.width = '100%';
				target.style.height = '100%';
				target.style.top = '0';
				target.style.left = '0';
				target.style.background = app_config.spin.box_background || '#333';
				target.style.zIndex = app_config.spin.box_zIndex || '999999';
				target.style.opacity = app_config.spin.box_opacity || '0.6';
				var spinner = new Spinner(opts).spin(target);
				$timeout(function(){
					_self.spinner_stop(spinner, id);
				}, app_config.timeout.duration || 10000);
				return spinner;
			},
			spinner_stop: function (spinner, id) {
				id = id || 'spinner';
				var target = document.getElementById(id);
				target.style.display = 'none';
				spinner.stop();
			},
			toastr: function(param, text, title) {
				var defer = $q.defer();
				if(angular.isObject(param)){
					var type = param.type;
					text = text || param.msg;
					title = title || param.title;
				}else{
					var type = param;
				}
				toastr.onHidden = function(){
					defer.resolve();
				};
				switch (type.toLowerCase()) {
					case 'success':
						toastr.success(text, this.isEmptyObject(title) ? '操作成功！' : title);
						break;
					case 'error':
						toastr.error(text, this.isEmptyObject(title) ? '操作失败！' : title);
						break;
					case 'warning':
						toastr.warning(text, this.isEmptyObject(title) ? '操作警告！' : title);
						break;
					case 'info':
					default:
						toastr.info(text, this.isEmptyObject(title) ? '操作提醒！' : title);
				}
				return defer.promise;
			},
			close: function(){
				swal.close();
			},
			enableButtons: function(){
				swal.enableButtons();
			},
			disableButtons: function(){
				swal.disableButtons();
			},
			/**
			 * # 创建公私密钥
			 * @param keySize
			 * @returns {{privkey: *, pubkey: *}}
			 */
			generateKey: function(keySize){
				keySize = keySize || 512;
				var crypt = new JSEncrypt({default_key_size: keySize});
				crypt.getKey();
				return {
					privkey: crypt.getPrivateKey(),
					pubkey: crypt.getPublicKey(),
				}
			},
			/**
			 * # 使用公钥对数据进行加密
			 * @param string
			 * @param public_key
			 */
			encrypt: function(string, public_key){
				var crypt = new JSEncrypt();
				crypt.setPublicKey(public_key);
				return crypt.encrypt(string);
			},
			/**
			 * # 使用私钥对加密数据进行解密
			 * @param string
			 * @param private_key
			 */
			decrypt: function(string, private_key){
				var crypt = new JSEncrypt();
				crypt.setPrivateKey(private_key);
				return crypt.decrypt(string);
			},
			/**
			 * # HTTP 网络数据请求
			 * @param params
			 * @param method
			 * @returns {Promise}
			 */
			http: function(params, method){
				app_config.timeout.extended = app_config.timeout.extended || 2000;
				app_config.type.hint = app_config.type.hint || 'toastr';
				var config = {
					url: (app_config.url && app_config.url.restful)?app_config.url.restful:'http://www.yoursite.com/app.php?s=/Api/angular.html',
					cache: (app_config.cache && app_config.cache.restful)?app_config.cache.restful:false,
					timeout: (app_config.timeout && app_config.timeout.restful)?app_config.timeout.restful:1000 * 15,
				}
				var defer = $q.defer();
				var _self = this;
				var rsa_key = $window.localStorage.getItem('rsa_key');
				if(!_self.isEmptyObject(rsa_key) && params.rsa)
					params.router = _self.encrypt(angular.toJson(params.router), angular.fromJson(rsa_key).client_public);
				var after = {};
				angular.forEach(params, function(obj, key){
					if(!_self.isEmptyObject(obj)) this[key] = angular.isObject(obj)?angular.toJson(obj):obj;
				}, after);
				switch(method.toLowerCase()){
					case 'get':
					case 'delete':
						config.method = method.toLowerCase();
						config.params = after;
						break;
					case 'post':
					case 'put':
					default:
						config.method = method.toLowerCase();
						config.data = after;
				}
				$http(config).then(function(result){
					if(result.status == 200 && angular.isObject(result.data) && result.data.type.toLowerCase() == 'success'){
						if(_.indexOf(['post', 'put'], method.toLowerCase()) >= 0){
							if(!angular.isUndefined(app_config.type) && !angular.isUndefined(app_config.type.hint) && app_config.type.hint == 'alert'){
								_self.alert({
									text: result.data.msg,
									type: result.data.type.toLowerCase(),
								},function(){
									defer.resolve(result.data);
								});
							}else if(!angular.isUndefined(app_config.type) && !angular.isUndefined(app_config.type.hint) && app_config.type.hint == 'toastr'){
								_self.toastr(result.data.type.toLowerCase(), result.data.msg).then(function(){
									defer.resolve(result.data);
								});
							}else{
								defer.resolve(result.data);
							}
						}else{
							defer.resolve(result.data);
						}
					}else{
						if(app_config.debug.request) _self.debug('Request', angular.toJson(result), 'Error');
						if(!angular.isUndefined(app_config.type) && !angular.isUndefined(app_config.type.hint) && app_config.type.hint == 'alert'){
							_self.alert({
								text: 'HTTP请求失败! ' + result.data.msg,
								type: 'error',
								closeOnConfirm: true,
								confirmButtonText: '确定',
								showCancelButton: false,
							},function(){
								defer.reject(result);
							});
						}else if(!angular.isUndefined(app_config.type) && !angular.isUndefined(app_config.type.hint) && app_config.type.hint == 'toastr'){
							_self.toastr('error', 'HTTP请求失败! ' + result.data.msg).then(function(){
								defer.reject(result);
							});
						}else{
							defer.reject(result);
						}
					}
				}, function(error){
					if(app_config.debug.request) _self.debug('Request', angular.toJson(error), 'Error');
					if(!angular.isUndefined(app_config.type) && !angular.isUndefined(app_config.type.hint) && app_config.type.hint == 'alert'){
						_self.alert({
							text: 'HTTP请求失败! ' + error,
							type: 'error',
							closeOnConfirm: true,
							confirmButtonText: '确定',
							showCancelButton: false,
						},function(){
							defer.reject(error);
						});
					}else if(!angular.isUndefined(app_config.type) && !angular.isUndefined(app_config.type.hint) && app_config.type.hint == 'toastr'){
						_self.toastr('error', 'HTTP请求失败! ' + error).then(function(){
							defer.reject(error);
						});
					}else{
						defer.reject(error);
					}
				});
				return defer.promise;
			},
			/**
			 * # 文件上传
			 * @param files 需要上传的文件或文件数组
			 * @param text  上传过程中进度条的提示说明
			 * @param type  上传文件的类型
			 * @param uid   上传者的uid, 默认为0
			 * @param url   需要上传的服务器地址, 默认为配置中的 `url.upload` 地址
			 * @returns {Promise}
			 */
			upload: function(files, text, type, uid, url){
				var defer = $q.defer();
				var _self = this;
				if(!angular.isUndefined(files)){
					text = text || '上传文件';
					uid = uid || 0;
					url = url || app_config.url.upload;
					$ocLazyLoad.load('file_upload').then(function(){
						var Upload = $injector.get('Upload');
						Upload.upload({
							url: url,
							method: 'POST',
							headers : {
								'Content-Type': 'application/x-www-form-urlencoded'
							},
							data: {file: files, type: type, uid: uid},
						}).then(function (result) {
							defer.reject(result);
						}, function (error) {
							if(app_config.debug.upload) _self.debug('Upload', angular.toJson(error), 'Error');
							if(app_config.hint_type == 'alert'){
								_self.popup({
									text: '文件上传请求失败! ' + error.status,
									type: 'error',
								});
								defer.reject(error);
							}else if(app_config.hint_type == 'toastr'){
								_self.toastr('error', '文件上传请求失败!' + error.status).then(function(){
									defer.reject(error);
								});
							}else{
								defer.reject(error);
							}
						}, function (evt) {
							_self.progress({text: text, width: parseInt(100.0 * evt.loaded / evt.total)});
						});
					});
				}else{
					var error = {
						text: '没有指定上传文件! ',
						type: 'error',
					}
					if(app_config.debug.upload) _self.debug('Upload', angular.toJson(error), 'Error');
					_self.popup(error);
					defer.reject(error);
				}
				return defer.promise;
			},
			debug: function(key, msg, type){
				type = type || 'Debug';
				$window.sessionStorage.setItem(type + '-' + key + '-' + this.datetime(), msg);
			},
		}
	});