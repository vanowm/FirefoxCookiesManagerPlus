const EXPORTED_SYMBOLS = ["coomanPlusCore"],
			{classes: Cc, interfaces: Ci, utils: Cu} = Components;
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/AddonManager.jsm");

var	self = this,
		log = function(){},
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

	openCMP: function openCMP(args)
	{
		args = typeof(args) == "undefined" ? {} : args
		args.wrappedJSObject = args;
		let win = this.cmpWindow;
		if (win)
		{
			if (win.coomanPlus.focus)
				win.coomanPlus.focus(args, true);

			win.focus();
		}
		else
		{
			let ww = Components.classes["@mozilla.org/embedcomp/window-watcher;1"]
												 .getService(Components.interfaces.nsIWindowWatcher);
			win = ww.openWindow(null, "chrome://cookiesmanagerplus/content/cookiesmanagerplus.xul",
													"coomanPlusWindow", "chrome,resizable,dialog=no,toolbar=no,statusbar=no,scrollbar=no,centerscreen", args);
//			win.focus();
		}
	},//openCMP()

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

	onPrefChange: {
		observe: function(aSubject, aTopic, aKey)
		{
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

			coomanPlusCore.pref.prefs[aKey] = v;
			if (aKey == "debug")
				log.logLevel = coomanPlusCore.pref("debug");
		}
	}
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

AddonManager.getAddonByID(coomanPlusCore.GUID, function(addon)
{
	let __dumpName__ = "log";
	coomanPlusCore.addon = addon;
	coomanPlusCore.prefs.QueryInterface(Ci.nsIPrefBranch).addObserver('', coomanPlusCore.onPrefChange, false);
	Services.scriptloader.loadSubScript(addon.getResourceURI("dump.js").spec, self);
	coomanPlusCore.log = log;
	Services.scriptloader.loadSubScript(addon.getResourceURI("chrome/content/constants.js").spec, self);
	coomanPlusCore.EMAIL = EMAIL;
	coomanPlusCore.HOMEPAGE = HOMEPAGE;
	coomanPlusCore.SUPPORTSITE = SUPPORTSITE;
	coomanPlusCore.ISSUESSITE = ISSUESSITE;
	coomanPlusCore.ADDONDOMAIN = ADDONDOMAIN;

	log.folder = "";
	log.title = "CM+";
	log.showCaller = 3;
	let l = coomanPlusCore.prefs.getChildList("");

	for(let i of l)
		coomanPlusCore.onPrefChange.observe(coomanPlusCore.prefs, "nsPref:changed", i);

	log.logLevel = coomanPlusCore.pref.prefs.debug;
	coomanPlusCore.prevVersion = coomanPlusCore.pref("version");
	log.debug.startTime = new Date();
	log.debug("coomanPlusCore.jsm loaded");
});
