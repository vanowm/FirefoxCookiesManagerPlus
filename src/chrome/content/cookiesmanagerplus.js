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
 Contains some of the code from Mozilla original Cookie Editor
 ----------------------*/


/*##################################################################################### */
Cu.import("resource://gre/modules/Services.jsm");

function $(id)
{
	return document.getElementById(id);
}
var self = this;
var coomanPlus = {
	_cmpWindow: null,
	winid: new Date(),
	inited: false,
	focused: null,
	args: {},
	backup: {},
	website: false,
	websiteHost: null,
	websiteHostStripped: null,
	pref: coomanPlusCore.pref,
	prefs: coomanPlusCore.prefs,
	prefBranch: Ci.nsIPrefBranch2,
//	prefShowExtra: false, //EXTRA
	prefFiltersearchname: true,
	prefFiltersearchhost: true,
	prefFiltersearchhosttype: 0,
	prefFiltersearchcontent: true,
	prefFiltersearchcase: false,
	prefFiltersearchregex: false,
	prefSimpleHost: false,
	prefExpireProgress: false,
	prefExpireCountdown: true,
	prefViewOrder: "",
	prefViewOrderDefault: "name|value|host|path|isSecure|expires|creationTime|lastAccessed|isHttpOnly|policy|status|isProtected|size|type|originAttributes",

	accel: "CONTROL",
	keysList: null,
	lastKeyDown: [],
	strings: {},
	_noObserve: false,
	_selected: [],
	_cookies: [],
	_cookiesAll: [],
	_cb: [],
	_cookiesTree: null,
	supress_getCellText: false,
	contextDelay: 0,
	isXP: false,

	dragCancel: true,
	dragoverObj: null,
	infoRowsFirst: null,
	infoRowsLast: null,
	infoRowsChanged: false,

	readonlyFields: ["value", "expires", "isSecure", "isHttpOnly"],
	showedExpires: -1,

	exec: [],

	_cookiesTreeView: {
		QueryInterface: null,
		rowCount : 0,
		tree: null,
		canDrop: function canDrop(row, orientation, dataTransfer){return false},
		drop: function drop(row, orientation, dataTransfer)
		{
			coomanPlus.filesDragDrop(dataTransfer);
		},
		cycleHeader: function cycleHeader(aColId, aElt) {},
		cycleCell: function cycleCell(row, col){},
		setTree: function setTree(tree){ this.tree = tree },
		getImageSrc: function getImageSrc(){},
		getProgressMode: function getProgressMode(row,column)
		{
			if (!coomanPlus._cookies[row])
				return;

			return coomanPlus._cookies[row]["expires"] ? 1 : 3;
		},
		getCellText: function getCellText(row,column)
		{
			if (coomanPlus.supress_getCellText || column.id == "sel" || !coomanPlus._cookies[row])
				return;

			switch(column.id)
			{
				case "type":
					return "";

				case "rawHost":
				 return coomanPlus._cookies[row][coomanPlus.pref("showrealhost") ? "host" : "rawHost"];

				case "size":
				 return coomanPlus._cookies[row].sizeText;// + " (" + coomanPlus._cookies[row].valueSizeText + ")";

				case "expires":
					return coomanPlus.getExpiresString(coomanPlus._cookies[row]["expires"]);

				case "creationTimeString":
//EXTRA
//						if (!coomanPlus._cookies[row].extra)
//							coomanPlus._cookies[row] = coomanPlus._cookieGetExtraInfo(coomanPlus._cookies[row]._aCookie);
					return coomanPlus.getExpiresString(Math.round(coomanPlus._cookies[row]["creationTime"]/1000000));

				case "lastAccessedString":
//EXTRA
//						if (!coomanPlus._cookies[row].extra)
//							coomanPlus._cookies[row] = new coomanPlus.cookieObject(coomanPlus._cookies[row]._aCookie.QueryInterface(Ci.nsICookie2), coomanPlus._cookies[row].sel, coomanPlus._cookies[row].updated);
					return coomanPlus.getExpiresString(Math.round(coomanPlus._cookies[row]["lastAccessed"]/1000000));

				case "isHttpOnly":
//EXTRA
//						if (!coomanPlus._cookies[row].extra)
//							coomanPlus._cookies[row] = new coomanPlus.cookieObject(coomanPlus._cookies[row]._aCookie.QueryInterface(Ci.nsICookie2), coomanPlus._cookies[row].sel, coomanPlus._cookies[row].updated);
					return coomanPlus.string("yesno"+(coomanPlus._cookies[row]["isHttpOnly"]?1:0));

				case "isSecure":
						if (!("isSecure" in coomanPlus._cookies[row]))
							coomanPlus._cookies[row] = new coomanPlus.cookieObject(coomanPlus._cookies[row]._aCookie.QueryInterface(Ci.nsICookie2), coomanPlus._cookies[row].sel, coomanPlus._cookies[row].updated);

					return coomanPlus.string("yesno"+(coomanPlus._cookies[row]["isSecure"]?1:0));

				case "policyString":
					return coomanPlus.string("policy"+coomanPlus._cookies[row]["policy"]);

				case "statusString":
//EXTRA
//						if (!coomanPlus._cookies[row].extra)
//							coomanPlus._cookies[row] = new coomanPlus.cookieObject(coomanPlus._cookies[row]._aCookie.QueryInterface(Ci.nsICookie2), coomanPlus._cookies[row].sel, coomanPlus._cookies[row].updated);
					return coomanPlus.string("status"+coomanPlus._cookies[row]["status"]);

				case "isProtected":
					return coomanPlus.string("yesno"+(coomanPlus._cookies[row]["isProtected"]?1:0));

				case "readonly":
				 return coomanPlus.string("yesno"+(coomanPlus._cookies[row].readonly ? 1 : 0))

				case "originAttributesString":
				 return coomanPlus._cookies[row].originAttributesText;
			}
			return coomanPlus._cookies[row][column.id];
		},
		setCellText: function setCellText(row,column,val) {},
		getCellValue: function getCellValue(row,column)
		{
			if (!coomanPlus._cookies[row])
				return;

			return coomanPlus._cookies[row][column.id];
		},
		setCellValue: function setCellValue(row, col, val)
		{
//			let s = true;
			if (this.selection.isSelected(row))
			{
//				s = false;
				this.selection.clearRange(row,row);
				coomanPlus.cookieSelected();
			}
			else
			{
				this.selection.rangedSelect(row,row, true);
			}
//			this.tree.invalidateRow(row);
//			coomanPlus._cookies[row][col.id] = s;
		},
		isSeparator: function isSeparator(index) {return false;},
		isSorted: function isSorted() { return false; },
		isContainer: function isContainer(index) {return false;},
		isContainerOpen: function isContainerOpen(index) {return false;},
		isContainerEmpty: function isContainerEmpty(index) {},
		toggleOpenState: function toggleOpenState(index) {},
		getRowProperties: function getRowProperties(row,column, props)
		{
			if (!coomanPlus._cookies[row])
				return;

			let old = typeof(props) != "undefined",
					aserv;
			if (old)
				aserv=Cc["@mozilla.org/atom-service;1"].getService(Ci.nsIAtomService);
			else
				props = "";

			if (coomanPlus._cookies[row].deleted)
				if (old)
					props.AppendElement(aserv.getAtom("deleted" + coomanPlus._cookies[row].deleted));
				else
					props = "deleted" + coomanPlus._cookies[row].deleted;

			return props;
		},
		getColumnProperties: function getColumnProperties(column,columnElement,props)
		{
		},
		getCellProperties: function getCellProperties(row,col,props)
		{
			if (!coomanPlus._cookies[row])
				return;

			let old = typeof(props) != "undefined",
					aserv;

			if (old)
			{
				aserv = Cc["@mozilla.org/atom-service;1"].getService(Ci.nsIAtomService);
				if (coomanPlus.protect.enabled && coomanPlus._cookies[row]['isProtected'])
					props.AppendElement(aserv.getAtom("protected"));

				if (coomanPlus._cookies[row].deleted)
					props.AppendElement(aserv.getAtom("deleted" + coomanPlus._cookies[row].deleted));

				if (!coomanPlus._cookies[row]['expires'])
					props.AppendElement(aserv.getAtom("session"));

				if (coomanPlus._cookies[row]['expires'] && coomanPlus._cookies[row]['expires'] != -1 && coomanPlus._cookies[row]['expires'] && coomanPlus._cookies[row]['expires'] *1000 < (new Date()).getTime())
					props.AppendElement(aserv.getAtom("expired"));

				if (col.type == col.TYPE_CHECKBOX && this.selection.isSelected(row))
					props.AppendElement(aserv.getAtom("checked"));


//				if (coomanPlus._cookies[row]['updated'] && coomanPlus._cookies[row]['updated'] + 60000 < (new Date()).getTime())
//					props.AppendElement(aserv.getAtom("updated"));
				if (col.id == "type")
						props.AppendElement(aserv.getAtom("type" + coomanPlus._cookies[row].type));
			}
			else
			{
				props = "";
				if (coomanPlus.protect.enabled && coomanPlus._cookies[row]['isProtected'])
					props = "protected";

				if (coomanPlus._cookies[row].deleted)
					props += " deleted" + coomanPlus._cookies[row].deleted;

				if (!coomanPlus._cookies[row]['expires'])
					props += " session";

				if (coomanPlus._cookies[row]['expires'] && coomanPlus._cookies[row]['expires'] != -1 && coomanPlus._cookies[row]['expires'] && coomanPlus._cookies[row]['expires'] *1000 < (new Date()).getTime())
					props += " expired";

				if (col.type == col.TYPE_CHECKBOX && this.selection.isSelected(row))
					props += " checked";

//				if (coomanPlus._cookies[row]['updated'] && coomanPlus._cookies[row]['updated'] + 60000 < (new Date()).getTime())
//					props += " updated";
				if (col.id == "type")
						props += " type" + coomanPlus._cookies[row].type;
			}
			if (coomanPlus.pref("readonly"))
			{
				if (!coomanPlus._cookies[row].readonly)
					coomanPlus._cookies[row].readonly = coomanPlusCore.readonlyCheck(coomanPlus._cookies[row]);

				let ro = coomanPlus._cookies[row].readonly;
				if (ro && col.id in ro)
					if (old)
						props.AppendElement(aserv.getAtom("ro"));
					else
						props += " ro"
			}

			return props;
		},
		isEditable: function isEditable(row, col){ return col.editable; },
		isSelectable: function isSelectable(row, col) {return false},
		getLevel: function getLevel(aIndex){return 0},
		getParentIndex: function getParentIndex(aIndex){return -1;},
	},

	load: function load()
	{
		coomanPlus.start();
	},

	start: function start()
	{
log.debug.startTime = new Date();
log.debug("start");
		if (!coomanPlusCore.addon)
			return;






/*
//private cookies

this._permissions = [];

// load permissions into a table
var count = 0;
var enumerator = Services.perms.enumerator;
while (enumerator.hasMoreElements()) {
var nextPermission = enumerator.getNext().QueryInterface(Components.interfaces.nsIPermission);
if (nextPermission.type == "cookie")
this._permissions.push(nextPermission);
}
//log(this._permissions, 3);



var windows = Services.wm.getEnumerator("navigator:browser");

// Check for windows matching the url
while (windows.hasMoreElements()) {
  var currentWindow = windows.getNext();
  if (currentWindow.closed || !currentWindow.document.documentElement.hasAttribute("privatebrowsingmode"))
  {
    continue;
  }
  let gBrowser = currentWindow.gBrowser;
  log(currentWindow.document.cookie);
  var num = gBrowser.browsers.length;  
	for (let i = 0; i < num; i++) 
	{  
	  var b = gBrowser.getBrowserAtIndex(i);  
	  try {  
	    log(b.currentURI.spec); // dump URLs of all open tabs to console
	    log(b.contentDocument);
	  } catch(e) {  
	    log.error(e);  
	  }  
	}
//	log(currentWindow.contentDocument.cookie, 1);
}

*/
//log(coomanPlusCore.asyncData, 1)
//coomanPlusCore.readonlyDecryptEncrypted();
		this.inited = true;

		this.isXP = window.navigator.oscpu.indexOf("Windows NT 5") != -1;
		$("cookiesTreeChildren").setAttribute("xp", this.isXP);
		this._cmpWindow = coomanPlusCore.cmpWindow;
		coomanPlusCore.cmpWindow = window;
		this._cb.push($("bundlePreferences"));
		this._cb.push($("changesLogPreferences"));

		this.strings.secureYes = this.string("forSecureOnly");
		this.strings.secureNo = this.string("forAnyConnection");
		this._cookiesTree = $("cookiesTree");

		this.listKeys();

		Services.scriptloader.loadSubScript(coomanPlusCore.addon.getResourceURI("chrome/content/constants.js").spec, self);
		let rows = $("cookieInfoRows").getElementsByTagName("row");
		for(let i = 0; i < rows.length; i++)
		{
			if (rows[i].id == "row_start" || rows[i].id == "row_end")
				continue;

			rows[i].firstChild.addEventListener("dragstart", this.dragstart, true);
			rows[i].addEventListener("dragenter", this.dragenter, true);
			rows[i].addEventListener("dragover", this.dragover, true);
			rows[i].addEventListener("dragend", this.dragend, true);
			$("ifl_" + rows[i].id.replace("row_", "")).addEventListener("keydown", this.dragKeyDown, true);

		}
		coomanPlusCore.lastKeyDown = [];
		$("cookieInfoBox").addEventListener("dragexit", this.dragexit, true);
		$("main").addEventListener("keydown", this.onKeyDown, true);
		$("main").addEventListener("keyup", this.onKeyUp, true);
		$("cookiesTree").addEventListener("scroll", this.treeScroll, true);
		$("cookiesTree").addEventListener("select", this.cookieSelectedEvent, true);
		$("cookiesTree").addEventListener("mousedown", this.cookieSelectMouse, true);
		$("cookiesTree").addEventListener("click", this.cookieClickEvent, true);
		$("cookiesTreeChildren").addEventListener("click", this.dblClickEdit, true);
		$("cookiesTreeChildren").addEventListener("dragstart", this.treeDragStart, true);
		$("main").addEventListener("dragover", this.filesDragOver, true);
		$("main").addEventListener("dragdrop", this.filesDragDrop, true);
//		$("cookiesmanagerplusWindow").addEventListener("mouseup", this.resizeInfoRowMouseUp, true);
//		$("cookiesmanagerplusWindow").addEventListener("mousemove", this.resizeInfoRowMouseMove, true);

		if ("arguments" in window && window.arguments.length)
		{
			this.focus(window.arguments[0]);
		}

		$('lookupcriterium').value = $('lookupcriterium').getAttribute("filter");
		this.title = document.title + " v" + coomanPlusCore.addon.version

		let observer = Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);

		observer.addObserver(this, "cookie-changed", false);
//		observer.addObserver(this, "private-cookie-changed", false);
		observer.addObserver(this, "cmp-command", false);
		this.autocompleteLoad();
//		this.setFilter();
//		this.setSort();
		this.onPrefChange.do();
		if ("addObserver" in this.prefs.QueryInterface(Ci.nsIPrefBranch))
			this.prefBranch = Ci.nsIPrefBranch;

		this.prefs.QueryInterface(this.prefBranch).addObserver('', this.onPrefChange, false);
		this.onPrefChange.inited = true;
		this._cookiesTree.focus();
		switch (Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService).getBranch("ui.key.").getIntPref("accelKey"))
		{
			case 17:  this.accel = "CONTROL"; break;
			case 18:  this.accel = "ALT"; break;
			case 224: this.accel = "META"; break;
			default:  this.accel = (this.isMac ? "META" : "CONTROL");
		}
//		let k = $("platformKeys").getString("VK_" + this.accel);
		let k = $("platformKeys").getString("VK_ALT");
		$("infoRowUp").label += " (" + k + " + " + $("localeKeys").getString("VK_UP") + ")";
		$("infoRowDown").label += " (" + k + " + " + $("localeKeys").getString("VK_DOWN") + ")";
		$("coomanPlus_inforow_drag_menu").getElementsByTagName("menuitem")[0].label = $("infoRowUp").label;
		$("coomanPlus_inforow_drag_menu").getElementsByTagName("menuitem")[1].label = $("infoRowDown").label;
//		$("sel").width = $("sel").boxObject.height + 2;
		let treecolpicker = document.getAnonymousElementByAttribute(document.getAnonymousNodes($("treecols"))[1], "anonid", "popup");
		treecolpicker.addEventListener("command", this.treeViewSelectColpicker, true)
		treecolpicker.addEventListener("popupshowing", this.treeViewColpicker, true)
		this.website = false;
