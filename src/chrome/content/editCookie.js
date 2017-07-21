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
	_params: null,
	focused: null,
	_cmpWindow: null,

	_addFlag: false,
	_addFlagNew: false,
	_curCookie: null,
	_newCookie: null,
	_cb: [], //cookie bundle
	_parent: null,
	_multi: false,
	backupData: {},
	pref: coomanPlusCore.pref,
	prefs: coomanPlusCore.prefs,
	prefBranch: Ci.nsIPrefBranch2,
	mouseScrollTimeStamp: 0,
	saveEnabled: false,
	inited: false,
	exec: [],
	load: function load()
	{
		coomanPlus.init(window.arguments[0]);
	},

	init: function init(params)
	{
//		this._cmpWindow = coomanPlusCore.cmpWindow;
//		coomanPlusCore.cmpWindow = window;

		this._params = params.wrappedJSObject;
		this._parent = this._params.document;

		this._addFlag = this._params.type == "new";
		this._cb.push($("bundlePreferences"));

		$('ifl_isSecureYes').label = $('ifl_isSecureYes').value = this.string("forSecureOnly");
		$('ifl_isSecureNo').label = $('ifl_isSecureNo').value = this.string("forAnyConnection");

		this.command("topmost");
		if (this._params.cookies) //this._params.window.coomanPlus._selected.length == 1)
		{
			this._multi = (this._params.cookies.length > 1);
//			var aCookie = this.clone(this._cookieGetExtraInfo(this._params.cookies[0]));
			let aCookie = this.clone(this._params.cookies[0]);
			if (this._addFlag)
			{
				aCookie.name = "";
				aCookie.value = "";
			}

			this._curCookie = new this.cookieObject(aCookie);
//			this._curCookie.name = this._curCookie.nameRaw;
//			this._curCookie.value = this._curCookie.valueRaw;
		}
		else
			this._curCookie = new this.cookieObject({
				name: "",
				value: "",
				host: "",
				path: "",
				isSecure: false,
				expires: 0,
				policy: 0,
				isHttpOnly: false,
				originAttributes: {
					appId: 0,
					firstPartyDomain: "",
					inIsolatedMozBrowser: false,
					privateBrowsingId: 0,
					userContexId: 0
				},
				type: coomanPlusCore.COOKIE_NORMAL
		});
		this._curCookie.hash = coomanPlusCore.cookieHash(this._curCookie, undefined, true);
		$("ifl_name").readonly = this._multi;
		$("ifl_host").readonly = this._multi;
		$("ifl_path").readonly = this._multi;
//		this.setType();
		if (!this.inited)
			this.title = document.title;

		document.title = this.title;
		$("multiSelect").collapsed = !this._multi;
		$("valueMenuBox").collapsed = !this._multi;
		if (this._multi)
		{
			this.backup("c_name", "checked", $("c_name").checked);
			this.backup("c_host", "checked", $("c_host").checked);
			this.backup("c_path", "checked", $("c_path").checked);
			$("c_name").checked = false;
			$("c_host").checked = false;
			$("c_path").checked = false;

			document.title += " " + this._params.cookies.length + " " + this.string("cookies");
			$("ifl_value").setAttribute("type", "multi");
			coomanPlusCore.async(coomanPlus.loadMenu);
			window.onresize = this.valueMenuSize;
		}
		else
		{
			$("ifl_value").removeAttribute("type");
			document.title += " " + this.string("cookie");
		}
		document.title += " - " + coomanPlusCore.addon.name;
		this.setSaveCheckboxes();
		$("c_name").disabled = this._multi || this._addFlag;
		$("c_host").disabled = this._multi || this._addFlag;
		$("c_path").disabled = this._multi || this._addFlag;
/*
		this.addEventListener($("ifl_expires_date"), "change", this.fixDate, true);
		this.addEventListener($("ifl_expires_time"), "change", this.fixTime, true);
*/
		this.addEventListener($("main"), "DOMMouseScroll", this.mouseScroll, true);
/*
		this.addEventListener($("ifl_expires_Year"), "DOMMouseScroll", this.mouseScroll, true);
		this.addEventListener($("ifl_expires_Month"), "DOMMouseScroll", this.mouseScroll, true);
		this.addEventListener($("ifl_expires_Day"), "DOMMouseScroll", this.mouseScroll, true);
		this.addEventListener($("ifl_expires_Hours"), "DOMMouseScroll", this.mouseScroll, true);
		this.addEventListener($("ifl_expires_Minutes"), "DOMMouseScroll", this.mouseScroll, true);
		this.addEventListener($("ifl_expires_Seconds"), "DOMMouseScroll", this.mouseScroll, true);
*/
		this.addEventListener(window, "focus", this.onFocus, true);
		if (this._addFlag)
		{
			document.title = this.string("titleAdd") +  " - " + coomanPlusCore.addon.name;
			$("editCookie").hidden = false;

			$('ifl_isSecure').value = $('ifl_isSecureNo').value;

			$("expr_selection").value = "expr_new";

			let newdate = (new Date());

			//add a day to the default time, so it does not expire right away.
			newdate = (this.dateAdd(newdate, "d", 1));

			$("ifl_expires_date").value = this.getDateStr(newdate);
			$('ifl_expires_time').value = this.getTimeStr(newdate); //newdate.getHours() + ':' + newdate.getMinutes() + ':' +newdate.getSeconds();

			this.rebuildDateSelection($("expr_new"), true);
			//set date/time picker fields
		}
//		$("typebox").collapsed = !this.html5.available || !this.pref("html5");
		this.setFieldProps();
		this.showNew();
		this.setWrap();
		//we used persist in previous versions, now we must reset manually :(
		this.inited = true;
		let observer = Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);
		observer.addObserver(this, "cmp-command", false);
		if ("addObserver" in this.prefs.QueryInterface(Ci.nsIPrefBranch))
			this.prefBranch = Ci.nsIPrefBranch;

		this.prefs.QueryInterface(this.prefBranch).addObserver('', this.onPrefChange, false);

		this.checkReset("edit");
		this.checkRestore("edit");
	},//init()

	_events: {},
	addEventListener: function addEventListener(obj, type, func, bubble, force)
	{
		if (!this._events[type])
			this._events[type] = [];

		if (this._events[type] && this._events[type].indexOf(obj) != -1)
				return;

		obj.addEventListener(type, func, bubble);
		this._events[type].push(obj);
	},//addEventListener()

	setSaveCheckboxes: function setSaveCheckboxes()
	{
		for(let i in this._curCookie)
		{
			let obj = $("c_" + i);
			if (!obj)
				continue;

			obj.disabled = this._addFlag;

			obj.setAttribute("checked", !this._multi && this._addFlag ? true : obj.checked);
			this.addEventListener(obj, "CheckboxStateChange", this.enableDisable, false);
			this.enableDisableChildren(obj);
		}
	},//setSaveCheckboxes()

	loadMenu: function loadMenu()
	{
log.debug();
		let c = coomanPlus._params.cookies;
		for(let i = 0; i < c.length; i++)
		{
			let v = c[i].name + " @ " + c[i].host + c[i].path;
			if (!i)
			{
				$("multiDefault").setAttribute("label", v);
			}
			$("multiDefault").appendItem(v, i).setAttribute("tooltiptext", v);
			let item = document.createElement("menuitem")
			item.setAttribute("label", "(" + v + ") " + c[i].value);
			item.value = c[i].value;
			item.setAttribute("tooltiptext", c[i].value);
			$("valuePopup").appendChild(item);
		}
		$("valuePopup").selectedIndex = 0;
		$("multiDefault").selectedIndex = 0;
	},

	unload: function unload()
	{
		coomanPlus.uninit();
	},

	uninit: function uninit()
	{
log.debug();
		coomanPlus.settingsBackup();
//		coomanPlusCore.cmpWindow = this._cmpWindow;

		for(var i in this._curCookie)
		{
			if (!$("c_" + i))
				continue;

			$("c_" + i).removeEventListener("CheckboxStateChange", this.enableDisable, false);
		}
/*
		$("ifl_expires_date").removeEventListener("change", this.fixDate, true);
		$("ifl_expires_time").removeEventListener("change", this.fixTime, true);
*/
		$("main").removeEventListener("DOMMouseScroll", this.mouseScroll, true);
/*
		$("ifl_expires_Year").removeEventListener("DOMMouseScroll", this.mouseScroll, true);
		$("ifl_expires_Month").removeEventListener("DOMMouseScroll", this.mouseScroll, true);
		$("ifl_expires_Day").removeEventListener("DOMMouseScroll", this.mouseScroll, true);
		$("ifl_expires_Hours").removeEventListener("DOMMouseScroll", this.mouseScroll, true);
		$("ifl_expires_Minutes").removeEventListener("DOMMouseScroll", this.mouseScroll, true);
		$("ifl_expires_Seconds").removeEventListener("DOMMouseScroll", this.mouseScroll, true);
*/
		for(let i in this.backupData)
		{
			if ($(i))
				$(i).setAttribute("checked", this.backup(i, "checked"));
		}
		try
		{
			let observer = Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);
			observer.removeObserver(this, "cmp-command", false);
		}catch(e){};
		try
		{
			coomanPlus.protect.unload();
		}catch(e){log.error(e)}
		try
		{
			this.prefs.QueryInterface(this.prefBranch).removeObserver('', this.onPrefChange, false);
		}catch(e){log.error(e)}
		window.removeEventListener("focus", this.onFocus, true);

