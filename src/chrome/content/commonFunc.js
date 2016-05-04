log.debug("commonFunc.js loaded");

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

coomanPlus.string = function(s)
{
	if (s in this.strings)
		return this.strings[s];

	try
	{
		return this._cb.getString(s);
	}
	catch(e)
	{
		if ("_cb2" in this)
		try
		{
			return this._cb2.getString(s);
		}
		catch(e)
		{
			log.error("String is missing: " + s);
		}
	}
}

coomanPlus.getExpiresString = function(expires, format)
{
	format = format || this.pref("dateformat")
	if (typeof(expires) == "number" && expires > 0)
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
	return expires == -1 ? "--" : this.string("expireAtEndOfSession");
}

coomanPlus._isSelected = function _isSelected(aCookie, list, r, ignoreval)
{
	try
	{
		list = !list || typeof(list) == "undefined" ? this._selected : list;
		r = typeof(r) == "undefined" ? [] : r;
		
		for(let i = 0; i < list.length; i++)
		{
			if (this._cookieEquals(list[i], aCookie, ignoreval))
			{
				r[0] = i;
				return true;
			}
		}
		return false;
	}
	catch(e)
	{
		log.error(e);
	}
}

coomanPlus.isExists = function _isExists(aCookie, callback)
{
	if (aCookie.type == coomanPlusCore.COOKIE_NORMAL)
		callback(coomanPlusCore._cm2.cookieExists(aCookie));
	else
		this.html5.isExists(aCookie, callback);

}

coomanPlus._cookieEquals = function _cookieEquals(aCookieA, aCookieB, noval)
{
	let hashA = aCookieA.hash,
			hashB = aCookieB.hash;
//HTML5 cookies don't have path, therefore value used when created hash. If noval is true, we need recreate hash without the value
	if (noval
			&& ((aCookieA.type == coomanPlusCore.COOKIE_HTML5 && aCookieA.value === ""
				|| aCookieB.type == coomanPlusCore.COOKIE_HTML5 && aCookieB.value === "")))
	{
		hashA = this.cookieHash({
			host: aCookieA.host,
			path: aCookieA.path,
			name: aCookieA.name
		});
		hashB = this.cookieHash({
			host: aCookieB.host,
			path: aCookieB.path,
			name: aCookieB.name
		});
	}
	else
	{
		if (!hashA)
		{
			try
			{
				hashA	= this.cookieHash(aCookieA);
				aCookieA.hash = hashA;
			}catch(e){}
		}
		if (!hashB)
		{
			try
			{
				hashB = this.cookieHash(aCookieB);
				aCookieB.hash = hashB;
			}catch(e){}
		}
	}
	if (hashA && hashB)
		return hashA == hashB;
/*	let r = typeof(aCookieA) == "object"
					&& typeof(aCookieB) == "object"
	if (!r)
		return false;
*/
	let	typeA = typeof(aCookieA.type) == "undefined" ? coomanPlusCore.COOKIE_NORMAL : aCookieA.type;
			typeB = typeof(aCookieB.type) == "undefined" ? coomanPlusCore.COOKIE_NORMAL : aCookieB.type;

	let r =	typeA == typeB &&
			aCookieA.host == aCookieB.host &&
			aCookieA.name == aCookieB.name &&
			aCookieA.path == aCookieB.path
	if (!r)
		return false;

	if (noval)
		return true;

	return (typeA == coomanPlusCore.COOKIE_NORMAL
		|| (typeA != coomanPlusCore.COOKIE_NORMAL && aCookieA.value == aCookieB.value))

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
coomanPlus.cookieAdd = function cookieAdd(aCookie, callback)
{
	aCookie.type = typeof(aCookie.type) == "undefined" ? coomanPlusCore.COOKIE_NORMAL : aCookie.type;
	let r = true,
			self = this;
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
	if (aCookie.type == coomanPlusCore.COOKIE_NORMAL)
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
															aCookie.expires || Math.round((new Date()).getTime() / 1000 + 9999999999)
			);
		}
		catch(e)
		{
			log.error(e);
			r = false;
		}
		cookieAddContinue(r)
	}
	else if (aCookie.type == coomanPlusCore.COOKIE_HTML5)
	{
		this.html5.add(aCookie, cookieAddContinue);
	}
	return r;
}//cookieAdd()

