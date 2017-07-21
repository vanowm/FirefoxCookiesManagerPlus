String.prototype.trim = function()
{
	return this.replace(/^\s+|\s+$/g,"");
}
coomanPlus.trim = function(s)
{
	return s.replace(/^\s+|\s+$/g,"");
}

coomanPlus.numberClean = function(s)
{
	return s.replace(/-[^0-9]/g,"");
}

coomanPlus.clone = function(o)
{
	let n = {};
	for(let i in o)
		n[i] = o[i];
	return n;
}

coomanPlus.getExpiresString = function(expires, format)
{
	format = typeof(format) == "undefined" ? this.pref("dateformat") : format;
	if (expires)
	{
		let date;
		if (format)
		{
			date = this.date(format,  expires);
			if (date)
				return date;
		}
		date = new Date(1000 * expires)
		return coomanPlusCore._ds.FormatDateTime(1,	coomanPlusCore._ds.dateFormatLong,
																			coomanPlusCore._ds.timeFormatSeconds,
																			date.getFullYear(),
																			date.getMonth() + 1,
																			date.getDate(),
																			date.getHours(),
																			date.getMinutes(),
																			date.getSeconds()
																	);

	}
	return this.string("expireAtEndOfSession");
}

coomanPlus.string = function(s)
{
	if (this.strings && s in this.strings)
		return this.strings[s];
	for(let i = 0; i < this._cb.length; i++)
	{
		let cb = this._cb[i];
		try
		{
			return cb.getString(s);
		}
		catch(e){}
	}
	log.error("String is missing: " + s);
}

coomanPlus._cookieEquals = function _cookieEquals(aCookieA, aCookieB, checkAttrib)
{
	let r = true;
	if (aCookieA.hash && aCookieB.hash)
		return aCookieA.hash == aCookieB.hash;

	if (checkAttrib)
	{
		if (!aCookieA.originAttributes || !aCookieB.originAttributes)
			r = false;
		else
		{
			for(let i in aCookieA.originAttributes)
				r = r && aCookieA.originAttributes[i] == aCookieB.originAttributes[i];
		}
	}
	return	r &&
					aCookieA.host == aCookieB.host &&
					aCookieA.name == aCookieB.name &&
					aCookieA.path == aCookieB.path;
}

coomanPlus._cookieGetExtraInfo = function(aCookie)
{
	if (aCookie.extra)
		return aCookie;

	let list = coomanPlusCore._cm2.getCookiesFromHost(aCookie.host);
	while (list.hasMoreElements())
	{
		let c = list.getNext();
		if (!c || !(c instanceof Ci.nsICookie))
			break;
		if (this._cookieEquals(aCookie, c))
		{
			aCookie = new this.cookieObject(c.QueryInterface(Ci.nsICookie2), aCookie.sel, aCookie.added);
			aCookie.extra = true;
			break;
		}
	}
	return aCookie;
}

