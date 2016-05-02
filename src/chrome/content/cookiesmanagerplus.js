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
function $(id)
{
	return document.getElementById(id);
}
var self = this;
var coomanPlus = {
	_cmpWindow: null,
	core: coomanPlusCore,
	winid: new Date(),
	inited: false,
	app: null,
	focused: null,
	args: {},
	backup: {},
	website: false,
	websiteHost: null,
	websiteHostStripped: null,
	prefBranch: Ci.nsIPrefBranch2,
	prefFiltersearchname: true,
	prefFiltersearchhost: true,
	prefFiltersearchhosttype: 0,
	prefFiltersearchcontent: true,
	prefFiltersearchcase: false,
	prefFiltersearchtype: 0,
	prefFiltersearchtype1: false,
	prefFiltersearchtype2: false,
	prefSimpleHost: false,
	prefExpireProgress: false,
	prefExpireCountdown: true,
	prefViewOrder: "",
	prefViewOrderDefault: "name|value|host|path|isSecure|expires|creationTime|lastAccessed|isHttpOnly|policy|status|type|isProtected",

	accel: "CONTROL",
	keysList: null,
	lastKeyDown: [],
	strings: {},
	_noObserve: false,
	_selected: [],
	_cookies: [],
	_cookiesAll: [],
	_cb: null,
	_cookiesTree: null,
	supress_getCellText: false,
	contextDelay: 0,
	isXP: false,

	prefs: coomanPlusCore.prefs,
	pref: coomanPlusCore.pref,

	dragCancel: true,
	dragoverObj: null,
	infoRowsFirst: null,
	infoRowsLast: null,
	infoRowsChanged: false,
	storageFile: "cookiesManagerPlus.json",
	showedExpires: -1,

	_cookiesTreeView: {
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
			{
				return;
			}

			switch(column.id)
			{
				case "type":
					return "";

				case "rawHost":
				 return coomanPlus._cookies[row][coomanPlus.pref("showrealhost") ? "host" : "rawHost"];

				case "expires":
					return coomanPlus.getExpiresString(coomanPlus._cookies[row]["expires"]);

				case "creationTimeString":
						if (coomanPlus._cookies[row].type != coomanPlusCore.COOKIE_NORMAL)
							return "--";

					return coomanPlus.getExpiresString(Math.round(coomanPlus._cookies[row]["creationTime"]/1000000));

				case "lastAccessedString":
						if (coomanPlus._cookies[row].type != coomanPlusCore.COOKIE_NORMAL)
							return "--";

					return coomanPlus.getExpiresString(Math.round(coomanPlus._cookies[row]["lastAccessed"]/1000000));

				case "isHttpOnly":
						if (coomanPlus._cookies[row].type != coomanPlusCore.COOKIE_NORMAL)
							return "--";

					return coomanPlus.string("yesno"+(coomanPlus._cookies[row]["isHttpOnly"]?1:0));

				case "isSecure":
						if (!("isSecure" in coomanPlus._cookies[row]))
							coomanPlus._cookies[row] = new coomanPlus.cookieObject(coomanPlus._cookies[row]._aCookie.QueryInterface(Ci.nsICookie2), coomanPlus._cookies[row].sel, coomanPlus._cookies[row].updated);

					return coomanPlus.string("yesno"+(coomanPlus._cookies[row]["isSecure"]?1:0));

				case "policyString":
					return coomanPlus.string("policy"+coomanPlus._cookies[row]["policy"]);

				case "statusString":
						if (coomanPlus._cookies[row].type != coomanPlusCore.COOKIE_NORMAL)
							return "--";

					return coomanPlus.string("status"+coomanPlus._cookies[row]["status"]);
				case "isProtected":
					return coomanPlus.string("yesno"+(coomanPlus._cookies[row]["isProtected"]?1:0));
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
			let s = true;
			if (this.selection.isSelected(row))
			{
				s = false;
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
				aserv=Cc["@mozilla.org/atom-service;1"].getService(Ci.nsIAtomService);
			else
				props = "";

			if (coomanPlus.protect.enabled && coomanPlus._cookies[row]['isProtected'])
			{
				if (old)
					props.AppendElement(aserv.getAtom("protected"));
				else
					props = "protected";
			}

			if (coomanPlus._cookies[row].deleted)
				if (old)
					props.AppendElement(aserv.getAtom("deleted" + coomanPlus._cookies[row].deleted));
				else
					props += " deleted" + coomanPlus._cookies[row].deleted;

			if (!coomanPlus._cookies[row]['expires'])
				if (old)
					props.AppendElement(aserv.getAtom("session"));
				else
					props += " session";

			if (coomanPlus._cookies[row]['expires'] && coomanPlus._cookies[row]['expires'] != -1 && coomanPlus._cookies[row]['expires'] && coomanPlus._cookies[row]['expires'] *1000 < (new Date()).getTime())
				if (old)
					props.AppendElement(aserv.getAtom("expired"));
				else
					props += " expired";

			if (col.id == "type")
				if (old)
					props.AppendElement(aserv.getAtom("type" + coomanPlus._cookies[row].type));
				else
					props += " type" + coomanPlus._cookies[row].type;

			if (col.type == col.TYPE_CHECKBOX && this.selection.isSelected(row))
				if (old)
					props.AppendElement(aserv.getAtom("checked"));
				else
					props += " checked";

/*
			if (coomanPlus._cookies[row]['updated'] && coomanPlus._cookies[row]['updated'] + 60000 < (new Date()).getTime())
				if (old)
					props.AppendElement(aserv.getAtom("updated"));
				else
					props += " updated";
*/
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
		this.inited = true;
		if (!coomanPlusCore.addon)
			return;

log.debug.startTime = new Date();
log.debug("begin");
		this.isXP = window.navigator.oscpu.indexOf("Windows NT 5") != -1;

		$("cookiesTreeChildren").setAttribute("xp", this.isXP);
		this._cmpWindow = coomanPlusCore.cmpWindow;
		coomanPlusCore.cmpWindow = window;
		this._cb = $("bundlePreferences");
		this._cb2 = $("changesLogPreferences");

		this.strings.secureYes = this.string("forSecureOnly");
		this.strings.secureNo = this.string("forAnyConnection");
		this._cookiesTree = $("cookiesTree");
		this._cookiesTree.view = this._cookiesTreeView;
		this._cookiesTree.view.rowCount; //some weird things happens in FF37+ without this line

		this.listKeys();

		Cu.import("resource://gre/modules/Services.jsm");
		Services.scriptloader.loadSubScript(coomanPlusCore.addon.getResourceURI("chrome/content/html5.js").spec, this);
		Services.scriptloader.loadSubScript(coomanPlusCore.addon.getResourceURI("chrome/content/constants.js").spec, self);
		if (!this.html5.enabled)
		{
			$("menu_info_type").hidden = true;
			$("searchtype1").hidden = true;
			$("searchtype1").setAttribute("checked", true);
			$("searchtype2").hidden = true;
			$("type").collapsed = true;
			$("row_type").hidden = true;
		}
		var rows = $("cookieInfoRows").getElementsByTagName("row");
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
		$("cookiesTree").addEventListener("select", this.cookieSelectedEvent, true);
		$("cookiesTree").addEventListener("keydown", this.onKeyDown, true);
		$("cookiesTree").addEventListener("keyup", this.onKeyUp, true);
		$("cookiesTree").addEventListener("scroll", this.treeScroll, true);
		$("cookiesTree").addEventListener("click", this.cookieClickEvent, true);
		$("cookiesTree").addEventListener("mousedown", this.cookieSelectMouse, true);
		$("cookiesTreeChildren").addEventListener("click", this.dblClickEdit, true);
		$("main").addEventListener("dragover", this.filesDragOver, true);
		$("main").addEventListener("dragdrop", this.filesDragDrop, true);

		if ("arguments" in window && window.arguments.length)
		{
			this.focus(window.arguments[0]);
		}

		$('lookupcriterium').value = $('lookupcriterium').getAttribute("filter");

		Cc["@mozilla.org/observer-service;1"]
			.getService(Ci.nsIObserverService)
			.addObserver(this, "cookie-changed", false);

		this.title = document.title + " v" + coomanPlusCore.addon.version
//		this.setFilter();
//		this.setSort();
		this.onPrefChange.do();

		this.loadCookies();
//		this.selectLastCookie(true);
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
		var k = $("platformKeys").getString("VK_" + this.accel);
		$("infoRowUp").label += " (" + k + " + " + $("localeKeys").getString("VK_UP") + ")";
		$("infoRowDown").label += " (" + k + " + " + $("localeKeys").getString("VK_DOWN") + ")";
		$("coomanPlus_inforow_drag_menu").getElementsByTagName("menuitem")[0].label = $("infoRowUp").label;
		$("coomanPlus_inforow_drag_menu").getElementsByTagName("menuitem")[1].label = $("infoRowDown").label;
		$("sel").width = $("sel").boxObject.height;
//treecolpicker
		let treecolpicker = document.getAnonymousElementByAttribute(document.getAnonymousNodes($("treecols"))[1], "anonid", "popup");
		treecolpicker.addEventListener("command", this.treeViewSelectColpicker, true)
		treecolpicker.addEventListener("popupshowing", this.treeViewColpicker, true)

		this.website = false;
log.debug("end", 1);
//window resize doesn't work properly with persist attribute. it resizes slightly bigger each time window opened.
/*
		var w = $("main").boxObject.width;
		var h = $("main").boxObject.height;
		if (document.width < w || document.height < h)
			window.sizeToContent();
*/
	},//start()

	decode: function(t)
	{
		t = t.toString();
		let r = "";
		for(let i = 0; i < t.length; i += 2)
		{
			r += String.fromCharCode(parseInt(t.substr(i, 2), 16));
		}
		return r;
	},
	getPrefs: function(type)
	{
		let l = this.prefs.getChildList(""),
				r = {};
		l.sort();
		for each (let i in l)
		{
			switch(this.prefs.getPrefType(i))
			{
				case Ci.nsIPrefBranch.PREF_BOOL:
					r[i] = this.pref(i);
					break;
				case Ci.nsIPrefBranch.PREF_INT:
					r[i] = this.pref(i);
					break;
				case Ci.nsIPrefBranch.PREF_STRING:
					r[i] = this.prefs.getComplexValue(i, Ci.nsISupportsString).data;
					break;
			}
		}
		if (type)
			return r;
		else
		{
			l = [];
			for (let i in r)
				l.push(i + ": " + r[i]);

			return l.join("\n");
		}
	},

	fixUrl: function(url)
	{
		let tags = {
					OS: encodeURIComponent(Services.appinfo.OS + " (" + Services.appinfo.XPCOMABI + ")"),
					VER: encodeURIComponent(coomanPlusCore.addon.version),
					APP: encodeURIComponent(Services.appinfo.name + " v" + Services.appinfo.version),
					EMAIL: escape(this.decode(EMAIL)),
					EMAILRAW: this.decode(EMAIL),
					NAME: encodeURIComponent(coomanPlusCore.addon.name),
					NAMERAW: coomanPlusCore.addon.name,
					LOCALE: encodeURIComponent(Cc["@mozilla.org/chrome/chrome-registry;1"].getService(Ci.nsIXULChromeRegistry).getSelectedLocale("global")),
					PREFS: encodeURIComponent(this.getPrefs()),
					PREFSSERIALIZE: encodeURIComponent(JSON.stringify(this.getPrefs(true)))
				}
		let reg = new RegExp("\{([A-Z]+)\}", "gm");
		url = url.replace(reg, function(a, b, c, d)
		{
			if (b in tags)
				return tags[b];
			return a;
		});
		return url;
	}, //fixUrl()

	supportSite: function supportWeb()
	{
		if (coomanPlus.getOpenURL)
		coomanPlus.getOpenURL(SUPPORTSITE, true);
	},

	supportEmail: function supportEmail()
	{
		let href = coomanPlus.fixUrl("mailto:{NAME} support<{EMAIL}>?subject={NAME}&body=%0A%0A__________%0A [Extension]%0A{NAME} v{VER}%0A%0A [Program]%0A{APP} ({LOCALE})%0A%0A [OS]%0A{OS}%0A%0A [Preferences]%0A{PREFSSERIALIZE}"),
				promptService = Cc["@mozilla.org/embedcomp/prompt-service;1"].getService(Ci.nsIPromptService),
				button = promptService.confirmEx(window,
									this.string("addExtensionsTitle"),
									this.string("addExtensions"),
									promptService.BUTTON_POS_0 * promptService.BUTTON_TITLE_YES + promptService.BUTTON_POS_1 * promptService.BUTTON_TITLE_NO,
									"",
									"",
									"",
									null,
									{});
		function callback(list)
		{
			let addons = {extension:[],theme:[],plugin:[]};
			for(let i in list)
			{
				if (list[i].isActive)
				{
					if (!addons[list[i].type])
						addons[list[i].type] = []

					addons[list[i].type].push(list[i].name + " v" + list[i].version + " " + list[i].id.replace("@", "{a}"));
				}
			}
			list = "";
			for(let i in addons)
			{
				addons[i].sort();
				let t = addons[i].join("\n");
				if (t)
					list += "\n\n [" + i.charAt(0).toUpperCase() + i.slice(1) + (addons[i].length > 1 ? "s" : "") + "]\n" + t;
			}
			if (list)
				href += encodeURIComponent(list);

			if (coomanPlus.getOpenURL)
			coomanPlus.getOpenURL(href, true);
		}
		AddonManager.getAllAddons(callback);
	},

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
log.debug(e.type);
		coomanPlus.cookieSelected();
	},

	cookieClickEvent: function cookieClickEvent(e)
	{
log.debug(e.type);
		if (e.type == "click" && e.target.id == "sel")
		{
			coomanPlus.selectAllToggle(e.button);
			return;
		}
	},

	unload: function unload()
	{
log.debug();
		if (this.website)
		{
			if (this.websiteHost == $('lookupcriterium').getAttribute("filter"))
			{
//				$('lookupcriterium').setAttribute("filter", this.backup.filter);
			}
		}
		coomanPlusCore.cmpWindow = null;
		try
		{
			Cc["@mozilla.org/observer-service;1"]
				.getService(Ci.nsIObserverService)
				.removeObserver(this, "cookie-changed", false);
		}catch(e){log.error(e)}
		try
		{
			this.prefs.QueryInterface(this.prefBranch).removeObserver('', this.onPrefChange, false);
		}catch(e){log.error(e)}
		try
		{
			$("cookiesTree").removeEventListener("keydown", this.onKeyDown, true);
			$("cookiesTree").removeEventListener("keyup", this.onKeyUp, true);
			$("cookiesTree").removeEventListener("scroll", this.treeScroll, true);
			$("cookiesTree").removeEventListener("select", this.cookieSelectedEvent, true);
			$("cookiesTree").removeEventListener("click", this.cookieClickEvent, true);
			$("cookiesTree").removeEventListener("mousedown", this.cookieSelectMouse, true);
			$("cookiesTreeChildren").removeEventListener("click", this.dblClickEdit, true);
			$("main").removeEventListener("dragover", this.filesDragOver, true);
			$("main").removeEventListener("dragdrop", this.filesDragDrop, true);
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
		coomanPlus.selectionSave(undefined, true);
		//re-set dimensions so it properly saved as persistant.
//		document.documentElement.setAttribute("width", window.innerWidth);
//		document.documentElement.setAttribute("height", window.innerHeight);
log.debug();
	},//unload()

	selectionRead: function selectionRead()
	{
log.debug("begin");
		let data = "",
				r = [];
		if (this.selectionSave.saved)
			data = this.selectionSave.saved;
		else
		{
			let file = FileUtils.getFile("ProfD", [this.storageFile]),
					fstream = Cc["@mozilla.org/network/file-input-stream;1"].createInstance(Ci.nsIFileInputStream),
					cstream = Cc["@mozilla.org/intl/converter-input-stream;1"].createInstance(Ci.nsIConverterInputStream);
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
			}catch(e){};
		}
		this.selectionRead.last = data;
		try
		{
			r = JSON.parse(data);
		}
		catch(e){}
log.debug("end", 1);
		return r;
	},

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
				list.push({
					h: self._cookies[idx].hash ? self._cookies[idx].hash : self.cookieHash({
						host: self._cookies[idx].host,
						path: self._cookies[idx].path,
						name: self._cookies[idx].name,
						type: self._cookies[idx].type,
						value: self._cookies[idx].type == coomanPlusCore.COOKIE_NORMAL ? "" : self._cookies[idx].value
					}),
					f: 1,
				});
			}

			for(s of selections)
			{
				let item = self._cookies[s];
				if (!item || item.deleted == 2)
					continue;

				if (s == idx)
				{
					list[0].f = 2;
//					if (list.length > max)
//						break;

					continue;
				}
				list.push({
					h: item.hash ? item.hash : self.cookieHash({
						host: item.host,
						path: item.path,
						name: item.name,
						type: item.type,
						value: item.type == coomanPlusCore.COOKIE_NORMAL ? "" : item.value
					})
				});
			}
log.debug("end build", 1);
		}
