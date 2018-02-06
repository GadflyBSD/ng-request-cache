# request-cache-indexeddb
angularJS 下的`restFul`数据请求缓存服务及服务器端缓存服务, 实现服务器-客户端的数据请求三级缓存服务架构.
> * 服务器端采用`Memcache`或`Redis`作为缓存服务器, 缓存数据库中的数据, 提供给客户端只读操作查询;
> * 客户端第一级本地缓存采用`angularJs`的`$cacheFactory`服务, 数据存放在内存中, 当第一次启动项目或`$cacheFactory`中没有指定数据时查询二级缓存
> * 客户端第二级本地缓存采用`IndexedDB`数据库, 进行永久数据缓存
> * 客户端对服务器数据库的写操作使用`requestCacheFactory.request()`方法, 服务器端处理完客户端的写操作请求后自动删除对应的服务器缓存,以待下一次客户端读操作请求时重建
> * 客户端对服务器数据库的读操作使用`requestCacheFactory.readonly()`方法
> > * 如果读操作请求操作前端已做缓存, 同时请求时间在最后缓存时间的`configs.cache_timeout`设置时间内, 则本次请求不向服务器发出请求, 返回的结果是前端已做的缓存.
> > * 如果读操作请求操作前端已做缓存, 但请求时间在最后缓存时间的`configs.cache_timeout`设置时间外, 则本次请求将向服务器发出缓存校验参数, 服务器验证校验参数一致, 服务器不做数据返回, 数据仍从前端缓存中获取, 以减少服务器的带宽压力和前端的流量压力; 如果服务器验证校验参数不一致, 则从服务器向前端返回最终数据. 
> > * 如果读操作请求操作前端未做缓存, 则从服务器向前端返回最终数据.

## 解决的问题
**`AngularJs Router` 中`cache`不能按需缓存和请求数据!**
---
1. `AngularJs Router` 中`cache`打开的情况下, 只有第一次访问该路由, 才向服务器发出数据请求, 后续对该路由的访问都是得到客户端已缓存的数据
2. `AngularJs Router` 中`cache`关闭的情况下, 每次访问该路由都向服务器发出数据请求

#### 依赖/加载与配置
1. PC WEB 项目和 Cordova APP 项目都必须引入的文件
    * 下载本服务所使用的<a href="https://github.com/bramski/angular-indexedDB">$indexedDB</a>本地数据库服务封装, 并且在你的index.html中加载它.

            # CMD 安装
            bower install --save angular-indexed-db
            
            # HTML 引入
            <script src="path/to/angular-indexedDB/src/indexeddb.js"></script> 
            
    * 下载本服务所使用的<a href="https://sweetalert.js.org/">SweetAlert</a>弹框服务封装, 并且在你的index.html中加载它.

            # CMD 安装
            npm install sweetalert
            
            # HTML 引入
            <script src="dist/sweetalert.min.js"></script>
            <link rel="stylesheet" type="text/css" href="dist/sweetalert.css">

2. 针对不同的平台引入相应的Toast消息提醒模块
    * PC WEB 项目安装并引入
    
            # CMD 安装
            npm install --save angularjs-toaster
            
            # HTML 引入
            <link href="path/to/angularjs-toaster/1.1.0/toaster.min.css" rel="stylesheet" />
            <script src="path/to/angularjs/angular.min.js" ></script>
            <script src="path/to/angular-animate.min.js" ></script>
            <script src="path/to/angularjs-toaster/toaster.min.js"></script>

    * Cordova APP 项目安装 $cordovaToast 插件
    
            # CMD 安装
            cordova plugin add https://github.com/EddyVerbruggen/Toast-PhoneGap-Plugin.git

3. 下载js文件，保存在你的项目，并且在你的index.html 加载它.

        <script src="path/to/request-cache-indexeddb.js"></script>          // PC WEB 项目引入
        <script src="path/to/request-cache-indexeddb-cordova.js"></script>  // Cordova APP 项目引入