coomanPlus.cookieObject = function(aCookie, sel, updated)
{
	if (!"_aCookie" in aCookie)
		this._aCookie = aCookie._aCookie;
	else
		this._aCookie			= aCookie;

/*
	this.nameRaw			= aCookie.name;
	try
	{
//		this.name				= decodeURIComponent(aCookie.name);
	}
	catch(e)
	{
		this.name 			= aCookie.name;
	}
*/
	this.name 				= aCookie.name;
	this.value 				= aCookie.value;
/*
	this.valueRaw			= aCookie.value;
	try
	{
		this.value			= decodeURIComponent(aCookie.value);
	}
	catch(e)
	{
		this.value 			= aCookie.value;
	}
*/
	this.isDomain			= aCookie.isDomain;
	this.host					= aCookie.host;
	this.rawHost			= aCookie.rawHost ? aCookie.rawHost : coomanPlus.getRawHost(aCookie.host);
//	this.simpleHost		= this.rawHost.charAt(0) == "." ? this.rawHost.substring(1, this.rawHost.length) : this.rawHost.match(/^www\./) ? this.rawHost.replace(/^www\./, "") : this.rawHost;
	this.simpleHost		= this.rawHost.charAt(0) == "." ? this.rawHost.substring(1, this.rawHost.length) : this.rawHost.replace(/^www\./, "");
	this.rootHost			= this.rawHost.replace(/^.*\.([^.]+\.[^.]+)$/, "$1");
	this.path					= aCookie.path;
	this.isSecure			= aCookie.isSecure;
	this.expires			= aCookie.expires;
	this.policy				= aCookie.policy;
	this.status				= aCookie.status;
	this.isSession		= aCookie.isSession;
	this.expiry				= aCookie.expiry;
	this.creationTime	= aCookie.creationTime;
	this.lastAccessed	= aCookie.lastAccessed;
	this.isHttpOnly		= aCookie.isHttpOnly;
/*
	this.status				= typeof(aCookie.status) == "undefined" ? null : aCookie.status;
	this.isSession		= typeof(aCookie.isSession) == "undefined" ? null : aCookie.isSession;
	this.expiry				= typeof(aCookie.expiry) == "undefined" ? null : aCookie.expiry;
	this.creationTime	= typeof(aCookie.creationTime) == "undefined" ? null : aCookie.creationTime;
	this.lastAccessed	= typeof(aCookie.lastAccessed) == "undefined" ? null : aCookie.lastAccessed;
	this.isHttpOnly		= typeof(aCookie.isHttpOnly) == "undefined" ? null : aCookie.isHttpOnly;
	this.sel					= typeof(sel) == "undefined" ? false : sel;
*/

	this.sel					= sel;
	this.isProtected	= coomanPlus.protect.enabled ? coomanPlus.protect.obj.isProtected(this) : false;
//	this.updated			= typeof(updated) == "undefined" ? null : updated;
	this.updated			= updated;
	this.type 				= coomanPlusCore.COOKIE_NORMAL;
	this.readonly			= false;
//	this.valueSize 		= coomanPlus.getByteSize(this.value);
//	this.valueSizeText= coomanPlus.getByteSizeText(this.valueSize);
	this.size 				= coomanPlus.getByteSize(this.name + "=" + this.value);
	this.sizeText			= coomanPlus.getByteSizeText(this.size);
	this.originAttributes = aCookie.originAttributes === undefined ? {} : aCookie.originAttributes;
	this.originAttributesText =  JSON.stringify(this.originAttributes);
}

coomanPlus.resizeWindow = function(f)
{
	let	w = document.getElementById("main").boxObject.width,
			h = document.getElementById("main").boxObject.height;
//log([f, [w + "x" + h], [document.width + "x" + document.height]], 1);
	if (f || document.width < w || document.height < h)
		window.resizeTo(w,h);
//		window.sizeToContent();
}

coomanPlus.clearUserPref = function(p)
{
	if (coomanPlusCore.prefs.prefHasUserValue(p))
		coomanPlusCore.prefs.clearUserPref(p);
}

coomanPlus.right = function(str, n)
{
	if (n <= 0)
		return "";

	else if (n > String(str).length)
		return str;

	else
	{
		var iLen = String(str).length;
		return String(str).substring(iLen, iLen - n);
	}
}

coomanPlus.left = function(str, n)
{
	if (n <= 0)
		return "";
	else if (n > String(str).length)
		return str;
	else
		return String(str).substring(0,n);
}

coomanPlus._openDialog = function(url, b, c, arg)
{

	let wm = Cc['@mozilla.org/appshell/window-mediator;1'].getService(Ci.nsIWindowMediator),
			wins = wm.getZOrderDOMWindowEnumerator('', false),
			win;
	if (!url.match("/"))
		url = "chrome://cookiesmanagerplus/content/" + url;

	if (typeof(arg) == "undefined")
		arg = {};

	arg.window = window;
	arg.document = document;
	arg.wrappedJSObject = arg;
	while (win = wins.getNext())
	{
		if (win.location.href.toString() == url)
		{
			if (!arg.multiple)
			{
				win.focus();
				if (win.coomanPlus && win.coomanPlus.focus)
					win.coomanPlus.focus(arg)

				return;
			}
		}
	}
/*
	Cc["@mozilla.org/embedcomp/window-watcher;1"]
		.getService(Ci.nsIWindowWatcher)
		.openWindow(null, a, b, c, arg);
*/
	window.openDialog(url, b, c, arg);
}

coomanPlus.alert = function(msg, title)
{
	let promptService = Cc["@mozilla.org/embedcomp/prompt-service;1"]
											.getService(Ci.nsIPromptService);
	promptService.alert(window, title || msg, msg);
}

coomanPlus.confirm = function(msg, title)
{
	let prompts = Cc["@mozilla.org/embedcomp/prompt-service;1"].getService(Ci.nsIPromptService),
			flags = prompts.BUTTON_POS_0 * prompts.BUTTON_TITLE_YES +
							prompts.BUTTON_POS_1 * prompts.BUTTON_TITLE_NO;

	return !prompts.confirmEx(null, title, msg, flags, "", "", "", null, {value: false});
}

