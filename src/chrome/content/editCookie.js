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
var	log = coomanPlusCore.log,
		coomanPlus = {
	_params: null,
	focused: null,
	_cmpWindow: null,

	_addFlag: false,
	_addFlagNew: false,
	_curCookie: null,
	_newCookie: null,
	_cb: null, //cookie bundle
	_parent: null,
	_multi: false,
	backupData: {},
	prefs: coomanPlusCore.prefs,
	mouseScrollTimeStamp: 0,
	load: function load()
	{
		coomanPlus.init();
	},

	init: function init()
	{
log.debug.startTime = new Date();
log.debug();
		this._cmpWindow = coomanPlusCore.cmpWindow;
		coomanPlusCore.cmpWindow = window;

		this._params = window.arguments[0];
		this._parent = this._params.document;

		this._addFlag = this._params.type == "new";
		this._cb = $("bundlePreferences");

		Cu.import("resource://gre/modules/Services.jsm");
		Services.scriptloader.loadSubScript(coomanPlusCore.addon.getResourceURI("chrome/content/html5.js").spec, this);

		$('ifl_isSecureYes').label = $('ifl_isSecureYes').value = this.string("forSecureOnly");
		$('ifl_isSecureNo').label = $('ifl_isSecureNo').value = this.string("forAnyConnection");

		if (this._params.cookies) //this._params.window.coomanPlus._selected.length == 1)
		{
			this._multi = (this._params.cookies.length > 1);
			var aCookie = this.clone(this._params.cookies[0]);
			if (this._addFlag)
			{
				aCookie.name = "";
				aCookie.value = "";
			}

			this._curCookie = new this.cookieObject(aCookie);
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
				type: coomanPlusCore.COOKIE_NORMAL
			});

		$("ifl_name").readonly = this._multi;
		$("ifl_host").readonly = this._multi;
		$("ifl_path").readonly = this._multi;
		this.setType();
		if (this._multi)
		{
			$("c_name").disabled = this._multi;
			$("c_host").disabled = this._multi;
			$("c_path").disabled = this._multi;
			this.backup("c_name", "checked", $("c_name").checked);
			this.backup("c_host", "checked", $("c_host").checked);
			this.backup("c_path", "checked", $("c_path").checked);
			$("c_name").checked = false;
			$("c_host").checked = false;
			$("c_path").checked = false;
			document.title += " (" + this._params.cookies.length + " " + this.string("cookies") + ")";
			$("ifl_value").setAttribute("type", "multi");
			$("multiSelect").collapsed = false;
			$("valueMenuBox").collapsed = false;
			Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer).init({observe: function(){coomanPlus.loadMenu()}}, 0, Ci.nsITimer.TYPE_ONE_SHOT);
			window.onresize = this.valueMenuSize;
		}
		for(let i in this._curCookie)
		{
			if (!$("c_" + i))
				continue;

			if (this._addFlag)
				$("c_" + i).disabled = true;

			$("c_" + i).setAttribute("checked", !this._multi && this._addFlag ? true : $("c_" + i).checked);
			$("c_" + i).addEventListener("CheckboxStateChange", this.enableDisable, false);
			this.enableDisableChildren($("c_" + i));
		}