//window resize doesn't work properly with persist attribute. it resizes slightly bigger each time window opened.
/*
		var w = $("main").boxObject.width;
		var h = $("main").boxObject.height;
		if (document.width < w || document.height < h)
			window.sizeToContent();
*/
		this.setAutofit();
		this.checkReset("main");
		this.checkRestore("main");
		let list = document.getElementsByAttribute("type", "ro"),
				i = 0,
				o;
		while(o = list[i++])
		{
			let buttons = o.getElementsByTagName("button");
			buttons[0].setAttribute("tooltiptext", this.string("readonly1") + "\n\n" + this.string("readonlyInfo"));
			buttons[1].setAttribute("tooltiptext", this.string("readonly2") + "\n\n" + this.string("readonlyInfo"));
		}
		let filterMenu = document.getAnonymousElementByAttribute($("lookupcriterium"), "anonid", "searchbutton-icon");
		filterMenu.setAttribute("tooltiptext", $("filter").getAttribute("_tooltiptext"))
		filterMenu.addEventListener("click", function(e)
		{
			$("filter").openPopup($("lookupcriterium"), "after_start", 0, 0);
		},false)
		let _load = function _load()
		{
log.debug();
			_load.loaded = true;
			coomanPlusCore.readonlyDecryptEncrypted();
			coomanPlus.loadCookies(undefined, undefined, undefined, undefined, undefined, undefined, true);
			coomanPlus._cookiesTree.view = coomanPlus._cookiesTreeView;
			coomanPlus._cookiesTree.view.rowCount; //some weird things happens in FF37+ without this line
			coomanPlusCore.async(function()
			{
				coomanPlus.selectLastCookie(true);
			});
		}
//when master password promt shown without async, window persist attributes would fail to apply
		if (coomanPlusCore._readonlyList !== null
				&& !coomanPlusCore.readonlyListEncrypted)
		{
			_load();
		}
		else
		{
//async for proper scroll position restore. Without it getLastVisibleRow() returns incorrect number
			coomanPlusCore.async(function()
			{
				_load();
			}, true);
		}