coomanPlus.cookieAdd = function cookieAdd(aCookie, callback)
{
	aCookie.type = typeof(aCookie.type) == "undefined" ? coomanPlusCore.COOKIE_NORMAL : aCookie.type;
	let r = true,
			self = this;

	coomanPlusCore.readonlyAdd(aCookie);
	function cookieAddContinue(r)
	{
		if (self.protect.enabled && aCookie.isProtected !== null)
		{
			let prot = aCookie.isProtected;
			aCookie.isProtected = !prot;
			self.protect.obj[prot ? "protect" : "unprotect"](aCookie, true);
			aCookie.isProtected = prot;
		}
		if (typeof(callback) == "function")
			callback(r)

		return r;
	}
	if (!aCookie.type || aCookie.type == coomanPlusCore.COOKIE_NORMAL)
	{
		try
		{
			coomanPlusCore._cm2.add(aCookie.host,
															aCookie.path,
															aCookie.name,
															aCookie.value,
															aCookie.isSecure,
															aCookie.isHttpOnly,
															(aCookie.expires) ? false : true,
															aCookie.expires || Math.round((new Date()).getTime() / 1000 + 9999999999),
															typeof(aCookie.originAttributes) != "undefined"
																? aCookie.originAttributes
																: aCookie._aCookie && typeof(aCookie._aCookie.originAttributes) != "undefined"
																	? aCookie._aCookie.originAttributes 
																	: {}
			);
		}
		catch(e)
		{
			log.error(e);
			r = false;
		}
		cookieAddContinue(r)
	}
	return r;
}//cookieAdd()

coomanPlus.cookieRemove = function cookieRemove(aCookie, callback)
{
	let type = typeof(aCookie.type) == "undefined" ? coomanPlusCore.COOKIE_NORMAL : aCookie.type;
	switch(type)
	{
		case coomanPlusCore.COOKIE_NORMAL:
log.debug("normal cookie");
			let result;
			let readonlyList = coomanPlusCore.readonlyCheck(aCookie);
			if (readonlyList)
				coomanPlusCore.readonlyRemove(aCookie);
			try
			{
/*
log({host: aCookie.host,
		name: aCookie.name,
		path: aCookie.path,
		block: aCookie.block,
		originAttributes: typeof(aCookie.originAttributes) != "undefined"
				? aCookie.originAttributes
				: aCookie._aCookie && typeof(aCookie._aCookie.originAttributes) != "undefined"
					? aCookie._aCookie.originAttributes 
				: {}}, 3);
*/
				if (aCookie.block)
				{
					let perm = Cc["@mozilla.org/permissionmanager;1"].getService(Ci.nsIPermissionManager),
							ioService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService),
							scheme = ["http", "https"],
							host = aCookie.host.replace(/^\./, '');
					for(let i = 0; i < scheme.length; i++)
					{
						try
						{
							perm.add(ioService.newURI(scheme[i] + "://" + host, null, null), "cookie", Ci.nsIPermissionManager.DENY_ACTION);
						}
						catch(e)
						{
							log.error(e);
						}
					}
				}
				result = coomanPlusCore._cm.remove(	aCookie.host,
																						aCookie.name,
																						aCookie.path,
																						aCookie.block,
																						typeof(aCookie.originAttributes) != "undefined"
																							? aCookie.originAttributes
																							: aCookie._aCookie && typeof(aCookie._aCookie.originAttributes) != "undefined"
																								? aCookie._aCookie.originAttributes 
																								: {}
				);
			}
			catch(e)
			{
				log.error(e);
			}
			if (typeof(callback) == "function")
				callback(result)

			break;
		default:
			log.error("Error deleting cookie - unknown type");
			if (typeof(callback) == "function")
				callback(result)
	}
}

coomanPlus._isSelected = function _isSelected(aCookie, list, r, checkAttrib)
{
	if (list.length && list[0].constructor.name != "String")
	{
		let l = [];
		for(let i = 0; i < list.length; i++)
			l.push(coomanPlusCore.cookieHash(list[i]));

		list = l;
	}
	try
	{
		list = !list || typeof(list) == "undefined" ? this._selected : list;
		r = typeof(r) == "undefined" ? [] : r;
		
		for(let i = 0; i < list.length; i++)
		{
			if (this._cookieEquals({hash: list[i]}, aCookie, checkAttrib))
			{
				r[0] = i;
				return true;
			}
		}
		return false;
	}
	catch(e)
	{
//		log.error(e);
	}
}