/*
		$("ifl_expires_date").addEventListener("change", this.fixDate, true);
		$("ifl_expires_time").addEventListener("change", this.fixTime, true);
*/
		$("ifl_expires_Year").addEventListener("DOMMouseScroll", this.mouseScroll, true);
		$("ifl_expires_Month").addEventListener("DOMMouseScroll", this.mouseScroll, true);
		$("ifl_expires_Day").addEventListener("DOMMouseScroll", this.mouseScroll, true);
		$("ifl_expires_Hours").addEventListener("DOMMouseScroll", this.mouseScroll, true);
		$("ifl_expires_Minutes").addEventListener("DOMMouseScroll", this.mouseScroll, true);
		$("ifl_expires_Seconds").addEventListener("DOMMouseScroll", this.mouseScroll, true);
		window.addEventListener("focus", this.onFocus, true);
		if (this._addFlag)
		{
			document.title = this.string("titleAdd");
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
		this.setFieldProps();
		this.showNew();
		this.setWrap();
		this.setJSON();
	},//init()

	loadMenu: function loadMenu()
	{
log.debug();
		var c = this._params.cookies;
		for(var i = 0; i < c.length; i++)
		{
			let v = c[i].name + " @ " + c[i].host + c[i].path;
			if (!i)
			{
				$("multiDefault").setAttribute("label", v);
			}
			$("multiDefault").appendItem(v, i).setAttribute("tooltiptext", v);
			$("valueMenu").appendItem("(" + v + ") " + c[i].value, c[i].value).setAttribute("tooltiptext", c[i].value);
		}
		$("valuePopup").selectedIndex = 0;
		$("multiDefault").selectedIndex = 0;
	},

	unload: function unload()
	{
log.debug();
		coomanPlus.uninit();
	},

	uninit: function uninit()
	{

log.debug();
		coomanPlusCore.cmpWindow = this._cmpWindow;

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
		$("ifl_expires_Day").removeEventListener("DOMMouseScroll", this.mouseScroll, true);
		$("ifl_expires_Month").removeEventListener("DOMMouseScroll", this.mouseScroll, true);
		$("ifl_expires_Year").removeEventListener("DOMMouseScroll", this.mouseScroll, true);
		$("ifl_expires_Hours").removeEventListener("DOMMouseScroll", this.mouseScroll, true);
		$("ifl_expires_Minutes").removeEventListener("DOMMouseScroll", this.mouseScroll, true);
		$("ifl_expires_Seconds").removeEventListener("DOMMouseScroll", this.mouseScroll, true);

		for(let i in this.backupData)
		{
			if ($(i))
				$(i).setAttribute("checked", this.backup(i, "checked"));
		}

		try
		{
			coomanPlus.protect.unload();
		}catch(e){log.error(e)}
		window.removeEventListener("focus", this.onFocus, true);
	},

	onFocus: function focus(e)
	{
		coomanPlus.focused = "id" in e.target ? e.target.id : null;
	},

	focus: function(args)
	{
		if (args.options)
		{
			coomanPlusCore.async(function()
			{
				coomanPlus.options();
			});
		}
		else
			window.focus();
	},

	setAttribute: function setAttribute(obj, attr, value, remove)
	{
		if (typeof(obj) == "string")
			obj = $(obj);

		var c = obj.childNodes;
		var command = remove ? "removeAttribute" : "setAttribute";
		obj[command]((attr == "disabled" && obj.tagName == "textbox" ? "readonly" : attr), value);
		for(var i = 0; i < c.length; i++)
		{
			if (c[i][command])
				c[i][command]((attr == "disabled" && c[i].tagName == "textbox" ? "readonly" : attr), value);

			if (c[i].childNodes.length > 0)
				this.setAttribute(c[i], attr, value, remove);
		}
	},

	enableDisable: function enableDisable(e)
	{
coomanPlus.debug();
		e.target.setAttribute("checked", e.target.checked); //work around of bug https://bugzilla.mozilla.org/show_bug.cgi?id=15232
		coomanPlus.enableDisableChildren(e.target);
		coomanPlus.showNew();
	},

	enableDisableChildren: function enableDisableChildren(obj)
	{
		coomanPlus.setAttribute(obj.parentNode.nextSibling, "disabled", !obj.checked, obj.checked);
	},

	secure: function secure()
	{
log.debug();
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
		if (e.target.id != coomanPlus.focused)
		{
	//		return true;
			e.target.focus();
		}
		var dir = e.detail > 0 ? "down" : "up";
		var s = e.target.parentNode.getElementsByTagName("spinbuttonsH");
		if (!s.length)
		{
			s = e.target.parentNode.getElementsByTagName("spinbuttonsV");
		}
		if (s.length)
		{
			coomanPlus.spinEvent("", s[0], dir);
		}

	},

	setFieldProps: function setFieldProps()
	{
log.debug();
		var field;
		var i;

		$("ifl_type").value = this._curCookie.type;
		var props = [
			{id: "ifl_name", value: this._curCookie.name, readonly: true, hidden: false },
			{id: "ifl_value", value: this.unescape(this._curCookie.value), readonly: false, hidden: false },
			{id: "ifl_host", value: this._curCookie.host, readonly: true, hidden: false },
			{id: "ifl_path", value: this._curCookie.path, readonly: true, hidden: false },
			{id: "ifl_isSecure",
			 value: this._curCookie.isSecure ?
							this.string("forSecureOnly") :
							this.string("forAnyConnection"), readonly: false, hidden: false },
			{id: "ifl_expires", value: this._curCookie.type == coomanPlusCore.COOKIE_NORMAL ? this._curCookie.expires : (new Date()).getTime()/1000+31536000, readonly: true, hidden: true },
			{id: "ifl_expires_date", value: "", readonly: true, hidden: false },
			{id: "ifl_expires_time", value: "", readonly: true, hidden: false },
			{id: "ifl_isHttpOnly", value: this._curCookie.isHttpOnly ? "true" : "false" , readonly: true, hidden: false },
			{id: "ifl_port", value: this._curCookie.port, readonly: true, hidden: false },
			{id: "ifl_proto", value: this._curCookie.proto, readonly: true, hidden: false },
		];


		for(i = 0; i < props.length; i++ )
		{
			field						= $(props[i].id);
			field.value			= props[i].value;
			field.readonly	= props[i].readonly;
			field.hidden		= props[i].hidden;
		}

		this.secure();
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
		$("ifl_type").value = this._curCookie.type;
		//collapse the new date dialog
	//  $("datetimepickerbox").hidden = true;
		this.rebuildDateSelection($("expr_" + sel));
		//set date/time picker fields
		this.fixDate();
		this.setDateField();
		this.fixTime();
		this.setTimeField();
		this.setType();
	},

	rebuildDateSelection: function rebuildDateSelection(radio, noresize)
	{
log.debug();
		if (radio.id == "expr_new")
			$("datetimepickerbox").collapsed = false;
		else
			$("datetimepickerbox").collapsed = true;
		this.showWarning();
		if (!noresize)
		Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer).init({observe: function(){coomanPlus.resizeWindow()}}, 0, Ci.nsITimer.TYPE_ONE_SHOT);
