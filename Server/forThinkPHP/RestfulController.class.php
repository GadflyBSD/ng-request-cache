<?php
/**
 * Created by IntelliJ IDEA.
 * User: gadflybsd
 * Date: 2017/10/18
 * Time: 16:17
 */
namespace App\Controller;
use Think\Controller\RestController;
use Think\Log;

class RestfulController extends RestController{
	/**
	 * @param null $rsa
	 *
	 */
	public function angular($rsa=null){
		header("Content-type: json; charset=utf-8");
		header('Access-Control-Allow-Origin:*');
		header('Access-Control-Allow-Methods:POST, GET, PUT, OPTIONS, DELETE');
		header('Access-Control-Allow-Headers:x-requested-with,content-type');
		header("Access-Control-Allow-Credentials: true");
		$param = I('param.');
		$param['data'] = $param['data']?json_decode(I('param.data', '', false), true):null;
		$param['check'] = $param['check']?json_decode(I('param.check', '', false), true):null;
		$param['jpush'] = $param['jpush']?json_decode(I('param.jpush', '', false), true):false;
		$param['merge'] = $param['merge']?json_decode(I('param.merge', '', false), true):false;
		//$param['data']['uuid'] = $param['jpush']?$param['jpush']['uuid']:null;
		switch ($this->_method){
			case 'post':
				$op = 'insert';
				break;
			case 'put':
				$op = 'update';
				break;
			case 'delete':
				$op = 'delete';
				break;
			case 'get':
			default:
				$op = 'lists';
				break;
		}
		if(!is_null($rsa)){
			$key = $this->getRsaKey('getRsaKey', $param['uuid']);
			$decrypt = json_decode($this->_privateKeyDecode($param['rsa'], $key['client_private']), true);
			$action = (isset($decrypt['action']))?$decrypt['action']:'angular';
			$model = (isset($decrypt['model']))?ucfirst($decrypt['model']):ucfirst(CONTROLLER_NAME);
			$module = (isset($decrypt['module']))?ucfirst($decrypt['module']):'ajax_'.$this->_method;
			$param['op'] = (isset($decrypt['op']))?ucfirst($decrypt['op']):$op;
		}else{
			$action = (isset($param['action']))?$param['action']:'angular';
			$model = (isset($param['model']))?ucfirst($param['model']):ucfirst(CONTROLLER_NAME);
			$module = (isset($param['module']))?ucfirst($param['module']):'ajax_'.$this->_method;
			$param['op'] = (isset($param['op']))?ucfirst($param['op']):$op;
		}
		if($action == 'angular'){
			$msg = '系统在'.$model.'模型中没有找到'.$module.'方法';
			if(method_exists(D($model), $module))
				$return = call_user_func(array(D($model), $module), $param);
			else
				$return = array('type' => 'Error', 'msg' => $msg);
		}else{
			$msg = '系统在'.$action.'控制器中没有找到'.$module.'方法';
			if(method_exists(A($action), $module))
				$return = call_user_func(array(A($action), $module), $param);
			else
				$return = array('type' => 'Error', 'msg' => $msg);
		}
		$debug = (APP_DEBUG)?array('method' => $this->_method, 'param' => $param):array();
		$this->response(array_merge($return, $debug), 'json');
	}
	
	public function getServiceData($param){
		$base = A('Cache')->verifyCache($param['check'], $param['data']['uid']?$param['data']['uid']:0);
		if($param['merge'] || is_array($param['merge'])){
			$action = (isset($param['merge']['action']))?$param['merge']['action']:'angular';
			$model = (isset($param['merge']['model']))?ucfirst($param['merge']['model']):ucfirst(CONTROLLER_NAME);
			$module = (isset($param['merge']['module']))?ucfirst($param['merge']['module']):'ajax_'.$this->_method;
			if($action == 'angular'){
				$msg = '系统在'.$model.'模型中没有找到'.$module.'方法';
				if(method_exists(D($model), $module))
					$return = call_user_func(array(D($model), $module), $param['merge']);
				else
					$return = array('type' => 'Error', 'msg' => $msg);
			}else{
				$msg = '系统在'.$action.'控制器中没有找到'.$module.'方法';
				if(method_exists(A($action), $module))
					$return = call_user_func(array(A($action), $module), $param['merge']);
				else
					$return = array('type' => 'Error', 'msg' => $msg);
			}
			return array('merge' => $return, 'cache' => $base, 'type' => 'Success');
		}else{
			return array('cache' => $base, 'type' => 'Success');
		}
	}
	