coomanPlus.getRawHost = function getRawHost(host)
{
	let r = host;
	if (/^(::){0,1}([0-9a-fA-F]{1,4}:)+[0-9a-fA-F]{1,4}$/.test(host))
	{
		r = "[" + host + "]";
	}
	else if (!/^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/.test(host))
	{
		try 
		{
			if (host.charAt(".") >= 0)
			{
				r = host.charAt(0) == "." ? host.substring(1) : host;
				r = Services.eTLD.getBaseDomainFromHost(r);
			} // else maybe a local domain, like 'localhost'
		}
		catch (e)
		{
			let r = host.split(".").reverse();
			r = r[1] + "." + r[0];
		}
	}
	return r;
}//getRawHost()

coomanPlus.protect = {
	inited: false,
	enabled: false,
	name: "",
	icon: "",
	id: null,
	init: function protect_init(f, startup)
	{
log.debug("start" + this.inited);
		f = typeof(f) == "undefined" ? false : f
		if (this.inited && !f)
			return;

		coomanPlusCore.isProtect = false;
		this.enabled = false;
		try
		{
			this.CookieKeeper.init(startup);
		}
		catch(e){log.error(e)}

		this.inited = true;
	},//init()

	unload: function protect_unload()
	{
		try
		{
			this.CookieKeeper.unload();
		}catch(e){log.error(e)}
	},

	get obj()
	{
		return this.id && this.id in this ? this[this.id] : this.objDefault;
	},

	objDefault:
	{
		type: null,
		init: function init(){},
		isProtected: function isProtected(){},
		protect: function protect(){},
		unprotect: function unprotect(){},
		open: function open(){},
		unload: function unload(){},
	},
	
	CookieKeeper:
	{
		id: "CookieKeeper",
		inited: false,
		coomanPlus: coomanPlus,
		obs: Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService),
		OBS_TOPIC: "cookiekeeper-change",
		OBS_STARTUP: "startup",
		OBS_SHUTDOWN: "shutdown",
		observerAdded: false,

		addHelpers: function(aCookie)
		{
			if (!("equals" in aCookie))
				if (!("type" in aCookie) || aCookie.type == coomanPlusCore.COOKIE_NORMAL)
				{
					aCookie.equals = function(aItem)
					{
						return	typeof(aItem) == "object" &&
										aItem.getType() == CookieKeeper.COOKIE_TYPE_STANDARD &&
										aItem.host == this.host &&
										aItem.name == this.name &&
										aItem.path == this.path
					}
				}
				else
				{
					aCookie.equals = function(aItem)
					{
						// aItem can be a protected storage, or a dom storage
						return  aItem !=  null &&
										aItem.getType() == CookieKeeper.COOKIE_TYPE_STORAGE &&
										this.scope === aItem.scope &&
										this.key === aItem.key;
					}
				}
			if (!("getHost" in aCookie))
				aCookie.getHost = function()
				{
					return this.host;
				}
			if (!("getName" in aCookie))
				aCookie.getName = function()
				{
					return this.name;
				}
			if (!("getType" in aCookie))
				if (!("type" in aCookie) || aCookie.type == coomanPlusCore.COOKIE_NORMAL)
				{
					aCookie.getType = function()
					{
						return CookieKeeper.COOKIE_TYPE_STANDARD;
					}
				}
				else
				{
					aCookie.getType = function()
					{
						return CookieKeeper.COOKIE_TYPE_STORAGE;
					}
				}
			if (!("getRawHost" in aCookie))
				aCookie.getRawHost = function()
				{
					return this.rawHost;
				}

			return aCookie;
		},
		init: function protect_CookieKeeper_init(startup)
		{
log.debug("start" + this.inited);
			if (this.inited)
				return;

			let self = this;
			Cu.import("resource://gre/modules/AddonManager.jsm");
			AddonManager.getAddonByID("cookiekeeper@cookiekeeper.mozdev.org", function(a)
			{
				if (!a)
					return;
				
				try
				{
					Cu.import("resource://cookiekeeper/cookiekeeper.jsm");
				}
				catch(e){}

				if (!self.observerAdded)
				{
log.debug("protect observer added");
					self.obs.addObserver(self, a.isActive ? CookieKeeper.OBS_TOPIC : self.OBS_TOPIC, false);
					self.observerAdded = true;
				}
				if (!a.isActive || !CookieKeeper)
					return;

				self.name = a.name;
				self.icon = a.iconURL;
				self.protectedList = CookieKeeper.getProtectedItems();

				coomanPlus.protect.id = self.id;
				self.inited = true;
				coomanPlusCore.isProtect = true;
				coomanPlus.protect.enabled = true;
				self.OBS_TOPIC = CookieKeeper.OBS_TOPIC;
				self.OBS_STARTUP = CookieKeeper.OBS_STARTUP;
				self.OBS_SHUTDOWN = CookieKeeper.OBS_SHUTDOWN;
				let obj = $("protect_menu");
				if (obj)
				{
					obj.label = obj.getAttribute("_label").replace("$NAME$", self.name)
					obj.setAttribute("image", self.icon);
					$("protect_btn").setAttribute("image", self.icon);
					$("unprotect_btn").setAttribute("image", self.icon);
					$("menu_protect").setAttribute("image", self.icon);
					$("menu_unprotect").setAttribute("image", self.icon);
					$("tree_menu_protect").setAttribute("image", self.icon);
					$("tree_menu_unprotect").setAttribute("image", self.icon);
				}
				if (startup && coomanPlus.infoRowsShow)
				{
					coomanPlusCore.async(function()
					{
						coomanPlus.loadCookies();
						coomanPlus.infoRowsShow(true);
					});
				}
log.debug("end", 1);
			});
		},//init()
		unload: function protect_CookieKeeper_unload(shutdown)
		{
log.debug();
			this.inited = coomanPlus.protect.enabled = coomanPlus.protect.inited = false;
			if (!shutdown)
			{
log.debug("protect observer removed");
				if (this.observerAdded)
					this.obs.removeObserver(this, this.OBS_TOPIC, false);

				this.observerAdded = false;
			}
			else if (coomanPlus.infoRowsShow) //only for main window
				coomanPlus.infoRowsShow(true);
log.debug("end", 1);
		},

		isProtected: function protect_CookieKeeper_isProtected(aCookie)
		{
			if (!("type" in aCookie._aCookie) || aCookie.type == coomanPlusCore.COOKIE_NORMAL)
				return CookieKeeper.isProtectedItem(this.addHelpers({
					type: coomanPlusCore.COOKIE_NORMAL,
					host: aCookie.host,
					path: aCookie.path,
					name: aCookie.name
				}));
			else
				return CookieKeeper.isProtectedItem(this.addHelpers({
					key: aCookie._aCookie.key,
					type: aCookie._aCookie.type,
					scope: aCookie._aCookie.scope
				}));
		},

		protect: function protect_CookieKeeper_protect(cookies, norefresh)
		{
			norefresh = typeof(norefresh) == "undefined" ? false : norefresh;
			let self = coomanPlus.protect;
			if (!self.enabled)
				return

log.debug();
			let sel = false
			if (!cookies)
			{
				sel = true;
				let s = coomanPlus.getTreeSelections(coomanPlus._cookiesTree);
				if (!s)
					return;

				cookies = []
				for(let i = 0; i < s.length; i++)
					cookies.push(coomanPlus._cookies[s[i]]);
			}
			else if (!(cookies instanceof Array))
				cookies = [cookies];

			for(let i = 0; i < cookies.length; i++)
			{
				if(cookies[i].isProtected)
					continue;

				let item = this.addHelpers(cookies[i]),
						p = CookieKeeper.addProtectedItem(item);

				cookies[i].isProtected = p;
			}
			if (norefresh)
				return;

			coomanPlus._cookiesTree.treeBoxObject.invalidateRange(coomanPlus._cookiesTree.treeBoxObject.getFirstVisibleRow(), coomanPlus._cookiesTree.treeBoxObject.getLastVisibleRow());
//			coomanPlus._cookiesTree.treeBoxObject.invalidate();
			if (sel)
				coomanPlus.cookieSelected();
		},//protect()

		unprotect: function unprotect(cookies, norefresh, force)
		{
			norefresh = typeof(norefresh) == "undefined" ? false : norefresh;
			let self = coomanPlus.protect;
			if (!self.enabled)
				return

log.debug();
			let sel = false
			if (!cookies)
			{
				sel = true;
				let s = coomanPlus.getTreeSelections(coomanPlus._cookiesTree);
				if (!s)
					return;

				cookies = []
				for(let i = 0; i < s.length; i++)
					cookies.push(coomanPlus._cookies[s[i]]);
			}
			else if (!(cookies instanceof Array))
				cookies = [cookies];

			for(let i = 0; i < cookies.length; i++)
			{
				if(!cookies[i].isProtected)
					continue;

				let p = !CookieKeeper.removeProtectedItem(this.addHelpers(cookies[i]));
				cookies[i].isProtected = p;
			}
			if (norefresh)
				return;

			coomanPlus._cookiesTree.treeBoxObject.invalidateRange(coomanPlus._cookiesTree.treeBoxObject.getFirstVisibleRow(), coomanPlus._cookiesTree.treeBoxObject.getLastVisibleRow());
//				coomanPlus._cookiesTree.treeBoxObject.invalidate();
			if (sel)
				coomanPlus.cookieSelected();
		},//unprotect()

		observe: function protect_CookieKeeper_observe(aSubject, aTopic, aData)
		{
log.debug(aTopic);
			let self = coomanPlus.protect.CookieKeeper;
			if (aTopic == self.OBS_TOPIC)
			{
				if (aData == self.OBS_STARTUP)
				{
					coomanPlus.protect.init(true,true);
				}
				else if (aData == self.OBS_SHUTDOWN)
				{
					self.unload(true);
				}
				else
				{
					let	data = aSubject.wrappedJSObject,
							aCookie = null,
							r = [];
					if (data.pcookie)
						aCookie = new coomanPlus.cookieObject({host: data.pcookie.host, name: data.pcookie.name, path: data.pcookie.path});
/*
					else if (data.pstorage)
						aCookie = coomanPlus.html5.getCookieObject(data.pstorage.scope, data.pstorage.key, "", data.pstorage.key, "");
*/
					if (!aCookie)
						return;

					coomanPlus._isSelected(aCookie, coomanPlus._cookies, r);
					try
					{
						coomanPlus._cookies[r[0]].isProtected = aData == CookieKeeper.OBS_ADD;
						if (coomanPlus._cookies[r[0]].indexAll != -1)
							coomanPlus._cookiesAll[coomanPlus._cookies[r[0]].indexAll].isProtected = coomanPlus._cookies[r[0]].isProtected;

					}
					catch(e)
					{
//CookieKeeper doesn't return value for HTML5, which makes it impossible get properly which cookie was affected
//						log.error(e)
					}
					this._async = coomanPlusCore.async(function()
					{
						try
						{
							coomanPlus._cookiesTree.treeBoxObject.invalidateRange(coomanPlus._cookiesTree.treeBoxObject.getFirstVisibleRow(), coomanPlus._cookiesTree.treeBoxObject.getLastVisibleRow());
							coomanPlus._cookiesTree.treeBoxObject.invalidate();
						}catch(e){}
					}, 0, this.async);
					this._async2 = coomanPlusCore.async(function()
					{
						try
						{
							coomanPlus.cookieSelected(true);
						}catch(e){};
					}, 100, this._async2);
				}
			}
		},

		open: function open()
		{
			CookieKeeper.showMainWindow(window);
		}

	},//CookieKeeper

}//protect

