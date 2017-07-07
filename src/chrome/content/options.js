 /* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Mozilla.org code.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.org.
 * Portions created by the Initial Developer are Copyright (C) 2004
 * the Initial Developer. All Rights Reserved.
 *
 * Author(s): Michael Ryabushkin
 *
 * ***** END LICENSE BLOCK ***** */

/*----------------------
 Contains some of the code is from Mozilla original Cookie Editor
 ----------------------*/
coomanPlusCore.lastKeyDown = [];

function $(id)
{
	return document.getElementById(id);
}
var coomanPlus = {
	standalone: true,
	winid: new Date(),
	_cb: [],
	instantApply: false,
	inited: false,
	pref: coomanPlusCore.pref,
	prefs: coomanPlusCore.prefs,
	html5: coomanPlusCore.html5,
	exec: [],
	load: function load()
	{
		coomanPlusCore.async(function()
		{
			coomanPlus.init();
		});
	},

	init: function init()
	{
log.debug();
		let self = this;
		this._cb.push($("cookieBundle"));
		document.title += " - " + coomanPlusCore.addon.name;
		this.strings.secureYes = this.string("forSecureOnly");
		this.strings.secureNo = this.string("forAnyConnection");
		this.test($("format"));
		this.instantApply = Cc["@mozilla.org/preferences-service;1"]
												.getService(Ci.nsIPrefBranch)
												.getBoolPref("browser.preferences.instantApply");

		coomanPlus.protect.init();
		$("topmostBox").collapsed = !this.isWin;
		let tree = $("dateList"),
				p = null,
				t = (new Date()).getTime() / 1000;
		for(let i = 0; i < tree.view.rowCount; i++)
		{
			if (p == null)
			{
				if (tree.view.getCellValue(i, tree.columns[0]) != "presets")
					continue;

				p = i;
				continue
			}
			if (tree.view.getParentIndex(i) != p)
				break;

			let val = tree.view.getCellValue(i, tree.columns[0]) != "default" ? tree.view.getCellText(i, tree.columns[0]) : "";

			tree.view.setCellText(i, tree.columns[2], (this.getExpiresString(t, val)));
		}
		for(let i = 0; i < t.length; i++)
		{
			if (!t[i].label)
				t[i].label = this.getExpiresString((new Date()).getTime()/1000, t[i].value);
		}
		$("templateclipboardinput").editor.transactionManager.clear();
		$("templatefileinput").editor.transactionManager.clear();
		$("templateclipboardinput").selectionStart = 0;
		$("templateclipboardinput").selectionEnd = 0;
		$("templatefileinput").selectionStart = 0;
		$("templatefileinput").selectionEnd = 0;
		$("dateList").addEventListener("keydown", this.dateFormatAdd, true);
		$("dateList").addEventListener("click", this.dateFormatAdd, true);
		if ($("optionsBox").tabs.itemCount <= parseInt($("optionsBox").getAttribute("selectedIndex")))
			$("optionsBox").selectedIndex = 0;

		if ($("exportChildren").tabs.itemCount <= parseInt($("exportChildren").getAttribute("selectedIndex")))
			$("exportChildren").selectedIndex = 0;

		this.exportFilename({target: $("fieldBackupfilename")});
		coomanPlusCore.async(function()
		{
			coomanPlus.dateListSize();
		});
		this.changesLogMenu();
		this.debugMenu();
		$("changesLog").addEventListener("command", coomanPlus.changesLogClick, true);
		$("debug").addEventListener("command", coomanPlus.debugClick, true);
		$("protectbox").setAttribute("collapsed", !this.protect.enabled);
		coomanPlusCore.async(function()
		{
			$("html5box").setAttribute("collapsed", !self.html5 || !self.html5.available);
		}, 100);
		$("showChangesLog_button").addEventListener("click", function(e)
		{
			if (e.button == 2)
				return;

			let win = null,
					link = "chrome://" + coomanPlusCore.ADDONDOMAIN + "/content/changes.xul";

			coomanPlusCore.window.switchToTabHavingURI(link, true);
		}, true);
		function replace_validateValue(numBox, value)
		{
			numBox.addEventListener("keydown", coomanPlus.keydown, true);
			numBox.prev = [0, 0, value];
			numBox._validateValue = function(aValue, aIsIncDec)
			{
				let min = numBox.min,
						max = numBox.max;

				aValue = Number(String(aValue).replace(/[^0-9\-]/g, "")) || 0;
				if (aValue < min)
					aValue = min;
				else if (aValue > max)
					aValue = numBox._value > max ? max : numBox._value;

				aValue = Number(aValue);
				numBox._valueEntered = false;
				numBox._value = aValue;
				numBox.prev.push(numBox._value);
				numBox.prev.splice(0,1);
				numBox.inputField.value = aValue > 0 ? aValue : aValue == -1 ? coomanPlus.string("all") : coomanPlus.string("none");
				numBox._enableDisableButtons();
				return "" + aValue;
			}
			numBox.value = value;
		}
		$("panelGeneral").addEventListener("DOMMouseScroll", this.mouseScroll, true);
		replace_validateValue($("ifl_restoreselection"), this.pref("restoreselection"));
		replace_validateValue($("ifl_searchhistory"), this.pref("searchhistory"));
		let tools = $("toolsBox");
		document.documentElement._buttons.accept.parentNode.insertBefore(tools, document.documentElement._buttons.accept.parentNode.firstChild);
		this.checkReset("optionsBox");
		this.inited = true;
	},//init()

	keydown: function keydown(e)
	{
		switch(e.keyCode)
		{
			case e.DOM_VK_PAGE_UP:
					e.target.value = Number(e.target.value) + 10;
				break;
			case e.DOM_VK_PAGE_DOWN:
					e.target.value = Number(e.target.value) - 10;
				break;
		}
	},

	unload: function unload()
	{

		coomanPlusCore.cmpWindowOptions = null;

		if (coomanPlus.inited)
		{
			coomanPlus.changesLogSave();
			coomanPlus.debugSave();
			try
			{
				coomanPlus.protect.unload();
			}catch(e){log.error(e)}
		}
	},

	focus: function()
	{
		window.focus();
	},

	changesLogMenuParse: function changesLogMenuParse()
	{
		let c = $("changesLogMenu").children,
		r = 0;
		for (let i = 0; i < c.length; i++)
			if (c[i].getAttribute("checked"))
				r += Number(c[i].getAttribute("value"));

		return r;
	},
	changesLogSave: function()
	{
		coomanPlusCore.pref("showChangesLog", this.changesLogMenuParse());
	},

	changesLogClick: function changesLogClick(e)
	{
		if (e.explicitOriginalTarget.getAttribute("checked")
				&& Number(e.explicitOriginalTarget.getAttribute("value")) & coomanPlus.CHANGESLOG_NOTIFICATION)
			coomanPlus.showChangesLog(coomanPlus.CHANGESLOG_NOTIFICATION, window)

		if (e.explicitOriginalTarget.getAttribute("checked")
				&& Number(e.explicitOriginalTarget.getAttribute("value")) & coomanPlus.CHANGESLOG_NOTIFICATION2)
			coomanPlus.showChangesLog(coomanPlus.CHANGESLOG_NOTIFICATION2, window)

		coomanPlus.changesLogMenu(coomanPlus.changesLogMenuParse());
	},

	changesLogMenu: function changesLogMenu(v)
	{
		v = typeof(v) == "undefined" ? coomanPlusCore.pref("showChangesLog") : v;
		let c = $("changesLogMenu"),
				t = [];

		c = c.children;
		for (let i = 0; i < c.length; i++)
		{
			if (c[i].getAttribute("value") == 1 && !coomanPlus.notificationAvailable)
				c[i].disabled = true;

			if (!c[i].disabled && v & Number(c[i].getAttribute("value")))
			{
				t.push(coomanPlus.string("changesLog" + Number(c[i].getAttribute("value"))));
				c[i].setAttribute("checked", true);
			}
			else
				c[i].removeAttribute("checked");
		}
		if (!t.length)
			t = [coomanPlus.string("none")];

		$("changesLog").setAttribute("label", (t.join(" + ")));
	},

	debugParse: function debugParse()
	{
		let c = $("debugMenu").children,
		r = 0;
		for (let i = 0; i < c.length; i++)
			if (c[i].getAttribute("checked"))
				r += Number(c[i].getAttribute("value"));

		return r;
	},
	debugSave: function()
	{
		coomanPlusCore.pref("debug", this.debugParse());
	},

	debugClick: function debugClick(e)
	{
		coomanPlus.debugMenu(coomanPlus.debugParse());
		if (coomanPlus.instantApply)
			coomanPlus.debugSave();
	},

	debugMenu: function debugMenu(v)
	{
		v = typeof(v) == "undefined" ? coomanPlusCore.pref("debug") : v;
		let c = $("debugMenu"),
				t = [];

		c = c.children;
		for (let i = 0; i < c.length; i++)
		{
			let val = Number(c[i].getAttribute("value"));
			if (v & val)
			{
				c[i].setAttribute("checked", true);
			}
			else
			{
				c[i].removeAttribute("checked");
			}
			if (val & 1)
				c[i].disabled = (v & val);
		}
	},


	template: function template(e)
	{
		$("format").value = e.originalTarget.value;
		let event = document.createEvent("Events");
		event.initEvent("change", true, true);
		$("format").dispatchEvent(event);
		this.test(e.originalTarget);
		$("format").focus();
	},

	test: function test(obj)
	{
		$("test").value = this.getExpiresString((new Date()).getTime()/1000, obj.value);
	},

	observeSend: function observeSend(data)
	{
		let observerService = Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService),
				observerSubject = Cc["@mozilla.org/supports-string;1"].createInstance(Ci.nsISupportsString);
		observerSubject.data = data;
		observerService.notifyObservers(observerSubject, "coomanPlusWindow", null);
	},

	cookieInfoRowsReset: function cookieInfoRowsReset()
	{
		this.observeSend("cookieInfoRowsReset");
	},

	templateReset: function templateReset(id)
	{
		$("template" + id + "input").value = coomanPlusCore.prefsDefault.getComplexValue("template" + id, Ci.nsISupportsString);
		$("prefpane").userChangedValue($("template" + id + "input"));
	},

	backupDecrypt: function backupDecrypt()
	{
		this.backupRemovePassword();
	},

	backupEncrypt: function backupEncrypt()
	{
		let r;
		do
		{
			r = this.backupAddPassword(true);
			if (r.status == 5)
			{
				this.alert(r.msg)
				return;
			}
			if (r.status == 3)
				return;

			if (r.status && r.msg)
				this.alert(r.msg);
		}
		while(r.status)
		
	},

	dateFormatAdd: function dateFormatAdd(e)
	{
		let k = coomanPlus.getKeys(e);
		if ((e.type == "click" && !e.button && e.detail > 1)
				|| (e.type == "keydown" && (coomanPlus.matchKeys(k[0], ["SPACE"], 1)
						|| coomanPlus.matchKeys(k[0], ["ENTER"], 1))))
		{
			let tree = $("dateList"),
					start = new Object(),
					end = new Object();

			tree.view.selection.getRangeAt(0, start, end);
			if (start.value > -1 && !tree.view.isContainer(start.value))
			{
				if (tree.view.getCellValue(tree.view.getParentIndex(start.value), tree.columns[0]) == "presets")
				{
					$("format").value = tree.view.getCellValue(start.value, tree.columns[0]) == "default" ? "" : tree.view.getCellText(start.value, tree.columns[0]);
				}
				else
				{
					let val = tree.view.getCellText(start.value, tree.columns[0]);
					start = $("format").selectionStart;
					end = $("format").selectionEnd;
					$("format").value = $("format").value.substring(0, start) + val + $("format").value.substring(end);
					$("format").selectionStart = start + val.length;
					$("format").selectionEnd = start + val.length;
				}
				coomanPlus.test($("format"));
				let event = document.createEvent("Events");
				event.initEvent("change", true, true);
				$("format").dispatchEvent(event);
				e.preventDefault();
				e.stopPropagation();
			}
			return false;
		}
	},

	dateListSize: function dateListSize(e)
	{
		$("coomanPlusWindowOptions").style.minHeight = ($("generalBox").lastChild.boxObject.y + $("generalBox").lastChild.boxObject.height + $("toolsBox").boxObject.parentBox.boxObject.height + 20) + "px";
		let h = window.outerHeight;
		window.resizeBy(0,-1);
		if (h - window.outerHeight == 1)
			window.resizeBy(0, 1);

	},
	
	exportFilename: function exportFilename(e)
	{
		let file = this.getFilename(true, e.target.value);
		$("backupfilenameTest").value = file;
	},

	mouseScroll: function mouseScroll(e)
	{
log.debug();
		if (e.axis != e.VERTICAL_AXIS || e.timeStamp == coomanPlus.mouseScrollTimeStamp)
			return true;

		coomanPlus.mouseScrollTimeStamp = e.timeStamp;

		let obj = document.activeElement.parentNode.parentNode;
		if (obj.tagName == "textbox" && obj.getAttribute("type") == "number")
		{
			obj.value = Number(obj.value) + (e.detail > 0 ? -1 : 1);
			obj._fireChange();
		}
	},//mouseScroll()
	
	resetAll: function resetAll()
	{
		let list = this.prefs.getChildList(""),
				i = -1,
				e = ["version"];
//				e = ["version","debug"];
		while(++i < list.length)
		{
			if (e.indexOf(list[i]) != -1)
				continue;
			try
			{
				this.prefs.clearUserPref(list[i]);
			}
			catch(e){log.error(e)};
		}
		this.resetPersist();
		this.dateListSize();
		this.changesLogMenu();
		this.debugMenu();
		delete coomanPlusCore.storage.restore;
		coomanPlusCore.storage.reset = {main:[], edit:[]};
		coomanPlusCore.storageWrite();
		Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService)
			.notifyObservers(null, "cmp-command", "reset");
	},

	command: function command(com, data)
	{
log.debug();
		switch(com)
		{
			case "reset":
				this.resetAll();
				break;
			case "backup":
					Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService)
						.notifyObservers(null, "cmp-command", "backup");
					let prefs = null;
					coomanPlusCore.async(function()
					{
						prefs = coomanPlus.getSettings();
					}, 500);
					let fp = this.saveFileSelect(this.getFilename(null, "cmp-settings-#.cmps"), "cmps", "", this.string("backupSettingsSave"), {title: this.string("settingsFile").replace("#", coomanPlusCore.addon.name), filter: "*.cmps;*.cmpj"});
					if (!fp)
						break;

					prefs.searches = coomanPlusCore.storage.search;
					try
					{
						prefs = JSON.stringify(prefs);
					}catch(e){};
					this.saveFile(fp, prefs)
				break;
			case "restore":
					this.settingsRestore();
				break;
			case "searchhistoryclear":
				coomanPlusCore.storage.search = [];
				coomanPlusCore.storageWrite();
				break;
		}
	},//command()

	getSettings: function getSettings()
	{
		let list = this.pref.prefs,
				e = ["version", "reset", "restore"],
				prefs = {};
		for(let i in list)
		{
			if (e.indexOf(i) != -1)
				continue;

			prefs[i] = this.pref(i, undefined, true);
		}
		prefs.persist = coomanPlusCore.storage.persist;
		return prefs
	},//getSettings()

	settingsRestore: function settingsRestore()
	{
		let nsIFilePicker = Ci.nsIFilePicker;
		fp = Cc["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
		fp.init(window, this.string("restoreSettingsOpen"), nsIFilePicker.modeOpen);
		fp.appendFilter(this.string("settingsFile").replace("#", coomanPlusCore.addon.name), "*.cmps;*.cmpj");
		fp.defaultExtension = "cmps";
		let rv = fp.show();
		if (rv != nsIFilePicker.returnOK)
			return false;

		let istream = Cc["@mozilla.org/network/file-input-stream;1"].
									createInstance(Ci.nsIFileInputStream);
		istream.init(fp.file, -1, -1, false);

		let bstream = Cc["@mozilla.org/binaryinputstream;1"].
									createInstance(Ci.nsIBinaryInputStream);
		bstream.setInputStream(istream);

		let fileData = bstream.readBytes(bstream.available());
		bstream.close();
		istream.close();
		let data;
		try
		{
			data = JSON.parse(fileData);
		}catch(e){log.error(e)}
		if (!data)
		{
			this.alert(this.string("restoreSettingsError"));
			return false;
		}
		let params = {
			data: data,
			button: 0,
		}
		this._openDialog("optionsRestore.xul", "_blank", "chrome,resizable,centerscreen,dialog" + (this.isMac ? "" : "=no") + ",modal", params);

		if (!params.button)
			return;

		for(let i in data)
		{
			if (i == "restore" || i == "reset")
				continue;

			switch(i)
			{
				case "persist":
					if (typeof(data[i]) == "string")
					{
						try
						{
							coomanPlusCore.storage.restore = JSON.parse(data[i]);
						}catch(e){}
					}
					else
						coomanPlusCore.storage.restore = data[i];
					break;
				case "search":
					coomanPlusCore.storage.search = data[i];
					break;
				default:
					try
					{
						this.pref(i, data[i]);
					}catch(e){};
			}
		}
		if (data.persist)
		{
			let observerService = Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService)
			observerService.notifyObservers(null, "cmp-command", "restore");
		}

		delete coomanPlusCore.storage.reset;
		coomanPlusCore.storageWrite();
		this.dateListSize();
		this.changesLogMenu();
		this.debugMenu();
	},//settingsRestore()

	topmost: function topmost(broadcast)
	{
log.debug();
		if (broadcast)
			Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService).notifyObservers(null, "cmp-command", "topmost");
			
		let xulWin = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
								.getInterface(Components.interfaces.nsIWebNavigation)
								.QueryInterface(Components.interfaces.nsIDocShellTreeItem)
								.treeOwner.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
								.getInterface(Components.interfaces.nsIXULWindow);
		xulWin.zLevel = xulWin.highestZ;
		coomanPlusCore.async(function()
		{
			xulWin.zLevel = coomanPlusCore.pref("topmost") ? xulWin.highestZ : xulWin.normalZ;
		}, 100);
	},//topmost()
	backupPersist: function backupPersist(){log.debug()},
}//coomanPlus