	public function getCacheData($param){
		$category = D('MustachTask')->categoryCache();
		$sitedate = D('Document')->sitedateCache();
		$localStorage = array();
		$sessionStorage = array();
		if($param['data']['category']){
			if($param['data']['category']['md5'] != $category['md5'] && $param['data']['category']['sha1'] != $category['sha1'])
				$localStorage['category'] = $category;
		}else{
			$localStorage['category'] = $category;
		}
		if($param['data']['sitedate']){
			if($param['data']['sitedate']['md5'] != $sitedate['md5'] && $param['data']['sitedate']['sha1'] != $sitedate['sha1'])
				$localStorage['sitedate'] = $sitedate;
		}else{
			$localStorage['sitedate'] = $sitedate;
		}
		if($param['data']['userInfo']){
			if(M('MustachUser')->where('uuid = "'.$param['data']['userInfo']['uuid'].'" AND id='.$param['data']['userInfo']['uid'])->count()==0)
				$localStorage['userInfo'] = 'empty';
		}
		return array('type' => 'Success', 'sessionStorage' => $sessionStorage, 'localStorage' => $localStorage);
	}
	
	public function setMemcacheData($type, $param=array()){
		if(in_array($type, array('city', 'county', 'town', 'village'))){
			$data_name = 'city_'.$param['pk'];
			$list = D('Position')->getList(array('type' => $type, 'pk' => $param['pk']));
			if($list['type'] == 'Success')
				$data = $list['data'];
			else
				$data = $list;
		}else{
			switch ($type){
				case 'user':
					$data_name = 'user_'.$param['uid'];
					$where = 'uuid = "'.$param['uuid'].'" AND id='.$param['uid'];
					if(M('MustachBindView')->where($where)->count() > 0)
						$data = M('MustachBindView')->where($where)->find();
					else
						$data = null;
					break;
				case 'category':
					$data_name = 'category';
					$result = D('MustachTask')->getCategory();
					$data = $result['data'];
					break;
				case 'sitedate':
					$data_name = 'sitedate';
					$advert = D('Document')->getSitedate('advert');
					$service = D('Document')->getSitedate('Service');
					$question = D('Document')->getSitedate('question');
					$mrfile = D('Document')->getSitedate('mrfile');
					$data = array(
						'advert'    => $advert['data'],
						'service'   => $service['data'],
						'question'  => $question['data'],
						'mrfile'	=> $mrfile['data'],
					);
					break;
				case 'province':
					$data_name = 'province';
					$list = D('Position')->getList(array('type' => 'province'));
					if($list['type'] == 'Success')
						$data = $list['data'];
					else
						$data = $list;
					break;
			}
		}
		$memcache = new \Memcache;
		$memcache->connect('127.0.0.1', '11211');
		if(!$data || is_null($data)){
			if($memcache->get($data_name)) $memcache->delete($data_name);
		}else{
			$verify = array('md5' => md5(serialize($data)), 'sha1' => sha1(serialize($data)), 'data' => $data);
			if($memcache->get($data_name)){
				$memcache->replace($data_name , $verify, MEMCACHE_COMPRESSED, 2592000);
			}else{
				$memcache->delete($data_name);
				$memcache->set($data_name , $verify, MEMCACHE_COMPRESSED, 2592000);
			}
		}
	}
	
	public function verifyMemcacheData($param){
		$memcache = new \Memcache;
		$memcache->connect('127.0.0.1', '11211');
		$localStorage = array();
		$sessionStorage = array();
		foreach ($param['data'] AS $key => $val){
			$memcache->delete($key);
			if($key == 'user') {
				$name = 'user_' . $param['data']['uid'];
				if (!$memcache->get($name))
					$this->setMemcacheData($name, $param['data']);
				$verify = $memcache->get($name);
				if ($verify['md5'] != $val['md5'] && $verify['sha1'] != $val['sha1'])
					$sessionStorage[$key] = $verify;
			}else{
				$position = explode('_', $key);
				if(in_array($position[0], array('city', 'county', 'town', 'village'))){
					if (!$memcache->get($key))
						$this->setMemcacheData($position[0], array('pk' => $position[1]));
					$verify = $memcache->get($key);
					if ($verify['md5'] != $val['md5'] && $verify['sha1'] != $val['sha1'])
						$localStorage[$key] = $verify;
				}else{
					if(!$memcache->get($key))
						$this->setMemcacheData($key);
					$verify = $memcache->get($key);
					if($verify['md5'] != $val['md5'] && $verify['sha1'] != $val['sha1'])
						$localStorage[$key] = $verify;
				}
			}
		}
		return array('type' => 'Success', 'msg' => '数据校验成功!', 'sessionStorage' => $sessionStorage, 'localStorage' => $localStorage);
	}
	
	public function weixin(){
		Vendor('Weixin');
		$weixin = new \Weixin();
		$weixin->valid();
		return array('type' => 'Success', 'data' => $weixin->get_auth2_userinfo(I('post.code')));
	}
	