coomanPlus.accel = "CONTROL";
coomanPlus.keysList = null;
coomanPlus.matchKeys = function(k, l, len)
{
	if (k.length != l.length || (len && k.length < len))
		return false;

	for(let i = 0; i < l.length; i++)
	{
		if (k.indexOf(this.getAccel(l[i])) == -1)
		{
			return false;
		}
	}
	return true;
}

coomanPlus.getKeys = function(e)
{
	let keys = [],
			keycode = this.getAccel(this.keysList[e.keyCode]);
	if(e.ctrlKey) keys.push(this.getAccel("CONTROL"));
	if(e.altKey) keys.push(this.getAccel("ALT"));
	if(e.metaKey) keys.push(this.getAccel("META"));
	if(e.shiftKey) keys.push(this.getAccel("SHIFT"));

	let modifiers = keys.slice();
	if (keys.indexOf(keycode) == -1)
		keys.push(keycode);
	return [keys, [modifiers, keycode]];
}

coomanPlus.getAccel = function(a)
{
	return this.accel == a ? "ACCEL" : a;
}

coomanPlus.listKeys = function()
{
	if (coomanPlus.keysList !== null)
		return;

	coomanPlus.keysList = [];
	for (let property in KeyEvent)
		coomanPlus.keysList[KeyEvent[property]] = property.replace("DOM_VK_","");

}

