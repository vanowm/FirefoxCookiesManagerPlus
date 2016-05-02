Components.utils.import("resource://cookiesmanagerplus/coomanPlusCore.jsm");
var coomanPlus = {
	_cw: null,
	args: null,
	sync: false,
	load: function load()
	{
		window.removeEventListener("load", coomanPlus.load, true);
		coomanPlus.init();
	},

	init: function init()
	{
		this._cw = gCookiesWindow;
		this._cw._tree.view.selection.clearSelection();
		document.getElementById("removeAllCookies").parentNode.insertBefore(document.getElementById("cmp"), document.getElementById("removeAllCookies").nextSibling);
		document.getElementById("cookiesList").addEventListener("select", this._selected, false);
		this.sync = coomanPlusCore.pref("nativesync")
		document.getElementById("cmpSync").setAttribute("checked", this.sync);

	},

	openCMP: function openCMP()
	{
		coomanPlusCore.openCMP();
	},

	_selected: function _selected()
	{
		let args = coomanPlus.args;
		if (!args || !coomanPlusCore.cmpWindow || !coomanPlus.sync || !("coomanPlus" in coomanPlusCore.cmpWindow))
			return;

		let	cmp = coomanPlusCore.cmpWindow.coomanPlus,
				_cw = coomanPlus._cw,
				seln = _cw._tree.view.selection,
				item,
				selected,
				list = [];

		if (!_cw._view._filtered)
			item = _cw._view._getItemAtIndex(seln.currentIndex);
		else
			item = _cw._view._filterSet[seln.currentIndex];

		if (item.container)
			selected = item.cookies;
		else
			selected = [item];

		for(let i of selected)
		{
			let aCookie = new cmp.cookieObject(i);
			list.push({
				h: cmp.cookieHash({
						host: aCookie.host,
						path: aCookie.path,
						name: aCookie.name,
						type: aCookie.type,
						value: aCookie.type == coomanPlusCore.COOKIE_NORMAL ? "" : aCookie.value
				})
			})
		}
		list[0].f = 2;
		cmp.selectionSave(list);
		cmp._selected = [];
		cmp.selectLastCookie(undefined,undefined,list,function callback()
		{
			let	s = cmp.getTreeSelections(cmp._cookiesTree),
					f = cmp._cookiesTree.treeBoxObject.getFirstVisibleRow(),
					l = cmp._cookiesTree.treeBoxObject.getLastVisibleRow();
			for(let i = 0; i < s.length; i++)
				if (s[i] < f || s[i] > l)
				{
					let p = cmp._cookies.length - cmp._cookiesTree.treeBoxObject.getPageLength();
					if (s[0] > p)
						s[0] = p;

					cmp._cookiesTree.treeBoxObject.scrollToRow(s[0]);
					break;
				}
		});
	},

	syncChange: function syncChange(e)
	{
		this.sync = e.target.getAttribute("checked") == "true";
		coomanPlusCore.pref("nativesync", this.sync);
		e.stopPropagation();
		e.preventDefault();
		return false;
	},
}
var forced = false;
if ("arguments" in window && window.arguments.length > 0 && window.arguments[0] && typeof(window.arguments[0]) == "object")
{
	coomanPlus.args = window.arguments[0].wrappedJSObject;
	forced = coomanPlus.args.type == "forced";
}

if (coomanPlusCore.pref("alwaysusecmp") && !forced)
{
	gCookiesWindow.init = function(){};
	gCookiesWindow.uninit = function(){};
	coomanPlusCore.openCMP();
	window.close();
}
else
{
	window.addEventListener("load", coomanPlus.load, true);
}