	/**
	 * 微信支付生成统一订单
	 * @return array
	 */
	public function payment($param){
		$data = $param['data'];
		$isTest = ($data['isTest'] && !is_null($data['isTest']))?true:false;
		return D('MustachTask')->unifiedorder($data['orderId'], $data['type'], $isTest, $data['way']);
	}
	
	public function alipay(){
		Vendor('Alipay.AopClient');
		Vendor('Alipay.request.AlipayTradePrecreateRequest');
		$aop = new \AopClient();
		$aop->gatewayUrl = 'https://openapi.alipaydev.com/gateway.do';
		$aop->appId = '2016072300102600';
		$aop->rsaPrivateKeyFilePath = './rsa_private_key.pem';
		$aop->alipayPublicKey='./alipay_public_key.pem';
		$aop->apiVersion = '1.0';
		$aop->postCharset='UTF-8';
		$aop->format='json';
		$request = new \AlipayTradePrecreateRequest();
		$data = json_encode(array(
			"out_trade_no" => "wx2016120951519992",
			"total_amount" => "1",
			"subject"      => "测试",
			"body"         => "测试商品100"
		),JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT);
		$request->setBizContent($data);
		$request->setNotifyUrl("http://pay.moblm.com/Todo/notify");
		$result = $aop->execute ( $request);
		$responseNode = str_replace(".", "_", $request->getApiMethodName()) . "_response";
		$resultCode = $result->$responseNode->code;
		if(!empty($resultCode)&&$resultCode == 10000){
			$resp = (array)$result->$responseNode;
			Vendor('phpqrcode.phpqrcode'); # 这里开始是生成二维码
			$url = $resp['qr_code'];
			$errorCorrectionLevel =intval(4) ;//容错级别
			$matrixPointSize = intval(8);//生成图片大小
			$object = new \QRcode();
			$object->png($url, false, $errorCorrectionLevel, $matrixPointSize, 2);
		} else {
			echo "失败";
			exit;
		}
	}
	
	/**
	 * 微信支付结果通知响应
	 */
	public function wx_notify(){
		$this->response(D('MustachTask')->notify('weixin'), 'xml');
	}
	
	public function alipay_notify(){
		echo D('MustachTask')->notify('alipay');
	}
	
	/**
	 * 发送电信能力平台短信验证码模型
	 * @param  array $param
	 * @method sendSms
	 * @return array
	 * @example public_html/example/RestController.php 12 5 参数 $param 的数据结构
	 * @example public_html/example/RestController.php 18 7 返回值 $return 的数据结构
	 */
	public function sendCode($param){
		switch (C('SmsCode')){
			case 'CTCSMS':
				Vendor('CtcSms');
				$sms = new \CtcSms();
				break;
			case 'ALIYUNSMS':
				Vendor('AliyunSms');
				$sms = new \AliyunSms();
				break;
		}
		$action = ($param['data']['action'])?$param['data']['action']:'register';
		$uid = $this->getUserUid($param['data']['uuid']);
		if(is_null($uid)) $uid = $this->getUserUid($param['data']['mobile']);
		else $uid = 0;
		return $sms->sendCode($param['data']['mobile'], $uid, $param['data']['uuid'], $action);
	}
	
	public function getUserUid($param){
		if(!preg_match('/^1[3|4|5|7|8][0-9]\d{4,8}$/', $param))
			return M('MustachUser')->where('mobile="'.$param.'"')->getField('id');
		elseif (!preg_match('/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/', $param))
			return M('MustachUser')->where('uuid="'.$param.'"')->getField('id');
		else
			return 0;
	}
	
	/**
	 * 创建生成服务器和客户端RSA密钥
	 *
	 * @return array|mixed
	 */
	protected function createRsaKey(){
		if(strtoupper(substr(PHP_OS, 0, 3)) === 'WIN'){
			$config = array('config' => 'D:\xampp\php\extras\openssl\openssl.cnf');
		}else{
			$config = array(
				"digest_alg" => "sha512",
				"private_key_bits" => 1024,
				"private_key_type" => OPENSSL_KEYTYPE_RSA,
			);
		}
		$res1 = openssl_pkey_new($config);
		openssl_pkey_export($res1, $privateKeyService, null, $config);
		$publicKeyService = openssl_pkey_get_details($res1);
		$res2 = openssl_pkey_new($config);
		openssl_pkey_export($res2, $privateKeyClient, null, $config);
		$publicKeyClient = openssl_pkey_get_details($res2);
		return array(
			'service_public'    => $publicKeyService['key'],
			'service_private'   => $privateKeyService,
			'client_public'     => $publicKeyClient['key'],
			'client_private'    => $privateKeyClient,
			'create_key_dateline' => time(),
		);
	}
	
