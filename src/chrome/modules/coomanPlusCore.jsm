const EXPORTED_SYMBOLS = ["coomanPlusCore"],
			{classes: Cc, interfaces: Ci, utils: Cu} = Components;
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/AddonManager.jsm");
Cu.import("resource://gre/modules/FileUtils.jsm");
Cu.import("resource://gre/modules/NetUtil.jsm");

var	self = this,
		log = function logWTF(){},
		coomanPlusCore = {
	GUID: '{bb6bc1bb-f824-4702-90cd-35e2fb24f25d}',
	cmpWindow: null,
	cmpWindowOptions: null,
	lastKeyDown: [],
	prefNoObserve: false,
	isProtect: false,
	updated: false,
	updateChecked: false,
	log: log,
	addon: null,
	window: null,
	prevVersion: "",
	PREF_BRANCH: "extensions.cookiesmanagerplus.",
	storageFile: "cookiesManagerPlus.json",
	storage: null,
	storageString: null,
	storageVersion: 1,
	storageStructure: {
		select: [],
		readonly: {},
		search: [],
		persist: {},
		v: 0,
	},
	prefs: null,
	prefsDefault: null,
	COOKIE_NORMAL: 1,
	COOKIE_HTML5: 2,
	COOKIE_FLASH: 3,
	_ds: Cc["@mozilla.org/intl/scriptabledateformat;1"].getService(Ci.nsIScriptableDateFormat),
	_cm: Cc["@mozilla.org/cookiemanager;1"].getService(Ci.nsICookieManager),
	_cm2: Cc["@mozilla.org/cookiemanager;1"].getService(Ci.nsICookieManager2),
	os: Cc["@mozilla.org/xre/app-info;1"].getService(Ci.nsIXULRuntime).OS,
	appInfo: Cc["@mozilla.org/xre/app-info;1"].getService(Ci.nsIXULAppInfo),
	sdr: Cc["@mozilla.org/security/sdr;1"].getService(Ci.nsISecretDecoderRing),
//	sdr: Cc["@mozilla.org/login-manager/crypto/SDR;1"].getService(Ci.nsILoginManagerCrypto),
	mpToken: Cc['@mozilla.org/security/pk11tokendb;1'].getService(Ci.nsIPK11TokenDB).getInternalKeyToken(),
	_readonlyList: null,
	readonlyList: function readonlyList(data)
	{
		if (typeof(data) != "undefined")
			this._readonlyList = data;

		else if (this._readonlyList === null)
		{
			this._readonlyList = {};
			this.readonlyLoad();
		}

		return this._readonlyList;
	},
	readonlyListEncrypted: null,
	readonlyFileSaved: true,
	readonlyFileScheduled: false,
	asyncMap: new Map(),
	async: function async(callback, delay, timer, noreset)
	{
		if (!timer)
			timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);

		if (!noreset)
			timer.cancel();

		let self = this,
				prev = self.asyncMap.has(timer),
				obj = {
					delay: delay,
					callback: callback,
					observe: function()
					{
						timer.cancel();
						this.callback();
						self.asyncMap.delete(timer);
					}
				}

		self.asyncMap.set(timer, obj);
		if (prev && noreset)
			return timer;


		timer.init(obj, delay || 0, timer.TYPE_ONE_SHOT);
		return timer;
	},//async()

	openCMP: function openCMP(_args)
	{
		_args = typeof(_args) == "undefined" ? {} : _args
		let args = {};
		args.wrappedJSObject = _args;
		let win = this.cmpWindow;
		if (win)
		{
			if (win.coomanPlus.focus)
				win.coomanPlus.focus(args, true);

			win.focus();
			return;
		}
			let ww = Cc["@mozilla.org/embedcomp/window-watcher;1"].getService(Ci.nsIWindowWatcher);
		win = ww.openWindow(null, "chrome://cookiesmanagerplus/content/cookiesmanagerplus.xul",
												"coomanPlusWindow", "chrome,resizable,dialog=no,toolbar=no,statusbar=no,scrollbar=no,centerscreen", args);
//			win.focus();
	},//openCMP()

	openOptions: function(_args)
	{
		_args = typeof(_args) == "undefined" ? {} : _args

	//	this._openDialog("options.xul", "", "chrome,resizable=yes,centerscreen,dialog=no," + (this.isMac ? "dialog=no" : "modal"), {standalone: standalone ? true : false});
		let url = "chrome://cookiesmanagerplus/content/options.xul",
				id = "options",
				prop = "chrome,resizable,centerscreen,dialog" + (this.isMac ? "" : "=no"),
				args = {};
		args.wrappedJSObject = _args;
		if (this.cmpWindowOptions)
		{
			this.cmpWindowOptions.focus(args);
			return;
		}

		if (this.windowss && this.window.openDialog)
			this.window.openDialog(url, id, prop, args);
		else
		{
			let ww = Cc["@mozilla.org/embedcomp/window-watcher;1"].getService(Ci.nsIWindowWatcher);
			win = ww.openWindow(null, url, id, prop, args);
		}
	},

	_backups: {},
	backup: function backup(obj, id)
	{
		let self = this;
		self._backups[id] = obj;

		self.backup.timer = self.async(function()
		{
			self.storage.persist = self._backups;
//			self.pref("persist", JSON.stringify(self._backups));
//			self.storage.persist = self._backups;
			self.storageWrite();
		}, 0, self.backup.timer);
	},

	pref: function (key, val, noCache, noAsync)
	{
		let pref = coomanPlusCore.pref;

		try
		{
			if (!noCache && typeof(val) == "undefined")
			{
				return pref.prefs[key];
			}
			let type = typeof(pref.prefs[key]);
			if (typeof(val) == "undefined")
			{
				type = pref.types[type];
				if (type)
					val = coomanPlusCore.prefs["get" + type + "Pref"](key);
				else
					val = coomanPlusCore.prefs.getComplexValue(key, Ci.nsISupportsString).data;

				if (typeof(val) != "undefined")
				pref.prefs[key] = val;
				return val
			}
			else
			{
				if (type != typeof(val))
				{
					if (type == "number")
						val = Number(val);
					else if (type == "string")
						val = String(val);
					else
						val = Boolean(val);
				}
				pref.prefs[key] = val;
				let callback = function()
				{
					delete pref.timers[key];
					let type = pref.types[typeof(pref.prefs[key])];
					if (type)
						coomanPlusCore.prefs["set" + type + "Pref"](key, val);
					else
					{
						let str = Cc["@mozilla.org/supports-string;1"].createInstance(Ci.nsISupportsString);
						str.data = val;
						coomanPlusCore.prefs.setComplexValue(key, Ci.nsISupportsString, str);
					}
				}
				if (noAsync)
					callback();
				else
					pref.timers[key] = coomanPlusCore.async(callback, 0, pref.timers[key]);
			}
		}
		catch(e)
		{
			log.error(e);
		}
		return null;
	},

	_windows: [],
	windowAdd: function windowAdd(win)
	{
		let id = this._windows.indexOf(win);
		if (id != -1)
			return id

		return this._windows.push(win);
	},//windowAdd()

	windowRemove: function windowRemove(win)
	{
		let id = this._windows.indexOf(win);
		if (id != -1)
			this._windows[id] = null;
	},//windowRemove()

	notify: function notify(com, data)
	{
		return Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService).notifyObservers(null, "cmp-command", com);