log.debug("finished");
	},

	onPrefChange: {
		observe: function observe(subject, topic, key)
		{
			let self = coomanPlus;
			if (key == "topmost")
			{
				coomanPlusCore.async(function()
				{
					self.command("topmost");
				});
				return;
			}
		},
	},//onPrefChange

	onFocus: function focus(e)
	{
		coomanPlus.focused = e.target;
	},

	focus: function focus(args)
	{
		if (args.options)
		{
			coomanPlusCore.async(function()
			{
				coomanPlus.options();
			});
		}
		else
		{
			window.focus();
			coomanPlus.init(args);
		}
	},

	setAttribute: function setAttribute(obj, attr, value, remove)
	{
		if (typeof(obj) == "string")
			obj = $(obj);

		if (!obj)
			return;

		let c = obj.childNodes,
				command = remove ? "removeAttribute" : "setAttribute";

		obj[command]((attr == "disabled" && obj.tagName == "textbox" ? "readonly" : attr), value);
		for(var i = 0; i < c.length; i++)
		{
			if (c[i][command])
				c[i][command]((attr == "disabled" && c[i].tagName == "textbox" ? "readonly" : attr), value);

			if (c[i].childNodes.length > 0)
				this.setAttribute(c[i], attr, value, remove);
		}
//		this.setAttribute(obj.nextSibling, attr, value, remove);
			
	},

	enableDisable: function enableDisable(e)
	{
		e.target.setAttribute("checked", e.target.checked); //work around of bug https://bugzilla.mozilla.org/show_bug.cgi?id=15232
		coomanPlus.enableDisableChildren(e.target);
		coomanPlus.showNew();
	},

	enableDisableChildren: function enableDisableChildren(obj)
	{
		let parent;
		if (["c_name","c_path","c_host"].indexOf(obj.id) == -1)
		 parent = obj.parentNode.nextSibling
		else
			parent = obj.parentNode.parentNode.nextSibling;

		coomanPlus.setAttribute(parent, "disabled", !obj.checked, obj.checked);
	},

	secure: function secure()
	{
		$("secure").hidden = $('ifl_isSecure').value == $('ifl_isSecureNo').value;
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
/*
		if (e.target.id != coomanPlus.focused.id)
		{
	//		return true;
			e.target.focus();
		}
*/
		let parent = coomanPlus.focused.parentNode;
		if (!parent)
			return true;

		let dir = e.detail > 0 ? "down" : "up",
				s = parent.getElementsByTagName("spinbuttonsH");

		if (!s.length)
		{
			s = parent.getElementsByTagName("spinbuttonsV");
		}
		if (s.length)
		{
			coomanPlus.spinEvent("", s[0], dir);
		}

	},

	setFieldProps: function setFieldProps()
	{
		var field;
		var i;


		var props = [
			{id: "ifl_name", value: this._curCookie.name, readonly: true, hidden: false },
			{id: "ifl_value", value: this._curCookie.value, readonly: false, hidden: false },
			{id: "ifl_host", value: this._curCookie.host, readonly: true, hidden: false },
			{id: "ifl_path", value: this._curCookie.path, readonly: true, hidden: false },
			{id: "ifl_isSecure",
				value: this._curCookie.isSecure ?
							this.string("forSecureOnly") :
							this.string("forAnyConnection"),
				readonly: false,
				hidden: false },
			{id: "ifl_expires", value: this._curCookie.expires, readonly: true, hidden: true },
			{id: "ifl_expires_date", value: "", readonly: true, hidden: false },
			{id: "ifl_expires_time", value: "", readonly: true, hidden: false },
			{id: "ifl_isHttpOnly", value: this._curCookie.isHttpOnly ? "true" : "false" , readonly: true, hidden: false },
		];


		for(i = 0; i < props.length; i++ )
		{
			field						= $(props[i].id);
			field.value			= props[i].value;
			field.readonly	= props[i].readonly;
			field.hidden		= props[i].hidden;
		}
		//FF50 has a delay before field.value is populated???
		coomanPlusCore.async(function(){coomanPlus.secure()});
		//rearrange radio bttons if this is a session cookie
		var sel = "new";
		if (this._curCookie.expires)
		{
			$("ifl_expires_date").value = this.getDateStr(new Date($("ifl_expires").value*1000))
			$('ifl_expires_time').value = this.getTimeStr(new Date($("ifl_expires").value*1000))
		}
		else
		{
			sel = "session";
			var newdate = (new Date());

			//add one day to the default time, so it does not expire right away.
			var newdate = (this.dateAdd(newdate, "d", 1));

			$("ifl_expires_date").value = this.getDateStr(newdate);
			$('ifl_expires_time').value = this.getTimeStr(newdate); //newdate.getHours() + ':' + newdate.getMinutes() + ':' +newdate.getSeconds();

		}

		$("expr_selection").value  = "expr_" + sel;
		//collapse the new date dialog
	//  $("datetimepickerbox").hidden = true;
		this.rebuildDateSelection($("expr_" + sel));
		//set date/time picker fields
		this.fixDate();
		this.setDateField();
		this.fixTime();
		this.setTimeField();
	},

	rebuildDateSelection: function rebuildDateSelection(radio, noresize)
	{
		if (radio.id == "expr_new")
			$("datetimepickerbox").collapsed = false;
		else
			$("datetimepickerbox").collapsed = true;
		this.showWarning();
		if (!noresize)
			coomanPlusCore.async(this.resizeWindow);
	},

	getExpireSelection: function getExpireSelection()
	{
		switch ($('expr_selection').value)
		{
			case "expr_new":
				return Date.parse($('ifl_expires_date').value + ' ' + $('ifl_expires_time').value) / 1000;
			case "expr_session":
				return false;
			default:
				return this._curCookie.expires;
		}
		return this._curCookie.expires;

	},


	test_url: function test_url(host, path)
	{
		let r = false,
				msg = {
					host: false,
					path: false
				},
				ioService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);

		//check url
		try
		{
			if (!host.length)
				throw Components.results.NS_ERROR_MALFORMED_URI;

			ioService.newURI("http://" + host, null, null);
		}
		catch(e)
		{
			msg.host = [this.string("error_domain") + ": " + host, e];
			r = true;
		}
		try
		{
			if (!path.length)
				throw Components.results.NS_ERROR_MALFORMED_URI;

			ioService.newURI("http://test" + path, null, null);
		}
		catch(e)
		{
			msg.path = [this.string("error_path") + ": " + path, e];
			r = true;
		}
		return [r, msg];
	},

	createNewCookie: function createNewCookie(check)
	{
		check = typeof(check) == "undefined" ? true : check;
		let name = this.trim($("ifl_name").value),
//				value = this.escape($("ifl_value").value),
				value = $("ifl_value").value,
				host = this.trim($("ifl_host").value),
				path = this.trim($("ifl_path").value),
				isHttpOnly = ($("ifl_isHttpOnly").value == "true");

/*		try
		{
			name = encodeURIComponent(name);
		}
		catch(e){}
		try
		{
			value = encodeURIComponent(value);
		}
		catch(e){}
*/
		let isValidURI = this.test_url(host, path),
				r = 0;
		for(let i in isValidURI[1])
		{
			let val = isValidURI[1][i] && $("c_" + i).checked;
			$("i_" + i).style.visibility = val ? "visible" : "hidden";
			r |= val ? 1 : 0
		}
		r |= !name.length && $("c_name").checked ? 1 : 0;
		$("i_name").style.visibility = !name.length && $("c_name").checked ? "visible" : "hidden";
		if (isValidURI[0])
		{
			if (check)
			{
				for(let i in isValidURI[1])
				{
					log.error(isValidURI[1][i][0]);
				}
			}
			if (r)
				return false;
		}
		if (name.length < 1)
		{
			if (check)
				log.error('please specify name');
	
			if (r)
				return false;
		}
/*
			if ( !(value.length > 0) ) {
				alert('Error: \n' + 'please specify value');
				return false;
			}
*/
		this._newCookie = new this.cookieObject({
												name: name,
												value: value,
												host: host,
												path:path,
												isSecure: $("ifl_isSecure").value == coomanPlus.string("forSecureOnly"),
												expires: this.getExpireSelection(),
												policy: this._curCookie.policy,
												isHttpOnly: isHttpOnly,
												originAttributes: this._curCookie.originAttributes,
											});
//		this._newCookie.name = name;
//		this._newCookie.value = value;
		this._newCookie.hash = coomanPlusCore.cookieHash(this._newCookie, undefined, true);
		return true;

	},//createNewCookie()

	cookieMerge: function cookieMerge(a, b)
	{
		let r = {};
		for(let i in a)
		{
			r[i] = a[i];
			if ($("c_" + i))
				if ($("c_" + i).checked)
					r[i] = b[i];
		}

		r.hash = coomanPlusCore.cookieHash(r, undefined, true);
		return r;
	},

	saveCookie: function saveCookie(asNew)
	{
		asNew = typeof(asNew) == "undefined" ? false : true;
	//out_d2("Cookie Manager::SaveCookie::BEGIN");

		if (!this.createNewCookie())
			return false;

		let exists = false,
				cookieEqual = this._cookieEquals(this._curCookie, this._newCookie);
		try
		{
			exists = coomanPlusCore._cm2.cookieExists(this._newCookie, this._newCookie.originAttributes);
		}catch(e){}

		if (!cookieEqual && exists)
		{
			if (!window.confirm(this.string("overwrite")))
				return;
		}
		let list = this._params.cookies;
		if (!list)
			list = [this._curCookie];

		let selected = [];
		for(let i = 0; i < list.length; i++)
		{
			let aCookie = this.cookieMerge(list[i], this._newCookie),
					ro = aCookie.readonly;

			cookieEqual = this._cookieEquals(aCookie, list[i]);
			if (ro)
			{
				for(let r in ro)
					ro[r] = aCookie[r];
			}

			if(this._addFlag
					|| (!this._addFlag && !exists)
					|| !cookieEqual
					|| (aCookie.value != list[i].value)
					|| (aCookie.expires != list[i].expires)
					|| (aCookie.isSecure != list[i].isSecure)
					|| (aCookie.isHttpOnly!= list[i].isHttpOnly)
				)
			{
				this._params.window.coomanPlus._noObserve = true;

				if (!this._addFlag && !asNew && !cookieEqual)
				{
					coomanPlus.cookieRemove(list[i]);
				}
				coomanPlus.cookieAdd(aCookie);
				this._params.window.coomanPlus._noObserve = false;
			}
			selected.push(coomanPlusCore.cookieHash(aCookie, undefined, true));
		}
		if (this._params.window.coomanPlus.inited)
		{
			this._params.window.coomanPlus._selected = selected;
			this._params.window.coomanPlus.loadCookies();
//			this._params.window.coomanPlus.cookieSelected();
		}
		if (typeof(coomanPlus._params.callback) == "function")
			try
			{
				coomanPlus._params.callback(selected);
			}catch(e){log.debug(e)}

	//out_d2("Cookie Manager::SaveCookie::END");
		window.close();

		return true;

	},

	showNew: function showNew(obj)
	{
/*
		if (obj)
		{
			let val = obj.value;
			val = val.replace(/\r\n/g, "\n").replace(/\n/g, " ");
			if (val !== obj.value)
			{
				let s = obj.selectionStart,
						e = obj.selectionEnd;
				obj.value = val;
				obj.selectionEnd = e;
				obj.selectionStart = s;
			}
		}
*/
		this.saveEnabled = this.createNewCookie(false);
		let ok = false;
		try
		{
			coomanPlusCore._cm2.cookieExists(this._newCookie, this._newCookie.originAttributes);
			ok = true;
		}
		catch(e){}
		let e = (!this.saveEnabled
							||	(!ok
									||	($('c_name').checked && !this.trim($('ifl_name').value).length)
									||	($('c_host').checked && !this.trim($('ifl_host').value).length)
									||	($('c_path').checked && !this.trim($('ifl_path').value).length)
									||	(!$('c_name').checked
												&& !$('c_host').checked
												&& !$('c_path').checked
												&& !$('c_value').checked
												&& !$('c_expires').checked
												&& !$('c_isSecure').checked
											)
								)
						);

/*
log([e,
			!this.saveEnabled,
			(!ok
						|| ($('c_name').checked && !this.trim($('ifl_name').value).length)
						||	!this.trim($('ifl_host').value) === ""
						||	(!$('c_name').checked
									&& !$('c_host').checked
									&& !$('c_path').checked
									&& !$('c_value').checked
									&& !$('c_expires').checked
									&& !$('c_isSecure').checked
								)
			),
			!ok,
			($('c_name').checked && !this.trim($('ifl_name').value).length),
			!this.trim($('ifl_host').value) === "",
			(!$('c_name').checked
					&& !$('c_host').checked
					&& !$('c_path').checked
					&& !$('c_value').checked
					&& !$('c_expires').checked
					&& !$('c_isSecure').checked
			),
			!$('c_name').checked,
			!$('c_host').checked,
			!$('c_path').checked,
			!$('c_value').checked,
			!$('c_expires').checked,
			!$('c_isSecure').checked,
			

]);
*/
		$("editCookie").disabled = e;
		if (this._addFlag || this._multi)
			return;

		let aCookie = this.cookieMerge(this._curCookie, this._newCookie);
		this._addFlagNew = !this._cookieEquals(aCookie, this._curCookie);
		$("editCookieNew").hidden = false;
		if (this._addFlagNew && !e)
		{
			$("editCookieNew").disabled = false;
	//    $("editCookie").style.fontWeight = "normal";
		}
		else
		{
			$("editCookieNew").disabled = true;
	//    $("editCookie").style.fontWeight = "bold";
		}
	},//showNew()

	saveCookiesCheck: function saveCookiesCheck(e)
	{
//		if (e.keyCode == KeyEvent.DOM_VK_RETURN && (this._addFlag || !this._addFlagNew))
		if (e.target.id != "ifl_value" && e.keyCode == KeyEvent.DOM_VK_RETURN && !$("editCookie").disabled)
		{
			return this.saveCookie();
		}
		return false;
	},

	resizeWindow: function resizeWindow(f)
	{
log.debug();
		let w = $("main").boxObject.width,
				h = $("main").boxObject.height;
	//	alert(document.width + "x" + document.height +"\n" + w + "x" + h);
		if (f || document.width < w || document.height < h)
			window.sizeToContent();
	},

	showValueSelect: function showValueSelect(e)
	{
		$("ifl_value").value = e.target.value
	},

	showDefaultSelect: function showDefaultSelect(e)
	{
		this._curCookie = new this.cookieObject(this._params.cookies[e.target.value]);
		this._curCookie.hash = coomanPlusCore.cookieHash(this._curCookie, undefined, true);
//		this._curCookie.name = this._curCookie.nameRaw;
//		this._curCookie.value = this._curCookie.valueRaw;
		this.setFieldProps();
	},
	
	valueMenuSize: function valueMenuSize(e)
	{
		$("valuePopup").style.maxWidth = $("ifl_value").parentNode.clientWidth + "px";
	},
	
	typeSelected: function typeSelected(e)
	{
log.debug();
		this.showNew();
		this.setType();
	},

	backup: function backup(id, type, val)
	{
		let r;
		try
		{
			r = this.backupData[id][type];
		}catch(e){};

		if (typeof(val) == "undefined")
			return r;

		if (!(id in this.backupData))
			this.backupData[id] = {};

		this.backupData[id][type] = val;
		return r;
	},//backup()

	valueKeypress: function valueKeypress(e)
	{
		if(!coomanPlus.saveCookiesCheck(e)
				|| (!e.ctrlKey
				&& !e.shiftKey
				&& !e.altKey
				&& !this.open
				&& (e.keyCode == KeyEvent.DOM_VK_UP
						|| e.keyCode == KeyEvent.DOM_VK_DOWN
						|| e.keyCode == KeyEvent.DOM_VK_PAGE_UP
						|| e.keyCode == KeyEvent.DOM_VK_PAGE_DOWN
						|| e.keyCode == KeyEvent.DOM_VK_HOME
						|| e.keyCode == KeyEvent.DOM_VK_END
						|| e.keyCode == KeyEvent.DOM_VK_BACK_SPACE
						|| e.keyCode == KeyEvent.DOM_VK_SPACE)))
		{
			e.target.open = true;
			e.preventDefault();
			e.stopPropagation();
		}
	},

	setWrap: function setWrap(e)
	{
		$("wrap").setAttribute("checked", $("wrap").getAttribute("checked") == "true");
		$("ifl_value").setAttribute("wrap", $("wrap").getAttribute("checked") == "true" ? "" : "off");
	},
	
	setAction: function	setAction(e)
	{
log.debug();

		let obj = $("ifl_value"),
				selStart = obj.selectionStart,
				selEnd = obj.selectionEnd,
				r = obj.value;

		if (selStart != selEnd)
			r = r.substring(selStart, selEnd);

		switch(e.target.id.replace("mnu_", ""))
		{
			case "encode":
				try
				{
					r = encodeURIComponent(r);
				}catch(e){}
			break;

			case "decode":
				try
				{
					r = decodeURIComponent(r);
				}catch(e){}
			break;

			case "expand":
				try
				{
					r = JSON.stringify(JSON.parse(r), null, 2);
				}catch(e){}
			break;

			case "compact":
				try
				{
					r = JSON.stringify(JSON.parse(r), null, 0);
				}catch(e){}
			break;

			case "base64encode":
				try
				{
					r = btoa(r);
				}catch(e){}
			break;

			case "base64decode":
				try
				{
					r = atob(r);
				}catch(e){}
			break;
		}
		let newLength = r.length;
		if (selStart != selEnd)
			r = obj.value.slice(0, selStart) + r + obj.value.slice(selEnd);

		if (r == obj.value)
		{
			let button = e.currentTarget,
					timer = coomanPlus.setAction["timer" + e.target.id];
			button.setAttribute("error", true);
			
			timer = coomanPlusCore.async(function()
			{
				button.removeAttribute("error");
			}, 1000, timer)
		}
		else
		{
			obj.value = r;
		}
		obj.focus();
		if (selStart != selEnd)
		{
			obj.selectionStart = selStart;
			obj.selectionEnd = selStart + newLength;
		}

	},//setAction()

	observe: function observe(aData, aTopic, aCommand)
	{
log.debug();
		if (aTopic == "cmp-command")
			return coomanPlus.command(aCommand, aData);
	},//observe{}

	resetWindowSettings: function resetWindowSettings(params)
	{
		function execute(p)
		{
			return !params || !params.length || params.indexOf(p) != -1;
		}
		if (execute("persist"))
		{
			this.resetPersist();
			this.setSaveCheckboxes();
		}
	
		window.sizeToContent();
		try
		{
			delete coomanPlusCore.storage.reset.edit;
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
		let win = $("cookiesManagerPlusWindowEdit");
		coomanPlus.backupPersist(win, settings);
		coomanPlusCore.backup(settings, "edit")

	},//settingsBackup()

	settingsRestore: function settingsRestore()
	{
log.debug();
		let data = coomanPlusCore.storage.restore;
		if (!data || !data.edit)
			return

		this.resetPersist(undefined, data.edit);
		this.setSaveCheckboxes();
		if (data.cookiesManagerPlusWindowEdit)
		{
			window.resizeTo(data.cookiesManagerPlusWindowEdit.width, data.cookiesManagerPlusWindowEdit.height);
		}
		else
			window.sizeToContent();

		delete data.edit;
		coomanPlusCore.storageWrite();
	},//settingsRestore()
};

coomanPlus.exec.push(function()
{
	coomanPlus.backupPersist($("cookiesManagerPlusWindowEdit"));
});
