Components.utils.import("resource://cookiesmanagerplus/coomanPlusCore.jsm");

var coomanPlus = {
	load: function load()
	{
		window.removeEventListener("load", coomanPlus.load, true);
		coomanPlusCore.async(coomanPlus.init, 1000);
	},
	unload: function unload()
	{
		window.removeEventListener("focus", coomanPlus.winFocus, true);
	},
	winFocus: function(e)
	{
		coomanPlusCore.window = window;
	},
	init: function init()
	{

		window.addEventListener("focus", coomanPlus.winFocus, true);
		
coomanPlusCore.log.debug("start load");

/*
//open console window on startup
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
			coomanPlus.update();

coomanPlusCore.log.debug("end load", 1);
	},
	openCookieEditor: function openCookieEditor(args)
	{
		args = typeof(args) == "undefined" ? {} : args
		args.window = window;
		coomanPlusCore.openCMP(args);
	},
	menu: function menu(e)
	{
		let m = document.getElementById("coomanPlus_button_menu"),
				m2 = document.getElementById("coomanPlus_tools_menuitem"),
				m3 = document.getElementById("coomanPlus_appmenu_menuitem"),
				host;
		try
		{
			host = gBrowser.currentURI.host;
		}
		catch(er){};
if (coomanPlusCore.pref("debug") & 4) coomanPlusCore.log(gBrowser.currentURI, 1);
		if (host && ["http","https"].indexOf(gBrowser.currentURI.scheme) != -1)
		{
			m.label = this.strings.site + ": " + host;
			m2.label = this.strings.site + ": " + host;
			if (m3)
				m3.label = this.strings.site + ": " + host;
			
			document.getElementById("coomanPlus_tools_menuitem").hidden = false;
		}
		else
		{
			if (!e)
			{
				this.openCookieEditor();
				return false;
			}

			document.getElementById("coomanPlus_tools_menuitem").hidden = true;
		}
		return true;
	},
}

window.addEventListener("load", coomanPlus.load, true);