log.debug("end",1);
	},//start()

	searchField: function searchField()
	{
		coomanPlusCore.async(function()
		{
			coomanPlus._cookieMatchesFilter({name: "", host: "", value:""}, $('lookupcriterium').value);
		});

	},//searchField()

	cookieSelectMouse: function cookieSelectMouse(e)
	{
		if (e.button || (coomanPlus.contextDelay + 300) > (new Date()).getTime())
		{
			e.stopPropagation();
			e.preventDefault();
		}
	},

	cookieSelectedEvent: function cookieSelectedEvent(e)
	{
		if (e.type != "select" || coomanPlus._cookiesTree.view.selection.selectEventsSuppressed || coomanPlus._noselectevent)
			return;
log.debug([coomanPlus._cookiesTree.view.selection.selectEventsSuppressed, coomanPlus._noselectevent]);
		coomanPlus.cookieSelected();
	},

	unload: function unload()
	{
log.debug();
		coomanPlus.settingsBackup();
		coomanPlusCore.cmpWindow = null;
		let observer = Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService)
		try
		{
			observer.removeObserver(this, "cookie-changed", false);
		}catch(e){log.error(e)}
		try
		{
//			observer.removeObserver(this, "private-cookie-changed", false);
		}catch(e){log.error(e)}
		try
		{
			observer.removeObserver(this, "cmp-command", false);
		}catch(e){log.error(e)}
		try
		{
			this.prefs.QueryInterface(this.prefBranch).removeObserver('', this.onPrefChange, false);
		}catch(e){log.error(e)}
		try
		{
			$("main").removeEventListener("keydown", this.onKeyDown, true);
			$("main").removeEventListener("keyup", this.onKeyUp, true);
			$("cookiesTree").removeEventListener("scroll", this.treeScroll, true);
			$("cookiesTree").removeEventListener("select", this.cookieSelectedEvent, true);
			$("cookiesTree").removeEventListener("mousedown", this.cookieSelectMouse, true);
			$("cookiesTreeChildren").removeEventListener("click", this.dblClickEdit, true);
			$("cookiesTreeChildren").removeEventListener("dragstart", this.treeDragStart, true);
			$("main").removeEventListener("dragover", this.filesDragOver, true);
			$("main").removeEventListener("dragdrop", this.filesDragDrop, true);
			$("cookiesTree").removeEventListener("click", this.cookieClickEvent, true);
			$("cookieInfoBox").removeEventListener("dragexit", this.dragexit, true);
		}catch(e){log.error(e)}

		let rows = $("cookieInfoRows").getElementsByTagName("row");
		try
		{
			for(let i = 0; i < rows.length; i++)
			{
				if (rows[i].id == "row_start" || rows[i].id == "row_end")
					continue;

				rows[i].firstChild.removeEventListener("dragstart", this.dragstart, true);
				rows[i].removeEventListener("dragenter", this.dragenter, true);
				rows[i].removeEventListener("dragover", this.dragover, true);
				rows[i].removeEventListener("dragend", this.dragend, true);
				$("ifl_" + rows[i].id.replace("row_", "")).removeEventListener("keydown", this.dragKeyDown, true);

			}
		}
		catch(e){log.error(e)};
		try
		{
			coomanPlus.protect.unload();
		}catch(e){log.error(e)}
		try
		{
			if (coomanPlus.title)
			{
				let nsIFile = FileUtils.getDir("TmpD", [coomanPlus.title]);
				nsIFile.remove(true);
			}
		}
		catch(e){}
		coomanPlus.autocompleteSave();
		coomanPlus.selectionSave(undefined, true);
		coomanPlusCore.readonlySave(false);
		coomanPlus.inited = false;
	},//unload()

	onPrefChangeDo: function onPrefChangeDo()
	{
log.debug();
		coomanPlus.onPrefChange.do();
	},

	onPrefChange: {
		inited: false,
		observe: function observe(subject, topic, key)
		{
			let self = this;
			if (!coomanPlusCore.prefNoObserve)
				coomanPlusCore.async(function()
				{
					self.do(subject, topic, key);
				});
		},
		do: function onPrefChange_do(subject, topic, key)
		{
log.debug();
			subject = typeof(subject) == "undefined" ? null : subject;
			topic = typeof(topic) == "undefined" ? null : topic;
			key = typeof(key) == "undefined" ? null : key;
			let self = coomanPlus;
			if (key == "searchhistory")
				return self.autocompleteLoad();

			if (key == "autofit")
				return self.setAutofit();

			if (["reset", "restore", "persist", "version"].indexOf(key) != -1)
				return;

			self.setFilter(subject, topic, key);

			self.setSort(subject, topic, key);
			let l = self.string("filterRefresh");
			if (!self.pref("autofilter") || (!self.pref("autoupdate") && !self.pref("autofilter")))
				l = self.string("filterSearch") + "/" + self.string("filterRefresh");

			$("lookupstart").label = l;
			if (key === null || key == "topmost")
			{
				self.command("topmost");
				if (key == "topmost")
					return;
			}
			$("menu_info_topmost").setAttribute("checked", self.pref("topmost"));
			$("menu_treeView_realHost").setAttribute("checked", self.pref("showrealhost"));
			$("treeView_realHost").setAttribute("checked", self.pref("showrealhost"));
			self.infoRowsShow();
			self.infoRowsSort();
			self.prefTemplateClipboard.value = self.pref("templateclipboard");
			self.prefTemplateFile.value = self.pref("templatefile");

			self.prefTemplateClipboard.extra = (self.prefTemplateClipboard.value.indexOf("{ISHTTPONLY}") != -1
																								|| self.prefTemplateClipboard.value.indexOf("{STATUS}") != -1
																								|| self.prefTemplateClipboard.value.indexOf("{CREATIONTIME}") != -1
																								|| self.prefTemplateClipboard.value.indexOf("{LASTACCESSED}") != -1
																								|| self.prefTemplateClipboard.value.indexOf("{ISHTTPONLY_RAW}") != -1
																								|| self.prefTemplateClipboard.value.indexOf("{STATUS_RAW}") != -1
																								|| self.prefTemplateClipboard.value.indexOf("{CREATIONTIME_RAW}") != -1
																								|| self.prefTemplateClipboard.value.indexOf("{LASTACCESSED_RAW}") != -1);
			self.prefTemplateFile.extra = (self.prefTemplateFile.value.indexOf("{ISHTTPONLY}") != -1
																						|| self.prefTemplateFile.value.indexOf("{STATUS}") != -1
																						|| self.prefTemplateFile.value.indexOf("{CREATIONTIME}") != -1
																						|| self.prefTemplateFile.value.indexOf("{LASTACCESSED}") != -1
																						|| self.prefTemplateFile.value.indexOf("{ISHTTPONLY_RAW}") != -1
																						|| self.prefTemplateFile.value.indexOf("{STATUS_RAW}") != -1
																						|| self.prefTemplateFile.value.indexOf("{CREATIONTIME_RAW}") != -1
																						|| self.prefTemplateFile.value.indexOf("{LASTACCESSED_RAW}") != -1);

			if (self._cookiesAll.length > 0)
			{
				self.selectLastCookie(true);
			}
			coomanPlusCore.async(self.resizeWindow);
		}//onPrefChange_do()
	},//onPrefChange()

	loadCookies: function loadCookies(criterium, noresort, selected, updated, deleteExpired, isImport, startup)
	{
log.debug(this.loadCookies.started);
		if (this.loadCookies.started)
			return;

		this.loadCookies.started = true;

		criterium = typeof(criterium) == "undefined" ? $('lookupcriterium').getAttribute("filter") : criterium;
		
		deleteExpired = typeof(deleteExpired) == "undefined" ? coomanPlus.pref("deleteexpired") : deleteExpired;
log.debug("deleteExpired: " + deleteExpired);
		// load cookies into a table
		let count = 0,
				e = coomanPlusCore._cm.enumerator,
				cookiesAll = [],
				expired = [],
				t = (new Date()).getTime(),
				self = this;
		self._currentIndex = self._cookiesTree.view.selection.currentIndex;
		this._cookiesAll = [];
/*
		if (!$(this._cookiesTree.getAttribute("sortResource"))
				|| $(this._cookiesTree.getAttribute("sortResource")).getAttribute("hidden") == "true")
			this._cookiesTree.setAttribute("sortResource", "rawHost");
*/

		let sort = ['creationTimeString', 'lastAccessedString', 'isHttpOnly', 'isSecure', 'statusString'].indexOf(this._cookiesTree.getAttribute("sortResource")) != -1;
		while (e.hasMoreElements())
		{
			let nextCookie = e.getNext();
			if (!nextCookie || !(nextCookie instanceof Ci.nsICookie))
				break;

//EXTRA
//			let aCookie = new this.cookieObject(nextCookie, false, updated)
			let aCookie = new this.cookieObject(nextCookie.QueryInterface(Ci.nsICookie2), false, updated)
			if (deleteExpired && aCookie.expires && aCookie.expires *1000 < t
					&& (!aCookie.isProtected || !coomanPlus.protect.enabled || coomanPlus.pref("deleteprotected")))
			{
					expired.push(aCookie);
			}
			else
				cookiesAll.push(aCookie);
		}
/*
		coomanPlusCore.async(function()
		{
			let c,
					i = 0;
			while(c = cookiesAll[i++])
			{
				c.hash = coomanPlusCore.cookieHash(c);
			} 
		});
*/
		this._cookiesAll = cookiesAll;
		if (expired.length)
		{
			coomanPlusCore.async(function()
			{
log.debug("delete expired");
				let d = expired.length;
				for(let aCookie of expired)
				{
					coomanPlus._noObserve = true;
					if (aCookie.isProtected)
					{
log.debug("unprotect");
						coomanPlus.protect.obj.unprotect(aCookie);
					}
					coomanPlus.cookieRemove(aCookie);
				}
			});
		}

		for(let i = 0; i < cookiesAll.length; i++)
		{
			let aCookie = cookiesAll[i];
			if (criterium && !this._cookieMatchesFilter(aCookie, criterium, true))
				continue;

//EXTRA
//			if (sort)
//				aCookie = this._cookieGetExtraInfo(aCookie);

			this._cookies[count] = aCookie; //we can't use push() because we are replacing existing data to avoid flickering
			count++;
		}
		if (count < this._cookies.length) //to avoid flickering effect we replacing existing data in _cookies array, trimming off old data
		{
			this._cookies.splice(count, this._cookies.length - count);
		}
		function _readonly()
		{
			let i = 0,
					aCookie;
			while(aCookie = self._cookies[i++])
			{
//				aCookie.hash = coomanPlusCore.cookieHash(aCookie);
				aCookie.readonly = coomanPlusCore.readonlyCheck(aCookie);
			}
			self._noselectevent = true;
			self.sortTreeData(self._cookiesTree, self._cookies);
			self._cookiesTreeView.rowCount = self._cookies.length;
			self._cookiesTree.treeBoxObject.view = self._cookiesTreeView;
			self._cookiesTree.view.selection.currentIndex = self._currentIndex;
			self._noselectevent = false;
			if (!startup)
				self.selectLastCookie(noresort, isImport);

			self.loadCookies.started = false;
		}
		if (self._cookiesTree.getAttribute("sortResource") == "readonly")
		{
			coomanPlusCore.async(_readonly);
		}
		else
			_readonly();
	},//loadCookies()

	_updateCookieData: function _updateCookieData(aCookie, selections)
	{
log.debug();
		selections = typeof(selections) == "undefined" ? this.getTreeSelections(this._cookiesTree) : selections;
		let multi = "<" + this.string("multipleSelection") + ">",
				na = "--",//"<" + this.string("na") + ">",
				count = selections.length;

//EXTRA
//		if (this.prefShowExtra)
//			aCookie = this._cookieGetExtraInfo(aCookie);
		aCookie = "QueryInterface" in aCookie ? new this.cookieObject(aCookie, false) : aCookie;
		if (!aCookie.readonly)
			aCookie.readonly = coomanPlusCore.readonlyCheck(aCookie);

		let fixed =  this.clone(aCookie),
				value, field;
		for(let i = 0; i < count; i++)
		{
			if (!this._cookies[selections[i]].readonly)
				this._cookies[selections[i]].readonly = coomanPlusCore.readonlyCheck(this._cookies[selections[i]]);

			let s = this._cookieEquals(aCookie, this._cookies[selections[i]], true);
					readonly = this._cookies[selections[i]].readonly;

			for(let o in fixed)
			{
//EXTRA
//			if (this.prefShowExtra)
//				this._cookies[selections[i]] = this._cookieGetExtraInfo(this._cookies[selections[i]]);

				if (o == "readonly" || o == "_aCookie")
					continue

				let isRo = this.readonlyFields.indexOf(o) != -1;
				if (typeof(fixed[o]) != "object" || fixed[o] === null || o == "originAttributes")
				{
					fixed[o] = [fixed[o], null, []];
					if (isRo && this.pref("readonly"))
					{
						fixed[o][4] = typeof(fixed.readonly[o]) != "undefined";
						fixed[o][5] = false;
					}
				}

				fixed[o][2][i] = this._cookies[selections[i]][o];
				if (!s && this._cookies[selections[i]] && o in this._cookies[selections[i]] && this._cookies[selections[i]][o] !== fixed[o][0])
				{
					fixed[o][0] = multi;
					fixed[o][1] = true;
				}
				if (!s && isRo)
					fixed[o][5] = (fixed[o][5] || fixed[o][4] !== (typeof(readonly[o]) != "undefined"));
			}
		}
		let props = [
			{id: "name", value: fixed.name},
			{id: "value", value: fixed.value},
/*
			{id: "isDomain",
						 value: [aCookie.isDomain ?
										this.string("domainColon") : this.string("hostColon"), false]},
*/
			{id: "host", value: fixed.host},
			{id: "path", value: fixed.path},
			{id: "isSecure",
						 value: [fixed.isSecure[1] ? fixed.isSecure[0] : (fixed.isSecure[0] ?
										this.strings.secureYes :
										this.strings.secureNo), fixed.isSecure[1], fixed.isSecure[2], fixed.isSecure[3], fixed.isSecure[4], fixed.isSecure[5]]},
			{id: "expires", value: [fixed.expires[1] ? fixed.expires[0] : aCookie.expires == -1 ? na : this.getExpiresString(fixed.expires[0]), fixed.expires[1], 0, aCookie.expires == -1, fixed.expires[4], fixed.expires[5]]},
			{id: "expires2", value: [fixed.expires[1] ? fixed.expires[0] : aCookie.expires == -1 ? na : this.getExpiresString(fixed.expires[0]), fixed.expires[1], 0, aCookie.expires == -1]},
			{id: "status", value: [fixed.status[1] ? fixed.status[0] : aCookie.status == -1 ? na : this.string("status"+fixed.status[0]), fixed.status[1], 0, aCookie.status == -1]},
			{id: "policy", value: [fixed.policy[1] ? fixed.policy[0] : this.string("policy"+fixed.policy[0]), fixed.policy[1]]},

			{id: "lastAccessed", value: [fixed.lastAccessed[1] ? fixed.lastAccessed[0] : aCookie.lastAccessed == -1 ? na : this.getExpiresString(fixed.lastAccessed[0] == -1 ? -1 : Math.round(fixed.lastAccessed[0]/1000000)), fixed.lastAccessed[1], 0, aCookie.lastAccessed == -1]},
			{id: "creationTime", value: [fixed.creationTime[1] ? fixed.creationTime[0] : aCookie.creationTime == -1 ? na : this.getExpiresString(fixed.creationTime[0] == -1 ? -1 : Math.round(fixed.creationTime[0]/1000000)), fixed.creationTime[1], 0, aCookie.creationTime == -1]},
			{id: "isHttpOnly", value: [fixed.isHttpOnly[1] ? fixed.isHttpOnly[0] : this.string("yesno"+(fixed.isHttpOnly[0]?1:0)), fixed.isHttpOnly[1], fixed.isHttpOnly[2], fixed.isHttpOnly[3], fixed.isHttpOnly[4], fixed.isHttpOnly[5]]},
			{id: "isProtected", value: [fixed.isProtected[1] ? fixed.isProtected[0] : this.string("yesno"+(fixed.isProtected[0]?1:0)), fixed.isProtected[1], fixed.isProtected[2]]},
			{id: "isProtected2", value: [fixed.isProtected[1] ? fixed.isProtected[0] : this.string("yesno"+(fixed.isProtected[0]?1:0)), fixed.isProtected[1], fixed.isProtected[2]]},
//			{id: "size", value: [fixed.size[1] ? fixed.size[0] : fixed.sizeText[2] + " (" + (fixed.valueSizeText[1] ? fixed.valueSizeText[2][2] : fixed.valueSizeText[2]) + ")", fixed.size[1]]},
			{id: "size", value: [fixed.size[1] ? fixed.size[0] : fixed.sizeText[2], fixed.size[1]]},
			{id: "originAttributes", value: [fixed.originAttributes[1] ? fixed.originAttributes[0] : fixed.originAttributesText[2], fixed.originAttributes[1]]},
			{id: "type", value: [fixed.type[1] ? fixed.type[0] : this.string("cookieType"+fixed.type[0]), fixed.type[1]]},

		];
		this.showedExpires = aCookie.expires == -1 ? -1 : fixed.expires[0] * 1000;
		this.showedCreationTime = fixed.creationTime[0] / 1000;
		let expired = aCookie.expires != -1 && aCookie.expires && aCookie.expires*1000 < (new Date()).getTime();
		$("ifl_expires").setAttribute("expired", expired);
//		if (fixed.expires[1] || (!this.prefExpireProgress && !this.prefExpireCountdown))
		if (fixed.expires[1] || !this.prefView_expires || aCookie.expires == -1)
		{
			$("expireProgressText").hidden = true;
			$("expireProgress").hidden = true;
			if ($("expireProgressText").hidden && $("expireProgress").hidden)
				this.expiresProgress.cancel(1);
		}
		else
		{
			$("expireProgressText").hidden = !this.prefExpireCountdown;
			$("expireProgressText").setAttribute("progress", this.prefExpireProgress);
			if (!fixed.expires[1] && fixed.expires[0] && !fixed.creationTime[1] && fixed.creationTime[0]/1000000 < fixed.expires[0])
			{
				$("expireProgress").hidden = !this.prefExpireProgress;
				$("expireProgress").setAttribute("text", this.prefExpireCountdown);
			}
			else
			{
				if (!fixed.expires[0])
					$("expireProgressText").hidden = true;

				$("expireProgress").hidden = true;
			}
		}
		for(let i = 0; i < props.length; i++ )
		{
			let	id = props[i].id,
					row = $("row_" + id),
					field = $("ifl_" + id);
			if (row)
			{
				row.setAttribute("multi", props[i].value[1]);
				row.setAttribute("empty", !props[i].value[0].length);
				row.setAttribute("na", props[i].value[3] || "");
				if (this.pref("readonly"))
				{
					row.setAttribute("ro", props[i].value[4]);
					row.setAttribute("multiro", props[i].value[5]);
				}
				else
				{
					row.removeAttribute("ro");
					row.removeAttribute("romulti");
				}
			}
			if (field)
			{
				field.setAttribute("multi", props[i].value[1]);
				field.setAttribute("empty", !props[i].value[0].length);
				field.setAttribute("na", props[i].value[3]);
				if (!props[i].value[0].length)
				{
					field.value = "";
					field.setAttribute("value", "<" + this.string("empty") + ">");
					field.setAttribute("placeholder", "<" + this.string("empty") + ">");
				}
				else if(props[i].value[1])
				{
					field.value = "";
					field.setAttribute("value", multi);
					field.setAttribute("placeholder", multi);
				}
				else if(props[i].value[3])
				{
					field.value = "";
					field.setAttribute("value", props[i].value[0]);
					field.setAttribute("placeholder", props[i].value[0]);
				}
				else
				{
					field.value = props[i].value[0];
				}
				field.setAttribute("value", field.value);
				field.realValue = props[i].value[2];
			}

		}//for
		let expires = $("ifl_expires");
		if (expires.getAttribute("multi") == "true" || expires.getAttribute("empty") == "true" || expires.getAttribute("na") == "true")
			expires.removeAttribute("tooltip");
		else
			expires.setAttribute("tooltip", "expiresProgressTooltip");
		let obj = $("ifl_value");
		if (!fixed.value[1] && fixed.value[0].length > 0)
		{
			obj.setAttribute("tooltip", "tooltipValue");
		}
		else
		{
			obj.removeAttribute("tooltip");
		}
		obj.valueOrig = obj.value;
		obj.value = this.parseValue(obj.value);

		if (!fixed.type[1])
			$("img_type").setAttribute("type", fixed.type[0]);

		this.secure((fixed.isSecure[0] && !fixed.isSecure[1]));
//		$("ifl_expires").setAttribute("expired", (aCookie.expires && aCookie.expires*1000 < (new Date()).getTime()));
		if (this.protect.enabled)
		{
			if (fixed.isProtected[1])
			{
				$("protect_btn").collapsed = false;
				$("unprotect_btn").collapsed = false;
				$("menu_protect").collapsed = false;
				$("menu_unprotect").collapsed = false;
				$("tree_menu_protect").collapsed = false;
				$("tree_menu_unprotect").collapsed = false;
			}
			else
			{
				$("protect_btn").collapsed = fixed.isProtected[0];
				$("unprotect_btn").collapsed = !fixed.isProtected[0];
				$("menu_protect").collapsed = fixed.isProtected[0];
				$("menu_unprotect").collapsed = !fixed.isProtected[0];
				$("tree_menu_protect").collapsed = fixed.isProtected[0];
				$("tree_menu_unprotect").collapsed = !fixed.isProtected[0];
			}
			$("protectMenuSeparator").collapsed = false;
			$("tree_protectMenuSeparator").collapsed = false;
		}
		$("menu_exportclipboard").disabled = false;
		$("menu_exportfile").disabled = false;
		$("menu_backupselected").disabled = false;
		$("menu_restoreselected").disabled = false;
		$("menuBackupSelected").disabled = false;
		$("menuRestoreSelected").disabled = false;
		if (!expired && aCookie.expires > 0
				&& this.prefView_expires)
//				&& this.prefView_expires && (this.prefExpireProgress || this.prefExpireCountdown))
		{
			this.expiresProgress.init();
		}
		else if (expired || aCookie.expires < 1)
		{
			this.expiresProgress.cancel(1);
		}
	},//_updateCookieData()

	expiresProgress: {
		timer: Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer),
		started: false,
		inited: false,
		init: function expiresProgress_init(f)
		{
			if (f || !this.started)
			{
				this.cancel();
				this.timer.init(this, 1000, this.timer.TYPE_REPEATING_SLACK);
				if (!this.inited)
				{
					window.addEventListener("unload", this.unload, false);
					this.inited = true;
				}
				this.started = true;
			}
			this.observe(f);
		},
		unload: function expiresProgress_unload()
		{
			coomanPlus.expiresProgress.cancel();
		},
		cancel: function expiresProgress_cancel(f)
		{
			coomanPlus.expiresProgress.timer.cancel();
			this.started = false;
			if (f)
				this.observe();
		},
		observe: function expiresProgress_observe(f)
		{
			if (!$("expireProgress").hidden || !$("expireProgressText").hidden)
			{
				coomanPlus._cookiesTree.treeBoxObject.invalidateRange(coomanPlus._cookiesTree.treeBoxObject.getFirstVisibleRow(), coomanPlus._cookiesTree.treeBoxObject.getLastVisibleRow())
				if (isNaN(coomanPlus.showedExpires) || coomanPlus.showedExpires < 1)
					return;
			}
			if (coomanPlus.showedExpires < 1 && $("expireProgress").hidden && $("expireProgressText").hidden)
			{
				this.cancel();
				return;
			}
			let d = new Date(),
					p = null,
					m = ((coomanPlus.showedExpires - coomanPlus.showedCreationTime) * 10000).toFixed(),
					n = ((coomanPlus.showedExpires - d.getTime()) * 10000).toFixed();
			if (coomanPlus.showedCreationTime)
			{
				n = Math.round(n * 10000 / m);
				m = 10000; //as larger the number, as smoother the progress bar will be. It seems FF chokes on numbers larger then 10M though
				let p = n * 100 / m;
				if (p <= 0.0009)
					p = p.toFixed();
				else if (p <= 0.009)
					p = p.toFixed(3);
				else if (p <= 0.09)
					p = p.toFixed(2);
				else if (p <= 0.9)
					p = p.toFixed(1);
				else
					p = p.toFixed();
			}

			let e = coomanPlus.showedExpires > d.getTime(),
					tt = coomanPlus.strings.cookieexpired;

			if (!e && !f && $("expireProgress").hidden && $("expireProgressText").hidden)
				this.cancel();
			else
			{
				e = new Date(coomanPlus.showedExpires);
				let dd = e-d,
						dday = Math.floor(dd/(86400000)*1),
						dhour = Math.floor((dd%(86400000))/(3600000)*1),
						dmin = Math.floor(((dd%(86400000))%(3600000))/(60000)*1),
						dsec = Math.floor((((dd%(86400000))%(3600000))%(60000))/1000*1),
						s = coomanPlus.strings,
						t = [],
						l;
				if (dday > 0)
					t.push(dday + " " + s['day' + (dday != 1 ? "s" : "")]);

				if (dhour > 0 || t.length)
					t.push(dhour + " " + s['hour' + (dhour != 1 ? "s" : "")]);


				if (dmin > 0 || t.length)
					t.push(dmin + " " + s['minute' + (dmin != 1 ? "s" : "")]);

				if (dsec > 0 || t.length)
					t.push(dsec + " " + s['second' + (dsec != 1 ? "s" : "")]);

				if (t.length)
					tt = coomanPlus.string("cookieexpire_progress").replace("#", t.join(", ")) + (p !== null ? " (" + coomanPlus.string("cookieexpire_progress_life").replace("#", p) + ")" : "");
				else
				{
					n = 0;
					e = false;
				}
			}
			$("expireProgress").setAttribute("max", m);
			$("expireProgress").value = n;
			$("expireProgress").setAttribute("expired", !e);
			$("ifl_expires").setAttribute("expired", !e);
			$("expireProgressText").setAttribute("expired", !e);
			$("expiresProgressTooltip").setAttribute("label", tt);
			$("expireProgressText").setAttribute("label", tt);
			$("expireProgressText").value = tt;
			this._asyncTree = coomanPlusCore.async(function()
			{
				try
				{
					coomanPlus._cookiesTree.treeBoxObject.invalidateRange(coomanPlus._cookiesTree.treeBoxObject.getFirstVisibleRow(), coomanPlus._cookiesTree.treeBoxObject.getLastVisibleRow());
				}catch(e){};
			}, 250, this.asyncTree);
		}
	},

	clearCookieProperties: function clearCookieProperties(l, d)
	{
log.debug();
		let properties = ["name","value","host","path","isSecure",
											"expires", "expires2","policy", "isHttpOnly",
											"lastAccessed", "creationTime", "status",
											"isProtected", "isProtected2", "type", "size",
											"originAttributes"];
		l = typeof(l) == "undefined" ? 0 : l;
		l = (l == 0) ? this.string("noCookieSelected") : "";
		for (let prop = 0; prop < properties.length; prop++)
		{
			let field = $("ifl_" + properties[prop]),
					row = $("row_" + properties[prop]);

			if (field)
			{
				field.value = "";
				field.setAttribute("value", l);
				field.setAttribute("placeholder", l);
				field.removeAttribute("multi");
				field.setAttribute("empty", true);
			}
			if (row)
			{
				row.removeAttribute("multi");
				row.setAttribute("empty", true);
				row.removeAttribute("ro");
			}
		}
		this.secure(false);
		if (d)
		{
			var b = this._cookiesTree.view.selection.selectEventsSuppressed;
			this._cookiesTree.view.selection.selectEventsSuppressed = true;
			this._noselectevent = true;
			this._cookiesTree.view.selection.clearSelection();
			this._cookiesTree.view.selection.currentIndex = null;
			this._cookiesTree.view.selection.selectEventsSuppressed = b;
			this._noselectevent = false;
		}
		$("protect_btn").collapsed = true;
		$("unprotect_btn").collapsed = true;
		$("menu_protect").collapsed = true;
		$("menu_unprotect").collapsed = true;
		$("tree_menu_protect").collapsed = true;
		$("tree_menu_unprotect").collapsed = true;
		$("protectMenuSeparator").collapsed = true;
		$("tree_protectMenuSeparator").collapsed = true;
		$("expireProgress").hidden = true;
		$("expireProgressText").hidden = true;
		$("menu_exportclipboard").disabled = true;
		$("menu_exportfile").disabled = true;
		$("menu_backupselected").disabled = true;
		$("menu_restoreselected").disabled = true;
		$("menuBackupSelected").disabled = true;
		$("menuRestoreSelected").disabled = true;
		$("ifl_expires").removeAttribute("tooltip");
		this._selected = [];
		this.UI_EnableCookieBtns(false, false);
		if ($("expireProgress").hidden	 && $("expireProgressText").hidden)
			this.expiresProgress.cancel(1);
	},//clearCookieProperties()

	clearFilter: function clearFilter()
	{
log.debug();
		$('lookupcriterium').value = "";
		$('lookupcriterium').setAttribute("filter", "");
		this.loadCookies();
	},

	checkFilter: function checkFilter()
	{
		return $("lookupcriterium").value != $("lookupcriterium").getAttribute("filter");
	},

	observe: function observe(aCookie, aSubject, aData)
	{
log.debug();
		if (aSubject == "cmp-command")
			return coomanPlus.command(aData, aCookie);

		if (this._noObserve || aSubject != "cookie-changed" || !this.pref("autoupdate"))
			return;

		if (aCookie instanceof Ci.nsICookie)
		{
			aCookie.QueryInterface(Ci.nsICookie2);
			if (aData == "changed")
				this._handleCookieChanged(aCookie);
			else if (aData == "added")
				this._handleCookieAdded(aCookie);
			else if (aData == "deleted")
				this._handleCookieDeleted(aCookie);
		}
		else if (aData == "cleared")
		{
			this._cookies = [];
			var oldRowCount = this._cookiesTreeView.rowCount;
			this._cookiesTreeView.rowCount = 0;
			this._cookiesTree.treeBoxObject.rowCountChanged(0, -oldRowCount);
			this._cookiesTree.view.selection.clearSelection();
			this._cookiesTree.view.selection.currentIndex = -1;
			this._selected = [];
			this.loadCookies();
		}
		else if (aData == "reload")
		{
			// first, clear any existing entries
			this.observe(aCookie, aSubject, "cleared");

			// then, reload the list
			this.loadCookies();
		}

	},

	_handleCookieAdded: function _handleCookieAdded(aCookie)
	{
log.debug();
		this.observe.timer = coomanPlusCore.async(function()
		{
			coomanPlus.loadCookies($('lookupcriterium').getAttribute("filter"), false, undefined, (new Date()).getTime());
		}, 1000, this.observe.timer);
	},

	_handleCookieDeleted: function _handleCookieDeleted(aCookie)
	{
log.debug();
		this.observe.timer = coomanPlusCore.async(function()
		{
			coomanPlus.loadCookies();
		}, 1000, this.observe.timer);
	},

	_handleCookieChanged: function _handleCookieChanged(_aCookie)
	{
log.debug(_aCookie.name);
		let self = this;
		coomanPlusCore.async(function()
		{
			let aCookie = new self.cookieObject(_aCookie.QueryInterface(Ci.nsICookie2), false, (new Date()).getTime());
			aCookie.hash = coomanPlusCore.cookieHash(aCookie);
			for(let i = 0; i < self._cookies.length; i++)
			{
				if (self._cookieEquals(self._cookies[i], aCookie, true))
				{
					self._cookies[i] = aCookie;
					if (self._isSelected(aCookie, self._selected, undefined, true))
					{
						self._updateCookieData(aCookie);
					}
				}
			}
	//		log(self._cookiesTree.treeBoxObject.getFirstVisibleRow() + " | "  +  self._cookiesTree.treeBoxObject.getLastVisibleRow());
			self._cookiesTree.treeBoxObject.invalidateRange(self._cookiesTree.treeBoxObject.getFirstVisibleRow(), self._cookiesTree.treeBoxObject.getLastVisibleRow());
	//		self._cookiesTree.treeBoxObject.invalidate();
		}, 100);
	}, //_handleCookieChanged()

	secure: function secure(type)
	{
		$("secure").hidden = type ? false : true;
	},

	onKeyDown: function onKeyDown(e)
	{
log.debug();
		let keys = coomanPlus.getKeys(e);
		if (coomanPlus.matchKeys(coomanPlusCore.lastKeyDown, keys[0], keys[0].length) || !("className" in e.target) || e.target.className == "hotkey") //prevent repeats
			return true;

		coomanPlusCore.lastKeyDown = keys[0];
		let r = true;
		if (coomanPlus.matchKeys(keys[0], ["ESCAPE"], 1))
		{
			e.preventDefault();
			e.stopPropagation();
			window.close();
			return false
		}
		if (coomanPlus.matchKeys(keys[0], ["F5"], 1))
		{
			coomanPlus.loadCookies($('lookupcriterium').getAttribute("filter"), true);
		}
		else if (e.target == coomanPlus._cookiesTree)
		{
			if (coomanPlus.matchKeys(keys[0], ["RETURN"], 1))
			{
				coomanPlus.openEdit();
			}
			else if (coomanPlus.matchKeys(keys[0], ["DELETE"], 1))
			{
				coomanPlus.deleteCookies();
			}
			else if (coomanPlus.matchKeys(keys[0], ["SHIFT", "DELETE"], 2))
			{
				coomanPlus.deleteCookies(true);
			}
			else if (coomanPlus.matchKeys(keys[0], ["ACCEL", "A"], 2))
			{
				coomanPlus.selectAllShown();
			}
			else if (coomanPlus.matchKeys(keys[0], ["ALT", coomanPlus.string("protect_protect_accesskey")], 2))
			{
				e.preventDefault();
				e.stopPropagation();
				coomanPlus.protect.obj.protect();
				return false;
			}
			else if (coomanPlus.matchKeys(keys[0], ["ALT", coomanPlus.string("protect_unprotect_accesskey")], 2))
			{
				e.preventDefault();
				e.stopPropagation();
				coomanPlus.protect.obj.unprotect();
				return false;
			}
		}
		return true;
	},

	onKeyUp: function onKeyUp(e)
	{
		coomanPlusCore.lastKeyDown = [];
		coomanPlus.lastKeyTime = (new Date()).getTime();
		let keys = coomanPlus.getKeys(e);
		if (coomanPlus.matchKeys(keys[0], ["CONTEXT_MENU"], 1) || coomanPlus.matchKeys(keys[0], ["SHIFT", "F10"], 2))
		{
			$("coomanPlus_tree_menu").openPopup(e.target, "overlap", 3, 0, false, false);
			e.preventDefault();
			e.stopPropagation();
		}
	},

	treeScroll: function treeScroll()
	{
		coomanPlus._cookiesTree.setAttribute("scrollPos", coomanPlus._cookiesTree.treeBoxObject.getFirstVisibleRow());
	},

	_currentIndexObj: null,
	get _currentIndex()
	{
		if (!this._currentIndexObj)
			this._currentIndex = this._cookiesTree.view.selection.currentIndex;

		if (!this._currentIndexObj)
			return -1;

		let l = this._cookies,
				c = this._currentIndexObj;
		for(let i = 0; i < l.length; i++)
			if (this._cookieEquals(l[i], c))
				return i;

		return -1
	},

	set _currentIndex(index)
	{
		if (this._cookies[index])
			this._currentIndexObj = this._cookies[index];

	},

	selectLastCookie: function selectLastCookie(noresort, isImport)
	{
log.debug();
		let b1 = this._cookiesTree.view.selection.selectEventsSuppressed,
				b2 = this._noselectevent;
		this._currentIndex = this._cookiesTree.view.selection.currentIndex;
		let scroll = this._cookiesTree.getAttribute("scrollPos");
		if (this._cookies.length - this._cookiesTree.treeBoxObject.getPageLength() >= scroll)
		{
			this._cookiesTree.treeBoxObject.scrollToRow(scroll);
		}
		let indexSet = false;
		if (this._selected.length == 0)
		{
			let cookies = this.selectionRead();
			if (cookies && cookies.constructor.name == "Array")
			{
				this._selected = cookies;
				this._currentIndexObj = cookies[0];
				this._selected[0] = "";
				indexSet = true;
			}
			else
			{
				this._selected = [coomanPlusCore.cookieHash({
					host: this._cookiesTree.getAttribute("selectedHost"),
					path: this._cookiesTree.getAttribute("selectedPath"),
					name: this._cookiesTree.getAttribute("selectedName"),
					originAttributes: this._cookiesTree.getAttribute("originAttributes"),
				})];
			}
		}
		let s = 0;
		if (this._selected.length)
		{
			this._cookiesTree.view.selection.selectEventsSuppressed = true;
			this._noselectevent = true

			for( let i = 0; i < this._cookies.length; i++ )
			{
				if (this._isSelected(this._cookies[i], this._selected, undefined, !isImport))
				{
					try
					{
						this._cookiesTree.view.selection.rangedSelect(i, i , s ? true : false);
						if (!noresort && !s)
							this.ensureRowIsVisible(i);
					}
					catch(e){};
					s++;
					if (s > this._selected.length)
					{
						break;
					}
				}
			}
		}

		if (!indexSet && !s)
		{
			this._cookiesTree.view.selection.clearSelection();
			this._cookiesTree.view.selection.currentIndex = -1;
			this._selected = [];
		}
		let r = [-1];
		if (this._isSelected(this._currentIndexObj, this._cookies, r, true))
		{
			this._cookiesTree.view.selection.currentIndex = r[0];
			this.ensureRowIsVisible(r[0]);
		}

		this.cookieSelected(noresort);
		coomanPlus._noselectevent = b2;
		coomanPlus._cookiesTree.view.selection.selectEventsSuppressed = b1;
	},//selectLastCookie()

	ensureRowIsVisible: function ensureRowIsVisible(row, tree)
	{
		tree = tree || this._cookiesTree;
//log([(tree.treeBoxObject.getFirstVisibleRow() < row || tree.treeBoxObject.getLastVisibleRow() > row), row, tree.treeBoxObject.getFirstVisibleRow(), tree.treeBoxObject.getLastVisibleRow()])
		if (tree.treeBoxObject.getFirstVisibleRow() < row || tree.treeBoxObject.getLastVisibleRow() > row)
		{
			tree.treeBoxObject.ensureRowIsVisible(row);
		}
	},//ensureRowIsVisible()

	autocompleteLoad: function autocompleteLoad()
	{
		let isHistory = this.pref("searchhistory") != 0;
		$('lookupcriterium').setAttribute("enablehistory", isHistory);

		let max = coomanPlusCore.pref("searchhistory");
		if (max > 0 && coomanPlusCore.storage.search.length > max)
		{
			coomanPlusCore.storage.search.splice(0, coomanPlusCore.storage.search.length - max);
		}
	},//autocompleteLoad()

	autocompleteSave: function autocompleteSave()
	{
		let max = coomanPlusCore.pref("searchhistory");
		if (max > 0 && coomanPlusCore.storage.search.length > max)
		{
			coomanPlusCore.storage.search.splice(0, coomanPlusCore.storage.search.length - max);
		}
		coomanPlusCore.storageWrite();
	},//autocompleteSave()

	autofilter: function autofilter(e)
	{
		if (!coomanPlus.pref('autofilter') || !coomanPlus.checkFilter())
			return;

		coomanPlus.autofilter.timer = coomanPlusCore.async(function()
		{
			coomanPlus.doLookup(undefined, false, 0);
		}, 250, coomanPlus.autofilter.timer)
	},

	autocompleteTimer: null,

	doLookup: function doLookup(e, website, delay)
	{
log.debug();
		if (this.loadCookies.started)
			return false;

		website = typeof(website) == "undefined" ? this.website : website;
		delay = typeof(delay) == "undefined" ? 0 : delay;
		if (!website)
			this.website = false;

		this.setFilter();
		if( (e && e.keyCode == 13) || !e || this.pref("autofilter"))
		{
			let searchfor = $('lookupcriterium').value,
					self = this;
			$('lookupcriterium').setAttribute("filter", searchfor);
			if (!website)
			{
				let filter = searchfor.trim();
				this.autocompleteTimer = coomanPlusCore.async(function()
				{
					if (coomanPlusCore.pref("searchhistory") != 0 && filter)
					{
						let i = coomanPlusCore.storage.search.indexOf(filter);
							coomanPlusCore.storage.search.push(filter);

						if (i != -1)
							coomanPlusCore.storage.search.splice(i, 1);
					}

					self.autocompleteSave();
				}, this.pref("autofilter") && !e ? 5000 : 0, this.autocompleteTimer);
			}
//			this.cookieSelected(true);
			self.loadCookies(undefined, true);
		}
	},

	twochar: function twochar(s)
	{
		let str = "00" + s;
		return str.substring( ((str.length)-2) ,str.length);
	},

	cookieObjectSave: function cookieObjectSave(aCookie)
	{
		return coomanPlusCore.cookieHash(aCookie);
	},

	cookieSelected: function cookieSelected(noresort)
	{
		if (this._noselectevent)
			return;

log.debug([noresort, this._noselectevent]);

		let selections = this.getTreeSelections(this._cookiesTree);
		this._currentIndex = this._cookiesTree.view.selection.currentIndex;
		$("sel").setAttribute("checked", (selections.length == this._cookies.length) ? 3 : selections.length ? 2 : 1)

		document.title = this.title + "  [" + this.string("stats").replace("NN", this._cookies.length).replace("TT", this._cookiesAll.length).replace("SS", selections.length) + "]";
		let index = this._currentIndex;
		if(selections.length < 1)
		{
			let aCookie = this._cookies[index];
			if (aCookie)
				coomanPlus.selectionSave([this.cookieObjectSave(aCookie)]);

			this.clearCookieProperties(0);
			return true;
		}


		let idx = selections.indexOf(index);
		idx = selections[((idx == -1) ? 0 : idx)];
		if (idx >= this._cookies.length)
		{
			this.UI_EnableCookieBtns(false, false);
			return false;
		}

		this._selected = [];
		for(let i = 0; i < selections.length; i++)
		{
			let aCookie = this._cookies[selections[i]];
			if (!aCookie)
				continue;

			this._selected.push(this.cookieObjectSave(aCookie));
		}


		// save last selected name
		let list = [this.cookieObjectSave(this._cookies[index])];
		list = list.concat(this._selected)

//		this._cookiesTree.setAttribute("selectedCookies", JSON.stringify(cookies));

		this.selectionSave(list);

		this._updateCookieData(this._cookies[idx], selections);
		// make the delete button active
		list = $("ifl_isProtected").realValue;
		let prot = true;
		for(let i = 0; i < list.length; i++)
		{
			if (!(prot = list[i]))
				break;
		}
		let del = ($("ifl_isProtected").getAttribute("multi") == "true" || !this.protect.enabled || this.pref("deleteprotected") || !prot);

		this.UI_EnableCookieBtns(del, true);


		if (this._currentIndex >= 0)
			this.ensureRowIsVisible(this._currentIndex);
		else if (selections.length == 1 && !noresort)
			this.ensureRowIsVisible(selections[0]);

	//out_d("Cookie Manager::CookieSelected::END");

		return true;
	}, //cookieSelected()

	cookieColumnSort: function cookieColumnSort(column, noresort)
	{
log.debug();
		this._currentIndex = this._cookiesTree.view.selection.currentIndex;
		this.sortTree( this._cookiesTree, this._cookies, column);
		this._cookiesTree.view.selection.currentIndex = this._currentIndex;
		this.selectLastCookie(noresort);
	},

	UI_EnableCookieBtns: function UI_EnableCookieBtns(flag, flag2)
	{
log.debug();
		$('deleteCookie').disabled = !flag;
		$('editCookie').disabled = !flag2;
		$('menu_delete').disabled = !flag;
		$('menu_delete_block').disabled = !flag;
		$('menu_edit').disabled = !flag2;
		$('tree_menu_delete').disabled = !flag;
		$('tree_menu_delete_block').disabled = !flag;
		$('tree_menu_edit').disabled = !flag2;
		$('menuExportFile').disabled = !flag2;
		$('menuExportClipboard').disabled = !flag2;
	},

	deleteCookies: function deleteCookies(block)
	{
log.debug();
		let deletedCookies = this.deleteSelectedItemFromTree(this._cookies, block);
		if (!this._cookies.length)
			this.clearCookieProperties(0, true);

		this._noObserve = true;
		this.finalizeCookieDeletions( deletedCookies );
		this._noObserve = false;
		this.loadCookies();
	},

	deleteExpiredCookies: function deleteExpiredCookies(loadCookies, list, selected)
	{
log.debug();
		let t = (new Date()).getTime();
		selected = typeof(selected) == "undefined" ? [] : selected;
		list = typeof(list) == "undefined" ? this._cookies : list;
		for(let i = 0; i < list.length; i++)
		{
			if (list[i].type == coomanPlusCore.COOKIE_NORMAL && list[i].expires && list[i].expires *1000 < t)
				selected.push(i);
		}
		let deletedCookies = this.deleteSelectedItemFromTree(list, false, selected, true);
		
//		if (!list.length)
//			this.clearCookieProperties(0, true);

		coomanPlusCore.async(function()
		{
			coomanPlus._noObserve = true;
			coomanPlus._cookiesTree.view.selection.selectEventsSuppressed = true;
			coomanPlus.finalizeCookieDeletions(deletedCookies);
			coomanPlus._noObserve = false;
			coomanPlus._cookiesTree.view.selection.selectEventsSuppressed = false;
			if (loadCookies)
				coomanPlus.loadCookies(undefined, true);
		});
	},

	deleteSelectedItemFromTree: function deleteSelectedItemFromTree(table, block, selected, DeleteAll)
	{
log.debug();
		block = typeof(block) == "undefined" ? false : block;
		let uChoice = {button:0, block:block},
				prefDeleteConf = this.pref("delconfirm"),
				index = this._currentIndex,
				selections = [],
				deletedTable = [],
				tree = this._cookiesTree;

		// Turn off tree selection notifications during the deletion
		tree.view.selection.selectEventsSuppressed = true;
		this._noselectevent = true;

		selected = selected || this.getTreeSelections(tree, table);
		// remove selected items from list (by setting them to null) and place in deleted list
		if (!this.protect.enabled || this.pref("deleteprotected"))
			selections = selected;
		else
		{
			for(let i = 0; i < selected.length; i++)
			{
				if (!this._cookies[selected[i]].isProtected)
					selections.push(selected[i]);
			}
		}
		for (let s = 0; s < selections.length; s++)
		{
			let i = selections[s];

				// delete = 1, delete all = 2, do not delete = 4, cancel = 3, close window = 0

			if (prefDeleteConf && !DeleteAll)
			{
				table[i].deleted = 1;
				tree.treeBoxObject.invalidateRow(i);
				this.ensureRowIsVisible(i, tree);
				uChoice = this.promptDelete({
					name: table[i].name,
					host: table[i].host,
					path: table[i].path,
					num: selections.length - s,
					total: selections.length,
					button: 0,
					block: block
				});
				if (uChoice.button == 4) //don't delete
				{
					delete table[i].deleted;
					tree.treeBoxObject.invalidateRow(i);
					continue;
				}
				else if (uChoice.button == 0 || uChoice.button == 3) //cancel / close window
				{
					delete table[i].deleted;
					tree.treeBoxObject.invalidateRow(i);
					break;
				}
				else if (uChoice.button == 2) //delete all
					DeleteAll = true;
			}

			if ( DeleteAll || !prefDeleteConf || uChoice.button == 1 )
			{
				table[i].block = uChoice.block;
				table[i].deleted = 2;
				deletedTable.push(table[i]);
				if (!table[i].originAttributes && table[i]._aCookie && table[i]._aCookie.originAttributes)
					table[i].originAttributes = table[i]._aCookie.originAttributes;
			}
			tree.treeBoxObject.invalidateRow(i);
			this.ensureRowIsVisible(i, tree);
		}
		if (!table[index] || table[index].deleted)
		{
			for (let s = 0; s < selections.length; s++)
			{
				let i = selections[s];
				if (!table[i].deleted)
				{
					index = i;
					break;
				}
			}
		}
		
		this._currentIndex = index;
		this._cookiesTree.view.selection.currentIndex = index;

		this.supress_getCellText = true;

		// collapse list by removing all the null entries
		for (let j = 0; j < table.length; j++)
		{
			if (table[j].deleted == 2)
			{
				table.splice(j, 1);
				--tree.view.rowCount;
				tree.treeBoxObject.rowCountChanged(j--, -1);
			}
		}
//		tree.view.rowCount = table.length;
		let newSelected = [];

//		this.supress_getCellText = false;
		if (table.length)
		{
			let s = this._selected;
			for( let i = 0; i < s.length; i++ )
			{
				let r = [-1];
				if(this._isSelected({hash: s[i]}, table, r))
				{
					newSelected.push(coomanPlusCore.cookieHash(table[r[0]]));
/*
					try
					{
						tree.view.selection.rangedSelect(r, r , newSelected.length ? true : false);
					}
					catch(e){};
*/
				}
			}
			this._selected = newSelected;
			if (!newSelected.length)
			{
				let nextSelection = (selections[0] < table.length) ? selections[0] : table.length-1;
				newSelected.push(coomanPlusCore.cookieHash(table[nextSelection]))
			}
		}
		this.selectionSave(newSelected)
		tree.view.selection.selectEventsSuppressed = false;
		this._noselectevent = false;
		this.supress_getCellText = false;
		return deletedTable;
	},

	finalizeCookieDeletions: function finalizeCookieDeletions(deletedCookies)
	{
log.debug();
		for (let c = 0; c < deletedCookies.length; c++)
		{
			if (deletedCookies[c].isProtected)
				coomanPlus.protect.obj.unprotect(deletedCookies[c]);

			this.cookieRemove(deletedCookies[c])
		}
		deletedCookies.length = 0;
	},

	cookieClickEvent: function cookieClickEvent(e)
	{
		if (e.type == "click" && e.target.id == "sel")
		{
log.debug();
			coomanPlus.selectAllToggle(e.button);
			return;
		}
	},

	selectAllShown: function selectAllShown()
	{
log.debug();
		this._cookiesTree.view.selection.selectAll();
//		this._cookiesTree.focus();
	},

	selectAllToggle: function selectAllToggle(button)
	{
log.debug();
		if (button == 2)
			return this.invertSelection();

		if (button)
			return;

		let s = this.getTreeSelections(this._cookiesTree),
				index = this._cookiesTree.view.selection.currentIndex;

		if (s.length == this._cookies.length)
			this._cookiesTree.view.selection.clearSelection();
		else
		{
/*
			this._cookiesTree.view.selection.selectEventsSuppressed = true;
			this._noselectevent = true;
			for (let i = 0; i < this._cookies.length; i++)
				this._cookiesTree.view.selection.rangedSelect(i, i, (i));

			this._cookiesTree.view.selection.currentIndex = index;
			this._cookiesTree.view.selection.selectEventsSuppressed = false;
			this._noselectevent = false;

			this.cookieSelected();
*/
			this._cookiesTree.view.selection.selectAll();
		}

//		this._cookiesTree.focus();
	},//selectAllToggle()

	invertSelection: function invertSelection()
	{
log.debug();
		let sel = this._cookiesTree.view.selection,
				cnt = this._cookiesTree.view.rowCount;
		this._cookiesTree.view.selection.selectEventsSuppressed = true;
		this._noselectevent = true;

		for (let i = 0; i < cnt; i++)
			sel.toggleSelect(i);

		this._cookiesTree.view.selection.currentIndex = this._currentIndex;
		this._cookiesTree.view.selection.selectEventsSuppressed = false;
		this._noselectevent = false;

		this.cookieSelected();
//		this._cookiesTree.focus();

	},//invertSelection()

	setFilter: function setFilter(subject, topic, key)
	{
log.debug();
		this.prefFiltersearchcontent = this.pref("searchcontent");
		this.prefFiltersearchhost = this.pref("searchhost");
		this.prefFiltersearchname = this.pref("searchname");
		this.prefFiltersearchcase = this.pref("searchcase");
		this.prefFiltersearchhosttype = this.pref("searchhosttype");
//		this.prefFiltersearchtype = this.pref("searchtype");
		this.prefFiltersearchregex = this.pref("searchregex");
		this.prefFiltersearchtype = coomanPlusCore.COOKIE_NORMAL;

		if (!this.prefFiltersearchtype)
		{
			this.prefFiltersearchtype = coomanPlusCore.COOKIE_NORMAL + coomanPlusCore.COOKIE_HTML5;
			coomanPlus.pref("searchtype", this.prefFiltersearchtype);
		}
		this.prefFiltersearchtype1 = this.prefFiltersearchtype & coomanPlusCore.COOKIE_NORMAL;
		this.prefFiltersearchtype2 = this.prefFiltersearchtype & coomanPlusCore.COOKIE_HTML5;

/*
		if (this.website)
		{
			this.pref("searchcontent", false);
			this.pref("searchhost", true);
			this.pref("searchname", false);
			this.pref("searchcase", false);
			this.pref("searchhosttype", 1);
			this.pref("searchtype", coomanPlusCore.COOKIE_NORMAL + coomanPlusCore.COOKIE_HTML5);
		}
*/
		this.setChecked("searchcontent");
		this.setChecked("searchhost");
		this.setChecked("searchname");
		this.setChecked("searchcase");
		this.setChecked("searchtype1");
		this.setChecked("searchtype2");
		this.setChecked("searchregex");
//		this.setChecked("searchhosttype");
		let m = $("searchhosttype").menupopup.children;
		for (let i of m)
			i.setAttribute("checked", i.value == this.prefFiltersearchhosttype);

		if (this.website)
		{
			this.prefFiltersearchcontent = false;
			this.prefFiltersearchhost = true;
			this.prefFiltersearchname = false;
			this.prefFiltersearchcase = false;
			this.prefFiltersearchhosttype = 1;
			this.prefFiltersearchtype = coomanPlusCore.COOKIE_NORMAL + coomanPlusCore.COOKIE_HTML5;
			this.prefFiltersearchregex = false;
		}
//		this.website = false;
		if (!this.prefFiltersearchcontent && !this.prefFiltersearchhost && !this.prefFiltersearchname)
		{
			var k = (topic == "nsPref:changed" && "prefFilter" + key in this) ? key : "searchhost";
			this['prefFilter' + k] = true;
			this.prefs.setBoolPref(k, true);
			return;
		}
		if ($('lookupcriterium').getAttribute("filter") != "" && topic == "nsPref:changed" && "prefFilter" + key in this)
		{
			this.loadCookies();
//			this.selectLastCookie(true);
		}
	},//setFilter()

	setChecked: function setChecked(id)
	{
		let obj = $(id);
		if (this["prefFilter" + id])
			obj.setAttribute("checked", true);
		else
			obj.removeAttribute("checked");

		if (this.website && id != "searchhost")
//		if (this["prefFilter" + id] && this.website && id != "searchhost")
			obj.setAttribute("indeterminate", true);
		else
			obj.removeAttribute("indeterminate");
	},

	regexInfo: function regexInfo()
	{
		let url = "http://www.regextester.com/jssyntax.html";
		if (coomanPlus.getOpenURL)
			coomanPlus.getOpenURL(url, true);
		else
			window.open(url);
	},//regexInfo()

	changeFilter: function changeFilter(e)
	{
log.debug();
		let obj = e.originalTarget;

		if (this.website)
		{
			this.website = false;
			this.doLookup();
			return;
		}
		if (obj.getAttribute("type") == "radio")
		{
			let name = obj.getAttribute("name");
			this["prefFilter" + name] = obj.value;
			this.pref(name, obj.value);
		}
		else
		{
			let id = obj.id;
			if (id.indexOf("searchtype") != -1)
			{
				let prev = coomanPlus.pref("searchtype");
				if (!$("searchtype1").hasAttribute("checked")
						&& !$("searchtype2").hasAttribute("checked"))
					obj.setAttribute("checked", true);

				let val = $("searchtype1").hasAttribute("checked") ? 1 : 0;
				val += $("searchtype2").hasAttribute("checked") ? 2 : 0;
				if (!val)
					val = 1;

				if (val == prev)
					return;

				this.prefFiltersearchtype = val;
				this.prefFiltersearchtype1 = this.prefFiltersearchtype & coomanPlusCore.COOKIE_NORMAL;
				this.prefFiltersearchtype2 = this.prefFiltersearchtype & coomanPlusCore.COOKIE_HTML5;

				id = id.substr(0, id.length - 1);
				this.pref(id, val);

				this.loadCookies();
//				this.selectLastCookie();
				return;
			}
			this["prefFilter" + id] = obj.hasAttribute("checked");
			this.pref(id, obj.hasAttribute("checked"));
		}
	},//changeFilter()

	_match: function _match(str, needle, wildcard, start, type)
	{
		let regex = needle instanceof RegExp;
		if (regex)
		{
			try
			{
				return str.substring(start).match(needle);
			}
			catch(e)
			{
//				needle = needle.toString();
			}
		}
		needle = needle.replace(/[*]{2,}/g, "*");
		wildcard = typeof(wildcard) == "undefined" ? needle.match(/[*?]/) : wildcard;


		start = typeof(start) == "undefined" ? 0 : start;
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
			try
			{
				let r = new RegExp((exact ? "^" : "")+ needle.replace(/\*/g, ".*").replace(/\?/g, ".") + (exact ? "$" : ""), "");
				return str.substring(start).match(r);
			}
			catch(e){}
		}
		else
		{
			if (exact)
				return str.substring(start) == needle;

			return str.substring(start).indexOf(needle) != -1;
		}
	},//_match()

	_cookieMatchesFilter: function _cookieMatchesFilter(aCookie, filter)
	{
		host = aCookie.host;
		name = aCookie.name;
		value = aCookie.value;
		let match = filter.match(/^(\/?)(.*?)(\/([gimuy]*))?$/),
				type = "normal";
//		if (this.prefFiltersearchregex || (match && match[1] && match[3]))
		if (this.prefFiltersearchregex)
		{
			if (match)
			{
				try
				{
					filter = new RegExp(match[2], match[4] ? match[4] : (this.prefFiltersearchcase ? "" : "i"));
					type = "regex";
				}
				catch(e)
				{
					type = "error";
				}
			}
			else
			{
				try
				{
					filter = new RegExp(filter, (this.prefFiltersearchcase ? "" : "i"));
					type = "regex"
				}
				catch(e)
				{
					type = "error";
				}
			}
		}
		else if (!this.prefFiltersearchcase)
		{
			host = host.toLowerCase();
			name = name.toLowerCase();
			value = value.toLowerCase();
			filter = filter.toLowerCase();
		}
//log([host,filter]);
		$("lookupcriterium").setAttribute("entrytype", type);
		return (this.prefFiltersearchhost && coomanPlus._match(host, filter, undefined, undefined, this.prefFiltersearchhosttype)) ||
					 (this.prefFiltersearchname && coomanPlus._match(name, filter)) ||
					 (this.prefFiltersearchcontent && coomanPlus._match(value, filter));
	},

	setSort: function setSort(subject, topic, key)
	{
log.debug();
		this.prefSimpleHost = this.pref("simplehost");
		if (topic == "nsPref:changed" && key == "simplehost")
			this.sortTree(this._cookiesTree, this._cookies);
	},

	openAdd: function openAdd()
	{
log.debug();
//		this._openDialog("editCookie.xul", "_blank", "chrome,resizable=yes,centerscreen,dialog=no," + (this.isMac ? "dialog=no" : "modal"), {type: "new", cookies: this.getTreeSelections(this._cookiesTree).length ? [this._cookies[this._cookiesTree.view.selection.currentIndex]] : null});
		this.openEdit({type: "new"});
	},

	openCookies: function openCookies()
	{
log.debug();
		let cm = "chrome://browser/content/preferences/cookies.xul",
				wm = Cc['@mozilla.org/appshell/window-mediator;1'].getService(Ci.nsIWindowMediator),
				browsers = wm.getZOrderDOMWindowEnumerator('', false),
				browser;

		while (browser = browsers.getNext())
		{
			if (browser.location.href.toString() == cm)
			{
				browser.focus();
				return;
			}
		}
		let ww = Cc["@mozilla.org/embedcomp/window-watcher;1"].getService(Ci.nsIWindowWatcher),
				args = {};

		args.wrappedJSObject = {
			window: window,
			type: "forced",
		};
		ww.openWindow(null,	cm, "Browser:Cookies", "chrome,resizable,centerscreen", args).focus();
	},

	promptDelete: function promptDelete(args)
	{
log.debug();
//		this._openDialog("promptDelete.xul", "promptDelete", "chrome,resizable=no,centerscreen,dialog=no," + (this.isMac ? "dialog=no" : "modal"), args);
		this._openDialog("promptDelete.xul", "promptDelete", "chrome,resizable=no,centerscreen,modal,dialog" + (this.isMac ? "" : "=no"), args);
		return args;
	},

	openCookiesPermissions: function openCookiesPermissions()
	{
log.debug();
		var cm = "chrome://browser/content/preferences/permissions.xul";
		var wm = Cc['@mozilla.org/appshell/window-mediator;1'].getService(Ci.nsIWindowMediator);
		var browsers = wm.getZOrderDOMWindowEnumerator('', false);

		var browser;
		while (browser = browsers.getNext())
		{
			if (browser.location.href.toString() == cm)
			{
				browser.focus();
				return;
			}
		}
		var bundlePreferences = $("bundlePreferences");
		var params = { blockVisible   : true,
									 sessionVisible : true,
									 allowVisible   : true,
									 prefilledHost  : "",
									 permissionType : "cookie",
									 windowTitle    : bundlePreferences.getString("cookiepermissionstitle"),
									 introText      : bundlePreferences.getString("cookiepermissionstext") };
		this._openDialog(cm, "Browser:Permissions", "chrome,resizable,centerscreen", params);
	},

	infoRowsShow: function infoRowsShow(resize)
	{
log.debug();
		this.searchField();

		$("protect_menu").collapsed = !this.protect.enabled;
		resize = typeof(resize) == "undefined" ? false : resize
		this.prefExpireCountdown = !$("expireProgressText").collapsed; //this.pref("expirecountdown");
		this.prefExpireProgress = !$("expireProgress").collapsed;
		this.prefViewOrder = $("cookieInfoRows").hasAttribute("order") ? $("cookieInfoRows").getAttribute("order") : this.prefViewOrderDefault;
		this.prefView_name = !$("row_name").collapsed;
		this.prefView_host = !$("row_host").collapsed;
		this.prefView_value = !$("row_value").collapsed;
		this.prefView_path = !$("row_path").collapsed;
		this.prefView_expires = !$("row_expires").collapsed;
		this.prefView_isSecure = !$("row_isSecure").collapsed;
		this.prefView_creationTime = !$("row_creationTime").collapsed;
		this.prefView_lastAccessed = !$("row_lastAccessed").collapsed;
		this.prefView_isHttpOnly = !$("row_isHttpOnly").collapsed;
		this.prefView_policy = !$("row_policy").collapsed;
		this.prefView_status = !$("row_status").collapsed;
		this.prefView_isProtected = !$("row_isProtected").collapsed;
		this.prefView_size = !$("row_size").collapsed;
		this.prefView_type = !$("row_type").collapsed;
		this.prefView_originAttributes = !$("row_originAttributes").collapsed;

//EXTRA
//		this.prefShowExtra = this.prefView_creationTime || this.prefView_lastAccessed || this.prefView_isHttpOnly || this.prefView_status || this.prefExpireProgress;
		let rows = $("cookieInfoRows").getElementsByTagName("row"),
				last,
				id;
				s = 0;
		for(let i = 0; i < rows.length; i++)
		{
			id = rows[i].id.replace("row_", "");
			if ('prefView_' + id in this)
			{
//					rows[i].collapsed = !this['prefView_' + id];
				$("menu_info_" + id).setAttribute("checked", this['prefView_' + id]);
			}
			if (!rows[i].collapsed && !rows[i].hidden)
			{
				rows[i].setAttribute("first", (!last));
				last = rows[i];
			}
		}
		$("menu_info_expireProgress").disabled = !this.prefView_expires;
		$("menu_info_expireProgressText").disabled = !this.prefView_expires;
		$("menu_info_expireProgress").setAttribute("checked", this.prefExpireProgress);
		$("menu_info_expireProgressText").setAttribute("checked", this.prefExpireCountdown);
		$("cookieInfoBox").collapsed = last ? false : true;
		let c = this.protect.enabled;
		$("row_isProtected").hidden = !c;
		$("isProtected").collapsed = !c;
		$("protectMenuSeparator").collapsed = !c;
		$("menu_info_isProtected").collapsed = !c;
		$("menu_protect").collapsed = !c;
		$("menu_unprotect").collapsed = !c;
		$("tree_protectMenuSeparator").collapsed = !c;
		$("tree_menu_protect").collapsed = !c;
		$("tree_menu_unprotect").collapsed = !c;
		$("protect_menu").collapsed = !c;
		$("isProtected")[c ? "removeAttribute" : "setAttribute"]("ignoreincolumnpicker", true);
		c = this.pref("readonly")
		$("readonly").collapsed  = !c;

		this.infoRowsChanged = this.prefViewOrder != this.prefViewOrderDefault;
		$("menu_info_reset").disabled = !this.infoRowsChanged;
		coomanPlus.setWrap();
		coomanPlus.setExpand();
		coomanPlus.setDecode();
		coomanPlus.setBase64Decode();
		coomanPlus.setValActions();
		if (!resize)
			return;

		coomanPlus.resizeWindow();
	},

	infoRowsSort: function infoRowsSort(order)
	{
log.debug();
		if (typeof(order) == "undefined")
			order = this.prefViewOrder.split("|");//$("cookieInfoRows").getAttribute("order").split("|");

		let rows = $("cookieInfoRows").getElementsByTagName("row"),
				last, from, to, first;
		for(let i = 0; i < rows.length; i++)
		{
			let row = $("row_" + order[i]);
			if (!rows[i].collapsed && !rows[i].hidden)
			{
				if (!first && rows[i].id != "row_start")
					first = rows[i];
				else if (rows[i].id != "row_end")
					last = rows[i];
			}

			if (!order[i])
				continue;

			if (!row || row.id == rows[i].id)
				continue;

			row.removeAttribute("highlight");
			from = row;
			to = rows[i];
			this.moveAfter(row, to);
			to.setAttribute("collapsed", to.collapsed);
			row.removeAttribute("first");
			row.removeAttribute("last");
		}
		if (first)
		{
			first.setAttribute("first", true);
			this.infoRowsFirst = first;
		}
		if (last)
		{
			last.setAttribute("last", true);
			this.infoRowsLast = last;
		}
	},

	infoRowAction: function infoRowAction(e)
	{
log.debug();
		if (!e.button && e.target.tagName == "button")
			return;

		let o = e.currentTarget.parentNode.getElementsByTagName("textbox")[0]
		if (o.getAttribute("empty") == "true" || o.getAttribute("multi") == "true")
		{
			o.focus();
			return false;
		}

		if (!e.button)
			this.textboxSelect(o);

		if (!e.button && e.detail > 1)
			this.infoRowCopyToClipboard(e);
	},

	infoRowCopyToClipboard: function infoRowCopyToClipboard(e)
	{
log.debug();
		if (e.button)
			return false;

		let o = e.currentTarget.parentNode.getElementsByTagName("textbox")[0]
		this.textboxSelect(o);
		Cc["@mozilla.org/widget/clipboardhelper;1"]
		.getService(Ci.nsIClipboardHelper)
		.copyString(o.value);
	},

	infoRowContextCheck: function infoRowContextCheck(e)
	{
		let obj = document.popupNode.getAttribute("onclick") != "" ? document.popupNode : document.popupNode.parentNode,
				o = obj.parentNode.getElementsByTagName("textbox")[0]
						|| obj.parentNode.parentNode.getElementsByTagName("textbox")[0]
						|| obj.parentNode.parentNode.parentNode.getElementsByTagName("textbox")[0]
						|| obj.parentNode.parentNode.parentNode.parentNode.getElementsByTagName("textbox")[0];

		$("infoRowCopy").disabled = (o.getAttribute("empty") == "true" || o.getAttribute("multi") == "true");
		$("infoRowUp").disabled = obj.parentNode.id == coomanPlus.infoRowsFirst.id;
		$("infoRowDown").disabled = obj.parentNode.id == coomanPlus.infoRowsLast.id;
		
		let hide = o.id != "ifl_value";
		$("infoRow_wrap").collapsed = hide;
		$("infoRow_wrap").previousSibling.collapsed = hide;
		$("infoRow_expand").collapsed = hide;
		$("infoRow_decode").collapsed = hide;
		$("infoRow_base64decode").collapsed = hide;
		$("infoRowActionBtns").collapsed = hide;
		coomanPlus.infoRowMenuOrder($("coomanPlus_inforow_menu"));
		obj.click();
	},

	infoRowMenuOrder: function infoRowMenuOrder(menu)
	{
		let a = $("value_actions"),
				list = [],
				prev1 = $("infoRow_wrap"),
				prev2 = $("infoRow_wrap2");

		for (let i = 1; i < a.children.length; i++)
			list[Number(a.children[i].ordinal)] = a.children[i].id.replace("value_", "");

		for(let i = 0; i < list.length; i++)
		{
			let id = list[i];
			let obj = $("infoRow_" + id);

			if (obj)
			{
				obj.parentNode.insertBefore(obj, prev1.nextSibling)
				prev1 = obj;
			}

			obj = $("infoRow_" + id + "2");
			if (obj)
			{
				obj.parentNode.insertBefore(obj, prev2.nextSibling)
				prev2 = obj;
			}
		}
	},//infoRowMenuOrder()

	infoRowGetRowObj: function infoRowGetRowObj(p)
	{
		while(p)
		{
			if (p.tagName == "row")
				break;

			p = p.parentNode;
		}
		return p;
	},

	infoRowContextExec: function infoRowContextExec(e)
	{
log.debug();
		let obj = document.popupNode,
				o = coomanPlus.infoRowGetRowObj(obj),
				t;
		if (o)
			obj = o.firstChild;

		switch(e.target.value)
		{
			case "select":
					obj.click();
				break;
			case "copy":
					let evt = document.createEvent("MouseEvents");
					evt.initMouseEvent("click", true, true, window, 2, 0, 0, 0, 0, false, false, false, false, 0, null);
					obj.dispatchEvent(evt);
				break;
			case "up":
					o = coomanPlus.infoRowGetRowObj(obj.parentNode);
					if (o)
						coomanPlus.dragMoveUp(o);
				break;
			case "down":
					o = coomanPlus.infoRowGetRowObj(obj.parentNode);
					if (o)
						coomanPlus.dragMoveDown(o);
				break;
			case "wrap":
					o = $("ifl_value");
					o.setAttribute("wrap", o.getAttribute("wrap") == "on" ? "off" : "on");
					coomanPlus.setWrap();
				break;
			case "expand":
					o = $("ifl_value");
					t = o.getAttribute("expand") == "on";
					o.setAttribute("expand", t ? "off" : "on");
					coomanPlus.setExpand();
					if (o.getAttribute("empty") != "true" && o.getAttribute("multi") != "true" )
						o.value = coomanPlus.parseValue(o.valueOrig);
				break;
			case "decode":
					o = $("ifl_value");
					t = o.getAttribute("decode") == "on";
					o.setAttribute("decode", t ? "off" : "on");
					coomanPlus.setDecode();
					if (o.getAttribute("empty") != "true" && o.getAttribute("multi") != "true" )
						o.value = coomanPlus.parseValue(o.valueOrig);
				break;
			case "base64decode":
					o = $("ifl_value");
					t = o.getAttribute("base64decode") == "on";
					o.setAttribute("base64decode", t ? "off" : "on");
					coomanPlus.setBase64Decode();
					if (o.getAttribute("empty") != "true" && o.getAttribute("multi") != "true" )
						o.value = coomanPlus.parseValue(o.valueOrig);
				break;
			case "actions":
					o = $("value_actions");
					o.collapsed = !o.collapsed;
					coomanPlus.setValActions();
				break;
		}
		return true;
	},

	parseValue: function parseValue(value)
	{
		let o = $("ifl_value"),
				a = $("value_actions"),
				list = [],
				val = value;
		for (let i = 0; i < a.children.length; i++)
			list[a.children[i].ordinal] = a.children[i];

		for (let i = 0; i < list.length; i++)
		{
			if (!list[i])
				continue;

			switch(list[i].id.replace("value_", ""))
			{
				case "decode":
					if (o.getAttribute("decode") == "on")
					{
						try
						{
							val = decodeURIComponent(value);
						}catch(e){};
						$("value_decode").setAttribute("applied", val !== value);
						value = val;
					}
				break;
				case "expand":
					if (o.getAttribute("expand") == "on")
					{
						try
						{
							val = JSON.stringify(JSON.parse(value), null, 2);
						}catch(e){};
						$("value_expand").setAttribute("applied", val !== value);
						value = val;
					}
				break;
				case "base64decode":
					if (o.getAttribute("base64decode") == "on")
					{
						try
						{
							val = atob(value);
						}catch(e){}
						$("value_base64decode").setAttribute("applied", val !== value);
						value = val;
					}
				break;
			}
		}
		$("tooltipValue").label = value;

		return value;
	},//parseValue()

	setWrap: function setWrap()
	{
		let o = $("ifl_value"),
				r = o.getAttribute("wrap") == "on";
		$("opt_value").setAttribute("wrap", o.getAttribute("wrap"));
		$("infoRow_wrap").setAttribute("checked", r);
		try
		{
			$("infoRow_wrap2").setAttribute("checked", r);
		}catch(e){};
/*
		$("infoSplitter").collapsed = o.collapsed || o.getAttribute("wrap") != "on";
		if ($("infoSplitter").collapsed)
		{
			$("cookieInfoBox").setAttribute("height", "");
		}
*/
	},

	setValActions: function setValActions()
	{
		let o = $("value_actions");
		$("infoRowActionBtns").setAttribute("checked", !o.collapsed);
		try
		{
			$("infoRowActionBtns2").setAttribute("checked", !o.collapsed);
		}catch(e){};
	},

	setExpand: function setExpand()
	{
		let r = $("ifl_value").getAttribute("expand") == "on";
		$("opt_value").setAttribute("expand", $("ifl_value").getAttribute("expand"));

		$("infoRow_expand").setAttribute("checked", r);
		try
		{
			$("infoRow_expand2").setAttribute("checked", r);
		}catch(e){};
	},

	setDecode: function setDecode()
	{
log.debug();
		let r = $("ifl_value").getAttribute("decode") == "on";
		$("opt_value").setAttribute("decode", $("ifl_value").getAttribute("decode"));
		$("infoRow_decode").setAttribute("checked", r);
		try
		{
			$("infoRow_decode2").setAttribute("checked", r);
		}catch(e){};
	},

	setBase64Decode: function setBase64Decode()
	{
log.debug();
		let r = $("ifl_value").getAttribute("base64decode") == "on";
		$("opt_value").setAttribute("base64decode", $("ifl_value").getAttribute("base64decode"));
		$("infoRow_base64decode").setAttribute("checked", r);
		try
		{
			$("infoRow_base64decode2").setAttribute("checked", r);
		}catch(e){};
	},

	infoRowHighlight: function infoRowHighlight(e)
	{
		let obj = e.target,
				hide = e.type == "blur";
		
		if (obj.editor)
			obj.editor.selectionController.setCaretEnabled(!(obj.getAttribute("empty") == "true" || obj.getAttribute("multi") == "true"));

		let o = this.infoRowGetRowObj(obj);
		if (o)
			if(hide)
				o.removeAttribute("highlight");
			else
				o.setAttribute("highlight", true);
	},

	moveAfter: function moveAfter(item1, item2)
	{
		let parent = item1.parentNode;
		parent.removeChild(item1);
		parent.insertBefore(item1, item2 ? item2.nextSibling : null);
	},

	dragstart: function dragstart(e)
	{
		if (e.target.tagName == "splitterow")
			return;

		let row;
		if (e.target.parentNode == $("value_actions") && e.target.id != "value_wrap")
		{
			row = e.target;
			coomanPlus.dragActions = true;
		}
		else
		{
			row = coomanPlus.dragGetBox(e);
			row.getElementsByTagName("textbox")[0].focus();
			row.setAttribute("highlight", true);
			coomanPlus.dragActions = false;
	}
		coomanPlus.dragStarted = true;
		coomanPlus.dragCancel = false;
		coomanPlus.dragPause = false;
		coomanPlus.dragoverObj = null;
		e.dataTransfer.addElement(row);
		e.dataTransfer.effectAllowed = "move";
		e.dataTransfer.mozSetDataAt("application/x-moz-node", row, 0);
	},

	dragenter: function dragenter(e)
	{
		if (coomanPlus.dragCancel || coomanPlus.dragPause || !coomanPlus.dragStarted)
			return true;

		e.preventDefault();
		return false;
	},

	dragover: function dragover(e)
	{
		if (coomanPlus.dragCancel || !coomanPlus.dragStarted)
			return true;

		let obj = e.dataTransfer.mozGetDataAt("application/x-moz-node", 0);
		if (coomanPlus.dragActions)
		{
 			if ((e.target.id != "value_actions" && e.target.parentNode.id != "value_actions") || e.target.id == "value_wrap")
 				return true;

			if (coomanPlus.dragoverObj)
				coomanPlus.dragoverObj.removeAttribute("dragover");

			coomanPlus.dragoverObj = e.target;
			if (e.target != obj)
				e.target.setAttribute("dragover", true);

			e.preventDefault();
			e.stopPropagation();
			return false;
		}

		let box = $("cookieInfoBox").boxObject,
				o = coomanPlus.dragGetRow(e);
		if (obj.boxObject.x <= e.clientX && (obj.boxObject.x + obj.boxObject.width) >= e.clientX && e.clientY >= box.y && e.clientY <= (box.y + box.height))
		{
			if (o != coomanPlus.dragoverObj)
			{
				coomanPlus.dragoverObj = o;
				if (o)
				{
					let s = o.previousSibling;
					if (e.target.id == o.id)
						s = e.target.previousSibling;

					coomanPlus.dragoverShow(o.id);
				}
			}
			coomanPlus.dragPause = false;
		}
		else
		{
			coomanPlus.dragPause = true;
			coomanPlus.dragoverObj = null;
			coomanPlus.dragoverShow();
			e.dataTransfer.effectAllowed = "none";
		}
		e.preventDefault();
		e.stopPropagation();
		return false;
	},

	dragoverShow: function dragoverShow(id)
	{
		let rows = $("cookieInfoRows").getElementsByTagName("row"),
				spacer, dragover, dragupdown, last, obj;
		for(let i = 0; i < rows.length; i++)
		{
			spacer = rows[i];
			if (spacer == last)
				continue;

			dragover = rows[i].id == id;
			if (dragover)
				obj = rows[i];

			dragupdown = "up"
			if(dragover)
			{
				if (spacer.collapsed)
				{
					spacer = $("row_end");
					dragupdown = "down";
				}
				last = spacer;
			}
			spacer.setAttribute("dragover", dragover);
			spacer.setAttribute("dragupdown", dragupdown);
		}
	},

	dragexit: function dragexit(e)
	{
		let obj = document.elementFromPoint(e.clientX, e.clientY),
				box = $("cookieInfoBox");
		while (obj && obj != box)
		{
			obj = obj.parentNode;
		}
		if (obj)
			return;

		coomanPlus.dragPause = true;
		coomanPlus.dragoverObj = null;
		coomanPlus.dragoverShow();
		e.dataTransfer.effectAllowed = "none";
	},

	dragend: function dragend(e)
	{
		if (coomanPlus.dragCancel || coomanPlus.dragPause || !coomanPlus.dragStarted)
			return false;

		coomanPlus.dragStarted = false;
		coomanPlus.dragCancel = true;
		coomanPlus.dragoverShow();
		let obj = e.dataTransfer.mozGetDataAt("application/x-moz-node", 0);
		if (!e.dataTransfer.mozUserCancelled && !coomanPlus.dragActions)
		{
			let t = obj.getElementsByTagName("textbox")[0],
					r = [],
					box = $("cookieInfoBox").boxObject,
					o = coomanPlus.dragoverObj;

//		if (obj.boxObject.x <= e.clientX && (obj.boxObject.x + obj.boxObject.width) >= e.clientX && e.clientY >= box.y && e.clientY <= (box.y + box.height))

			for (let i = 0; i < t.editor.selection.rangeCount; i++)
				r.push(t.editor.selection.getRangeAt(i).cloneRange());

			if (o)
			{
				coomanPlus.cookieInfoRowsOrderSave(obj, o);
				t.focus();
				for(var i = 0; i < r.length; i++)
				{
					t.editor.selection.addRange(r[i])
					t.selectionStart = r[i].startOffset;
					t.selectionEnd = r[i].endOffset;
				}
			}
/*
			let sel = coomanPlus.getTreeSelections(coomanPlus._cookiesTree);
			if (sel.length)
				coomanPlus._updateCookieData(coomanPlus._cookies[sel[0]], sel);
			else
				coomanPlus.cookieSelected();
*/
		}
		e.preventDefault();
		if (coomanPlus.dragActions)
		{
			let o = obj.ordinal;
			obj.ordinal = coomanPlus.dragoverObj.ordinal;
			coomanPlus.dragoverObj.ordinal = o;
			obj = $("ifl_value");
			if (obj.getAttribute("empty") != "true" && obj.getAttribute("multi") != "true")
				obj.value = coomanPlus.parseValue(obj.valueOrig);

		}
		if (coomanPlus.dragoverObj)
			coomanPlus.dragoverObj.removeAttribute("dragover");

		coomanPlus.dragoverObj = null;
		return false;
	},//dragend()

	dragGetRow: function dragGetRow(e)
	{
		let dropTarget = e.target,
				dropTargetCenter = dropTarget.boxObject.y + (dropTarget.boxObject.height / 2),
				obj = coomanPlus.dragGetBox(e);

		if (obj)
		{
			if (e.clientY > dropTargetCenter)
			{
				let o = obj.nextSibling;
				while(o)
				{
					if (!o.collapsed && o.id != "row_end")
						break;

					o = o.nextSibling;
				}
				obj = o ? o : obj.nextSibling;
			}
		}
		return obj;
	},

	dragGetBox: function dragGetBox(e)
	{
		let obj = e.target;
		if (!obj)
			return null;

		if (obj.tagName == "spacer")
			obj = obj.nextSibling;

		while (obj && obj.tagName != "row")
		{
			obj = obj.parentNode;
		}
		return obj;
	},

	dragKeyDown: function dragKeyDown(e)
	{
		let keys = coomanPlus.getKeys(e),
				r = true,
				obj,
				id = e.target.id.replace("ifl_", "");
		if (coomanPlus.matchKeys(keys[0], ["ALT", "UP"], 2))
			coomanPlus.dragMoveUp($("row_" + id));
		else if (coomanPlus.matchKeys(keys[0], ["ALT", "DOWN"], 2))
			coomanPlus.dragMoveDown($("row_" + id));
		else if (coomanPlus.matchKeys(keys[0], ["UP"], 1))
			coomanPlus.changeUp($("row_" + id));
		else if (coomanPlus.matchKeys(keys[0], ["DOWN"], 1))
			coomanPlus.changeDown($("row_" + id));
	},

	textboxSelect: function textboxSelect(t)
	{
		let scrollTop = t.inputField.scrollTop,
				scrollLeft = t.inputField.scrollLeft;
		t.select();
		coomanPlusCore.async(function()
		{
			t.inputField.scrollTop = scrollTop;
			t.inputField.scrollLeft = scrollLeft;
		});
	},//textboxSelect()

	changeUp: function changeUp(obj)
	{
		let o = obj,
				sel = function(o)
				{
					coomanPlusCore.async(function()
					{
						let t = o.getElementsByTagName("textbox")[0];
						t.focus();
						coomanPlus.textboxSelect(t);
					});
				};
		if (obj.id == this.infoRowsFirst.id)
			return sel();

		let rows = $("cookieInfoRows").getElementsByTagName("row");

		for(let i = 0; i < rows.length; i++)
		{
			if (rows[i].id == obj.id)
				break;

			if (!rows[i].collapsed && !rows[i].hidden)
				o = rows[i];

		}
		sel(o);
	},

	changeDown: function changeDown(obj)
	{
		let o = obj,
				sel = function(o)
				{
					coomanPlusCore.async(function()
					{
						if (o.id == "row_end")
							o = obj;
						let t = o.getElementsByTagName("textbox")[0];
						t.focus();
						coomanPlus.textboxSelect(t);
					});
				};
		if (obj.id == this.infoRowsLast.id)
			return sel(o);

		let rows = $("cookieInfoRows").getElementsByTagName("row"),
				s = false;

		for(let i = 0; i < rows.length; i++)
		{
			if (rows[i].id == obj.id)
			{
				s = true;
				continue;
			}
			if (!s)
				continue;

			if (!rows[i].collapsed && !rows[i].hidden)
			{
				o = rows[i];
				break;
			}
		}
		sel(o);
	},

	dragMoveUp: function dragMoveUp(obj)
	{
log.debug();
		if (obj.id == this.infoRowsFirst.id)
			return;

		let id = obj.id.replace("row_", ""),
				rows = $("cookieInfoRows").getElementsByTagName("row"),
				o = null;
		for(let i = 0; i < rows.length; i++)
		{
			if (rows[i].id == "row_" + id)
				break;

			if (!rows[i].collapsed && !rows[i].hidden)
				o = rows[i];

		}
		if (o)
		{
			this.dragMove(obj, o);
		}
	},

	dragMoveDown: function dragMoveDown(obj)
	{
		if (obj.id == this.infoRowsLast.id)
			return;

		let id = obj.id.replace("row_", ""),
				rows = $("cookieInfoRows").getElementsByTagName("row"),
				o = null,
				o2 = null,
				s = false;
		for(let i = 0; i < rows.length; i++)
		{
			if (rows[i].id == "row_" + id)
			{
				s = true;
				continue;
			}
			if (!s)
				continue;

			if (!rows[i].collapsed && !rows[i].hidden)
			{
				o2 = o;
				o = rows[i];
			}
			if (o2)
				break;
		}
		if (o)
		{
			this.dragMove(obj, o);
		}
	},

	dragMove: function dragMove(obj, o)
	{
		let field = $(obj.id.replace("row_", "ifl_")),
				selectionStart = field.selectionStart,
				selectionEnd = field.selectionEnd;
		coomanPlus.cookieInfoRowsOrderSave(obj, o);
		field.focus();
		field.selectionStart = selectionStart;
		field.selectionEnd = selectionEnd;
	},

	dragMenu: function dragMenu(e, hide)
	{
		let obj = e.originalTarget,
				p = coomanPlus.infoRowGetRowObj(e.target.parentNode);
		if (!obj.getElementsByAttribute("coomanPlus", "true").length)
		{
			let menu = $("coomanPlus_inforow_drag_menu").childNodes;
			if (p.id == "row_value")
			{
				let clone = document.importNode($("infoRow_wrap").previousSibling, false);
				obj.appendChild(clone);
				clone = document.importNode($("infoRow_wrap"), false);
				clone.id += 2;
				clone.addEventListener("command", coomanPlus.infoRowContextExec, false);
				obj.appendChild(clone);
				clone = document.importNode($("infoRow_expand"), false);
				clone.id += 2;
				clone.addEventListener("command", coomanPlus.infoRowContextExec, false);
				obj.appendChild(clone);
				clone = document.importNode($("infoRow_decode"), false);
				clone.id += 2;
				clone.addEventListener("command", coomanPlus.infoRowContextExec, false);
				obj.appendChild(clone);
				clone = document.importNode($("infoRow_base64decode"), false);
				clone.id += 2;
				clone.addEventListener("command", coomanPlus.infoRowContextExec, false);
				obj.appendChild(clone);
				clone = document.importNode($("infoRowActionBtns"), false);
				clone.id += 2;
				clone.addEventListener("command", coomanPlus.infoRowContextExec, false);
				obj.appendChild(clone);
			}
			for(let i = 0; i < menu.length; i++)
			{
				let clone = document.importNode(menu[i], false);
				obj.appendChild(clone);
			}
		}
		if (p)
		{
			if (hide)
				p.removeAttribute("highlight");
			else
				p.setAttribute("highlight", true);
		}
		obj.getElementsByAttribute("value", "up")[0].disabled = p.id == coomanPlus.infoRowsFirst.id;
		obj.getElementsByAttribute("value", "down")[0].disabled = p.id == coomanPlus.infoRowsLast.id;
		coomanPlus.infoRowMenuOrder(obj);
	},

	cookieInfoRowsOrderSave: function cookieInfoRowsOrderSave(obj, target)
	{
		let rows = $("cookieInfoRows").getElementsByTagName("row"),
				list = [],
				id;
		for(let i = 0; i < rows.length; i++)
		{
			if (rows[i].id == obj.id && obj.id != target.id)
				continue

			if (rows[i].id == target.id && obj.id != target.id)
			{
				list.push(obj.id.replace("row_", ""));
				id = target.id;
			}
			else
				id = rows[i].id

			if (id != "row_start" && id != "row_end")
				list.push(id.replace("row_", ""));
		}
		let l = list.join("|");
		if (l != coomanPlus.prefViewOrder)
		{
			coomanPlus.prefViewOrder = l;
			$("cookieInfoRows").setAttribute("order", l);
//			coomanPlus.prefs.setCharPref("vieworder", l);
			coomanPlus.infoRowsSort(list);
			let sel = coomanPlus.getTreeSelections(coomanPlus._cookiesTree);
			if (sel.length)
				coomanPlus._updateCookieData(coomanPlus._cookies[sel[0]], sel);
			else
				coomanPlus.cookieSelected();
		}
		this.infoRowsShow();
	},//cookieInfoRowsOrderSave()

	cookieInfoRowsReset: function cookieInfoRowsReset()
	{
		this.prefViewOrder = this.prefViewOrderDefault;
		$("cookieInfoRows").setAttribute("order", this.prefViewOrderDefault);
//		coomanPlus.clearUserPref("vieworder");
		coomanPlus.infoRowsSort();
		let sel = coomanPlus.getTreeSelections(coomanPlus._cookiesTree);
		if (sel.length)
			coomanPlus._updateCookieData(coomanPlus._cookies[sel[0]], sel);
		else
			coomanPlus.cookieSelected();

		this.infoRowsShow();
	},

	treeViewColpicker: function treeViewColpicker(e)
	{
		coomanPlus.treeView(e.target, true);
	},

	treeView: function treeView(aPopup, isColpicker)
	{
log.debug();
//addopted from chrome://global/content/bindings/tree.xml
		// We no longer cache the picker content, remove the old content.
		while (aPopup.childNodes.length > 1)
		{
			if (aPopup.firstChild.tagName != "menuitem")
				break;

			if (aPopup.firstChild.tagName == "menuitem" && !aPopup.firstChild.hasAttribute("stationary"))
				aPopup.removeChild(aPopup.firstChild);
		}

		let refChild = aPopup.firstChild,
				tree = coomanPlus._cookiesTree,
				i = 0,
				d = true;
		for (let currCol = tree.columns.getFirstColumn(); currCol; currCol = currCol.getNext())
		{
			// Construct an entry for each column in the row, unless
			// it is not being shown.
			let currElement = currCol.element;
			if (d && i++ != currCol.index)
			{
				d = false;
			}

			if (currElement.hasAttribute("ignoreincolumnpicker") || currElement.collapsed)
				continue;

			let popupChild = document.createElement("menuitem");
			popupChild.setAttribute("type", "checkbox");
			popupChild.setAttribute("closemenu", "none");
			let columnName = currElement.getAttribute("display") ||
											 currElement.getAttribute("label");

			popupChild.setAttribute("label", columnName);
			popupChild.setAttribute("colindex", currCol.index);
			if (currElement.getAttribute("hidden") != "true")
				popupChild.setAttribute("checked", "true");
			if (currCol.primary)
				popupChild.setAttribute("disabled", "true");
			aPopup.insertBefore(popupChild, refChild);
		}
		let treeViewReset = aPopup.getElementsByAttribute("anonid", isColpicker ? "menuitem" : "treeViewReset")[0]
		if (treeViewReset)
			treeViewReset.disabled = d;
	},

	treeViewSelectColpicker: function treeViewSelectColpicker(event)
	{
log.debug();
		coomanPlus.menuView(event);
		coomanPlus.treeViewSelect(event);
		event.stopPropagation();
		event.preventDefault();
	},

	setAutofit: function setAutofit(reset)
	{
		let fit = coomanPlus.pref("autofit", undefined, true),
				cols = $("treecols").childNodes,
				i = 0,
				col;

		while(col = cols[i++])
		{
			if ((col.tagName != "treecol" && col.tagName != "splitter") || col.getAttribute("fixed") == "true")
				continue;

			switch(col.tagName)
			{
				case "splitter":
					if (fit)
//						col.removeAttribute("resizeafter");
						col.setAttribute("resizeafter", "farthest");
					else
						col.setAttribute("resizeafter", "grow");

					break;
			
				case "treecol":
					if (reset && col.hasAttribute("flex"))
						col.width = col.clientWidth;

					if (fit)
						col.setAttribute("flex", 1);
					else
						col.removeAttribute("flex");

					break;
			}
		}

		if (fit)
		{
			$("menu_treeView_autofit").setAttribute("checked", true);
		}
		else
		{
			$("menu_treeView_autofit").removeAttribute("checked");
		}
	},//setAutofit()

	treeViewSelect: function treeViewSelect(event)
	{
log.debug();
		var tree = coomanPlus._cookiesTree;
		if (event.originalTarget.parentNode.id.match("treeViewSort"))
		{
			coomanPlus.treeViewSortSelect(event)
			event.originalTarget.setAttribute("tooltiptext", coomanPlus.string(tree.getAttribute("sortDirection")));
		}
		else
		{
//addopted from chrome://global/content/bindings/tree.xml
			tree.stopEditing(true);
			let menuitem = event.originalTarget.parentNode.getElementsByAttribute("anonid", "treeViewReset")[0]
											|| event.originalTarget.parentNode.getElementsByAttribute("anonid", "menuitem")[0];

			if (event.originalTarget == menuitem)
			{
				tree.columns.restoreNaturalOrder();
				tree._ensureColumnOrder();
				coomanPlus.treeView(event.target.parentNode)
			}
			else if(event.originalTarget.id == "menu_treeView_autofit")
			{
				let fit = event.originalTarget.getAttribute("checked") == "true";
				coomanPlus.pref("autofit", fit, true, true);
				coomanPlus.setAutofit(true);
			}
			else
			{
				let colindex = event.originalTarget.getAttribute("colindex"),
						column = tree.columns[colindex];
				if (column)
				{
					let element = column.element;
					if (element.getAttribute("hidden") == "true")
						element.setAttribute("hidden", "false");
					else
					{
						element.setAttribute("hidden", "true");

//work around for a bug https://bugzilla.mozilla.org/show_bug.cgi?id=1274862
						let treeBox = coomanPlus._cookiesTree.boxObject,
								extra = $("treecols").boxObject.lastChild.boxObject.width + 2; //where is this 2 came from?

						if (treeBox.horizontalPosition + treeBox.width >= treeBox.rowWidth + extra)
						{
							let scrollPos = treeBox.rowWidth - treeBox.width + extra;
							if (scrollPos < 0)
									scrollPos = 0;

							treeBox.scrollToHorizontalPosition(scrollPos);
						}
					}
				}
			}
		}
	},

	treeViewSort: function treeViewSort(aPopup)
	{
		let tree = coomanPlus._cookiesTree;
		// We no longer cache the picker content, remove the old content.
		while (aPopup.childNodes.length > 0)
			aPopup.removeChild(aPopup.firstChild);

		let column = tree.getAttribute("sortResource"),
				refChild = aPopup.firstChild;
		for (let currCol = tree.columns.getFirstColumn(); currCol; currCol = currCol.getNext())
		{
			// Construct an entry for each column in the row, unless
			// it is not being shown.
			let currElement = currCol.element;
//			if (currElement.id != "colhid" && currElement.id != "sel" && !currElement.hidden && !currElement.collapsed)
			if (currElement.id != "sel" && !currElement.collapsed)
			{
				let popupChild = document.createElement("menuitem");
				popupChild.setAttribute("type", "radio");
				popupChild.setAttribute("closemenu", "none");
				popupChild.setAttribute("class", "menuitem-iconic sortmenu");
				popupChild.setAttribute("label", currElement.getAttribute("label"));
				popupChild.setAttribute("colindex", currCol.index);
				if (column == tree.columns[currCol.index].id)
				{
					popupChild.setAttribute("sortDirection", tree.getAttribute("sortDirection"));
					popupChild.setAttribute("tooltiptext", coomanPlus.strings[tree.getAttribute("sortDirection")]);
					popupChild.setAttribute("checked", "true");
				}
				aPopup.insertBefore(popupChild, refChild);
			}
		}
	},

	treeViewSortSelect: function treeViewSortSelect(event)
	{
		let tree = coomanPlus._cookiesTree,
				index = event.originalTarget.getAttribute("colindex"),
				items = event.originalTarget.parentNode.childNodes;

		coomanPlus.cookieColumnSort(tree.columns[index].id);
		for(let i = 0; i < items.length; i++)
		{
			if (items[i].getAttribute("colindex") == index)
			{
				items[i].setAttribute("checked", true);
				items[i].setAttribute("sortDirection", tree.getAttribute("sortDirection"));
			}
			else
				items[i].setAttribute("checked", false);
		}
	},

	menuView: function menuView(e)
	{
		
		if (e.target.id == "menu_info_reset")
		{
			this.cookieInfoRowsReset();
		}
		else if (e.target.id == "menu_info_topmost")
		{
			this.prefs.setBoolPref("topmost", e.target.getAttribute("checked") == "true");
			return;
		}
		else if (e.target.id == "menu_treeView_realHost" || e.target.id == "treeView_realHost")
		{
			this.pref("showrealhost", e.target.getAttribute("checked") == "true");
			this._cookiesTree.treeBoxObject.invalidateRange(this._cookiesTree.treeBoxObject.getFirstVisibleRow(), this._cookiesTree.treeBoxObject.getLastVisibleRow());
		}
		else if (e.target.id.match("menu_info"))
		{
			let o = $(e.target.id.replace("menu_info_", "row_"));
			if (!o)
				o = $(e.target.id.replace("menu_info_", ""));
//			coomanPlus.prefs.setBoolPref("view" + e.target.id.replace("menu_info_", "").toLowerCase(), e.target.getAttribute("checked") == "true");
			let h = $("cookieInfoBox").boxObject.height,
					h2 = $("infoSplitter").boxObject.height;

			o.setAttribute("collapsed", (o.collapsed = e.target.getAttribute("checked") != "true"));
			this.infoRowsShow(true);
			if ($("row_value").collapsed)
			{
				$("cookieInfoBox").setAttribute("_height", $("cookieInfoBox").getAttribute("height"));
				$("cookieInfoBox").removeAttribute("height");
			}
			else
			{
				$("cookieInfoBox").setAttribute("height", $("cookieInfoBox").getAttribute("_height"));
			}

			coomanPlusCore.async(function()
			{
				window.resizeBy(0, $("cookieInfoBox").boxObject.height + $("infoSplitter").boxObject.height - h - h2);
			});
		}
		this.cookieSelected();
		this.infoRowsSort();
	},//menuView()

	openAbout: function openAbout()
	{
		openDialog("chrome://mozapps/content/extensions/about.xul",
							 "", "chrome,centerscreen,modal,dialog" + (this.isMac ? "" : "=no"), coomanPlusCore.addon);
	},

	dblClickEdit: function dblClickEdit(e)
	{
		if (!e.button && e.detail == 2)
		{
			let col={};
			e.rangeParent.treeBoxObject.getCellAt(e.clientX, e.clientY, {}, col, {});
			if (!col.value || col.value.id == "sel")
				return;

			coomanPlus.openEdit();
		}
	},

	focus: function focus(args, submit)
	{
log.debug();
		if(!args)
			return;

		if (typeof(args) == "object")
			args = args.wrappedJSObject;

		if (args.reset)
		{
			coomanPlus.command("reset");
		}
		if (args.window)
			this.window = args.window;

		if (args.gBrowser)
		{
			this.args = args;
			let host;
			try
			{
				host = args.gBrowser.currentURI.host;
			}
			catch(e)
			{
				host = ""
			};
			this.website = true;
			this.websiteHost = host.toLowerCase();
/*
			this.prefFiltersearchcontent = false;
			this.prefFiltersearchhost = true;
			this.prefFiltersearchname = false;
			this.prefFiltersearchcase = false;
			this.prefFiltersearchrelaxed = true;
*/
			this.backup.filter = $('lookupcriterium').getAttribute("filter");
			$('lookupcriterium').value = this.websiteHost;
			$('lookupcriterium').setAttribute("filter", this.websiteHost);
			if (submit)
			 this.doLookup(undefined, this.website);
		}
		
		if (args.options)
		{
			coomanPlusCore.async(function()
			{
				coomanPlus.options();
			});
		}
	},//focus()

	filesDragOver: function filesDragOver(e)
	{
		let dragService = Cc["@mozilla.org/widget/dragservice;1"].getService(Ci.nsIDragService),
				dragSession = dragService.getCurrentSession();


		if (dragSession.isDataFlavorSupported("application/x-moz-file"))
		{
			dragSession.canDrop = true;
			dragSession.dragAction = e.ctrlKey ? dragService.DRAGDROP_ACTION_LINK : e.shiftKey ? dragService.DRAGDROP_ACTION_MOVE : dragService.DRAGDROP_ACTION_COPY;
		}
		coomanPlus.filesDragOver.ctrlKey = e.ctrlKey;
		coomanPlus.filesDragOver.shiftKey = e.shiftKey;
	},

	filesDragDrop: function filesDragDrop(e)
	{
		let	dragSession = Cc["@mozilla.org/widget/dragservice;1"].getService(Ci.nsIDragService).getCurrentSession()

		// If sourceNode is not null, then the drop was from inside the application
		if (dragSession.sourceNode)
			return;

		// Setup a transfer item to retrieve the file data
		let trans = Cc["@mozilla.org/widget/transferable;1"].createInstance(Ci.nsITransferable),
				files = [],
				self = coomanPlus;

		trans.addDataFlavor("application/x-moz-file");
		for (let i = 0; i < dragSession.numDropItems; i++)
		{
			let flavor = {},
					data = {},
					length = {};

			dragSession.getData(trans, i);
			trans.getAnyTransferData(flavor, data, length);
			if (data)
			{
				let file = data.value.QueryInterface(Ci.nsIFile);
				if (file && file.isFile())
					files.push(file);
			}
		}
		let list = [],
				pass = [];

		self.restoreAll(coomanPlus.filesDragOver.ctrlKey ? self._selected : coomanPlus.filesDragOver.shiftKey ? self._cookies : false, files);
	},//filesDragDrop()

	treeDragStart: function	treeDragStart(e)
	{
		let nsIFile = FileUtils.getDir("TmpD", [coomanPlus.title], true);
		coomanPlus.backupSelected(nsIFile)
		e.dataTransfer.effectAllowed = "move";
		e.dataTransfer.mozSetDataAt("application/x-moz-file", nsIFile, 0);
	},//treeDragStart()

	supportSite: function supportWeb()
	{
		if (coomanPlus.getOpenURL)
			coomanPlus.getOpenURL(SUPPORTSITE, true);
	},
	
	resetWindowSettings: function resetWindowSettings(params)
	{
		function execute(p, presize)
		{
			if (presize)
				return params.indexOf(p) != -1;

			return !params || !params.length || params.indexOf(p) != -1;
		}
		if (execute("colsordinal"))
		{
			let treecols = $("treecols"),
					d = 0;
			while(d < treecols.childNodes.length)
			{
				treecols.childNodes[d].setAttribute("ordinal", d);
				d++;
			}
		}
		if (execute("update1_12"))
		{
			let cookie = this.cookieObjectSave({
						host: this._cookiesTree.getAttribute("selectedHost"),
						path: this._cookiesTree.getAttribute("selectedPath"),
						name: this._cookiesTree.getAttribute("selectedName")
			});
			this.selectionSave([cookie, cookie]);
			let XULStore;
			try
			{
				XULStore = Cc["@mozilla.org/xul/xulstore;1"].getService(Ci.nsIXULStore);
			}catch(e){}
			if (XULStore)
			{
				let url = window.location.href;
				XULStore.removeValue(url, this._cookiesTree.id, "selectedHost");
				XULStore.removeValue(url, this._cookiesTree.id, "selectedPath");
				XULStore.removeValue(url, this._cookiesTree.id, "selectedName");
			}
			else
			{
				let persist = this._cookiesTree.getAttribute("persist");
				this._cookiesTree.setAttribute("persist", persist + " selectedHost selectedPath selectedName");
				this._cookiesTree.setAttribute("selectedHost", "");
				this._cookiesTree.setAttribute("selectedPath", "");
				this._cookiesTree.setAttribute("selectedName", "");
				this._cookiesTree.removeAttribute("selectedHost");
				this._cookiesTree.removeAttribute("selectedPath");
				this._cookiesTree.removeAttribute("selectedName");
				this._cookiesTree.setAttribute("persist", persist);
			}
		}

		if (execute("update1_13"))
		{
			let obj = $('lookupcriterium');
			try
			{
				coomanPlusCore.storage.search = JSON.parse(obj.getAttribute("autocompletesearchparam"));
			}catch(e){};
			if (!coomanPlusCore.storage.search || coomanPlusCore.storage.search.constructor.name != "Array")
				coomanPlusCore.storage.search = [];

			let XULStore;
			try
			{
				XULStore = Cc["@mozilla.org/xul/xulstore;1"].getService(Ci.nsIXULStore);
			}catch(e){}
			if (XULStore)
			{
				let url = window.location.href;
				XULStore.removeValue(url, "lookupcriterium", "autocompletesearchparam");
			}
			else
			{
				let persist = obj.getAttribute("persist");
				obj.setAttribute("persist", persist + " autocompletesearchparam");
				obj.setAttribute("autocompletesearchparam", "");
				obj.removeAttribute("autocompletesearchparam");
				obj.setAttribute("persist", persist);
			}
		}

		if (execute("persist"))
			this.resetPersist();

		if (execute("row") || execute("persist"))
			this.cookieInfoRowsReset();
	
		if (execute("shorealhost"))
			this.prefs.clearUserPref("showrealhost");

		if (execute("topmost"))
			this.prefs.clearUserPref("topmost");


		if (execute("autofit"))
		{
			coomanPlus.prefs.clearUserPref("autofit");
			this.setAutofit(true);
		}

		if (execute("filter"))
			$('lookupcriterium').value = $('lookupcriterium').getAttribute("filter");

		this.loadCookies();
		this.selectLastCookie(true);

		if (execute("persist") || execute("row"))
			window.sizeToContent();

		try
		{
			delete coomanPlusCore.storage.reset.main;
		}catch(e){}
		coomanPlusCore.storageWrite();
	},//resetWindowSettings()

	command: function command(com, data)
	{
log.debug();
		switch(com)
		{
			case "reset":
				this.resetWindowSettings(data ? data.wrappedJSObject : null);
				break;
			case "backup":
				this.settingsBackup();
				break;
			case "restore":
				this.settingsRestore();
				break;
			case "topmost":
				let xulWin = window.QueryInterface(Ci.nsIInterfaceRequestor)
										.getInterface(Ci.nsIWebNavigation).QueryInterface(Ci.nsIDocShellTreeItem)
										.treeOwner.QueryInterface(Ci.nsIInterfaceRequestor)
										.getInterface(Ci.nsIXULWindow);
				xulWin.zLevel = this.pref("topmost") ? xulWin.raisedZ : xulWin.normalZ;
				break;

		}
	},//command()

	settingsBackup: function settingsBackup()
	{
log.debug();
		let settings = {};
		let win = $("cookiesmanagerplusWindow");
		coomanPlus.backupPersist(win, settings);
		coomanPlusCore.backup(settings, "main")
	},//settingsBackup()

	settingsRestore: function settingsRestore()
	{
log.debug();
		let data = coomanPlusCore.storage.restore;
		if (!data || !data.main)
			return
//ordinal for columns and rows doesn't work, expired splitter doesn't work after http moved
		this.resetPersist(undefined, data.main);
		this.infoRowsShow();
		this.infoRowsSort();
		this.setAutofit();
		$('lookupcriterium').value = $('lookupcriterium').getAttribute("filter");
		this.loadCookies();
		this.selectLastCookie(true);
		window.sizeToContent();
		delete data.main;
		coomanPlusCore.storageWrite();
	},//settingsRestore()
	
	readonlySet: function readonlySet(obj)
	{
		let type = obj.getAttribute("value"),
				id = obj.parentNode.parentNode.getAttribute("control"),
				sel = this.getTreeSelections(this._cookiesTree),
				i = 0,
				aCookie;

		while(aCookie = this._cookies[sel[i++]])
		{
			if (!aCookie.readonly)
				aCookie.readonly = {};
			
			if (type)
				aCookie.readonly[id] = aCookie[id];
			else
				delete aCookie.readonly[id];

			coomanPlusCore.readonlyAdd(aCookie, true);
		}
		coomanPlusCore.readonlySave();
		if (sel.length)
			aCookie = this._cookies[sel[0]];
		else
			aCookie = this._cookies[this._cookiesTree.view.selection.currentIndex];

		if (this._cookiesTree.getAttribute("sortResource") == "readonly")
		{
			this._noselectevent = true;
			this._currentIndex = this._cookiesTree.view.selection.currentIndex;
			this.sortTreeData(this._cookiesTree, this._cookies);
			this._cookiesTree.view.selection.currentIndex = this._currentIndex;
			this._noselectevent = false;
			this.selectLastCookie();
		}
		else
			this._updateCookieData(aCookie);

		if (type)
		{
			obj.parentNode.nextSibling.firstChild.focus();
		}
		else
		{
			obj.parentNode.previousSibling.firstChild.focus();
		}
	},//readonlySet()
