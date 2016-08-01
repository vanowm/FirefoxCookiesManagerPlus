(function()
{

let log = coomanPlusCore.log;
coomanPlus.CHANGESLOG_NONE = 0;
coomanPlus.CHANGESLOG_FULL = 4;
coomanPlus.CHANGESLOG_NOTIFICATION = 1;
coomanPlus.CHANGESLOG_NOTIFICATION2 = 2;
coomanPlus.notification = Cc['@mozilla.org/alerts-service;1'].getService(Ci.nsIAlertsService);
coomanPlus.notificationAvailable = (coomanPlus.notification && coomanPlus.notification.showAlertNotification);
coomanPlus.strings = {};
coomanPlus.string = function(s)
{
		return this.strings[s];
}

coomanPlus.openChanges = function()
{
	coomanPlus.showChangesLog(coomanPlusCore.pref("showChangesLog"));
}

Object.defineProperty(coomanPlus, "getOpenURL", {get: function getOpenURL()
{
	let func
	try
	{
		func = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
						.getInterface(Components.interfaces.nsIWebNavigation)
						.QueryInterface(Components.interfaces.nsIDocShellTreeItem)
						.rootTreeItem
						.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
						.getInterface(Components.interfaces.nsIDOMWindow)
						.switchToTabHavingURI;
	}catch(e){}

	if (func)
		return func;

	if (coomanPlusCore.window)
		func = coomanPlusCore.window.switchToTabHavingURI;

	if (func)
		return func;

	if (coomanPlus.window)
		func = coomanPlus.window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
					.getInterface(Components.interfaces.nsIWebNavigation)
					.QueryInterface(Components.interfaces.nsIDocShellTreeItem)
					.rootTreeItem
					.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
					.getInterface(Components.interfaces.nsIDOMWindow)
					.switchToTabHavingURI;

	if (func)
		return func;

	return null;
}});
coomanPlus.options = function(standalone)
{
	coomanPlusCore.openOptions({standalone: standalone ? true : false});
//	this._openDialog("options.xul", "", "chrome,resizable=yes,centerscreen,dialog=no," + (this.isMac ? "dialog=no" : "modal"), {standalone: standalone ? true : false});
//	this._openDialog("options.xul", "options", "chrome,resizable=yes,centerscreen,dialog" + (this.isMac ? "" : "=no"), {standalone: standalone ? true : false});
}

coomanPlus._openDialog = function(a, b, c, arg)
{

	let	wm = Cc['@mozilla.org/appshell/window-mediator;1'].getService(Ci.nsIWindowMediator),
			browsers = wm.getZOrderDOMWindowEnumerator('', false),
			browser;

	if (!a.match("/"))
		a = "chrome://" + coomanPlusCore.ADDONDOMAIN + "/content/" + a;

	while (browser = browsers.getNext())
	{
		if (browser.location.href.toString() == a)
		{
			browser.focus();
			return;
		}
	}
	if (typeof(arg) == "undefined")
		arg = {};

	arg.window = window;
	arg.document = document;
/*
	Cc["@mozilla.org/embedcomp/window-watcher;1"]
		.getService(Ci.nsIWindowWatcher)
		.openWindow(null, a, b, c, arg);
*/
	try
	{
		window.openDialog(a, b, c, arg);
	}
	catch(e)
	{
		coomanPlusCore.window.openDialog(a, b, c, arg);
	}
}
coomanPlus.showChangesLog = function(type, demo)
{
	if (typeof(type) == "undefined" || type & coomanPlus.CHANGESLOG_FULL)
	{
		if (coomanPlus.getOpenURL)
			coomanPlus.getOpenURL("chrome://" + coomanPlusCore.ADDONDOMAIN + "/content/changes.xul", true);
	}

	let addon = coomanPlusCore.addon,
			updated = coomanPlus.string("updated").replace("{old}", "v" + coomanPlusCore.prevVersion).replace("{new}", "v" + addon.version);
	if (type & coomanPlus.CHANGESLOG_NOTIFICATION)
		try
		{
			let str = "",
					mp = coomanPlus,
					notifListener = {
						observe: function(aSubject, aTopic, aData)
						{
							if (aTopic == 'alertclickcallback')
							{
								mp.showChangesLog();
							}
						}
					};
			if (Components.classes["@mozilla.org/xpcom/version-comparator;1"]
					.getService(Components.interfaces.nsIVersionComparator)
					.compare(coomanPlusCore.appInfo.version, "8.0") > 0)
			{
				let	utf8Converter = Components.classes["@mozilla.org/intl/utf8converterservice;1"].getService(Components.interfaces.nsIUTF8ConverterService),
						ioService = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService),
						scriptableStream = Components.classes["@mozilla.org/scriptableinputstream;1"].getService(Components.interfaces.nsIScriptableInputStream),
						aURL = addon.getResourceURI("changes.txt").spec,
						channel,
						input
				try
				{
					//FF48 WHAT THE FUCK, MOZILLA?! HOW ABOUT YOU UPDATE THE DAMN DOCUMENTATION BEFORE YOU REMOVE SHIT WITHOUT BACKWARDS COMPATIBILITY?
					channel = ioService.newChannel2(aURL,null,null,
																					null,      // aLoadingNode
																					Services.scriptSecurityManager.getSystemPrincipal(),
																					null,      // aTriggeringPrincipal
																					Components.interfaces.nsILoadInfo.SEC_NORMAL,
																					Components.interfaces.nsIContentPolicy.TYPE_INTERNAL_IMAGE
					);
				}
				catch(e)
				{
					channel = ioService.newChannel(aURL,null,null);
				}
				input = channel.open();
	
				scriptableStream.init(input);
				str = scriptableStream.read(input.available());
				scriptableStream.close();
				input.close();
				str = utf8Converter.convertURISpecToUTF8 (str, "UTF-8");
				str = str.replace(/\t/g, "  ");
				function RegExpEscape(string)
				{
					return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
				}
				let strV = (new RegExp("(^v" + RegExpEscape(addon.version) + " \\([\\s\\S]+)" , "m")).exec(str),
						prevVersion = coomanPlusCore.prevVersion.replace("-signed", "");
	
				if (strV)
				{
					str = strV[1];
					if (demo && prevVersion == addon.version)
					{
						let v,l = [],
								r = new RegExp("[\\s\\S]{2}^v([a-z0-9.]+) \\(", "mig");
	
						while (v = r.exec(str))
							l.push(v[1]);
	
						if (l.length)
							prevVersion = l[Math.floor(Math.random() * l.length)];
	
					}
					strV = (new RegExp("([\\s\\S]+)^v" + RegExpEscape(prevVersion) + " \\(" , "m")).exec(str);
					if (strV)
						str = strV[1];
	
				}
			}

			coomanPlus.notification.showAlertNotification('chrome://' + coomanPlusCore.ADDONDOMAIN + '/skin/images/coomanPlus64.png',
																										addon.name + " " + updated,
																										str.replace(/^\s+|\s+$/g, ""),
																										true,
																										null,
																										notifListener,
																										addon.name + " " + updated);
		}catch(e){coomanPlusCore.log.error(e);}

	let win = coomanPlusCore.window;

	if (win && type & coomanPlus.CHANGESLOG_NOTIFICATION2 && win.gBrowser && win.document.getElementById("notification-popup"))
	{
			let pn = win.PopupNotifications,
					id = null,
					browser = win.gBrowser ? win.gBrowser.selectedBrowser : null;
//		try
//		{
		coomanPlusCore.async(function()
		{
			if (coomanPlusCore._notify)
				coomanPlusCore._notify.remove()


			coomanPlusCore._notify = pn.show(browser,
				"coomanPlus-update",
				addon.name + " " + updated,
				id, /* anchor ID */
				{
					label: coomanPlus.string("changesLog"),
					accessKey: coomanPlus.string("changesLog_key"),
					callback: function() {
						coomanPlus.showChangesLog()
					}
				},
				[
				{  /* secondary action */
					label: coomanPlus.string("label"),
					accessKey: coomanPlus.string("label_key"),
					callback: function()
					{
						coomanPlusCore._notify.remove();
						coomanPlusCore.openCMP();
					},
					dismiss: true
				},
				{  /* secondary action */
					label: coomanPlus.string("menu_options"),
					accessKey: coomanPlus.string("menu_options_key"),
					callback: function()
					{
						coomanPlusCore._notify.remove();
						coomanPlus.options();
					},
					dismiss: true
				},
				],
				{
					persistWhileVisible: true,
					learnMoreURL: coomanPlusCore.HOMEPAGE,
					hideNotNow: true,
					removeOnDismissal: demo ? true : false
				}
			);
			win.focus();
		}, 1000);
//		}catch(e){coomanPlusCore.log(e, 1)};
	}

}//openChanges()

coomanPlus.update = function update()
{
	if (coomanPlusCore.updateChecked)
		return;

	if (!coomanPlusCore.addon)
	{
		coomanPlusCore.async(coomanPlus.update)
		return;
	}
	let prefs = Cc["@mozilla.org/preferences-service;1"]
					.getService(Ci.nsIPrefService).getBranch("");

	function upgradeMS(o, n, d, g, s)
	{
		if (typeof(n) == "undefined")
			n = null;

		if (typeof(d) == "undefined")
			d = true;

		if (typeof(g) == "undefined")
			g = "Bool";

		if (typeof(s) == "undefined")
			s = g;

		let aCount = {value:0},
				r = null,
				c = null;

		prefs.getChildList(o, aCount);
		if( aCount.value != 0 )
		{
			try
			{
				if (g == "Complex")
				{
					r = prefs.getComplexValue(o, Ci.nsISupportsString).data;
				}
				else
					r = prefs['get' + g + 'Pref'](o)
			}
			catch(e)
			{
				r=null
			};
			if (d)
				try{prefs.deleteBranch(o)}catch(e){};

			if (n)
				if (s == "Complex")
				{
					let c = Cc["@mozilla.org/supports-string;1"].createInstance(Ci.nsISupportsString);
					c.data = r;
					coomanPlusCore.prefs.setComplexValue(n, Ci.nsISupportsString, c);
				}
				else
					coomanPlusCore.prefs['set' + s + 'Pref'](n, r);
		}
		return r;
	}


	let compare = Cc["@mozilla.org/xpcom/version-comparator;1"]
									.getService(Ci.nsIVersionComparator).compare,
			v = coomanPlusCore.prefs.getCharPref("version");
	coomanPlusCore.prevVersion = v;
	if (v != coomanPlusCore.addon.version)
	{
		try
		{
			let r;
			if (compare(v, "0.4") < 0)
			{
				r = upgradeMS("addneditcookies.lastsearch.host", null, true, "Char");
				if (r)
					document.getElementById('lookupcriterium').setAttribute("filter", r);

				upgradeMS("addneditcookies.displaydeleteconfirmation", "delconfirm");
			}
			if (compare(v, "1.0") < 0)
			{
				upgradeMS("extensions.addneditcookiesplus.autofilter", "autofilter");
				upgradeMS("extensions.addneditcookiesplus.autoupdate", "autoupdate");
				upgradeMS("extensions.addneditcookiesplus.topmost", "topmost");
			}
			if (compare(v, "1.3") < 0)
			{
				let extra = upgradeMS("extensions.cookiesmanagerplus.showextra");
				if (extra)
				{
					coomanPlusCore.prefs.setBoolPref("viewcreationtime", true);
					coomanPlusCore.prefs.setBoolPref("viewlastaccessed", true);
					coomanPlusCore.prefs.setBoolPref("viewishttponly", true);
					coomanPlusCore.prefs.setBoolPref("viewpolicy", true);
					coomanPlusCore.prefs.setBoolPref("viewstatus", true);
				}
				upgradeMS("extensions.cookiesmanagerplus.showextratree");
				upgradeMS("extensions.cookiesmanagerplus.clipboardtemplate", "templateclipboard", true, "Char");
			}
			if (compare(v, "1.5") < 0)
			{
				v = upgradeMS("extensions.cookiesmanagerplus.viewname");
				if (v !== null)
					document.getElementById("row_name").setAttribute("collapsed", !v);

				v = upgradeMS("extensions.cookiesmanagerplus.viewhost");
				if (v !== null)
					document.getElementById("row_host").setAttribute("collapsed", !v);

				v = upgradeMS("extensions.cookiesmanagerplus.viewvalue");
				if (v !== null)
					document.getElementById("row_value").setAttribute("collapsed", !v);

				v = upgradeMS("extensions.cookiesmanagerplus.viewpath");
				if (v !== null)
					document.getElementById("row_path").setAttribute("collapsed", !v);

				v = upgradeMS("extensions.cookiesmanagerplus.viewexpires");
				if (v !== null)
					document.getElementById("row_expires").setAttribute("collapsed", !v);

				v = upgradeMS("extensions.cookiesmanagerplus.viewissecure");
				if (v !== null)
					document.getElementById("row_isSecure").setAttribute("collapsed", !v);

				v = upgradeMS("extensions.cookiesmanagerplus.viewisprotected");
				if (v !== null)
					document.getElementById("row_isProtected").setAttribute("collapsed", !v);

				v = upgradeMS("extensions.cookiesmanagerplus.viewishttponly");
				if (v !== null)
					document.getElementById("row_isHttpOnly").setAttribute("collapsed", !v);

				v = upgradeMS("extensions.cookiesmanagerplus.viewlastaccessed");
				if (v !== null)
					document.getElementById("row_lastAccessed").setAttribute("collapsed", !v);

				v = upgradeMS("extensions.cookiesmanagerplus.viewcreationtime");
				if (v !== null)
					document.getElementById("row_creationTime").setAttribute("collapsed", !v);

				v = upgradeMS("extensions.cookiesmanagerplus.viewpolicy");
				if (v !== null)
					document.getElementById("row_policy").setAttribute("collapsed", !v);

				v = upgradeMS("extensions.cookiesmanagerplus.viewstatus");
				if (v !== null)
					document.getElementById("row_status").setAttribute("collapsed", !v);

				v = upgradeMS("extensions.cookiesmanagerplus.expireprogress");
				if (v !== null)
					document.getElementById("expireProgress").setAttribute("collapsed", !v);

				v = upgradeMS("extensions.cookiesmanagerplus.expirecountdown");
				if (v !== null)
					document.getElementById("expireProgressText").setAttribute("collapsed", !v);

				v = upgradeMS("extensions.cookiesmanagerplus.vieworder", null, true, "Char");
				if (v !== null)
					document.getElementById("cookieInfoRows").setAttribute("order", v);
			}
			if (compare(v, "1.5.1") < 0)
			{
				if (coomanPlusCore.prefs.prefHasUserValue("autoupdate"))
					v =	coomanPlusCore.prefs.getBoolPref("autoupdate");
				else
					v = true;

				coomanPlusCore.prefs.setBoolPref("autoupdate", v)
			}

			if (compare(v, "1.5.3") < 0)
			{
				upgradeMS("extensions.cookiesmanagerplus.cookieculler");
				upgradeMS("extensions.cookiesmanagerplus.cookiecullerdelete", "deleteprotected");
			}
			if (compare(v, "1.9") >= 0 && compare(v, "1.10") < 0)
			{
				coomanPlusCore.storage.reset = {main:["colsordinal"]};
			}
			if (compare(v, "1.12") < 0)
			{
				coomanPlusCore.storage.reset = {main:["update1_12"]};
				if (coomanPlusCore.pref("restoreselection") > 100)
					coomanPlusCore.pref("restoreselection", 100);
			}
			if (compare(v, "1.13") < 0)
			{
				coomanPlusCore.storage.reset = {main:["update1_13"]};
				coomanPlusCore.prefs.clearUserPref("reset");
				coomanPlusCore.prefs.clearUserPref("restore");
			}
		}
		catch(e)
		{
			log.error(e);
		}
		coomanPlusCore.pref("version", coomanPlusCore.addon.version);
		coomanPlusCore.async(coomanPlus.openChanges);
	}
	coomanPlusCore.updateChecked = true;
}
})();