//			this.resizeWindow();
	},

	getExpireSelection: function getExpireSelection()
	{
log.debug();
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
log.debug();
		var temp;

		//check url
		try
		{
			var ioService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
			temp = "http://" + host + "/";
			var newuri = ioService.newURI(temp, null, null);
			try
			{
				newuri = '';
				temp = '';
				temp = "http://" + host + "/" + path
				newuri = ioService.newURI(temp, null, null);
			}
			catch(e)
			{
				return 'not a valid path: ' + path;
			}
			return 0;
		}
		catch(e)
		{
			return 'not a valid host: ' + host;
		}
	},

	createNewCookie: function createNewCookie(check)
	{
		check = typeof(check) == "undefined" ? true : check;
		let	name = this.trim($("ifl_name").value),
				value = this.escape($("ifl_value").value),
				host = this.trim($("ifl_host").value),
				path = this.trim($("ifl_path").value),
				isHttpOnly = ($("ifl_isHttpOnly").value == "true"),
				proto = this.trim($("ifl_proto").value),
				port = this.trim($("ifl_port").value),
				type = Number($("ifl_type").value);

		if (check)
		{
			let isValidURI = this.test_url(host, path);

			if ( isValidURI != 0 )
			{
				log.error(isValidURI);
				return false;
			}

			if ( !(name.length > 0) )
			{
				log.error('please specify name');
				return false;
			}
/*
			if ( !(value.length > 0) ) {
				alert('Error: \n' + 'please specify value');
				return false;
			}
*/
		}
		this._newCookie = new this.cookieObject({
												name: name,
												value: value,
												host: host,
												path:path,
												isSecure: $("ifl_isSecure").value == coomanPlus.string("forSecureOnly"),
												expires: this.getExpireSelection(),
												policy: this._curCookie.policy,
												isHttpOnly: isHttpOnly,
												proto: proto,
												port: port,
												type: type
											});

		return true;

	},