4. 加载到你的模块, 并进行配置.

        var app = angular.module('myApp', ['xc.indexedDB', 'request-cache-indexeddb']);
        app.constant('configs', {
            db_name: 'myIndexedDB',
            restful_url: 'http://www.yoursite.com/app.php?s=',
            http_timeout: 15,
            cache_timeout: 5*60,
        });
        app.run(function($window, configs){
            var initialize_APP = $window.localStorage.getItem('initialize_APP');
            if (!initialize_APP || angular.isUndefined(initialize_APP) || initialize_APP === null ){
                $indexedDBProvider.connection(configs.db_name)
                    .upgradeDatabase(1.0.0, function(event, db, tx){
                        var memcacheStore = db.createObjectStore('memcache', {keyPath: 'key', autoIncrement: true});
                        memcacheStore.createIndex('md5', 'md5', {unique: false});
                        memcacheStore.createIndex('sha1', 'sha1', {unique: false});
                        var documentStore = db.createObjectStore('document', {keyPath: 'id'});
                        documentStore.createIndex('did', 'did', {unique: false});
                        documentStore.createIndex('title', 'title', {unique: false});
                        documentStore.createIndex('category_id', 'category_id', {unique: false});
                        documentStore.createIndex('category_name', 'category_name', {unique: false});
                        documentStore.createIndex('category_title', 'category_title', {unique: false});
                        documentStore.createIndex('url', 'url', {unique: false});
                        documentStore.createIndex('level', 'level', {unique: false});
                        documentStore.createIndex('status', 'status', {unique: false});
                    });
                $window.localStorage.setItem('initialize_APP', true);
            }
        });
        app.config(function($stateProvider, $urlRouterProvider, $httpProvider, $indexedDBProvider) {
            $httpProvider.defaults.headers = {
                post: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'cache':false
                },
                get: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                put: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                delete: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
            $httpProvider.defaults.cache = false;
            $httpProvider.defaults.transformRequest = function(obj) {
                var str = [];
                for (var p in obj) {
                    str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
                }
                return str.join("&");
            };
            $stateProvider.state('app.mTenderTasks',{
                url:'/mTenderTasks',
                cache:false,            // 请取消路由中的缓存
                views:{
                     'tab-my':{
                        templateUrl:'templates/tab-my/mTenderTasks.html',
                        controller: 'myTenderTasksCtrl'
                     }
                }
            });
        });

#### 基本用法
##### 一. 前端数据请求
*   常规请求模式

        app.controller('yourCtrl', function($scope, requestCacheFactory){
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
            requestCacheFactory.request(param, router, method).then(function(success){
                Success Request do someing ...
            }, function(error){
                Error Request do someing ...
            });
        });

*   请求获取服务器已缓存的指定数据(校验缓存)
    > * 如果请求操作前端已做缓存, 同时请求时间在最后缓存时间的`configs.cache_timeout`设置时间内, 则本次请求不向服务器发出请求, 返回的结果是前端已做的缓存.
    > * 如果请求操作前端已做缓存, 但请求时间在最后缓存时间的`configs.cache_timeout`设置时间外, 则本次请求将向服务器发出缓存校验参数, 服务器验证校验参数一致, 服务器不做数据返回, 数据仍从前端缓存中获取, 以减少服务器的带宽压力和前端的流量压力; 如果服务器验证校验参数不一致, 则从服务器向前端返回最终数据. 
    > * 如果请求操作前端未做缓存, 则从服务器向前端返回最终数据.

        app.controller('yourCtrl', function($scope, requestCacheFactory){
            /**
             * 请求获取服务器已缓存的指定数据(校验缓存)
             * @param getItem   String|Array    // 向服务器缓存请求数据的KEY值
             * @param merge: {  Object          // 合并请求数据的请求参数, 不设定则不向服务器合并请求数据
             * 			action: String, // 对应服务器控制器名,非必须
             * 			model: String,  // 对应服务器模型名,非必须
             * 			module: String  // 对应服务器方法名,非必须
             * 			key: String     // 请求结果通过$cacheFactory进行缓存的KEY值(不设定则不做缓存), 非必须
             * 			param: Object   // 服务器端具体方法所接收的请求参数, 非必须
             * 		},
             */
            requestCacheFactory.readonly(getItem, merge).then(function(success){
                Success Request do someing ...
            }, function(error){
                Error Request do someing ...
            });
        });

##### 二. 服务器端数据请求的接收与返回
> 本例中采用`Memcache`作为服务器缓存服务, 也可以选择使用`Redis`作为缓存服务使用
* 服务器接收到前端客户端所传递的数据参数格式:

   ```json
    {
      "action": "服务器控制器名",
      "model": "服务器模型名",
      "module": "服务器方法名",
      "data": {
        "uid": "用户uid",
        "uuid": "用户UUID",
        ......
      },
      "check": [
        {"key": "需要验证的服务器缓存KEY1", "md5": "md5", "sha1": "sha1"},
        {"key": "需要验证的服务器缓存KEY2", "md5": "md5", "sha1": "sha1"},
        ...
        {"key": "需要验证的服务器缓存KEYn", "md5": "md5", "sha1": "sha1"}
      ],
      "merge": {
        "action": "合并请求服务器控制器名",
        "model": "合并请求服务器模型名",
        "module": "合并请求服务器方法名",
      }
    }
   ```