log.debug("start save selection to file");

/*
		let clean = [];
		for(let i of list)
		{
			if (self._isSelected(i, self._cookiesAll))
				clean.push(i);
		}
	*/
		let listMax = list.slice(0, (max == -1 ? list.length : max + (list[0] && list[0].f == 2 ? 0 : 1)));
/*		if (list.length > max)
			list.splice(max);
*/
		let dataMax = JSON.stringify(listMax),
				data = JSON.stringify(list);

		if (data == self.selectionRead.last)
			return;


		function execute()
		{
			let	file = FileUtils.getFile("ProfD", [self.storageFile]),
					ostream = FileUtils.openSafeFileOutputStream(file),
					converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Ci.nsIScriptableUnicodeConverter);

			converter.charset = "UTF-8";
			let istream = converter.convertToInputStream(dataMax);
		// The last argument (the callback) is optional.
			NetUtil.asyncCopy(istream, ostream, function asyncCopy(status) {
				if (!Components.isSuccessCode(status))
				{
					log.error("error saving selections file");
					return;
				}
			});
log.debug("end save selection to file", self.selectionSave);
		}
		self.selectionSave.saved = data;
		if (noasync)
		{
			if (self.selectionSave.timer)
				self.selectionSave.timer.cancel();

			execute()
		}
		else
			self.selectionSave.timer = coomanPlusCore.async(execute, 5000, self.selectionSave.timer);
	},

	onPrefChangeDo: function onPrefChangeDo()
	{
log.debug();
		coomanPlus.onPrefChange.do();
	},

	onPrefChange: {
		inited: false,
		observe: function observe(subject, topic, key)
		{
			if (!coomanPlus.prefNoObserve)
				this.do(subject, topic, key);
		},
		do: function onPrefChange_do(subject, topic, key)
		{
log.debug("begin");
			let self = coomanPlus;
			subject = typeof(subject) == "undefined" ? null : subject;
			topic = typeof(topic) == "undefined" ? null : topic;
			key = typeof(key) == "undefined" ? null : key;
			self.setFilter(subject, topic, key);

			self.setSort(subject, topic, key);
			let l = self.string("filterRefresh");
			if (!self.pref("autofilter") || (!self.pref("autoupdate") && !self.pref("autofilter")))
				l = self.string("filterSearch") + "/" + self.string("filterRefresh");

			$("lookupstart").label = l;
			if (key === null || key == "topmost")
			{
//topmost borrowed from Console2 extension
				let xulWin = window.QueryInterface(Ci.nsIInterfaceRequestor)
											.getInterface(Ci.nsIWebNavigation)
											.QueryInterface(Ci.nsIDocShellTreeItem)
											.treeOwner.QueryInterface(Ci.nsIInterfaceRequestor)
											.getInterface(Ci.nsIXULWindow);
				xulWin.zLevel = (self.pref("topmost")) ? xulWin.raisedZ : xulWin.normalZ;
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

			self.prefBackupEncrypt = self.pref("backupencrypt");
			if (self._cookiesAll.length > 0)
			{
				self.selectLastCookie(true);
			}
			coomanPlusCore.async(self.resizeWindow);
log.debug("end", 1);
		}//onPrefChange_do()
	},//onPrefChange()

	loadCookies: function loadCookies(criterium, noresort, selected, updated, deleteExpired)
	{
		if (this.loadCookies.started)
			return;

		this.loadCookies.started = true;
log.debug("begin");
		criterium = typeof(criterium) == "undefined" ? $('lookupcriterium').getAttribute("filter") : criterium;
		deleteExpired = typeof(deleteExpired) == "undefined" ? coomanPlus.pref("deleteexpired") : deleteExpired;

		let	e = coomanPlusCore._cm.enumerator,
				cookiesAll = [],
				expired = [];
/*
		if (!$(this._cookiesTree.getAttribute("sortResource"))
				|| $(this._cookiesTree.getAttribute("sortResource")).getAttribute("hidden") == "true")
			this._cookiesTree.setAttribute("sortResource", "rawHost");
*/
		let self = this;
		if (self.selectLastCookie.timer)
			self.selectLastCookie.timer.cancel();

		$("loading").collapsed = false;
		$("loadingProgress").parentNode.hidden = false;
		$("loadingProgress").setAttribute("value", 0);
		$("loadingCount").value = "0%";
		if (this.prefFiltersearchtype & coomanPlusCore.COOKIE_NORMAL || !this.prefFiltersearchtype)
		{
log.debug("loading cookies");
			while (e.hasMoreElements())
			{
				let nextCookie = e.getNext();
				if (!nextCookie || !(nextCookie instanceof Ci.nsICookie))
					break;

				let aCookie = new this.cookieObject(nextCookie.QueryInterface(Ci.nsICookie2), false, updated)
				if (deleteExpired && aCookie.expires && aCookie.expires *1000 < (new Date()).getTime()
						&& (!aCookie.isProtected || !coomanPlus.protect.enabled || coomanPlus.pref("deleteprotected")))
				{
						expired.push(aCookie);
				}
				else
					cookiesAll.push(aCookie);
			}
			$("loadingProgress").setAttribute("value", 1000);
			$("loadingCount").value = "10%";
		}
		if (deleteExpired)
		{
			coomanPlusCore.async(function()
			{
log.debug("deleteexpired");
				let d = expired.length;
				function _callback()
				{
					if (!--d)
					{
						coomanPlus._noObserve = false;
						$("loadingProgress").setAttribute("value", 2000);
						$("loadingCount").value = "20%";
					}
				}
				for(let aCookie of expired)
				{
					coomanPlus._noObserve = true;
					if (aCookie.isProtected)
					{
log.debug("unprotect");
						coomanPlus.protect.obj.unprotect(aCookie);
					}
					coomanPlus.cookieRemove(aCookie, _callback);
				}
			});
		}
		if (this.prefFiltersearchtype & coomanPlusCore.COOKIE_HTML5 || !this.prefFiltersearchtype)
		{
log.debug("loading html5");
			coomanPlusCore.async(function()
			{
				coomanPlus.html5.load(function(list)
				{
					list = cookiesAll.concat(list)
					self.loadCookiesCallback(list, criterium, noresort, selected, updated);
				});
			});
		}
		else
			coomanPlusCore.async(function()
			{
				self.loadCookiesCallback(cookiesAll, criterium, noresort, selected, updated);
			});
	},//loadCookies()

	loadCookiesCallback: function loadCookiesCallback(list, criterium, noresort, selected, updated)
	{
log.debug();
		$("loadingProgress").setAttribute("value", 3000);
		$("loadingCount").value = "30%";
		if (list.length)
			this._cookiesAll = list;

		let count = 0,
				sort = ['creationTimeString', 'lastAccessedString', 'isHttpOnly', 'isSecure', 'statusString'].indexOf(this._cookiesTree.getAttribute("sortResource")) != -1;

//		this._cookies = [];
		for (let i = 0; i < list.length; i++)
		{
			let obj = list[i];
			coomanPlusCore.async(function()
			{
				obj.hash = coomanPlus.cookieHash(obj);
			});
			if (criterium && !this._cookieMatchesFilter(obj._aCookie, criterium))
				continue;

			obj._index = count;
			obj._indexAll = i;
			this._cookies[count] = obj; //we can't use push() because we are replacing existing data to avoid flickering
//			this._cookies.push(obj); //we can't use push() because we are replacing existing data to avoid flickering
			count++;
		}
log.debug("ended loadCookies", coomanPlus.loadCookies);
		if (count < this._cookies.length) //to avoid flickering effect we replacing existing data in _cookies array, trimming off old data
		{
			this._cookies.splice(count, this._cookies.length - count);
		}
		this._noselectevent = true;
		this.sortTreeData(this._cookiesTree, this._cookies);
		this._cookiesTreeView.rowCount = this._cookies.length;
		this._cookiesTree.view = this._cookiesTreeView;
		this._selected = [];
		let self = this;
		$("loadingProgress").setAttribute("value", 4000);
		$("loadingCount").value = "40%";
		function callback()
		{
			self._noselectevent = false;
			self.loadCookies.started = false;
			self._cookiesTree.treeBoxObject.invalidateRange(self._cookiesTree.treeBoxObject.getFirstVisibleRow(), self._cookiesTree.treeBoxObject.getLastVisibleRow())
		}
		this.selectLastCookie(noresort, undefined, selected, callback, true);
	},
	_updateCookieData: function _updateCookieData(aCookie, selections)
	{
log.debug();
		selections = typeof(selections) == "undefined" ? this.getTreeSelections(this._cookiesTree) : selections;
		let	multi = "<" + this.string("multipleSelection") + ">",
				na = "--",//"<" + this.string("na") + ">",
				count = selections.length;

		let	fixed = "QueryInterface" in aCookie ? new this.cookieObject(aCookie, false) : this.clone(aCookie),
				value, field;
		for(let i = 0; i < count; i++)
		{
			let s = this._cookieEquals(aCookie, this._cookies[selections[i]]);
			for(let o in fixed)
			{
				if (typeof(fixed[o]) != "object" || fixed[o] === null)
					fixed[o] = [fixed[o], false, fixed[o]];

				if (!s && this._cookies[selections[i]] && o in this._cookies[selections[i]] && this._cookies[selections[i]][o] !== fixed[o][0])
				{
					fixed[o] = [multi, true, fixed[o]];
				}
			}
		}
		if (fixed.type[0] == coomanPlusCore.COOKIE_HTML5)
		{
			fixed.path[2] = na;
			fixed.path[3] = true;
			if (!fixed.path[1])
				fixed.path[0] = na;
		}

		let props = [
			{id: "name", value: fixed.name},
			{id: "value", value: fixed.value},
/*			{id: "isDomain",
						 value: [aCookie.isDomain ?
										this.string("domainColon") : this.string("hostColon"), false]},
*/
			{id: "host", value: fixed.host},
			{id: "path", value: fixed.path},
			{id: "isSecure",
						 value: [fixed.isSecure[1] ? fixed.isSecure[0] : (fixed.isSecure[0] ?
										this.strings.secureYes :
										this.strings.secureNo), fixed.isSecure[1]]},
			{id: "expires", value: [fixed.expires[1] ? fixed.expires[0] : aCookie.expires == -1 ? na : this.getExpiresString(fixed.expires[0]), fixed.expires[1], 0, aCookie.expires == -1]},
			{id: "expires2", value: [fixed.expires[1] ? fixed.expires[0] : aCookie.expires == -1 ? na : this.getExpiresString(fixed.expires[0]), fixed.expires[1], 0, aCookie.expires == -1]},
			{id: "status", value: [fixed.status[1] ? fixed.status[0] : aCookie.status == -1 ? na : this.string("status"+fixed.status[0]), fixed.status[1], 0, aCookie.status == -1]},
			{id: "policy", value: [fixed.policy[1] ? fixed.policy[0] : this.string("policy"+fixed.policy[0]), fixed.policy[1]]},
			{id: "type", value: [fixed.type[1] ? fixed.type[0] : this.string("cookieType"+fixed.type[0]), fixed.type[1]]},

			{id: "lastAccessed", value: [fixed.lastAccessed[1] ? fixed.lastAccessed[0] : aCookie.lastAccessed == -1 ? na : this.getExpiresString(fixed.lastAccessed[0] == -1 ? -1 : Math.round(fixed.lastAccessed[0]/1000000)), fixed.lastAccessed[1], 0, aCookie.lastAccessed == -1]},
			{id: "creationTime", value: [fixed.creationTime[1] ? fixed.creationTime[0] : aCookie.creationTime == -1 ? na : this.getExpiresString(fixed.creationTime[0] == -1 ? -1 : Math.round(fixed.creationTime[0]/1000000)), fixed.creationTime[1], 0, aCookie.creationTime == -1]},
			{id: "isHttpOnly", value: [fixed.isHttpOnly[1] ? fixed.isHttpOnly[0] : this.string("yesno"+(fixed.isHttpOnly[0]?1:0)), fixed.isHttpOnly[1]]},
			{id: "isProtected", value: [fixed.isProtected[1] ? fixed.isProtected[0] : this.string("yesno"+(fixed.isProtected[0]?1:0)), fixed.isProtected[1], fixed.isProtected[2]]},
			{id: "isProtected2", value: [fixed.isProtected[1] ? fixed.isProtected[0] : this.string("yesno"+(fixed.isProtected[0]?1:0)), fixed.isProtected[1], fixed.isProtected[2]]},
		];
		this.showedExpires = aCookie.expires == -1 ? -1 : fixed.expires[0] * 1000;
		this.showedCreationTime = fixed.creationTime[0] / 1000;
		let expired = aCookie.expires != -1 && aCookie.expires && aCookie.expires*1000 < (new Date()).getTime();
		$("ifl_expires").setAttribute("expired", expired);
//		if (fixed.expires[1] || !this.prefView_expires || (!this.prefExpireProgress && !this.prefExpireCountdown) || aCookie.expires == -1)
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
		for(let i = 0; i < props.length; i++)
		{
			let	row = $("row_" + props[i].id),
					field = $("ifl_" + props[i].id);
			if (row)
			{
				row.setAttribute("multi", props[i].value[1]);
				row.setAttribute("empty", !props[i].value[0].length);
				row.setAttribute("na", props[i].value[3] || "");
			}
			field.setAttribute("multi", props[i].value[1]);
			field.setAttribute("empty", !props[i].value[0].length);
			field.setAttribute("na", props[i].value[3]);
			if (!props[i].value[0].length)
			{
				field.value = "";
				field.setAttribute("placeholder", "<" + this.string("empty") + ">");
			}
			else if(props[i].value[1])
			{
				field.value = "";
				field.setAttribute("placeholder", multi);
			}
			else if(props[i].value[3])
			{
				field.value = "";
				field.setAttribute("placeholder", props[i].value[0]);
			}
			else
			{
				field.value = props[i].value[0];
			}
			field.setAttribute("value", field.value);
			field.realValue = props[i].value[2];
		}

		if (!fixed.value[1] && fixed.value[0].length > 0)
		{
			$("ifl_value").setAttribute("tooltip", "tooltipValue");
			$("tooltipValue").label = $("ifl_value").value;
		}
		else
		{
			$("ifl_value").removeAttribute("tooltip");
		}
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
log.debug();
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
log.debug();
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
			var d = new Date();
			var p = null;
			if (coomanPlus.showedCreationTime)
			{
				var m = ((coomanPlus.showedExpires - coomanPlus.showedCreationTime) * 10000).toFixed();
				var n = ((coomanPlus.showedExpires - d.getTime()) * 10000).toFixed();
				n = Math.round(n * 10000 / m);
				m = 10000; //as larger the number, as smoother the progress bar will be. It seems FF chokes on numbers larger then 10M though
				var p = n * 100 / m;
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

			var e = coomanPlus.showedExpires < d.getTime();

			var tt = coomanPlus.strings.cookieexpired;
			if (e && !f && $("expireProgress").hidden && $("expireProgressText").hidden)
				this.cancel();
			else
			{
				var e = new Date(coomanPlus.showedExpires);
				var dd = e-d;
				var dday = Math.floor(dd/(86400000)*1)
				var dhour = Math.floor((dd%(86400000))/(3600000)*1)
				var dmin = Math.floor(((dd%(86400000))%(3600000))/(60000)*1)
				var dsec = Math.floor((((dd%(86400000))%(3600000))%(60000))/1000*1)
				var s = coomanPlus.strings;
				var t = [];
				var l;
				if (dday > 0)
					t.push(dday + " " + s['day' + (dday != 1 ? "s" : "")]);

				if (dhour > 0 || t.length)
					t.push(dhour + " " + s['hour' + (dhour != 1 ? "s" : "")]);


				if (dmin > 0 || t.length)
					t.push(dmin + " " + s['minute' + (dmin != 1 ? "s" : "")]);

				if (dsec > 0 || t.length)
					t.push(dsec + " " + s['second' + (dsec != 1 ? "s" : "")]);

				if (t.length)
					tt = coomanPlus.strings.cookieexpire_progress.replace("#", t.join(", ")) + (p !== null ? " (" + coomanPlus.strings.cookieexpire_progress_life.replace("#", p) + ")" : "");
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
		}
	},

	clearCookieProperties: function clearCookieProperties(l, d)
	{
log.debug();
		let properties = ["name","value","host","path","isSecure",
											"expires", "expires2","policy", "isHttpOnly",
											"lastAccessed", "creationTime", "status",
											"isProtected", "isProtected2", "type"];
		l = typeof(l) == "undefined" ? 0 : l;
		l = (l == 0) ? this.string("noCookieSelected") : "";
		for (let prop = 0; prop < properties.length; prop++)
		{
			let field = $("ifl_" + properties[prop]),
					row = $("row_" + properties[prop]);
			field.setAttribute("value", l);
			field.value = "";
			field.setAttribute("placeholder", l);
			field.removeAttribute("multi");
			field.setAttribute("empty", true);
			if (row)
			{
				row.removeAttribute("multi");
				row.setAttribute("empty", true);
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
		this._selected = [];
		this.UI_EnableCookieBtns(false, false);
		if ($("expireProgress").hidden	 && $("expireProgressText").hidden)
			this.expiresProgress.cancel(1);
	},

	clearFilter: function clearFilter()
	{
log.debug();
		$('lookupcriterium').value = "";
		$('lookupcriterium').setAttribute("filter", "");
		this.loadCookies();
	},

	checkFilter: function checkFilter()
	{
log.debug();
		return $("lookupcriterium").value != $("lookupcriterium").getAttribute("filter");
	},

	observe: function observe(aCookie, aTopic, aData)
	{
		if (this._noObserve || !this.pref("autoupdate") || aTopic != "cookie-changed")
			return;

log.debug();
		if (aCookie instanceof Ci.nsICookie)
		{
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
			this.observe(aCookie, aTopic, "cleared");

			// then, reload the list
			this.loadCookies();
		}

	},

	_handleCookieAdded: function _handleCookieAdded(aCookie)
	{
log.debug();
		this.observe.timer = coomanPlusCore.async(function()
		{
			coomanPlus.loadCookies($('lookupcriterium').getAttribute("filter"), false, (new Date()).getTime());
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

	_handleCookieChanged: function _handleCookieChanged(aCookie)
	{
log.debug();
		let self = this;
		this.observe.timer = coomanPlusCore.async(function()
		{
			
			for(let i = 0; i < self._cookies.length; i++)
			{
				if (self._cookieEquals(self._cookies[i], aCookie))
				{
					self._cookies[i] = new self.cookieObject(aCookie, false, (new Date()).getTime());
					if (self._isSelected(aCookie))
					{
						self._updateCookieData(aCookie);
					}
				}
			}
	//		log(self._cookiesTree.treeBoxObject.getFirstVisibleRow() + " | "  +  self._cookiesTree.treeBoxObject.getLastVisibleRow());
			self._cookiesTree.treeBoxObject.invalidateRange(self._cookiesTree.treeBoxObject.getFirstVisibleRow(), self._cookiesTree.treeBoxObject.getLastVisibleRow());
	//		self._cookiesTree.treeBoxObject.invalidate();
		}, 1000, this.observe.timer);
	},

	secure: function secure(type)
	{
		$("secure").hidden = type ? false : true;
	},

	onKeyDown: function onKeyDown(e)
	{
		var keys = coomanPlus.getKeys(e);
		if (coomanPlus.matchKeys(coomanPlusCore.lastKeyDown, keys[0], keys[0].length) || !("className" in e.target) || e.target.className == "hotkey") //prevent repeats
			return true;

		coomanPlusCore.lastKeyDown = keys[0];
		var r = true;
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
		else if (coomanPlus.matchKeys(keys[0], ["F5"], 1))
		{
			coomanPlus.loadCookies($('lookupcriterium').getAttribute("filter"), true);
		}
		else if (coomanPlus.matchKeys(keys[0], ["ACCEL", "A"], 2))
		{
			coomanPlus.selectAllShown();
		}
		else if (coomanPlus.matchKeys(keys[0], ["ALT", coomanPlus.strings.protect_protect_accesskey], 2))
		{
			e.preventDefault();
			e.stopPropagation();
			coomanPlus.protect.obj.protect();
			return false;
		}
		else if (coomanPlus.matchKeys(keys[0], ["ALT", coomanPlus.strings.protect_unprotect_accesskey], 2))
		{
			e.preventDefault();
			e.stopPropagation();
			coomanPlus.protect.obj.unprotect();
			return false;
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

	selectLastCookie: function selectLastCookie(noresort, changed, list, callback, isLoadCookies)
	{
		let self = this;
		if (self.selectLastCookie.started || (self.loadCookies.started && !isLoadCookies))
			return;

		self.selectLastCookie.started = true;
log.debug();
		let b = self._cookiesTree.view.selection.selectEventsSuppressed;
		self._cookiesTree.view.selection.selectEventsSuppressed = true;
		self._noselectevent = true;

		let	stored = false,
				index = null,
				indexSelect = true;

		if (!self._selected.length)
		{
			stored = true;
			list = typeof(list) == "undefined" ? [] : list;
			if (!list.length)
			{
				try
				{
					list = self.selectionRead();
				}
				catch(e){log.error(e)}
			}
			self._selected = [];
			for(let i = 0; i < list.length; i++)
			{
/*				let cookie = {
					host: list[i][0],
					path: list[i][1],
					name: list[i][2],
					type: list[i][3],
					value: list[i][5]
				};
	*/
				let idx = [];
				self._isSelected({hash: list[i].h}, self._cookiesAll, idx);
				if (!idx.length)
					continue;

				let aCookie = self._cookiesAll[idx[0]];
				let cookie = 
				{
					hash: aCookie.hash ? aCookie.hash : self.cookieHash({
						host: aCookie.host,
						path: aCookie.path,
						name: aCookie.name,
						type: aCookie.type,
						value: aCookie.value
					})
				};
//				if (!index && list[i][4])
				if (!index && list[i].f)
				{
					let c = cookie;
					index = c;
//					index.selected = list[i][4] == 2;
					index.selected = list[i].f == 2;
					index.i = i;
					if (index.selected)
						self._selected.push(cookie);

				}
				self._selected.push(cookie);
			}
		}
		let s = self._cookiesTree.getAttribute("scrollPos");
		if (!noresort && self._cookies.length - self._cookiesTree.treeBoxObject.getPageLength() >= s)
			self._cookiesTree.treeBoxObject.scrollToRow(s);
		s = 0;
		let	idx,
				first = null,
				last = null,
				selectedIndex = [],
				currentIndex = self._currentIndex,
				newIndex = null;
log.debug("selection read finished", coomanPlus.selectLastCookie);
log.debug("selection parse start");
		if (self._selected.length)
		{
//			$("loading").collapsed = false;
			let max = (self._selected.length * 10000).toFixed();
			let range = [];
			function loop(i)
			{
				let counter = 30;
				while (counter--)
				{
					if (i >= self._cookies.length)
					{
						selectLastCookieContinue();
						return;
					}
					let r = [],
							aCookie = self._cookies[i];
					if(self._isSelected(aCookie, null, r))
					{
						idx = false;
						if (first === null)
							first = i;

						if (index)
						{
							idx = self._cookieEquals(aCookie, index);
							if (idx && currentIndex == i)
								newIndex = i;

							if (idx && newIndex === null)
								newIndex = i
						}
						if (indexSelect || (!indexSelect && !idx))
						{
							last = i;
						}
						if (!idx || (idx && (!index || index.selected)))
						{
							selectedIndex.push(i);
//							self._cookiesTree.view.selection.rangedSelect(i, i , s ? true : false);
						}

						$("loadingProgress").setAttribute("value", Math.round(s * 60000000 / max) + 4000);
						$("loadingCount").value = (Math.round(s * 60 / self._selected.length) + 40) + "%";
						s++
						if (s >= self._selected.length)
						{
							selectLastCookieContinue()
							return;
						}

					}
					i++;
					if (i >= self._cookies.length)
					{
						selectLastCookieContinue();
						return;
					}
				}
				coomanPlusCore.async(function()
				{
					loop(i);
				});
			}//loop()
			loop(0);
		}
		else
			selectLastCookieContinue();

		function selectLastCookieContinue()
		{
log.debug("selection parse end", coomanPlus.selectLastCookie);
log.debug("selection set start");
			self._cookiesTree.view.selection.selectEventsSuppressed = true;
			self._noselectevent = true;
			$("loadingProgress").setAttribute("value", 10000);
			$("loadingCount").value = "100%";
			self.selectLastCookie.timer = coomanPlusCore.async(function()
			{
				$("loading").collapsed = true;
				$("loadingProgress").parentNode.hidden = true;
			}, 250, self.selectLastCookie.timer);
			if (self._selected.length)
			{
				for(let i = 0; i < selectedIndex.length; i++)
				{
					self._cookiesTree.view.selection.rangedSelect(selectedIndex[i], selectedIndex[i] , i ? true : false);
				}
				if (newIndex !== null || first !== null)
				{
	//				currentIndex = newIndex !== null ? newIndex : (self._cookies[currentIndex] && self._isSelected(self._cookies[currentIndex])) ? currentIndex : first;
					currentIndex = newIndex !== null ? newIndex : self._cookies[currentIndex] ? currentIndex : first;
					self._cookiesTree.view.selection.currentIndex = currentIndex;
				}
				if (!noresort)
				{
					let	v = false,
							f = self._cookiesTree.treeBoxObject.getFirstVisibleRow(),
							l = self._cookiesTree.treeBoxObject.getLastVisibleRow();

					if (index && selectedIndex[index.i] >= f && selectedIndex[index.i] <= l)
						v = true;


					for(let i = 0; i < selectedIndex.length; i++)
					{
						if (v || selectedIndex[i] >= f || selectedIndex <= l)
						{
							v = true;
							break;
						}
					}
					if (!v)
					{
						i = currentIndex != -1 ? currentIndex : first
						if (i !== null)
							self._cookiesTree.treeBoxObject.ensureRowIsVisible(i);
					}
				}
			}
			if (!s)
			{
				self._cookiesTree.view.selection.clearSelection();
				self._cookiesTree.view.selection.currentIndex = -1;
				self._selected = [];
			}
			self._cookiesTree.view.selection.selectEventsSuppressed = b;
			self._noselectevent = b;
log.debug("selection set end", 1);
			self.cookieSelected(noresort);
			self.selectLastCookie.started = false;
			if (typeof(callback) == "function")
				callback();
//log(self._selected, 1);
		}//selectLastCookieContinue()
	},//selectLastCookie()

	doLookup: function doLookup(e)
	{
log.debug();
		if (this.loadCookies.started)
			return false;

		this.website = false;
		this.setFilter();
		if( (e && e.keyCode == 13) || !e || this.pref("autofilter"))
		{
			var searchfor = $('lookupcriterium').value;
			$('lookupcriterium').setAttribute("filter", searchfor);
//			this.cookieSelected(true);
			this.loadCookies();
		}
	},

	twochar: function twochar(s)
	{
		let str = "00" + s;
		return str.substring( ((str.length)-2) ,str.length);
	},

	cookieSelected: function cookieSelected(noresort)
	{
log.debug("canceling " + this._noselectevent);
		if (this._noselectevent)
			return;

		let selections = this.getTreeSelections(this._cookiesTree);
		$("sel").setAttribute("checked", (selections.length == this._cookies.length))

		document.title = this.title + "  [" + this.string("stats").replace("NN", this._cookies.length).replace("TT", this._cookiesAll.length).replace("SS", selections.length) + "]";
		let index = this._cookiesTree.view.selection.currentIndex;
		this._currentIndex = index;
		if(selections.length < 1)
		{
			let list = [],
					aCookie = this._cookies[index];
			if (aCookie)
				list.push({
					h: aCookie.hash ? aCookie.hash : this.cookieHash({
						host: aCookie.host,
						path: aCookie.path,
						name: aCookie.name,
						type: aCookie.type,
						value: aCookie.type == coomanPlusCore.COOKIE_NORMAL ? "" : aCookie.value
					}),
					f: 1
				});
			coomanPlus.selectionSave(list);
			this.clearCookieProperties(0);
			return true;
		}


		let idx = selections.indexOf(index);
		idx = selections[((idx == -1) ? 0 : idx)];
		if( idx >= this._cookies.length )
		{
			this.UI_EnableCookieBtns(false, false);
			return false;
		}

		this._selected = [];
		let list = [];

		if (this._cookies[index])
		{
//			list.push([this._cookies[index].host,this._cookies[index].path,this._cookies[index].name, 1])
			list.push({
				h: this._cookies[index].hash ? this._cookies[index].hash : this.cookieHash({
					host: this._cookies[index].host,
					path: this._cookies[index].path,
					name: this._cookies[index].name,
					type: this._cookies[index].type,
					value: this._cookies[index].type == coomanPlusCore.COOKIE_NORMAL ? "" : this._cookies[index].value
				}),
				f: 1
			});
			this._selected.push({
				hash: list[0].h
			});
		}
		for(let s of selections)
		{
			let item = this._cookies[s];
			if (!item)
				continue;

			if (s == index)
			{
				list[0].f = 2;
				this._selected[0].i = s;
				continue;
			}

//			list.push([this._cookies[selections[i]].host,this._cookies[selections[i]].path,this._cookies[selections[i]].name])
			list.push({
				h: item.hash ? item.hash : this.cookieHash({
					host: item.host,
					path: item.path,
					name: item.name,
					type: item.type,
					value: item.type == coomanPlusCore.COOKIE_NORMAL ? "" : item.value
				})
			});

			this._selected.push({
				hash: list[list.length-1].h,
/*
				host: item.host,
				path: item.path,
				name: item.name,
*/
				i: s
			});
		}

		// save last selected name
			coomanPlus.selectionSave(list);
/*
		coomanPlusCore.async(function()
		{
			coomanPlus.selectionSave(list);
		});
*/
		this._updateCookieData(this._cookies[idx], selections);
		// make the delete button active
		let del = ($("ifl_isProtected").getAttribute("multi") == "true" || !this.protect.enabled || this.pref("deleteprotected") || !$("ifl_isProtected").realValue);

		this.UI_EnableCookieBtns(del, true);

		if ((index != -1 || selections.length) && !noresort)
		{
			let i = index != -1 ? index : selections[0],
					f = this._cookiesTree.treeBoxObject.getFirstVisibleRow(),
					l = this._cookiesTree.treeBoxObject.getLastVisibleRow();
			if (i < f || i > l)
			{
				this._cookiesTree.treeBoxObject.ensureRowIsVisible(i);
			}
		}
//log(this._cookies[index], 2);
		return true;
	},

	cookieColumnSort: function cookieColumnSort(column, noresort)
	{
log.debug();
		this._currentIndex = this._cookiesTree.view.selection.currentIndex;
		this.sortTree( this._cookiesTree, this._cookies, column);
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
		let deletedCookies = this.deleteSelectedItemFromTree(this._cookiesTree, this._cookies, block);
//log(deletedCookies, 1);
		if (!this._cookies.length)
			this.clearCookieProperties(0, true);

		this._noObserve = true;
		coomanPlusCore.async(function()
		{
			coomanPlus.finalizeCookieDeletions( deletedCookies, function deletedCookies_callback()
			{
	log.debug()
				coomanPlus._noObserve = false;
//				coomanPlus.loadCookies(undefined, true);
				coomanPlus.loadCookies();
			});
		});
	},

	deleteExpiredCookies: function deleteExpiredCookies(loadCookies, list, selected)
	{
log.debug();
		selected = typeof(selected) == "undefined" ? [] : selected;
		list = typeof(list) == "undefined" ? this._cookies : list;

		for(let i = 0; i < list.length; i++)
		{
			if (list[i].type == coomanPlusCore.COOKIE_NORMAL && list[i].expires && list[i].expires *1000 < (new Date()).getTime())
				selected.push(i);
		}
		let deletedCookies = this.deleteSelectedItemFromTree(this._cookiesTree, list, false, selected, true);
		
//		if (!list.length)
//			this.clearCookieProperties(0, true);

		this._noObserve = true;
		this._cookiesTree.view.selection.selectEventsSuppressed = true;
		coomanPlusCore.async(function()
		{
			coomanPlus.finalizeCookieDeletions( deletedCookies, function deleteExpiredCookies_callback()
			{
	log.debug()
				coomanPlus._noObserve = false;
				coomanPlus._cookiesTree.view.selection.selectEventsSuppressed = false;
				if (loadCookies)
					coomanPlus.loadCookies(undefined, true);
			});
		});
	},

	deleteSelectedItemFromTree: function deleteSelectedItemFromTree(tree, table, block, selected, DeleteAll)
	{
log.debug();
		block = typeof(block) == "undefined" ? false : block;
		let uChoice = {button:0, block:block},
				prefDeleteConf = this.pref("delconfirm"),
				index = tree.view.selection.currentIndex,
				selections = [],
				deletedTable = [],
				params = [];
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
				tree.treeBoxObject.ensureRowIsVisible(i);

				uChoice = this.promptDelete([table[i].name, table[i].host, selections.length - s], block);
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
			tree.treeBoxObject.ensureRowIsVisible(i);
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

//		coomanPlus.selectionSave();
/*
		coomanPlusCore.async(function()
		{
			coomanPlus.selectionSave();
		});
*/
		this.supress_getCellText = true;

		for (let j = 0; j < table.length; j++)
		{
			if (table[j].deleted == 2)
			{
				table.splice(j, 1);
				j--;
			}
		}
		tree.view.rowCount = table.length;
		let newSelected = [];
		if (table.length)
		{
			let s = this._selected;
			for(let i = 0; i < s.length; i++ )
			{
				let r = [];
				if(this._isSelected(s[i], table, r))
					newSelected.push({h: s[i].hash});
			}
			if (!newSelected.length)
			{
				let nextSelection = (selections[0] < table.length) ? selections[0] : table.length-1;
				newSelected.push({
					h: table[nextSelection].hash ? table[nextSelection].hash : this.cookieHash({
						host: table[nextSelection].host,
						path: table[nextSelection].path,
						name: table[nextSelection].name,
						type: table[nextSelection].type,
						value: table[nextSelection].type == coomanPlusCore.COOKIE_NORMAL ? "" : table[nextSelection].value
					})
				});
			}
		}
		this.selectionSave(newSelected)
		tree.view.selection.selectEventsSuppressed = false;
		this._noselectevent = false;
//log(newSelected);
//		this.selectLastCookie(false, undefined, newSelected);
		this.supress_getCellText = false;
		return deletedTable;
	},//deleteSelectedItemFromTree()

	finalizeCookieDeletions: function finalizeCookieDeletions(deletedCookies, callback)
	{
log.debug();
		let d = deletedCookies.length;
		for (let c = 0; c < d; c++)
		{
			if (deletedCookies[c].isProtected)
				coomanPlus.protect.obj.unprotect(deletedCookies[c]);

			this.cookieRemove(deletedCookies[c], function()
			{
				if (c >= d-1)
					callback();

			});
		}
	},

	selectAllShown: function selectAllShown()
	{
		this._cookiesTree.view.selection.selectAll();
//		this._cookiesTree.focus();
	},

	selectAllToggle: function selectAllToggle(button)
	{
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
			this._cookiesTree.view.selection.selectEventsSuppressed = true;
			this._noselectevent = true;
			for (let i = 0; i < this._cookies.length; i++)
				this._cookiesTree.view.selection.rangedSelect(i, i, (i));

			this._cookiesTree.view.selection.currentIndex = index;
			this._cookiesTree.view.selection.selectEventsSuppressed = false;
			this._noselectevent = false;

			this.cookieSelected();
//			this._cookiesTree.view.selection.selectAll();
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
		this.prefFiltersearchtype = this.pref("searchtype");

		if (!this.prefFiltersearchtype)
		{
			this.prefFiltersearchtype = coomanPlusCore.COOKIE_NORMAL + coomanPlusCore.COOKIE_HTML5;
			coomanPlus.pref("searchtype", this.prefFiltersearchtype);
		}
		this.prefFiltersearchtype1 = this.prefFiltersearchtype & coomanPlusCore.COOKIE_NORMAL;
		this.prefFiltersearchtype2 = this.prefFiltersearchtype & coomanPlusCore.COOKIE_HTML5;

		this.setChecked("searchcontent");
		this.setChecked("searchhost");
		this.setChecked("searchname");
		this.setChecked("searchcase");
		this.setChecked("searchtype1");
		this.setChecked("searchtype2");
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
		}
		this.website = false;
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
	},

	setChecked: function setChecked(id)
	{
log.debug();
		if (this["prefFilter" + id])
			$(id).setAttribute("checked", true);
		else
			$(id).removeAttribute("checked");

//		if (this.website && id != "searchhost")
		if (this["prefFilter" + id] && this.website && id != "searchhost")
			$(id).setAttribute("indeterminate", true);
		else
			$(id).removeAttribute("indeterminate");
	},

	changeFilter: function changeFilter(e)
	{
log.debug();
		let obj = e.originalTarget;
		if (obj.hasAttribute("indeterminate"))
		{
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
	},

	_cookieMatchesFilter: function _cookieMatchesFilter(aCookie, filter)
	{
		host = aCookie.host;
		name = aCookie.name;
		value = aCookie.value;
		if (!this.prefFiltersearchcase)
		{
			host = host.toLowerCase();
			name = name.toLowerCase();
			value = value.toLowerCase();
			filter = filter.toLowerCase();
		}
//log([host,filter]);
		return (this.prefFiltersearchhost && coomanPlus._match(host, filter, undefined, undefined, this.prefFiltersearchhosttype)) ||
					 (this.prefFiltersearchname && coomanPlus._match(name, filter)) ||
					 (this.prefFiltersearchcontent && coomanPlus._match(value, filter));
	},

	setSort: function setSort(subject, topic, key)
	{
		this.prefSimpleHost = this.pref("simplehost");
		if (topic == "nsPref:changed" && key == "simplehost")
			this.sortTree(this._cookiesTree, this._cookies);
	},

	openEdit: function openEdit()
	{
		var s = this.getTreeSelections(this._cookiesTree);
		if (!s.length)
		{
			this.openAdd();
			return;
		}
		var selIndex = s.indexOf(this._cookiesTree.view.selection.currentIndex);
		selIndex = s[((selIndex == -1) ? 0 : selIndex)]

		var cookies = [this._cookies[selIndex]];
		for(var i = 0; i < s.length; i++)
		{
			if (s[i] != selIndex)
				cookies[cookies.length] = this._cookies[s[i]];
		}
		this._openDialog("editCookie.xul", "_blank", "chrome,resizable=yes,centerscreen,dialog=no," + (this.isMac ? "dialog=no" : "modal"), {type: "edit", cookies: cookies});
	},

	openAdd: function openAdd()
	{
		this._openDialog("editCookie.xul", "_blank", "chrome,resizable=yes,centerscreen,dialog=no," + (this.isMac ? "dialog=no" : "modal"), {type: "new", cookies: this.getTreeSelections(this._cookiesTree).length ? [this._cookies[this._cookiesTree.view.selection.currentIndex]] : null});
	},

	openCookies: function openCookies()
	{
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
				args = {
			window: window,
			type: "forced",
		};
		args.wrappedJSObject = args;
		ww.openWindow(null, cm, "Browser:Cookies", "chrome,resizable,centerscreen", args).focus();
	},

	promptDelete: function promptDelete(params, block)
	{
		var r = {button: 0, params: params, block: block};
		this._openDialog("promptDelete.xul", "promptDelete", "chrome,resizable=no,centerscreen,dialog=no," + (this.isMac ? "dialog=no" : "modal"), r);
		return r;
	},

	openCookiesPermissions: function openCookiesPermissions()
	{
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
log.debug("begin");
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
		this.prefView_type = !$("row_type").collapsed;
		this.prefView_isProtected = !$("row_isProtected").collapsed;
		let rows = $("cookieInfoRows").getElementsByTagName("row"),
				last, id,
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
		$("isProtected")[c ? "removeAttribute" : "setAttribute"]("ignoreincolumnpicker", true);
		this.infoRowsChanged = this.prefViewOrder != this.prefViewOrderDefault;
		$("menu_info_reset").disabled = !this.infoRowsChanged;

//		$("infoSplitter").collapsed = $("row_value").collapsed || $("ifl_value").getAttribute("wrap") == "off";
		coomanPlus.setWrap();

log.debug("end", 1);
		if (!resize)
			return;

		coomanPlus.resizeWindow();
/*
		let w = $("main").boxObject.width,
				h = $("main").boxObject.height;
		if (document.width > w)
			w = document.width;

		if (document.height > h)
			h = document.height;

		w += (window.outerWidth - window.innerWidth);
		h += (window.outerHeight - window.innerHeight);
		window.resizeTo(w,h);
*/
	},

	infoRowsSort: function infoRowsSort(order)
	{

log.debug();
		if (typeof(order) == "undefined")
			var order = this.prefViewOrder.split("|");//$("cookieInfoRows").getAttribute("order").split("|");

		var rows = $("cookieInfoRows").getElementsByTagName("row");
		var last, from, to;
		for(var i = 0; i < rows.length; i++)
		{
			if (!rows[i].collapsed && !rows[i].hidden && rows[i].id != "row_end")
			{
				if (!last)
				{
					this.infoRowsFirst = row;
					rows[i].setAttribute("first", true);
				}
				last = rows[i];
			}

			if (!order[i])
				continue;

			var row = $("row_" + order[i]);
			if (!row || row.id == rows[i].id)
				continue;

			row.removeAttribute("highlight");
			from = row;
			to = rows[i];
			this.moveAfter(row, to);
			to.setAttribute("collapsed", to.collapsed);
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
		var o = e.currentTarget.parentNode.getElementsByTagName("textbox")[0]
		if (o.getAttribute("empty") == "true" || o.getAttribute("multi") == "true")
		{
			o.focus();
			return false;
		}

		if (!e.button)
			o.select();

		if (!e.button && e.detail > 1)
			this.infoRowCopyToClipboard(e);
	},

	infoRowCopyToClipboard: function infoRowCopyToClipboard(e)
	{
log.debug();
		if (e.button)
			return false;

		var o = e.currentTarget.parentNode.getElementsByTagName("textbox")[0]
		o.select();
		Cc["@mozilla.org/widget/clipboardhelper;1"]
		.getService(Ci.nsIClipboardHelper)
		.copyString(o.value);
	},

	infoRowContextCheck: function infoRowContextCheck(e)
	{
log.debug();
		var obj = document.popupNode.getAttribute("onclick") != "" ? document.popupNode : document.popupNode.parentNode;
		var o = obj.parentNode.getElementsByTagName("textbox")[0]
		$("infoRowCopy").disabled = (o.getAttribute("empty") == "true" || o.getAttribute("multi") == "true");
		$("infoRowUp").disabled = obj.parentNode.id == coomanPlus.infoRowsFirst.id;
		$("infoRowDown").disabled = obj.parentNode.id == coomanPlus.infoRowsLast.id;
		
		if (o.id == "ifl_value")
		{
			$("infoRowWrap").collapsed = false;
			$("infoRowWrap").previousSibling.collapsed = false;
		}
		else
		{
			$("infoRowWrap").collapsed = true;
			$("infoRowWrap").previousSibling.collapsed = true;
		}
		obj.click();
	},

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
				o = coomanPlus.infoRowGetRowObj(obj);

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
					o.setAttribute("wrap", o.getAttribute("wrap") == "off" ? "" : "off");
					coomanPlus.setWrap();
				break;
		}
		return true;
	},

	setWrap: function()
	{
		let o = $("ifl_value");
		$("infoRowWrap").setAttribute("checked", o.getAttribute("wrap") != "off");
		try
		{
			$("infoRowWrap2").setAttribute("checked", o.getAttribute("wrap") != "off");
		}catch(e){};
		$("infoSplitter").collapsed = $("row_value").collapsed || $("ifl_value").getAttribute("wrap") == "off";
		if ($("infoSplitter").collapsed)
			$("cookieInfoBox").setAttribute("height", "");
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
		coomanPlus.dragStarted = true;
		let row = coomanPlus.dragGetBox(e);
		row.getElementsByTagName("textbox")[0].focus();
		row.setAttribute("highlight", true);
		coomanPlus.dragCancel = false;
		coomanPlus.dragPause = false;
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

		let	obj = e.dataTransfer.mozGetDataAt("application/x-moz-node", 0),
				box = $("cookieInfoBox").boxObject;
		if (obj.firstChild.boxObject.x <= e.clientX && (obj.firstChild.boxObject.x + obj.firstChild.boxObject.width) >= e.clientX && e.clientY >= box.y && e.clientY <= (box.y + box.height))
		{
			let o = coomanPlus.dragGetRow(e);
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
			coomanPlus.dragoverShow();
			e.dataTransfer.effectAllowed = "none";
		}
		e.preventDefault();
		return false;
	},

	dragoverShow: function dragoverShow(id)
	{
		let	rows = $("cookieInfoRows").getElementsByTagName("row"),
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

	dragend: function dragend(e)
	{
		if (coomanPlus.dragCancel || coomanPlus.dragPause || !coomanPlus.dragStarted)
			return false;

		coomanPlus.dragStarted = false;
		coomanPlus.dragCancel = true;
		coomanPlus.dragoverShow();
		if (!e.dataTransfer.mozUserCancelled)
		{
			var obj = e.dataTransfer.mozGetDataAt("application/x-moz-node", 0);
			var t = obj.getElementsByTagName("textbox")[0];
			var r = [];
			for(var i = 0; i < t.editor.selection.rangeCount; i++)
				r.push(t.editor.selection.getRangeAt(i).cloneRange());

			var o = coomanPlus.dragoverObj;
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
			var sel = coomanPlus.getTreeSelections(coomanPlus._cookiesTree);
			if (sel.length)
				coomanPlus._updateCookieData(coomanPlus._cookies[sel[0]], sel);
			else
				coomanPlus.cookieSelected();
*/

		}
		coomanPlus.dragoverObj = null;
		e.preventDefault();
		return false;
	},//dragend()

	dragGetRow: function dragGetRow(e)
	{
		var	dropTarget = e.target,
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
		switch(obj.tagName)
		{
			case "spacer":
					obj = obj.nextSibling;
				break;
			case "hbox":
					obj = obj.parentNode;
				break;
			case "label":
					obj = obj.parentNode.parentNode;
				break;
		}
		if (obj && obj.tagName != "row")
			obj = null;

		return obj;
	},

	dragKeyDown: function dragKeyDown(e)
	{
		let keys = coomanPlus.getKeys(e),
				r = true,
				obj,
				id = e.target.id.replace("ifl_", "");
		if (coomanPlus.matchKeys(keys[0], ["ACCEL", "UP"], 2))
			coomanPlus.dragMoveUp($("row_" + id));
		else if (coomanPlus.matchKeys(keys[0], ["ACCEL", "DOWN"], 2))
			coomanPlus.dragMoveDown($("row_" + id));
		else if (coomanPlus.matchKeys(keys[0], ["UP"], 1))
			coomanPlus.changeUp($("row_" + id));
		else if (coomanPlus.matchKeys(keys[0], ["DOWN"], 1))
			coomanPlus.changeDown($("row_" + id));
	},

	changeUp: function changeUp(obj)
	{
		let o = obj,
				sel = function()
				{
					coomanPlusCore.async(function()
					{
						let t = o.getElementsByTagName("textbox")[0];
						t.focus();
						t.select();
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
		sel();
	},

	changeDown: function changeDown(obj)
	{
		let o = obj,
				sel = function()
				{
					coomanPlusCore.async(function()
					{
						if (o.id == "row_end")
							o = obj;
						let t = o.getElementsByTagName("textbox")[0];
						t.focus();
						t.select();
					});
				};
		if (obj.id == this.infoRowsLast.id)
			return sel();

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
		sel();
	},

	dragMoveUp: function dragMoveUp(obj)
	{
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
		let obj = e.originalTarget;
		var p = coomanPlus.infoRowGetRowObj(e.target.parentNode);
		if (!obj.getElementsByAttribute("coomanPlus", "true").length)
		{
			let menu = $("coomanPlus_inforow_drag_menu").childNodes;
			if (p.id == "row_value")
			{
				let clone = document.importNode($("infoRowWrap").previousSibling, false);
				obj.appendChild(clone);
				clone = document.importNode($("infoRowWrap"), false);
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
	},

	cookieInfoRowsOrderSave: function cookieInfoRowsOrderSave(obj, target)
	{
log.debug();
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
		var l = list.join("|");
		if (l != coomanPlus.prefViewOrder)
		{
			coomanPlus.prefViewOrder = l;
			$("cookieInfoRows").setAttribute("order", l);
//			coomanPlus.prefs.setCharPref("vieworder", l);
			coomanPlus.infoRowsSort(list);
			var sel = coomanPlus.getTreeSelections(coomanPlus._cookiesTree);
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
		var sel = coomanPlus.getTreeSelections(coomanPlus._cookiesTree);
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

		var refChild = aPopup.firstChild;

		var tree = coomanPlus._cookiesTree;
		var i = 0;
		var d = true;
		for (var currCol = tree.columns.getFirstColumn(); currCol; currCol = currCol.getNext())
		{
			// Construct an entry for each column in the row, unless
			// it is not being shown.
			var currElement = currCol.element;
			if (d && i++ != currCol.index)
			{
				d = false;
			}

			if (!currElement.hasAttribute("ignoreincolumnpicker") && !currElement.collapsed)
			{
				var popupChild = document.createElement("menuitem");
				popupChild.setAttribute("type", "checkbox");
				popupChild.setAttribute("closemenu", "none");
				var columnName = currElement.getAttribute("display") ||
												 currElement.getAttribute("label");

				popupChild.setAttribute("label", columnName);
				popupChild.setAttribute("colindex", currCol.index);
				if (currElement.getAttribute("hidden") != "true")
					popupChild.setAttribute("checked", "true");
				if (currCol.primary)
					popupChild.setAttribute("disabled", "true");
				aPopup.insertBefore(popupChild, refChild);
			}
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
			var menuitem = event.originalTarget.parentNode.getElementsByAttribute("anonid", "treeViewReset")[0]
											|| event.originalTarget.parentNode.getElementsByAttribute("anonid", "menuitem")[0];
			if (event.originalTarget == menuitem)
			{
				tree.columns.restoreNaturalOrder();
				tree._ensureColumnOrder();
				coomanPlus.treeView(event.target.parentNode)
			}
			else
			{
				var colindex = event.originalTarget.getAttribute("colindex");
				var column = tree.columns[colindex];
				if (column) {
					var element = column.element;
					if (element.getAttribute("hidden") == "true")
						element.setAttribute("hidden", "false");
					else
						element.setAttribute("hidden", "true");
				}
			}
		}
log.debug("end", 1);
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
			if (currElement.id != "colhid" && currElement.id != "sel" && currElement.getAttribute("hidden") != "true")
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
		for(var i = 0; i < items.length; i++)
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
log.debug();
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
							 "", "chrome,centerscreen,modal", coomanPlusCore.addon);
	},

	dblClickEdit: function dblClickEdit(e)
	{
		if (!e.button && e.detail == 2)
		{
			let col={};
			e.rangeParent.treeBoxObject.getCellAt(e.clientX, e.clientY, {}, col, {});
			if (!col.value || col.value.id == 'sel')
				return;

			coomanPlus.openEdit();
		}
	},

	focus: function focus(args, submit)
	{
		if(!args)
			return;

		if (typeof(args) == "object")
			args = args.wrappedJSObject;

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
			 this.doLookup();
		}
		
		if (args.options)
		{
			coomanPlusCore.async(function()
			{
				coomanPlus.options();
			});
		}
	},//focus()

	hasParent: function(obj, id)
	{
		if (obj.id == id)
			return true;
		
		if (!obj.parentNode)
			return false;
		
		return this.hasParent(obj.parentNode, id);
			
	},
	filesDragOver: function filesDragOver(e)
	{
		let dragService = Cc["@mozilla.org/widget/dragservice;1"].getService(Ci.nsIDragService),
				dragSession = dragService.getCurrentSession();


		if (dragSession.isDataFlavorSupported("application/x-moz-file"))
		{
			dragSession.canDrop = true;
			dragSession.dragAction = e.ctrlKey ? dragService.DRAGDROP_ACTION_LINK : dragService.DRAGDROP_ACTION_COPY;
		}
	},

	filesDragDrop: function filesDragDrop(e)
	{
		let	dragSession = Cc["@mozilla.org/widget/dragservice;1"].getService(Ci.nsIDragService).getCurrentSession()

		// If sourceNode is not null, then the drop was from inside the application
		if (dragSession.sourceNode)
			return;

		// Setup a transfer item to retrieve the file data
		let trans = Cc["@mozilla.org/widget/transferable;1"].createInstance(Ci.nsITransferable),
				files = [];

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
		let list = [];
		for(let i = 0; i < files.length; i++)
		{
			let file = files[i];
			coomanPlus.restoreAll(e.ctrlKey, {
				file: file,
				displayDirectory: file.parent.path
			}, function callback(r)
			{
				if (r)
					list = list.concat(r[1]);

				if (i >= files.length - 1)
				{
					if (!list.length)
					{
						coomanPlus.alert(coomanPlus.string("restore_none"));
						return;
					}
					list[0].f = 2;
					coomanPlus.selectionSave(list);
					coomanPlus.loadCookies();
					coomanPlus.alert(coomanPlus.string("restore_success").replace("#", list.length));
				}
			});
		}
	},
};

(function()
{
	let	wm = Cc['@mozilla.org/appshell/window-mediator;1'].getService(Ci.nsIWindowMediator),
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
})()

