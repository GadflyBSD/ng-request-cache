var app = angular.module('myapp', ['oc.lazyLoad', 'toastr', 'indexedDB', 'ng-unit', 'ng-request-cache', 'ng-oauth2']);
app.constant('app_config', {
	database: {
		name: 'myIndexedDB',
		version: 2.01,
		structure: [
			{
				table: 'verify_cache',
				key: 'key',
				auto: true,
				field: [
					{index: 'storage', name: 'storage', unique: false},
					{index: 'type', name: 'type', unique: false},
					{index: 'pk', name: 'pk', unique: false},
					{index: 'request', name: 'request', unique: false},
					{index: 'dateline', name: 'dateline', unique: false},
				]
			},
			{
				table: 'rsa_key',
				key: 'key',
				auto: true,
				field: [
					{index: 'client_public', name: 'client_public', unique: false},
					{index: 'server_private', name: 'server_private', unique: false},
					{index: 'create_dateline', name: 'create_dateline', unique: false},
				]
			},
			{
				table: 'provice',
				key: 'provice_id',
				auto: false,
				field: [
					{index: 'provice_name', name: 'provice_name', unique: false},
				]
			},
			{
				table: 'city',
				key: 'city_id',
				auto: false,
				field: [
					{index: 'provice_id', name: 'provice_id', unique: false},
					{index: 'city_name', name: 'city_name', unique: false},
				]
			},
			{
				table: 'county',
				key: 'county_id',
				auto: false,
				field: [
					{index: 'provice_id', name: 'provice_id', unique: false},
					{index: 'city_id', name: 'city_id', unique: false},
					{index: 'county_name', name: 'county_name', unique: false},
				]
			},
			{
				table: 'category',
				key: 'id',
				auto: false,
				field: [
					{index: 'ckey', name: 'ckey', unique: false},
					{index: 'name', name: 'name', unique: false},
					{index: 'pid', name: 'pid', unique: false},
				]
			},
			{
				table: 'document',
				key: 'id',
				auto: false,
				field: [
					{index: 'category_id', name: 'category_id', unique: false},
					{index: 'category_name', name: 'category_name', unique: false},
					{index: 'url', name: 'url', unique: false},
					{index: 'title', name: 'title', unique: false},
					{index: 'level', name: 'level', unique: false},
				]
			},
		]
	},
	url: {
		domain: 'localhost',            // 本地用户客户端主机名称
		upload: 'http://manage.hzxiansheng.com/app.php?s=/File/uploadPicture.html',
		restful: 'http://manage.hzxiansheng.com/app.php?s=/Api/angular.html',
	},
	swal: {                             // Sweetalert 弹框设置
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
	spin: {                         // spinner的参数设置
		lines: 13,                  // The number of lines to draw
		length: 30,                 // The length of each line
		width: 20,                  // The line thickness
		radius: 50,                 // The radius of the inner circle
		scale: 1.95,                // Scales overall size of the spinner
		corners: 0.6,               // Corner roundness (0..1)
		color: '#FFFFFF',           // CSS color or array of colors
		fadeColor: 'transparent',   // CSS color or array of colors
		opacity: 0.4,               // Opacity of the lines
		rotate: 23,                 // The rotation offset
		direction: 1,               // 1: clockwise, -1: counterclockwise
		speed: 1,                   // Rounds per second
		trail: 60,                  // Afterglow percentage
		fps: 20,                    // Frames per second when using setTimeout() as a fallback in IE 9
		zIndex: 2e9,                // The z-index (defaults to 2000000000)
		className: 'spinner',       // The CSS class to assign to the spinner
		top: '50%',                 // Top position relative to parent
		left: '50%',                // Left position relative to parent
		shadow: 'none',             // Box-shadow for the lines
		position: 'absolute',       // Element positioning
		box_background: '#333',
		box_zIndex: '999999',
		box_opacity: '0.6',
	},
	timeout: {
		sendSmsWait: 60,            // 再次发送短信验证码后的等待时间
		cache: 5*60*1000,           // 本地缓存时间
		extended: 2000,             // 提示弹框自动关闭时间
		duration: 10000,            // 加载数据最长自动关闭时间
		restful: 1000 * 15          // restful 超时时间
	},
	cache: {
		restful: false
	},
	type: {
		hint: 'toastr',
		load: 'spinner',        // 正在加载的方式
	},
	router:{
		server: {
			sendSmsCode: {model: 'oauth2',module: 'sendCode'},              // 发送短信验证码
			weixinLogin: {model: 'oauth2', module: 'weixinOauth2'},         // 微信登录
			login: {model: 'oauth2', module: 'webLogin'},                   // 普通登录
			register: {model: 'oauth2', module: 'webRegister'},             // 普通注册
			logout: {model: 'oauth2', module: 'logout'},                    // 退出注销
			forgotPassword: {model: 'oauth2', module: 'forgotPassword'},    // 忘记密码
			setPassword: {model: 'oauth2', module: 'setPassword'},          // 设置密码
			setEmail: {model: 'oauth2', module: 'setEmail'},                // 设置邮箱
			setMobile: {model: 'oauth2', module: 'setMobile'},              // 设置手机
			setNickname: {model: 'oauth2', module: 'setNickname'},          // 设置昵称
			setHeadimg: {model: 'oauth2', module: 'setHeadimg'},            // 设置头像
			applyRealname: {model: 'oauth2', module: 'realnameApply'},      // 实名认证申请
		},
		local: {
			home: '',
			my: '',
			weixin_register: ''
		}
	},
	token: {
		weixin_appid: 'wx639effc6575277f7',
		baidu_ak: 'sUVxgOPLFQpoNH8j3rHWUGQVtPV99O8K',
	},
	require: {
		debug: true,
		modules: [
			{
				name: 'weixin_sdk',
				files: [
					'http://res.wx.qq.com/connect/zh_CN/htmledition/js/wxLogin.js',
				]
			},
			{
				name: 'file_upload',
				files: [
					'../examples/lib/ng-file-upload/dist/ng-file-upload-shim.min.js',
					'../examples/lib/ng-file-upload/dist/ng-file-upload.min.js'
				]
			}
		]
	},
	headers: {
		post: {'Content-Type': 'application/x-www-form-urlencoded'},
		get: {'Content-Type': 'application/x-www-form-urlencoded'},
		put: {'Content-Type': 'application/x-www-form-urlencoded'},
		delete: {'Content-Type': 'application/x-www-form-urlencoded'},
		options: {'Content-Type': 'application/x-www-form-urlencoded'},
	},
	debug: {
		upload: true,
		request: true
	}
});
app.config(function($ocLazyLoadProvider, $httpProvider, $indexedDBProvider, app_config, toastrConfig) {
	$ocLazyLoadProvider.config(app_config.require);
	$httpProvider.defaults.headers = app_config.headers;
	$httpProvider.defaults.cache = app_config.cache.restful;
	$httpProvider.defaults.transformRequest = function (obj) {
		var str = [];
		for (var p in obj) {
			str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
		}
		return str.join("&");
	};
	angular.extend(toastrConfig, {
		allowHtml: false,
		closeButton: true,
		positionClass: 'toast-top-center',
		closeHtml: '<button>&times;</button>',
		extendedTimeOut: 1000,
		progressBar: true,
		tapToDismiss: true,
		timeOut: app_config.timeout.duration
	});
	$indexedDBProvider.connection(app_config.database.name)
		.upgradeDatabase(app_config.database.version, function(event, db, tx) {
			db.createObjectStore('picture', {keyPath: 'url'});
			angular.forEach(app_config.database.structure, function(obj){
				var store = this.createObjectStore(obj.table, {keyPath: obj.key, autoIncrement: obj.auto});
				angular.forEach(obj.field, function(o){
					this.createIndex(o.index, o.name, {unique: o.unique});
				}, store);
			}, db);
		});
});
app.run(function(){
	console.log('run');
});