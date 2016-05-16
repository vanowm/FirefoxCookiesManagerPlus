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
	cmpWindowBackup: null,
	standalone: true,
	winid: new Date(),
	_cb: null,
	instantApply: false,
	inited: false,
	pref: coomanPlusCore.pref,
	html5: coomanPlusCore.html5,
	load: function load()
	{
		coomanPlusCore.async(function()
		{
			coomanPlus.init();
		});
	},

	init: function init()
	{
		let self = this;
		this._cb = $("cookieBundle");
		this.strings.secureYes = this.string("forSecureOnly");
		this.strings.secureNo = this.string("forAnyConnection");
		this.test($("format"));
		this.instantApply = Cc["@mozilla.org/preferences-service;1"]
												.getService(Ci.nsIPrefBranch)
												.getBoolPref("browser.preferences.instantApply");

		coomanPlus.protect.init();
		var tree = $("dateList");
		var p = null;
		var t = (new Date()).getTime() / 1000;
		for(var i = 0; i < tree.view.rowCount; i++)
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

			var val = tree.view.getCellValue(i, tree.columns[0]) != "default" ? tree.view.getCellText(i, tree.columns[0]) : "";

			tree.view.setCellText(i, tree.columns[2], ("Ex: " + this.getExpiresString(t, val)));
		}
		for(var i = 0; i < t.length; i++)
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
		if ($("options").tabs.itemCount <= parseInt($("options").getAttribute("selectedIndex")))
			$("options").selectedIndex = 0;

		if ($("exportChildren").tabs.itemCount <= parseInt($("exportChildren").getAttribute("selectedIndex")))
			$("exportChildren").selectedIndex = 0;

		$("dateListBox").setAttribute("collapsed", $("dateListBox").collapsed);
		$("dateListSplitter").setAttribute("state", $("dateListBox").collapsed ? "collapsed" : "open");
		$("dateListSplitter").setAttribute("substate", $("dateListBox").collapsed ? "before" : "");
		this.exportFilename({target: $("fieldBackupfilename")});
		this.dateListSize();
		this.changesLogMenu();
		$("changesLog").addEventListener("command", coomanPlus.changesLogClick, true);
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
		let numBox = $("ifl_restoreselection");
		numBox.addEventListener("DOMMouseScroll", this.mouseScroll, true);
		numBox.addEventListener("keydown", this.keydown, true);
		numBox.prev = [0, 0, this.pref("restoreselection")];
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
		numBox.value = this.pref("restoreselection");
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
		if (!coomanPlus.standalone)
			coomanPlusCore.cmpWindow = coomanPlus.cmpWindowBackup;

		if (coomanPlus.inited)
		{
			coomanPlus.changesLogSave();
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

	template: function template(e)
	{
		$("format").value = e.originalTarget.value;
		var event = document.createEvent("Events");
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
		var observerService = Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);
		var observerSubject = Cc["@mozilla.org/supports-string;1"].createInstance(Ci.nsISupportsString);
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
		this.backupAddPassword();
	},

	dateFormatAdd: function dateFormatAdd(e)
	{
		let k = coomanPlus.getKeys(e);
		if ((e.type == "click" && !e.button && e.detail > 1)
				|| (e.type == "keydown" && (coomanPlus.matchKeys(k[0], ["SPACE"], 1)
						|| coomanPlus.matchKeys(k[0], ["ENTER"], 1))))
		{
			var tree = $("dateList");
			var start = new Object();
			var end = new Object();
			tree.view.selection.getRangeAt(0, start, end);
			if (!tree.view.isContainer(start.value))
			{
				if (tree.view.getCellValue(tree.view.getParentIndex(start.value), tree.columns[0]) == "presets")
				{
					let val = tree.view.getCellValue(start.value, tree.columns[0]) == "default" ? "" : tree.view.getCellText(start.value, tree.columns[0]);
					$("format").value = val;
				}
				else
				{
					var val = tree.view.getCellText(start.value, tree.columns[0]);
					var start = $("format").selectionStart;
					var end = $("format").selectionEnd;
					$("format").value = $("format").value.substring(0, start) + val + $("format").value.substring(end);
					$("format").selectionStart = start + val.length;
					$("format").selectionEnd = start + val.length;
				}
				coomanPlus.test($("format"));
				var event = document.createEvent("Events");
				event.initEvent("change", true, true);
				$("format").dispatchEvent(event);
			}
			e.preventDefault();
			e.stopPropagation();
			return false;
		}
	},

	dateListSize: function dateListSize(e)
	{
		$("dateListBox").setAttribute("collapsed", $("dateListBox").collapsed);
		if ($("dateListBox").collapsed)
		{
			$("coomanPlusWindowOptions").style.minHeight = "39em";
		}
		else
		{
			$("coomanPlusWindowOptions").style.minHeight = "50em";
			let h = window.outerHeight;
			window.resizeBy(0,-1);
			if (h - window.outerHeight == 1)
				window.resizeBy(0, 1);
		}

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
	/*

	var t = "";
	var a = e.target;
	for(var i in a)
		t = t + i + ": " + a[i] + "\n";
	alert(t);
	*/
		if (e.target.id != coomanPlus.focused)
		{
	//		return true;
			e.target.focus();
		}
		$("ifl_restoreselection").value = Number($("ifl_restoreselection").value) + (e.detail > 0 ? -1 : 1);
		$("ifl_restoreselection")._fireChange();
	},//mouseScroll()
	
}
function srGetStrBundle()
{
	return $("pippkiBundle");
}

if (coomanPlusCore.cmpWindowOptions)
{
	coomanPlusCore.cmpWindowOptions.focus();
	window.close()
}
coomanPlusCore.cmpWindowOptions = window;
if ("arguments" in window && window.arguments.length && (!("standalone" in window.arguments[0]) || !window.arguments[0].standalone))
{
	coomanPlus.cmpWindowBackup = coomanPlusCore.cmpWindow;
	coomanPlusCore.cmpWindow = window;
	coomanPlus.standalone = false;
}
log.debug("standalone " + coomanPlus.standalone);
var xulWin = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
						.getInterface(Components.interfaces.nsIWebNavigation)
						.QueryInterface(Components.interfaces.nsIDocShellTreeItem)
						.treeOwner.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
						.getInterface(Components.interfaces.nsIXULWindow);
xulWin.zLevel = xulWin.raisedZ;
if (coomanPlus.standalone)
{
	coomanPlusCore.async(function()
	{
		coomanPlusCore.openCMP({options: true});
	});
	window.close();
}
