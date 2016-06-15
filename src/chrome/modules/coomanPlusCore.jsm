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
	readonlyList: {},
	readonlyFile: "cookiesManagerPlusReadonly.json",
	readonlyFileSaved: true,
	readonlyFileScheduled: false,
	autocomplete: [],
	async: function async(callback, time, timer)
	{
		if (timer)
			timer.cancel();
		else
			timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);

		timer.init({observe: function()
		{
			timer.cancel();
			callback();
		}}, time || 0, timer.TYPE_ONE_SHOT);
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
			self.pref("persist", JSON.stringify(self._backups));
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
		observe: function(aSubject, aTopic, aKey)
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
				log.logLevel = self.pref("debug") || 1;

			if (aKey == "buttonaction")
			{
				self.notify("buttonaction");
			}
		}
	},//onPrefChange

	shutdown: function shutdown()
	{
		let save = this.readonlyCleanup();
		if (save || !this.readonlyFileSaved)
			this.readonlySave(false);
	},//shutdown()
	observe: function observe(aTopic, aSubject, aData)
	{
log.debug();
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

				while(aCookie = cookies[i++])
				{
					let hash = this.cookieHash(aCookie);
					if (!this.readonlyList[hash])
						continue;

					let newCookie = {
						host: aCookie.host,
						path: aCookie.path,
						name: aCookie.name,
						value: aCookie.value,
						isSecure: aCookie.isSecure,
						isHttpOnly: aCookie.isHttpOnly,
						expires: aCookie.expires
					},
					deleted = aData == "deleted" || aData == "batch-deleted",
					save = deleted;
					for(let i in this.readonlyList[hash])
					{
						if (newCookie[i] != this.readonlyList[hash][i])
						{
							newCookie[i] = this.readonlyList[hash][i];
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

log.debug("Attempt to change readonly cookie " + newCookie.name + "@" + newCookie.host + ", restoring readonly data");

						if (newCookie.expires * 1000 < (new Date()).getTime())
							newCookie.expires = (new Date()).getTime() / 1000 + 1;  //we can't add expired cookies, adding 1 sec

						this._cm2.add(newCookie.host,
													newCookie.path,
													newCookie.name,
													newCookie.value,
													newCookie.isSecure,
													newCookie.isHttpOnly,
													(newCookie.expires) ? false : true,
													newCookie.expires);
					}
				}
				break;
		}

	},//observe()
	readonlyAdd: function readonlyAdd(aCookie)
	{
log.debug();
		this.readonlyFileSaved = false
		if (!aCookie.readonly)
			return this.readonlyRemove(aCookie);

		let hash = this.cookieHash(aCookie),
				i = 0;

		aCookie.hash = hash;
		if (!this.readonlyList[hash])
			this.readonlyList[hash] = {}


		for(let f in aCookie.readonly)
		{
			this.readonlyList[hash][f] = aCookie[f];
			i++;
		}
		if (!i)
			this.readonlyRemove(aCookie)
		else
			this.readonlySave();

	},//readonlyAdd()
	
	readonlyRemove: function readonlyRemove(aCookie)
	{
		this.readonlyFileSaved = false
		let hash = this.cookieHash(aCookie);

		aCookie.hash = hash;
		aCookie.readonly = false;
		delete this.readonlyList[hash];
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
		return this.readonlyList[hash] ? this.readonlyList[hash] : false;
	},//readonlyCheck()

	readonlySave: function readonlySave(async)
	{
		async = typeof(async) == "undefined" ? 30000 : async;
log.debug();
		function save()
		{
			coomanPlusCore.readonlyFileScheduled = false;
			let self = coomanPlusCore,
					list = JSON.stringify(self.readonlyList),
					data = list;


			if (data == self.readonlySaveLast)
				return;

			if (self.pref("readonlyencrypt"))
			{
				try
				{
//					data = JSON.stringify({e:self.sdr.encrypt(data)});
					data = JSON.stringify({e:self.sdr.encryptString(data)});
				}
				catch(e){log.error(e)}
			}

			let file = FileUtils.getFile("ProfD", [self.readonlyFile]),
					ostream = FileUtils.openSafeFileOutputStream(file),
					converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Ci.nsIScriptableUnicodeConverter);

			converter.charset = "UTF-8";
			let istream = converter.convertToInputStream(data);
		// The last argument (the callback) is optional.
			NetUtil.asyncCopy(istream, ostream, function asyncCopy(status)
			{
				if (!Components.isSuccessCode(status))
				{
					self.readonlySaveLast = null;
					log.error("error saving readonly file");
					return;
				}
				self.readonlySaveLast = list;
log.debug("end save readonly list file " + file.path);
				coomanPlusCore.readonlyFileSaved = true;
			});
		}
		if (async === false)
		{
			if (this.readonlySave.timer)
				this.readonlySave.timer.cancel();

			save()
		}
		else if (!coomanPlusCore.readonlyFileScheduled)
		{
			coomanPlusCore.readonlyFileScheduled = true;
			this.readonlySave.timer = this.async(save, async, this.readonlySave.timer);
		}

	},//readonlySave()
	
	readonlyLoad: function readonlyLoad()
	{
log.debug();
		let file = FileUtils.getFile("ProfD", [this.readonlyFile]),
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
			let text = data;
			data = JSON.parse(data);
			if ("e" in data)
			{
				try
				{
//					text = this.sdr.decrypt(data.e);
					text = this.sdr.decryptString(data.e);
					data = JSON.parse(text);
				}
				catch(e)
				{
					data = null;
					log.error(e);
				}
			}
			this.readonlySaveLast = text;

			if (data)
				this.readonlyList = data;

		}catch(e){log.error(e)};
	},//readonlyLoad()

	readonlyCleanup: function readonlyCleanup()
	{
		let e = coomanPlusCore._cm.enumerator,
				list = [],
				i = 0,
				hash,
				save = false;

		while (e.hasMoreElements())
		{
			let aCookie = e.getNext();
			if (!aCookie || !(aCookie instanceof Ci.nsICookie))
				break;

			list.push(this.cookieHash(aCookie));
		}
		for(hash in this.readonlyList)
		{
			if (list.indexOf(hash) == -1)
			{
				delete this.readonlyList[hash];
				save = true;
			}
			else
			{
				let ro = this.readonlyList[hash],
						i = 0;
				for(let n in ro)
				{
					i++;
				}
				if (!i)
				{
					delete this.readonlyList[hash];
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
	},
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
coomanPlusCore.prefs.QueryInterface(Ci.nsIPrefBranch).addObserver('', coomanPlusCore.onPrefChange, false);

let l = coomanPlusCore.prefs.getChildList("");

for(let i of l)
	coomanPlusCore.onPrefChange.observe(coomanPlusCore.prefs, "nsPref:changed", i);

log.logLevel = coomanPlusCore.pref.prefs.debug || 1;
coomanPlusCore.prevVersion = coomanPlusCore.pref("version");
let observer = Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);

observer.addObserver(coomanPlusCore, "cookie-changed", false);
observer.addObserver(coomanPlusCore, "private-cookie-changed", false);
observer.addObserver(coomanPlusCore, "profile-change-net-teardown", false);
coomanPlusCore.readonlyLoad();
log.debug.startTime = new Date();
log.debug("coomanPlusCore.jsm loaded");
AddonManager.getAddonByID(coomanPlusCore.GUID, function(addon)
{
	let __dumpName__ = "log";
	coomanPlusCore.addon = addon;
});