function srGetStrBundle()
{
	return $("pippkiBundle");
}

if (coomanPlusCore.cmpWindowOptions)
{
	coomanPlusCore.cmpWindowOptions.focus();
	window.close()
}
var _args = "arguments" in window && window.arguments.length ? window.arguments[0] : {},
		args = {};
if (typeof(_args) == "object" && _args.wrappedJSObject)
	args = _args.wrappedJSObject;
delete _args;

if ("standalone" in args)
{
	coomanPlus.standalone = args.standalone;
}
log.debug("standalone " + coomanPlus.standalone);
let XULStore,
		persist = {};
try
{
	XULStore = Cc["@mozilla.org/xul/xulstore;1"].getService(Ci.nsIXULStore);

}catch(e){}

if (XULStore && window.location)
{
	let url = window.location.href,
			enumerator = XULStore.getIDsEnumerator(url);

	while(enumerator.hasMore())
	{
		let id = enumerator.getNext(),
				attrEnum = XULStore.getAttributeEnumerator(url, id);

		persist[id] = {};
		while(attrEnum.hasMore())
		{
			let attr = attrEnum.getNext();
			persist[id][attr] = XULStore.getValue(url, id, attr);
		}
	}
}
if (coomanPlus.standalone)
{
	coomanPlusCore.async(function()
	{
		coomanPlusCore.cmpWindowOptions = null;
		coomanPlusCore.openOptions({standalone: false});
	});
	window.close();
}
else
{
	coomanPlusCore.cmpWindowOptions = window;
	coomanPlus.topmost();
// breaks persitent tabs https://github.com/vanowm/FirefoxCookiesManagerPlus/issues/83
	coomanPlus.exec.push(function()
	{
		coomanPlus.backupPersist($("coomanPlusWindowOptions"));
		for(let id in persist)
		{
			if (!typeof(persist[id]) == "object")
				continue;

			for(let attr in persist[id])
			{
				if (!$(id))
					continue;

				if (attr in $(id))
					$(id)[attr] = persist[id][attr];
			}
		}
	});
}