coomanPlus.cookieRemove = function cookieRemove(aCookie, callback)
{
	switch(aCookie.type)
	{
		case coomanPlusCore.COOKIE_NORMAL:
			let result;
			result = coomanPlusCore._cm.remove(aCookie.host,
																					aCookie.name,
																					aCookie.path,
																					aCookie.block,
																					aCookie.originAttributes);
			if (typeof(callback) == "function")
				callback(result)

			break;
		case coomanPlusCore.COOKIE_HTML5:
			this.html5.remove(aCookie, function cookieRemove_callback(result)
			{
				if (aCookie.block)
				{
					let	uri = Services.io.newURI(aCookie.proto + "://" + aCookie.host.replace(/^\./, ""), null, null),
							principal = Services.scriptSecurityManager.createCodebasePrincipal(uri, {});

	log.debug(uri);
	log.debug(principal);
					Services.perms.addFromPrincipal(principal, "cookie", Ci.nsICookiePermission.ACCESS_DENY);
				}
				if (typeof(callback) == "function")
					callback(result)
			});
			break;
		default:
			log.error("Error deleting cookie - unknown type");
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

coomanPlus.cookieObject = function(aCookie, sel, updated)
{
	this._aCookie				= aCookie;
	this._index					= -1;
	this._indexAll			= -1;
	this.name					= aCookie.name;
	this.value				= aCookie.value;
	this.isDomain			= aCookie.isDomain;
	this.host					= aCookie.host;
	this.rawHost			= aCookie.rawHost ? aCookie.rawHost : coomanPlus.getRawHost(aCookie.host);
	this.simpleHost		= this.rawHost.charAt(0) == "." ? this.rawHost.substring(1, this.rawHost.length) : this.rawHost.match(/^www\./) ? this.rawHost.replace(/^www\./, "") : this.rawHost;
	this.rootHost			= this.rawHost.replace(/^.*\.([^.]+\.[^.]+)$/, "$1");
	this.path					= aCookie.path;
	this.isSecure			= aCookie.isSecure;
	this.expires			= aCookie.expires;
	this.policy				= aCookie.policy;
	this.status				= typeof(aCookie.status) == "undefined" ? null : aCookie.status;
	this.isSession		= typeof(aCookie.isSession) == "undefined" ? null : aCookie.isSession;
	this.expiry				= typeof(aCookie.expiry) == "undefined" ? null : aCookie.expiry;
	this.creationTime	= typeof(aCookie.creationTime) == "undefined" ? null : aCookie.creationTime;
	this.lastAccessed	= typeof(aCookie.lastAccessed) == "undefined" ? null : aCookie.lastAccessed;
	this.isHttpOnly		= typeof(aCookie.isHttpOnly) == "undefined" ? null : aCookie.isHttpOnly;
	this.sel					= typeof(sel) == "undefined" ? false : sel;
	this.isProtected	= coomanPlus.protect.enabled ? coomanPlus.protect.obj.isProtected(this) : false;
	this.updated			= typeof(updated) == "undefined" ? null : updated;
	this.type					= typeof(aCookie.type) == "undefined" ? coomanPlusCore.COOKIE_NORMAL : aCookie.type;
	this.proto				= typeof(aCookie.proto) == "undefined" ? "http" : aCookie.proto;
	this.port					= typeof(aCookie.port) == "undefined" ? 80 : aCookie.port;
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
		let iLen = String(str).length;
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
		}catch(e){}
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
		type: "CookieKeeper",
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

				coomanPlus.protect.id = self.type;
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
				}
				if (startup && coomanPlus.infoRowsShow)
					coomanPlus.infoRowsShow(true);
log.debug("end", 1);
			});
		},//init()
		unload: function protect_CookieKeeper_unload(shutdown)
		{
			this.inited = coomanPlus.protect.enabled = coomanPlus.protect.inited = false;
			if (!shutdown)
			{
log.debug("protect observer removed");
				this.obs.removeObserver(this, this.OBS_TOPIC, false);
				this.observerAdded = false;
			}
			else if (coomanPlus.infoRowsShow) //only for main window
				coomanPlus.infoRowsShow(true);
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
				let item = this.addHelpers(coomanPlus.html5.cookieToHTML5(cookies[i])),
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

				let p = !CookieKeeper.removeProtectedItem(this.addHelpers(coomanPlus.html5.cookieToHTML5(cookies[i])));
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
					else if (data.pstorage)
						aCookie = coomanPlus.html5.getCookieObject(data.pstorage.scope, data.pstorage.key, "", data.pstorage.key, "");

					if (!aCookie)
						return;
					coomanPlus._isSelected(aCookie, coomanPlus._cookies, r, true);
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
					try
					{
						coomanPlus._cookiesTree.treeBoxObject.invalidateRange(coomanPlus._cookiesTree.treeBoxObject.getFirstVisibleRow(), coomanPlus._cookiesTree.treeBoxObject.getLastVisibleRow());
						coomanPlus._cookiesTree.treeBoxObject.invalidate();
					}catch(e){log.error(e)}
					coomanPlusCore.async(function()
					{
						coomanPlus.cookieSelected(true);
					});
				}
			}
		},

		open: function open()
		{
			CookieKeeper.showMainWindow(window);
		}

	},//CookieKeeper

}//protect