coomanPlus.unescape = function unescape(str)
{
	let r = str;
	try
	{
		r = JSON.stringify(JSON.parse(r), null, 2);
	}
	catch(e)
	{
		r = r.replace(/%0A/ig, "\n")
				.replace(/%0D/ig, "\r")
				.replace(/%09/g, "\t");
	}
	return r;
}
coomanPlus.escape = function escape(str)
{
	let r = str;
	try
	{
		r = JSON.stringify(JSON.parse(r), null, 0);
	}
	catch(e)
	{
		r = r.replace(/\n/g, "%0A")
				.replace(/\r/g, "%0D")
				.replace(/\t/g, "%09");
	}
	return r;
}

coomanPlus.getByteSize = function getByteSize(s)
{
  return encodeURIComponent('' + s).length;
}

coomanPlus.getByteSizeText = function getByteSizeText(b)
{
	if (!b)
		return "0 B";

	let i = Math.floor(Math.log(b) / Math.log(1024));
	return parseFloat((b / Math.pow(1024, i)).toFixed(2)) + " " + ["B", "KB", "MB", "GB", "TB", "PB"][i];
}

coomanPlus.openEdit = function openEdit(param)
{
log.debug();
	param = typeof(param) == "undefined" ?  {type: "edit"} : param;
	if (param.type == "new")
	{
		param.cookies = this.getTreeSelections(this._cookiesTree).length ? [this._cookies[this._cookiesTree.view.selection.currentIndex]] : null;
	}
	else
	{
		if (!param.cookies)
		{
			let s = this.getTreeSelections(this._cookiesTree);
			if (!s.length)
			{
				this.openAdd();
				return;
			}
			let selIndex = s.indexOf(this._cookiesTree.view.selection.currentIndex);
			selIndex = s[((selIndex == -1) ? 0 : selIndex)]

			param.cookies = [this._cookies[selIndex]];
			for(let i = 0; i < s.length; i++)
			{
				if (s[i] != selIndex)
					param.cookies[param.cookies.length] = this._cookies[s[i]];
			}
		}
	}
//		this._openDialog("editCookie.xul", "_blank", "chrome,resizable=yes,centerscreen,dialog=no," + (this.isMac ? "dialog=no" : "modal"), {type: "edit", cookies: cookies});
	this._openDialog("editCookie.xul", "_blank", "chrome,resizable,centerscreen,dialog" + (this.isMac ? "" : "=no"), param);
}//openEdit();