/*
		let i = -1;
		while(i++ < this._windows.length)
		{
			let win = this._windows[i];
			if (!win || !win.coomanPlus || !win.coomanPlus.command)
				continue;

			win.coomanPlus.command(com, data);
		}
*/
	},//notify()

	onPrefChange: {
		observe: function(aSubject, aTopic, aKey, init)
		{
			let self = coomanPlusCore;
			if(aTopic != "nsPref:changed")
				return;

			let t = aSubject.getPrefType(aKey),
					v;

			if (t == Ci.nsIPrefBranch.PREF_INT)
				v = aSubject.getIntPref(aKey);
			else if (t == Ci.nsIPrefBranch.PREF_BOOL)
				v = aSubject.getBoolPref(aKey);
			else if (t == Ci.nsIPrefBranch.PREF_STRING)
				v = aSubject.getComplexValue(aKey, Ci.nsISupportsString).data;

			self.pref.prefs[aKey] = v;
			if (aKey == "debug")
			{
				log.logLevel = self.pref("debug") || 1;
				if (log.logLevel & 4)
					log.openConsole();
			}

			if (aKey == "buttonaction")
			{
				self.notify("buttonaction");
			}
			if (aKey == "readonlyencrypt" && coomanPlusCore.addon)
			{
				self.readonlySave(true, true);
			}
		}
	},//onPrefChange

	shutdown: function shutdown()
	{
		let save = this.readonlyCleanup();
		if (save || !this.readonlyFileSaved)
			this.readonlySave(false);
		this.storageWrite(undefined, false);
	},//shutdown()

	observe: function observe(aTopic, aSubject, aData)
	{
		if (aSubject == "profile-change-net-teardown")
			return this.shutdown()

		if (aSubject != "cookie-changed" || !this.pref("readonly"))
			return;

		switch(aData)
		{
			case "added":
			case "changed":
			case "deleted":
			case "batch-deleted":
				let cookies = [],
						i = 0;
				if (aData == "batch-deleted")
				{
					let nsIArray = aTopic.QueryInterface(Ci.nsIArray);
					for(let i = 0; i < nsIArray.length; i++)
						cookies.push(nsIArray.queryElementAt(i, Ci.nsICookie2));
				}
				else
					cookies = [aTopic.QueryInterface(Ci.nsICookie2)];

				let readonlyList = this.readonlyList();
				while(aCookie = cookies[i++])
				{
					let hash = this.cookieHash(aCookie);
					if (!readonlyList[hash])
					{
log.debug(aCookie.host + aCookie.path + (aCookie.path[aCookie.path.length-1] == "/" ? "" : "/")  + aCookie.name);
						continue;
					}

					let newCookie = {
						host: aCookie.host,
						path: aCookie.path,
						name: aCookie.name,
						value: aCookie.value,
						isSecure: aCookie.isSecure,
						isHttpOnly: aCookie.isHttpOnly,
						expires: aCookie.expires,
						originAttributes: typeof(aCookie.originAttributes) != "undefined" ? aCookie.originAttributes : {}
					},
					deleted = aData == "deleted" || aData == "batch-deleted",
					save = deleted;
					for(let i in readonlyList[hash])
					{
						if (newCookie[i] != readonlyList[hash][i])
						{
							newCookie[i] = readonlyList[hash][i];
							save = true;
						}
					}
					if (deleted && this.pref("readonlydelete"))
					{
//						this.readonlyRemove(newCookie);
						continue;
					}

					if (save)
					{

log.debug("Attempt to change readonly cookie " + newCookie.host + newCookie.path + (newCookie.path[newCookie.path.length-1] == "/" ? "" : "/")  + newCookie.name + ", restoring readonly data");

						if (newCookie.expires * 1000 < (new Date()).getTime())
						{
							newCookie.expires = Math.floor((new Date()).getTime() / 1000 + 1);  //we can't add already expired cookies, adding 1 sec
							if ("expires" in readonlyList[hash])
								readonlyList[hash].expires = newCookie.expires;
						}

						this._cm2.add(newCookie.host,
													newCookie.path,
													newCookie.name,
													newCookie.value,
													newCookie.isSecure,
													newCookie.isHttpOnly,
													(newCookie.expires) ? false : true,
													newCookie.expires,
													newCookie.originAttributes
						);
					}
					else
log.debug(aCookie.host + aCookie.path + (aCookie.path[aCookie.path.length-1] == "/" ? "" : "/")  + aCookie.name);

				}
				break;
		}

	},//observe()

	readonlyAdd: function readonlyAdd(aCookie, nosave)
	{
log.debug();
		this.readonlyFileSaved = false
		if (!aCookie.readonly)
			return this.readonlyRemove(aCookie);

		let hash = this.cookieHash(aCookie),
				i = 0,
				readonlyList = this.readonlyList();

		aCookie.hash = hash;
		if (!readonlyList[hash])
			readonlyList[hash] = {}


		for(let f in aCookie.readonly)
		{
			readonlyList[hash][f] = aCookie[f];
			i++;
		}
		if (!i)
			this.readonlyRemove(aCookie)
		else if (!nosave)
			this.readonlySave();

	},//readonlyAdd()
	
	readonlyRemove: function readonlyRemove(aCookie, nosave)
	{
		this.readonlyFileSaved = false
		let hash = this.cookieHash(aCookie);

		aCookie.hash = hash;
		aCookie.readonly = false;
		delete this.readonlyList()[hash];
		if (!nosave)
			this.readonlySave()
	},//readonlyRemove()
	
	readonlyCheck: function readonlyCheck(aCookie)
	{
		if (!this.pref("readonly"))
			return false;

		let hash = this.cookieHash(aCookie);

		try
		{
			aCookie.hash = hash;
		}catch(e){}
		let readonlyList = this.readonlyList();
		return readonlyList[hash] ? readonlyList[hash] : false;
	},//readonlyCheck()

	sdrLast: 0,
	_sdr: {
		decryptString: function()
		{
			throw "Master password is set but not logged in";
		},
		encryptString: function()
		{
			throw "Master password is set but not logged in";
		}
	},
	get getSdr ()
	{
		let now = (new Date()).getTime();
		if (!this.mpToken.isLoggedIn() && this.sdrLast > now - 100)
		{
			this.sdrLast = now;
			return this._sdr;
		}
		else
			return this.sdr;
	},

	readonlyDecrypt: function readonlyDecrypt(text)
	{
		let r = null;

		try
		{
			r = this.getSdr.decryptString(text);
		}
		catch(e)
		{
			this.sdrLast = (new Date()).getTime();
			log.error(e)
		}
		return r;
	},//readonlyDecrypt()

	readonlyDecryptEncrypted: function readonlyDecryptEncrypted()
	{
log.debug();
		let self = coomanPlusCore;
		if (!self.readonlyListEncrypted)
			return

log.debug("decrypting");
		let oldData = self.readonlyDecrypt(self.readonlyListEncrypted);
		if (oldData === null)
			return;

		try
		{
			oldData = JSON.parse(oldData);
			self.readonlyListEncrypted = null;
			let readonlyList = self.readonlyList();
			for(let l in readonlyList)
			{
				if (l in oldData)
				{
					for(let i in readonlyList[l])
						oldData[l][i] = readonlyList[l][i];
				}
				else
					oldData[l] = readonlyList[l];
			}
			self.readonlyList(oldData);
		}
		catch(e){log.error(e)}
	},//readonlyDecryptEncrypted()

	readonlySave: function readonlySave(async, force)
	{
log.debug();
		let self = coomanPlusCore;
		self.readonlyDecryptEncrypted();
		let data = self.readonlyList();

		if (self.pref("readonlyencrypt"))
		{
			try
			{
//					data = JSON.stringify({e:self.sdr.encrypt(data)});
				data = {e:self.getSdr.encryptString(JSON.stringify(data))};
			}
			catch(e)
			{
				self.sdrLast = (new Date()).getTime();
				log.error(e);
			}
		}
		if (self.readonlyListEncrypted)
		{
			try
			{
				let str = JSON.stringify(data);
				if (str == "{}")
					data = {e:self.readonlyListEncrypted};
			}catch(e){}
		}
		self.storage.readonly = data;
		self.storageWrite(undefined, async, force);
	},//readonlySave()
	
	readonlyLoad: function readonlyLoad()
	{
log.debug();
		let data = this.storage.readonly;

		if (data && "e" in data)
		{
			this.readonlyListEncrypted = data.e;
			let text = this.readonlyDecrypt(data.e);
			if (text === null)
			{
				data = null;
			}
			else
			{
				try
				{
					data = JSON.parse(text);
					this.readonlyListEncrypted = null;
				}
				catch(e)
				{
					data = null;
					log.error(e);
				}
			}
		}

		if (data)
			this.readonlyList(data);

	},//readonlyLoad()

	readonlyCleanup: function readonlyCleanup()
	{
		let e = coomanPlusCore._cm.enumerator,
				list = [],
				i = 0,
				hash,
				save = false,
				readonlyList = this.readonlyList();

		while (e.hasMoreElements())
		{
			let aCookie = e.getNext();
			if (!aCookie || !(aCookie instanceof Ci.nsICookie))
				break;

			list.push(this.cookieHash(aCookie));
		}
		for(hash in readonlyList)
		{
			if (list.indexOf(hash) == -1)
			{
				delete readonlyList[hash];
				save = true;
			}
			else
			{
				let ro = readonlyList[hash],
						i = 0;
				for(let n in ro)
				{
					i++;
				}
				if (!i)
				{
					delete readonlyList[hash];
					save = true;
				}
			}
		}
		return save;
	},//readonlyCleanup()
	nsIScriptableUnicodeConverter: Cc["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Ci.nsIScriptableUnicodeConverter),
	nsICryptoHash: Cc["@mozilla.org/security/hash;1"].createInstance(Ci.nsICryptoHash),

	cookieHash: function cookieHash(aCookie, type, nocache)
	{
	//type: 0/undefined = base64, 1 = hex, 2 = binary;
		if (aCookie.hash && !nocache)
			return aCookie.hash;
		
		let	converter = this.nsIScriptableUnicodeConverter,
				ch = this.nsICryptoHash,
				str = JSON.stringify({
					host: aCookie.host,
					name: aCookie.name,
					path: aCookie.path,
//breaks selection after import
//					originAttributes: aCookie.originAttributes
				}),
				hash,
				data;

		converter.charset = "UTF-8";
		data = converter.convertToByteArray(str, {});
		ch.init(ch.MD5);
		ch.update(data, data.length);
		hash = ch.finish(!type);
		if (type == 1)
		{
			let h = "";
			for (let i in hash)
				h += ("0" + hash.charCodeAt(i).toString(16)).slice(-2);

			hash = h;
		}
		return hash
	},//cookieHash()

	storageRead: function storageRead(forceRead)
	{
log.debug("begin");
		if (this.storage !== null && !forceRead)
			return

		let data = "",
				r = {},
				file = FileUtils.getFile("ProfD", [this.storageFile]),
				fstream = Cc["@mozilla.org/network/file-input-stream;1"].createInstance(Ci.nsIFileInputStream),
				cstream = Cc["@mozilla.org/intl/converter-input-stream;1"].createInstance(Ci.nsIConverterInputStream);
		try
		{
			fstream.init(file, -1, 0, 0);
			cstream.init(fstream, "UTF-8", 0, 0);
			let str = {},
					read = 0;
			do
			{
				read = cstream.readString(0xffffffff, str); // read as much as we can and put it in str.value
				data += str.value;
			} while (read != 0);
			cstream.close(); // this closes fstream
		}catch(e){};
		try
		{
			r = JSON.parse(data);
		}
		catch(e)
		{
			log.error(e);
		}
		this.storage = r;
		this.storageString = data;
	},//storageRead()

	storageWrite: function storageWrite(data, async, forceWrite)
	{
		let self = coomanPlusCore,
				dataString = "";

		if (typeof(data) == "undefined")
			data = self.storage;

		if (typeof(async) == "undefined")
			async = 60000;


		try
		{
			if (JSON.stringify(data.restore) == "{}")
				delete data.restore;
		}catch(e){}
		try
		{
			if (JSON.stringify(data.reset) == "{}")
				delete data.reset;
		}catch(e){}
		try
		{
			dataString = JSON.stringify(data);
		}catch(e){}

		if (!forceWrite && dataString === self.storageString)
		{
			if (self.storageWrite.timer)
				self.storageWrite.timer.cancel();

			self.storage = data;
			return;
		}
log.debug("storage file save begin");


		function write()
		{
			if (self.storageWrite.timer)
			{
				self.storageWrite.timer.cancel();
				delete self.storageWrite.timer;
			}
			let	file = FileUtils.getFile("ProfD", [self.storageFile]),
					ostream = FileUtils.openSafeFileOutputStream(file),
					converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Ci.nsIScriptableUnicodeConverter);

			converter.charset = "UTF-8";
			let istream = converter.convertToInputStream(dataString);
			NetUtil.asyncCopy(istream, ostream, function asyncCopy(status) {
				if (!Components.isSuccessCode(status))
				{
					log.error("error saving storage file");
					return;
				}
				self.storage = data;
				self.storageString = dataString;
			});
log.debug("storage file save finished", self.storageWrite);
		}
		if (async === false)
			write()
		else 
			self.storageWrite.timer = coomanPlusCore.async(write, async, self.storageWrite.timer, true);
	},//storageWrite()

}
coomanPlusCore.prefs = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService).getBranch(coomanPlusCore.PREF_BRANCH);
coomanPlusCore.prefsDefault = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService).getDefaultBranch(coomanPlusCore.PREF_BRANCH);
coomanPlusCore.pref.timers = {};
coomanPlusCore.pref.prefs = {}; //this will hold cached preferences.
coomanPlusCore.pref.types = {
	boolean: "Bool",
	number: "Int",
//	string: "Char"
}
Services.scriptloader.loadSubScript("chrome://cookiesmanagerplus/content/dump.js");
coomanPlusCore.log = log;
log.folder = "";
log.title = "CM+";
log.showCaller = 3;
Services.scriptloader.loadSubScript("chrome://cookiesmanagerplus/content/constants.js");
coomanPlusCore.EMAIL = EMAIL;
coomanPlusCore.HOMEPAGE = HOMEPAGE;
coomanPlusCore.SUPPORTSITE = SUPPORTSITE;
coomanPlusCore.ISSUESSITE = ISSUESSITE;
coomanPlusCore.ADDONDOMAIN = ADDONDOMAIN;
coomanPlusCore.SUPPORTSITEQUERY = SUPPORTSITEQUERY;
coomanPlusCore.storageRead();


