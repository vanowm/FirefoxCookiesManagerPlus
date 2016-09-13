//wrap code into anonymous function to prevent polution
var coomanPlus = (function()
{
Components.utils.import("resource://cookiesmanagerplus/coomanPlusCore.jsm");
let $ = function $(id)
		{
			return document.getElementById(id);
		},
		log = coomanPlusCore.log;
return {
	pref: coomanPlusCore.pref,
	buttons: [
						"coomanPlus_button_menuitem",
						"coomanPlus_tools_menuitem",
						"coomanPlus_appmenu_menuitem"
	],
	load: function load()
	{
		window.removeEventListener("load", coomanPlus.load, true);
		coomanPlusCore.async(coomanPlus.init, 1000);
	},
	unload: function unload()
	{
		let self = coomanPlus;
//		coomanPlusCore.windowRemove(window);
		window.removeEventListener("focus", self.winFocus, true);
		let observer = Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);
		observer.removeObserver(self, "cmp-command", false);
		coomanPlusCore.window = null;
	},
	winFocus: function(e)
	{
		coomanPlusCore.window = window;
	},
	init: function init()
	{
		let self = coomanPlus;
		window.addEventListener("focus", self.winFocus, true);
//		coomanPlusCore.windowAdd(window);
//		self.setActions();
log.debug("start load sysoverlay");

//open console window on startup
/*
try
{
 toErrorConsole();
}
catch(e)
{
	try
	{
		HUDService.toggleBrowserConsole();
	}
	catch(e)
	{
		try
		{
			toJavaScriptConsole();
		}
		catch(e){}
	}
}
*/
//	window.inspectDOMNode(window.document);



		if (!coomanPlusCore.updateChecked)
			self.update();

		let observer = Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);
		observer.addObserver(self, "cmp-command", false);
log.debug("end load sysoverlay", 1);
	},

	openCookieEditor: function openCookieEditor(type)
	{
		if (!type || type == 2)
		{
			let host;
			try
			{
				host = gBrowser.currentURI.host;
			}
			catch(er){};
			if (!host || ["http","https"].indexOf(gBrowser.currentURI.scheme) == -1)
				type = 1;
		}
		let args = {};
		if (type == 2 || (!type && this.pref("buttonaction")))
			args = {gBrowser: gBrowser};

		args = typeof(args) == "undefined" ? {} : args
		args.window = window;
		coomanPlusCore.openCMP(args);
	},

	menu: function menu(e)
	{
		let mi = coomanPlus.buttons,
				host,
				icon = "";
		try
		{
			host = gBrowser.currentURI.host;
		}
		catch(er){};
		if (!host || ["http","https"].indexOf(gBrowser.currentURI.scheme) == -1)
			host = this.strings.na;

		if (host != this.strings.na)
		{
			icon = gBrowser.getIcon();
		}

		for(let i = 0; i < mi.length; i++)
		{
			let m = $(mi[i] + "2");

			if (!m)
				continue;

			m.label = this.strings.site + ": " + host;
			m.disabled = host == this.strings.na;
			m.setAttribute("image", icon);
		}
		this.setActions(host != this.strings.na && this.pref("buttonaction"))
		return true;
	},

	observe: function observe(aTopic, aSubject, aData)
	{
		let self = coomanPlus;
		if (aSubject == "cmp-command")
			return self.command(aData,aTopic);

	},

	command: function command(com, data)
	{
log.debug();
		switch(com)
		{
			case "buttonaction":
				this.setActions();
				break;
		}
	},//command()

	setActions: function setActions(type)
	{
log.debug();
		type = typeof(type) == "undefined" ? this.pref("buttonaction") : type;
		type = type ? 2 : "";
		
		let mi = this.buttons;
		for(let i = 0; i < mi.length; i++)
		{
			let m = $(mi[i]);
			if (!m)
				continue;

			if (type)
			{
				m.removeAttribute("default");
				$(mi[i] + "2").setAttribute("default", true);
			}
			else
			{
				$(mi[i] + "2").removeAttribute("default");
				m.setAttribute("default", true);
			}
		}
	},

}})();

window.addEventListener("load", coomanPlus.load, true);