	protected function getRsaKey($change, $uuid){
		if(in_array($change, array('createRsaKey', 'changeRsaKey', 'getRsaKey'))){
			if(in_array($change, array('createRsaKey', 'changeRsaKey'))){
				S($uuid.'-RsaKey', $this->createRsaKey());
			}
			return S($uuid.'-RsaKey');
		}else{
			return S($uuid.'-RsaKey', null);
		}
	}
	
	/**
	 * 私钥加密
	 * @param $sourcestr    需加密的数据字符串
	 *
	 * @return string       加密后的字符串
	 */
	protected function _privateKeyEncode($sourcestr, $key, $tojs = FALSE){
		//$prikeyid = openssl_get_privatekey(file_get_contents(self::PRIVATE_KEY));
		$prikeyid = openssl_get_privatekey($key);
		$padding = $tojs?OPENSSL_NO_PADDING:OPENSSL_PKCS1_PADDING;
		if(openssl_private_encrypt($sourcestr, $crypttext, $prikeyid, $padding)){
			return base64_encode("".$crypttext);
		}
	}
	
	/**
	 * 公钥加密
	 *
	 * @param string 明文
	 * @param string 证书文件（.crt）
	 *
	 * @return string 密文（base64编码）
	 *
	 * //JS->PHP 测试
	 * $txt_en = $_POST['password'];
	 * $txt_en = base64_encode(pack("H*", $txt_en));
	 * $file = 'ssl/server.pem';
	 * $txt_de = $this->privateKeyDecode($txt_en, $file, TRUE);
	 * var_dump($txt_de);
	 * //PHP->PHP 测试
	$encrypt = $this->_publicKeyEncode('{"name":"公钥加密私钥解密测试","password":"dg123456"}');
	$decrypt = $this->_privateKeyDecode($encrypt);
	echo '<h2>公钥加密, 私钥解密</h2>';
	echo 'encode: <p>'.$encrypt.'</p><br>';
	echo 'dncode: '.$decrypt.'<br>';
	echo '<br><hr>';
	$encrypt = $this->_privateKeyEncode('{"name":"私钥加密公钥解密测试","password":"pw123456"}');
	$decrypt = $this->_publicKeyDecode($encrypt);
	echo '<h2>私钥加密, 公钥解密</h2>';
	echo 'encode: <p>'.$encrypt.'</p><br>';
	echo 'dncode: '.$decrypt.'<br>';
	echo '<br><hr>';
	 */
	protected function _publicKeyEncode($sourcestr, $key, $tojs = FALSE){
		//$pubkeyid = openssl_get_publickey(file_get_contents(self::PUBLIC_KEY));
		$pubkeyid = openssl_get_publickey($key);
		$padding = $tojs?OPENSSL_NO_PADDING:OPENSSL_PKCS1_PADDING;
		if(openssl_public_encrypt($sourcestr, $crypttext, $pubkeyid, $padding)){
			return base64_encode("".$crypttext);
		}
	}
	
	/**
	 * 私钥解密
	 *
	 * @param string    $crypttext 密文（二进制格式且base64编码）
	 * @param bool      $fromjs    密文是否来源于JS的RSA加密
	 *
	 * @return string 明文
	 */
	protected function _privateKeyDecode($crypttext, $key, $fromjs = FALSE){
		//$prikeyid = openssl_get_privatekey(file_get_contents(self::PRIVATE_KEY));
		$prikeyid = openssl_get_privatekey($key);
		$padding = $fromjs ? OPENSSL_NO_PADDING : OPENSSL_PKCS1_PADDING;
		if(openssl_private_decrypt(base64_decode($crypttext), $sourcestr, $prikeyid, $padding)){
			return $fromjs ? rtrim(strrev($sourcestr), "/0") : "".$sourcestr;
		}
		return ;
	}
	
	/**
	 * 公钥解密
	 * @param string    $crypttext   需解密的字符串
	 * @param bool      $fromjs      密文是否来源于JS的RSA加密
	 *
	 * @return string|void      解密后的字符串
	 */
	protected function _publicKeyDecode($crypttext, $key, $fromjs = FALSE){
		//$pubkeyid = openssl_get_publickey(file_get_contents(self::PUBLIC_KEY));
		$pubkeyid = openssl_get_publickey($key);
		$padding = $fromjs ? OPENSSL_NO_PADDING : OPENSSL_PKCS1_PADDING;
		if(openssl_public_decrypt(base64_decode($crypttext), $sourcestr, $pubkeyid, $padding)){
			return $fromjs ? rtrim(strrev($sourcestr), "/0") : "".$sourcestr;
		}
		return ;
	}
}