/*
	_cookieEquals: function _cookieEquals(aCookieA, aCookieB)
	{
		return	aCookieA.type == aCookieB.type &&
						this.trim(aCookieA.host) == this.trim(aCookieB.host) &&
						this.trim(aCookieA.name) == this.trim(aCookieB.name) &&
						this.trim(aCookieA.path) == this.trim(aCookieB.path);
	},
*/
	cookieMerge: function cookieMerge(a, b)
	{
log.debug();
		let r = {};
		for(let i in a)
		{
			r[i] = a[i];
			if (((i == "port" || i == "proto") && $("c_host").checked)
					|| ($("c_" + i) && $("c_" + i).checked))
				r[i] = b[i];
		}

		r.hash = this.cookieHash(r, true);
		return r;
	},

	saveCookie: function saveCookie(asNew)
	{
log.debug();
		asNew = typeof(asNew) == "undefined" ? false : true;
	//out_d2("Cookie Manager::SaveCookie::BEGIN");

		if (!this.createNewCookie())
			return false;

		this.isExists(this._newCookie, function(exists)
		{
			coomanPlus.saveCookieContinue(asNew, exists);
		});
	},

	saveCookieContinue: function saveCookieContinue(asNew, exists)
	{
log.debug();
		let cookieEqual = this._cookieEquals(this._curCookie, this._newCookie, true);
		if (!cookieEqual && exists)
		{
			if (!window.confirm(this.string("overwrite")))
				return;
		}
		let list = this._params.cookies;
		if (!list)
			list = [this._curCookie];

		let selected = [],
				count = 0,
				working = false,
				self = this;
		function callback(r)
		{
			working = false;
			count--;
		}
		for(let i = 0; i < list.length; i++)
		{
			let aCookie = this.cookieMerge(list[i], this._newCookie);
			cookieEqual = this._cookieEquals(aCookie, list[i], true);
			if(this._addFlag
					|| (!this._addFlag && !exists)
					|| !cookieEqual
					|| (aCookie.value != list[i].value)
					|| (aCookie.expires != list[i].expires)
					|| (aCookie.isSecure != list[i].isSecure)
					|| (aCookie.isHttpOnly != list[i].isHttpOnly)
					|| (aCookie.type != list[i].type)
					|| (aCookie.port != list[i].port)
					|| (aCookie.proto != list[i].proto)
				)
			{
				this._params.window.coomanPlus._noObserve = true;
				function add()
				{
					if (aCookie.type == coomanPlusCore.COOKIE_HTML5 && aCookie._aCookie && aCookie.type != aCookie._aCookie.type)
					{
						aCookie._aCookie = coomanPlus.clone(aCookie._aCookie);
						aCookie._aCookie.originAttributes = "";
						aCookie._aCookie.originKey = null;
						aCookie.path = "";
					}
					count++;
					working = true;
					self.cookieAdd(aCookie, callback);
					self._params.window.coomanPlus._noObserve = false;
				}
				if (!this._addFlag && !asNew && (!cookieEqual || (aCookie._aCookie && aCookie._aCookie.type == coomanPlusCore.COOKIE_HTML5 && aCookie._aCookie.originKey)))
				{
					let c = list[i];
					if (aCookie._aCookie && aCookie._aCookie.type == coomanPlusCore.COOKIE_HTML5 && aCookie._aCookie.originKey)
						c = c._aCookie;

					working = true;
					this.cookieRemove(list[i], add);
				}
				else
					add();
			}
				let cookie = {
					h: this.cookieHash({
						host: aCookie.host,
						path: aCookie.path,
						name: aCookie.name,
						type: aCookie.type,
						value: aCookie.value
					})
				};
			selected.push(cookie);
		}
		selected[0].f = 2;
//		this._params.window.coomanPlus._cookiesTree.view.selection.currentIndex = -1;
		function loop()
		{
			if (count || working)
			{
				this.loop = coomanPlusCore.async(loop, this.loop);
				return;
			}
			coomanPlus._params.window.coomanPlus.loadCookies(coomanPlus._parent.getElementById('lookupcriterium').getAttribute("filter"), undefined, selected);

		//out_d2("Cookie Manager::SaveCookie::END");
			window.close();
		}
		loop();
		return true;

	},

	showNew: function showNew()
	{
log.debug();
		this.createNewCookie(false);
		let e = (			!this.trim($("ifl_name").value)
							||	!this.trim($("ifl_host").value)
							||	(
											 !$("c_name").checked
										&& !$("c_host").checked
										&& !$("c_path").checked
										&& !$("c_value").checked
										&& !$("c_expires").checked
										&& !$("c_isSecure").checked
										&& !$("c_isHttpOnly").checked
										&& !$("c_type").checked
									)
						);

		$("editCookie").disabled = e;
		this.setJSON.timer = coomanPlusCore.async(function()
		{
			let val = $("ifl_value").value;
			try
			{
				JSON.parse(val);
				$("json").disabled = false;
			}
			catch(e)
			{
				let json = $("json");
				if (val.match(/[\r\n\t]/i))
				{
					json.disabled = false;
					json.setAttribute("label", coomanPlus.string("json1"))
					json.setAttribute("checked", false);
				}
				else if(val.match(/(%0A|%0D|%09)/i))
				{
					json.disabled = false;
					json.setAttribute("label", coomanPlus.string("json0"))
					json.setAttribute("checked", true);
				}
				else
					json.disabled = true;

			}
		}, 0, this.setJSON.timer);
		if (this._addFlag || this._multi)
			return;

		let aCookie = this.cookieMerge(this._curCookie, this._newCookie);
		this._addFlagNew = !this._cookieEquals(aCookie, this._curCookie, true);
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
	},

	saveCookiesCheck: function saveCookiesCheck(e)
	{
log.debug();
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
		var w = $("main").boxObject.width;
		var h = $("main").boxObject.height;
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
		this.setFieldProps();
	},
	
	valueMenuSize: function valueMenuSize(e)
	{
		$("valueMenu").menupopup.style.maxWidth = $("ifl_value").clientWidth + "px";
	},
	
	typeSelected: function typeSelected(e)
	{
log.debug();
		this.showNew();
		this.setType();
	},

	setType: function setType()
	{
log.debug();
		let type = $("ifl_type").value == coomanPlusCore.COOKIE_NORMAL;

		this.setTypeObj("c_expires", type);
		this.setTypeObj("c_path", type);
		this.setTypeObj("c_isSecure", type);
		this.setTypeObj("c_isHttpOnly", type);
		$("ifl_proto").hidden = type;
		$("ifl_port").hidden = type;
		$("ifl_path").disabled = !type;
	},//setType()

	setTypeObj: function setTypeObj(id, type)
	{
		let o = $(id);

		if (!type && !o.disabled)
			this.backup(o.id, "checked", o.checked);

		o.disabled = !type;
		let c = type;
		if (type)
		{
			let b = this.backup(o.id, "checked");
			if (typeof(b) != "undefined")
				c = b;
		}
		o.checked = c;

		o.setAttribute("checked", o.checked);
		this.enableDisableChildren(o);
	},//setTypeObj()

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
		coomanPlus.saveCookiesCheck(e)
		if(!e.ctrlKey
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
						|| e.keyCode == KeyEvent.DOM_VK_SPACE))
		{
			e.target.open = true;
			e.preventDefault();
			e.stopPropagation();
		}
	},
	setWrap: function(e)
	{
		$("wrap").setAttribute("checked", $("wrap").getAttribute("checked") == "true");
		$("ifl_value").setAttribute("wrap", $("wrap").getAttribute("checked") == "true" ? "" : "off");
	},
	setJSON: function(e)
	{
log.debug();
		let ok = true,
				type = $("json").getAttribute("checked") == "true";
		if (e)
		{
			e.target.removeAttribute("error");
			type = type ? 2 : 0;
		}
		else
			type = type ? 0 : 2;

		let val = $("ifl_value").value;
		if (type)
			val = this.unescape(val);
		else
			val = this.escape(val);

		if (e)
		{
			if (val == $("ifl_value").value)
			{
				e.target.setAttribute("error", true);
				coomanPlus.setJSON.timer = coomanPlusCore.async(function()
				{
					e.target.removeAttribute("error");
				}, 1000, coomanPlus.setJSON.timer)
			}
			else
			{
				e.target.setAttribute("checked", e.target.getAttribute("checked") != "true");
			}
		}
		if (val != $("ifl_value").value)
		{
			$("ifl_value").value = val;
		}	
		$("json").label = this.string("json" + ($("json").getAttribute("checked") == "true" ? 0 : 1));
		return;
/*
		try
		{
			let val = JSON.parse($("ifl_value").value);
			$("ifl_value").value = JSON.stringify(val, null, type);
			if (e)
			{
				e.target.setAttribute("checked", e.target.getAttribute("checked") != "true");
			}
		}
		catch(er)
		{
			if (e)
			{
				let val = $("ifl_value").value;
				if (e.target.getAttribute("checked") == "true")
					val = this.unescape(val);
				else
					val = this.escape(val);

				if (val === $("ifl_value").value)
				{
					e.target.setAttribute("error", true);
					coomanPlus.setJSON.timer = coomanPlusCore.async(function()
					{
						e.target.removeAttribute("error");
					}, 1000, coomanPlus.setJSON.timer)
				}
				else
				{
					$("ifl_value").value = val;
					e.target.setAttribute("checked", e.target.getAttribute("checked") != "true");
				}
			}
		}
		$("json").label = this.string("json" + ($("json").getAttribute("checked") == "true" ? 0 : 1));
*/
	},//json()
};