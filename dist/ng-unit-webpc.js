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
	.factory('unitFactory', function($q, $http, $window, app_config, toastr){
		var wait = app_config.sendSmsWait || 60;
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
			sendSmsTimer: function(ele){
				var that = this;
				if (wait == 0) {
					ele.removeAttr('disabled').text("重新获取验证码");
					wait = 60;
				} else {
					ele.attr('disabled', 'disabled').text(wait + "秒后重发验证码");
					wait--;
					setTimeout(function(){
						that.sendSmsTimer(ele);
					}, 1000)
				}
			},
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
			convertImgToBase64: function (url, callback, outputFormat){
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
				swal(angular.extend(defaults, param, config), function(){
					if(typeof(callback) == 'function') callback();
				});
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
					if(inputValue) if(typeof(callback) == 'function') callback(inputValue);
				});
			},
			loading: function(param){
				app_config.duration_timeout = app_config.duration_timeout || 10000;
				var config = {
					type: 'info',
					html: true,
					title: getTitle('info'),
					text: '<h5 style="color: #797979">正在 <span class="progressText">'+param.text+'</span> 请等待！</h5>',
					showLoaderOnConfirm: true,
					timer: app_config.duration_timeout
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
					lines: app_config.spin.opts.lines || 13,
					length: app_config.spin.opts.length || 38,
					width: app_config.spin.opts.width || 22,
					radius: app_config.spin.opts.radius || 49,
					scale: app_config.spin.opts.scale || 1,
					corners: app_config.spin.opts.corners || 1,
					color: app_config.spin.opts.color || '#333333',
					fadeColor: app_config.spin.opts.fadeColor || 'transparent',
					opacity: app_config.spin.opts.opacity || 0.3,
					rotate: app_config.spin.opts.rotate || 0,
					direction: app_config.spin.opts.direction || 1,
					speed: app_config.spin.opts.speed || 1,
					trail: app_config.spin.opts.trail || 60,
					fps: app_config.spin.opts.fps || 20,
					zIndex: app_config.spin.opts.zIndex || 2e9,
					className: app_config.spin.opts.className || 'spinner',
					top: app_config.spin.opts.top || '50%',
					left: app_config.spin.opts.left || '50%',
					shadow: app_config.spin.opts.shadow || 'none',
					position: app_config.spin.opts.position || 'absolute'
				};
				var target = document.getElementById(id);
				target.style.display = 'inline';
				target.style.position = 'fixed';
				target.style.width = '100%';
				target.style.height = '100%';
				target.style.top = '0';
				target.style.left = '0';
				target.style.background = '#333';
				target.style.zIndex = '999999';
				target.style.opacity = '0.6';
				return new Spinner(opts).spin(target);
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
				toastr.options.onHidden = function(){
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
			http: function(params, method){
				app_config.extended_timeout = app_config.extended_timeout || 2000;
				app_config.hint_type = app_config.hint_type || 'toastr';
				var config = {
					url: (app_config.restful && app_config.restful.url)?app_config.restful.url:'http://www.yoursite.com/app.php?s=/Api/angular.html',
					cache: (app_config.restful && app_config.restful.cache)?app_config.restful.cache:false,
					timeout: (app_config.restful && app_config.restful.timeout)?app_config.restful.timeout:1000 * 15,
				}
				var defer = $q.defer();
				var _self = this;
				var rsa_key = $window.localStorage.getItem('rsa_key');
				if(!_self.isEmptyObject(rsa_key) && params.rsa){
					var crypt = new JSEncrypt();
					console.log(angular.fromJson(rsa_key));
					crypt.setPublicKey(angular.fromJson(rsa_key).client_public);
					console.log(params.router);
					params.router = crypt.encrypt(angular.toJson(params.router));
					console.log(params.router);
				}
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
				$http(config).then(function(result){
					if(result.status == 200 && angular.isObject(result.data) && result.data.type.toLowerCase() == 'success'){
						if(_.indexOf(['post', 'put'], method.toLowerCase()) >= 0){
							if(app_config.hint_type == 'alert'){
								_self.alert({
									text: result.data.msg,
									type: result.data.type.toLowerCase(),
									timer: app_config.extended_timeout
								},function(){
									defer.resolve(result.data);
								});
							}
							if(app_config.hint_type == 'toastr'){
								_self.toastr(result.data.type.toLowerCase(), result.data.msg).then(function(){
									defer.resolve(result.data);
								});
							}
						}else{
							defer.resolve(result.data);
						}
					}else{
						if(app_config.hint_type == 'alert'){
							_self.alert({
								text: result.data.msg,
								type: result.data.type.toLowerCase(),
								closeOnConfirm: true,
								confirmButtonText: '确定',
								showCancelButton: false,
							},function(){
								defer.reject(result);
							});
						}
						if(app_config.hint_type == 'toastr'){
							_self.toastr(result.data.type.toLowerCase(), result.data.msg).then(function(){
								defer.reject(result);
							});
						}
					}
				}, function(error){
					if(app_config.hint_type == 'alert'){
						_self.alert({
							text: 'HTTP请求失败! ' + error,
							type: 'error',
							closeOnConfirm: true,
							confirmButtonText: '确定',
							showCancelButton: false,
							timer: app_config.extended_timeout
						},function(){
							defer.reject(error);
						});
					}
					if(app_config.hint_type == 'toastr'){
						_self.toastr('error', 'HTTP请求失败! ' + error).then(function(){
							defer.reject(error);
						});
					}
				});
				return defer.promise;
			},
		}
	});