* 服务器传递给客户端的数据格式:
> 1. 所有返回的需要缓存的数据(`localStorage`, `sessionStorage`, `indexeddb`, `cache`)请使用key-value的对象形式返回(`{"key": "data"}`), 如有多个类型的数据请以key-value的数组对象形式返回(`[{"key1": "data1"}, {"key1": "data1"}, ... {"keyN": "dataN"}]`). 
> 2. `indexeddb.structure`是客户端`IndexdDB`数据库对象的创建结构, 可以不指定, 不指定时将默认创建一个`db.createObjectStore('key', {keyPath: 'id', autoIncrement: true})`的对象存储空间
> 3. 服务器端返回数据的相关`JSON`格式约定:

   ```json
    {
      "type": "请求返回状态: Success/Error/Info",
      "msg": "请求返回说明",
      "localStorage": {
        "key1": {    // 此处key值为服务器端数据KEY
          "key": "服务器端数据KEY",
          "md5": "服务器端缓存数据的MD5校验值",
          "sha1": "服务器端缓存数据的SHA1校验值",
          "verify": "服务器对比客户端校验结果, 如果为true则不会有data返回, 说明客户端与服务器数据一致",
          "data": "需要客户端进行localStorage方式缓存的数据, 对象或数据对象"
        },
        "key2": {    // 此处key值为服务器端数据KEY
          "key": "服务器端数据KEY",
          "md5": "服务器端缓存数据的MD5校验值",
          "sha1": "服务器端缓存数据的SHA1校验值",
          "verify": "服务器对比客户端校验结果, 如果为true则不会有data返回, 说明客户端与服务器数据一致",
          "data": "需要客户端进行localStorage方式缓存的数据, 对象或数据对象"
        },
        ......
        "keyN": {    // 此处key值为服务器端数据KEY
          "key": "服务器端数据KEY",
          "md5": "服务器端缓存数据的MD5校验值",
          "sha1": "服务器端缓存数据的SHA1校验值",
          "verify": "服务器对比客户端校验结果, 如果为true则不会有data返回, 说明客户端与服务器数据一致",
          "data": "需要客户端进行localStorage方式缓存的数据, 对象或数据对象"
        }
      },
      "sessionStorage": "需要客户端进行sessionStorage方式缓存的数据, 对象或数据对象, 结构同localStorage",
      "indexeddb": {
       "key1": {    // 此处key值为服务器端数据KEY
         "key": "服务器端数据KEY",
         "md5": "服务器端缓存数据的MD5校验值",
         "sha1": "服务器端缓存数据的SHA1校验值",
         "structure": {
           "storeName": "对象空间名称",
           "keyPath": "指定每条记录中的某个指定字段作为键值",
           "autoIncrement": "是否自动生成的递增数字作为键值, 可以不指定, 如果与keyPath同时使用, 对象中有keyPath指定的属性则不生成新的键值，如果没有自动生成递增键值，填充keyPath指定属性",
           "createIndex": [
             {"name": "索引名称", "idx": "索引字段名", "unique": "是否唯一"}
             ......
           ]
        },
         "verify": "服务器对比客户端校验结果, 如果为true则不会有data返回, 说明客户端与服务器数据一致",
         "data": "需要客户端进行indexedDB方式缓存的数据, 对象或数据对象"
       },
       "key2": {    // 此处key值为服务器端数据KEY
         "key": "服务器端数据KEY",
         "md5": "服务器端缓存数据的MD5校验值",
         "sha1": "服务器端缓存数据的SHA1校验值",
         "structure": {
            "storeName": "对象空间名称",
            "keyPath": "指定每条记录中的某个指定字段作为键值",
            "autoIncrement": "是否自动生成的递增数字作为键值, 可以不指定, 如果与keyPath同时使用, 对象中有keyPath指定的属性则不生成新的键值，如果没有自动生成递增键值，填充keyPath指定属性",
            "createIndex": [
              {"name": "索引名称", "idx": "索引字段名", "unique": "是否唯一"}
              ......
            ]
         },
         "verify": "服务器对比客户端校验结果, 如果为true则不会有data返回, 说明客户端与服务器数据一致",
         "data": "需要客户端进行indexedDB方式缓存的数据, 对象或数据对象"
       },
       ......
       "keyN": {    // 此处key值为服务器端数据KEY
         "key": "服务器端数据KEY",
         "md5": "服务器端缓存数据的MD5校验值",
         "sha1": "服务器端缓存数据的SHA1校验值",
         "structure": {
            "storeName": "对象空间名称",
            "keyPath": "指定每条记录中的某个指定字段作为键值",
            "autoIncrement": "是否自动生成的递增数字作为键值, 可以不指定, 如果与keyPath同时使用, 对象中有keyPath指定的属性则不生成新的键值，如果没有自动生成递增键值，填充keyPath指定属性",
            "createIndex": [
              {"name": "索引名称", "idx": "索引字段名", "unique": "是否唯一"}
              ......
            ]
         },
         "verify": "服务器对比客户端校验结果, 如果为true则不会有data返回, 说明客户端与服务器数据一致",
         "data": "需要客户端进行indexedDB方式缓存的数据, 对象或数据对象"
       }
     },
      "cache": "需要客户端进行$cacheFactory方式缓存的数据, 对象或数据对象, 结构同localStorage",
      "data": "服务器返回的一般数据",
      "merge": "服务器返回合并请求数据"
    }
   ```