//	backupPersist: function backupPersist(){log.debug()},

	selectionRead: function selectionRead()
	{
log.debug("begin");
		let r = coomanPlusCore.storage.select,
				max = coomanPlus.pref("restoreselection");

		r = r.slice(0, (max == -1 ? r.length : max + 1));
		return r;
	},//selectionRead()

	selectionSave: function selectionSave(list, noasync)
	{
log.debug();
		let max = coomanPlus.pref("restoreselection"),
				self = coomanPlus;
		if (typeof(list) == "undefined")
		{
log.debug("building list");
			let selections = self.getTreeSelections(self._cookiesTree);
			list = [];

			let idx = self._cookiesTree.view.selection.currentIndex;
			if (idx != -1 && self._cookies[idx] && !self._cookies[idx].deleted)
			{
				list.push(this.cookieObjectSave(self._cookies[idx]));
//make sure current index is selected
				list.push(this.cookieObjectSave(self._cookies[idx]));
			}

			for(let s of selections)
			{
				let item = self._cookies[s];
				if (!item || item.deleted == 2 || self._cookieEquals({hash: list[0]}, item, true))
//				if (!item || item.deleted == 2)
					continue;

				list.push(this.cookieObjectSave(item));
			}
log.debug("end build", 1);
		}

/*
		let clean = [];
		for(let i of list)
		{
			if (self._isSelected(i, self._cookiesAll))
				clean.push(i);
		}
	*/
		let listMax = list.slice(0, (max == -1 ? list.length : max + 1 )),
				found = false;
//make sure selected index make it to the final list
/*
		//is index selected?
		for(let i = 1; i < list.length; i++)
		{
			if (found = self._cookieEquals(list[0], list[i], true))
				break;
		}
		if (found)
		{
			//is index still in stripped down selection?
			found = false;
			for(let i = 1; i < listMax.length; i++)
			{
				if (found = self._cookieEquals(listMax[0], listMax[i], true))
					break;
			}
			//make sure index made into the stripped down selection
			if (!found)
				listMax[listMax.length-1] = listMax[0];
		}
*/
		coomanPlusCore.storage.select = listMax;
		coomanPlusCore.storageWrite(undefined, noasync ? false : undefined);
	},//selectionSave()

};

coomanPlus.exec.push(function()
{
	coomanPlus.backupPersist($("cookiesmanagerplusWindow"));
});

let wm = Cc['@mozilla.org/appshell/window-mediator;1'].getService(Ci.nsIWindowMediator),
		browsers = wm.getZOrderDOMWindowEnumerator('', false);
while (browsers.hasMoreElements())
{
	let browser = browsers.getNext();
	if (browser.location.toString().indexOf("cookiesmanagerplus.xul") != -1 && browser.coomanPlus.winid != self.winid)
	{
		browser.focus();
		window.close();
	}
}