coomanPlus.nsIScriptableUnicodeConverter = Cc["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Ci.nsIScriptableUnicodeConverter);
coomanPlus.nsICryptoHash = Cc["@mozilla.org/security/hash;1"].createInstance(Ci.nsICryptoHash);
coomanPlus.cookieHash = function cookieHash(obj, force, type)
{
//type: 0/undefined = base64, 1 = hex, 2 = binary;
	if (obj.hash && !force)
		return obj.hash;
	
	let	converter = this.nsIScriptableUnicodeConverter,
			ch = this.nsICryptoHash,
			str = JSON.stringify({
				host: obj.host,
				name: obj.name,
				path: obj.path,
				type: typeof(obj.type) == "undefined" ? coomanPlusCore.COOKIE_NORMAL : obj.type,
				value: typeof(obj.type) == "undefined" || obj.type == coomanPlusCore.COOKIE_NORMAL ? "" : obj.value
			}),
			result = {},
			hash,
			data;

	converter.charset = "UTF-8";
	data = converter.convertToByteArray(str, result);
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
}//cookieHash()

coomanPlus._match = function _match(str, needle, wildcard, start, type)
{
	needle = needle.replace(/[*]{2,}/g, "*");
	start = typeof(start) == "undefined" ? 0 : start;
	wildcard = typeof(wildcard) == "undefined" ? needle.match(/[*?]/) : wildcard;
	type = typeof(type) == "undefined" ? 0 : type;
	switch (type)
	{
		case 1:
			let website = needle.toLowerCase(),
					host = str.toLowerCase();
			if (str == needle)
				return true;

			let p = -1,
					l = website.lastIndexOf(".");
			while(1)
			{
				p = website.indexOf(".", p+1);
				if (p == -1 || p == l)
					break;

				if (host == website.substring(p))
					return true;
			}
			break;
		case 2:
			return str == needle
			break;
	}
	let r = new RegExp('"([^"]+)"', ""),
			exact = needle.match(r),
			host, name, value;
	if (exact)
		needle = exact[1];
	if (wildcard)
	{
		let r = new RegExp((exact ? "^" : "")+ needle.replace(/\*/g, ".*").replace(/\?/g, ".") + (exact ? "$" : ""), "");
		return str.substring(start).match(r);
	}
	else
	{
		if (exact)
			return str.substring(start) == needle;

		return str.substring(start).indexOf(needle) != -1;
	}
}
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

coomanPlus.isMac = coomanPlusCore.os == "Darwin";

/*
coomanPlus.openChanges = function openChanges()
{
	if (this.window && this.window.switchToTabHavingURI)
		this.window.switchToTabHavingURI("chrome://" + coomanPlusCore.ADDONDOMAIN + "/content/changes.xul", true);
	else
		this._openDialog("changes.xul", "_blank", "chrome,resizable=yes,centerscreen");
}
*/
(coomanPlus.observer = {
	_observerService: Cc["@mozilla.org/observer-service;1"]
														.getService(Ci.nsIObserverService),
	_name: "coomanPlusWindow",
	init: function init()
	{
		this._observerService.addObserver(this, this._name, false);
		window.addEventListener("unload", function() { coomanPlus.observer.uninit(); }, false);
	},

	uninit: function uninit()
	{
		this._observerService.removeObserver(this, this._name);
	},

	observe: function observe(aSubject, aTopic, aData)
	{
		aSubject.QueryInterface(Components.interfaces.nsISupportsString);
		if (aTopic != this._name || !coomanPlus[aSubject.data])
			return;

		coomanPlus[aSubject.data](aData);
	},
}).init();
coomanPlus.protect.init(false);


window.addEventListener("load", coomanPlus.listKeys, false);
log.debug("commonFunc.js loaded");