coomanPlusCore.prefs.QueryInterface(Ci.nsIPrefBranch).addObserver('', coomanPlusCore.onPrefChange, false);

let l = coomanPlusCore.prefs.getChildList("");

for(let i of l)
	coomanPlusCore.onPrefChange.observe(coomanPlusCore.prefs, "nsPref:changed", i);

log.logLevel = coomanPlusCore.pref.prefs.debug || 1;
coomanPlusCore.prevVersion = coomanPlusCore.pref("version");
if (coomanPlusCore.pref("version") && Cc["@mozilla.org/xpcom/version-comparator;1"]
		.getService(Ci.nsIVersionComparator).compare(coomanPlusCore.pref("version"), "1.13") < 0)
{
	(function()
	{
		if (coomanPlusCore.storage && coomanPlusCore.storage.constructor.name == "Array")
		{
			coomanPlusCore.storage = {
				v: coomanPlusCore.storageVersion,
				select: coomanPlusCore.storage
			}
		}
		let file = FileUtils.getFile("ProfD", ["cookiesManagerPlusReadonly.json"]),
				fstream = Cc["@mozilla.org/network/file-input-stream;1"].createInstance(Ci.nsIFileInputStream),
				cstream = Cc["@mozilla.org/intl/converter-input-stream;1"].createInstance(Ci.nsIConverterInputStream),
				data = "";
		try
		{
			fstream.init(file, -1, 0, 0);
			cstream.init(fstream, "UTF-8", 0, 0);
			let str = {},
					read = 0;
			do
			{
				read = cstream.readString(0xffffffff, str); // read as much as we can and put it in str.value
				data += str.value;
			} while (read != 0);
			cstream.close(); // this closes fstream
			coomanPlusCore.storage.readonly = JSON.parse(data);
		}catch(e){};
		try
		{
			file.remove(false)
		}catch(e){}

		for(let i in coomanPlusCore.storageStructure)
		{
			if (!(i in coomanPlusCore.storage))
				coomanPlusCore.storage[i] = coomanPlusCore.storageStructure[i];
		}
		coomanPlusCore.storage.v = coomanPlusCore.storageVersion;
		try
		{
			coomanPlusCore.storage.persist = JSON.parse(coomanPlusCore.pref("persist"));
			coomanPlusCore.prefs.clearUserPref("persist");
		}catch(e){log.error(e)};
		coomanPlusCore.storageWrite();
	})()
}//v1.13 update
else if (coomanPlusCore.pref("version") && Cc["@mozilla.org/xpcom/version-comparator;1"]
		.getService(Ci.nsIVersionComparator).compare(coomanPlusCore.pref("version"), "1.13.2") < 0)
{
	if (coomanPlusCore.readonlyList() instanceof Array)
		coomanPlusCore.readonlyList({});
}//v1.13.2 update

for(let i in coomanPlusCore.storageStructure)
{
	if (!(i in coomanPlusCore.storage))
		coomanPlusCore.storage[i] = coomanPlusCore.storageStructure[i];
}
if (!coomanPlusCore.storage.v)
	coomanPlusCore.storage.v = coomanPlusCore.storageVersion;

let observer = Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);

observer.addObserver(coomanPlusCore, "cookie-changed", false);
observer.addObserver(coomanPlusCore, "private-cookie-changed", false);
observer.addObserver(coomanPlusCore, "profile-change-net-teardown", false);
//coomanPlusCore.readonlyLoad();
log.debug.startTime = new Date();
log.debug("coomanPlusCore.jsm loaded");
AddonManager.getAddonByID(coomanPlusCore.GUID, function(addon)
{
	let __dumpName__ = "log";
	coomanPlusCore.addon = addon;
});