coomanPlus.nsIScriptableUnicodeConverter = Cc["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Ci.nsIScriptableUnicodeConverter);
coomanPlus.nsICryptoHash = Cc["@mozilla.org/security/hash;1"].createInstance(Ci.nsICryptoHash);

coomanPlus.backupPersist = function backupPersist(obj, backup)
{
	if (!obj)
		return;

	let self = coomanPlus.backupPersist;

	if (!self.data)
		self.data = {}

	if (!backup)
		backup = self.data;

	if (obj.id)
	{
		let persist = [],
				i = 0
		try
		{
			if (obj.hasAttribute("persist"))
				persist = obj.getAttribute("persist").split(" ");
		}catch(e){}
		while(i < persist.length)
		{
			let attr = persist[i++].trim();
			if (["", "screenX", "screenY", "autocompletesearchparam"].indexOf(attr) != -1)
				continue;

			if (!backup[obj.id])
				backup[obj.id] = {};

//			if (obj.hasAttribute(attr))
				backup[obj.id][attr] = obj.getAttribute(attr);
//WTF! without set ordinal on splitters, they break when attempting read an attribute???
			if (attr == "ordinal")
			{
				d = 0;
				while(d < obj.parentNode.childNodes.length)
				{
					if (obj.parentNode.childNodes[d].tagName == "splitter")
						obj.parentNode.childNodes[d].setAttribute(attr, d);

					d++;
				}
			}
		}
	}
	let i = 0;
	while(i < obj.childNodes.length)
	{
		self(obj.childNodes[i++], backup);
	}
}//backupPersist()

coomanPlus.resetPersist = function resetPersist(obj, backup)
{
log.debug();
	if (!backup)
		backup = coomanPlus.backupPersist.data;
	let XULStore,
			skip = ["", "screenX", "screenY"];
	try
	{
		XULStore = Cc["@mozilla.org/xul/xulstore;1"].getService(Ci.nsIXULStore);
	}catch(e){}
	if (XULStore && window.location)
	{
		let url = window.location.href,
				enumerator = XULStore.getIDsEnumerator(url);
//clean up xulstore.json
		while(enumerator.hasMore())
		{
			let id = enumerator.getNext(),
					attrEnum = XULStore.getAttributeEnumerator(url, id)
			while(attrEnum.hasMore())
			{
				let attr = attrEnum.getNext();
				if (skip.indexOf(attr) != -1)
					continue;

				if (!backup || typeof(backup[id]) != "object" || !(attr in backup[id]))
				{
//log(id + ": " + attr + " = " + XULStore.getValue(url, id, attr), 1);
					XULStore.removeValue(url, id, attr);
				}
			}
		}
	}

	function resetPersist(obj)
	{
		let persist = [],
				i = 0
		try
		{
			if (obj.hasAttribute("persist"))
				persist = obj.getAttribute("persist").split(" ");
		}catch(e){}
		while(i < persist.length)
		{
			let attr = persist[i++].trim();
			if (skip.indexOf(attr) != -1)
				continue;

			let d = backup[obj.id][attr] || obj.getAttribute("_" + attr);
			obj.setAttribute(attr, d);
			if (attr == "ordinal")
			{
				d = 0;
				while(d < obj.parentNode.childNodes.length)
				{
//					if (obj.parentNode.childNodes[d].tagName == "splitter")
						obj.parentNode.childNodes[d].setAttribute(attr, d);

					d++;
				}
			}
		}
	}
	if (!obj)
	{
		for(let id in backup)
		{
			let obj = $(id);
			if (!obj)
				continue;

			resetPersist(obj);
		}
		return;
	}
	let self = coomanPlus.resetPersist;
	if (obj.id)
		resetPersist(obj)

	let i = 0;
	while(i < obj.childNodes.length)
	{
		self(obj.childNodes[i++], backup);
	}
}//resetPersist()

coomanPlus.checkReset = function checkReset(id)
{
	if (coomanPlusCore.storage.reset && coomanPlusCore.storage.reset[id])
	{
log.debug();
		let param = {};
		param.wrappedJSObject = coomanPlusCore.storage.reset[id];
		this.command("reset", param);
	}
}

coomanPlus.checkRestore = function checkRestore(id)
{
log.debug();
	if (coomanPlusCore.storage.restore && coomanPlusCore.storage.restore[id])
	{
		this.command("restore");
	}
}

coomanPlus.backupPersist.data = {};
coomanPlus.os = Cc["@mozilla.org/xre/app-info;1"].getService(Ci.nsIXULRuntime).OS;
coomanPlus.appInfo = Cc["@mozilla.org/xre/app-info;1"].getService(Ci.nsIXULAppInfo);
coomanPlus.isMac = coomanPlus.os == "Darwin";
coomanPlus.isWin = coomanPlus.os == "WINNT";
if (!coomanPlus.noFuncInit)
{
	(coomanPlus.observer = {
		_observerService: Cc["@mozilla.org/observer-service;1"]
															.getService(Ci.nsIObserverService),
		_name: "coomanPlusWindow",
		init: function()
		{
			this._observerService.addObserver(this, this._name, false);
			window.addEventListener("unload", function() { coomanPlus.observer.uninit(); }, false);
		},

		uninit: function()
		{
			this._observerService.removeObserver(this, this._name);
		},

		observe: function(aSubject, aTopic, aData)
		{
			aSubject.QueryInterface(Components.interfaces.nsISupportsString);
			if (aTopic != this._name || !coomanPlus[aSubject.data] || typeof(coomanPlus[aSubject.data]) != "function")
				return;

			coomanPlus[aSubject.data](aData);
		},
	}).init();
	coomanPlus.protect.init(false);
	window.addEventListener("load", coomanPlus.listKeys, false);
}

if (coomanPlus.exec)
{
	let com;
	while(com = coomanPlus.exec.splice(0, 1)[0])
	{
		com();
	}
}
/*

coomanPlusCore.async(function()
{
let perm = Cc["@mozilla.org/permissionmanager;1"].getService(Ci.nsIPermissionManager),
		enumerator = perm.enumerator,
		permList = [],
		permDomains = [],
		i = 0;

log(Cc["@mozilla.org/permissionmanager;1"].getService(Ci.nsIPermissionManager), 1);

while (enumerator.hasMoreElements())
{
	let n = enumerator.getNext();
	if (n.type == "cookie" && n.capability == perm.DENY_ACTION)
	{
log(n, 2);
		permList.push(n);
		permDomains.push(n.principal.URI.host);
	}
}
log(permDomains,1);
});
*/