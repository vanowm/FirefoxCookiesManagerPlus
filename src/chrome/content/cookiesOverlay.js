var coomanPlus = {
	_cw: null,
	args: null,
	sync: false,
	noFuncInit: true,
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
		document.getElementById("cookiesList").addEventListener("select", this._selected, true);
		document.getElementById("cookiesList").addEventListener("click", this._click, true);
		this.sync = coomanPlusCore.pref("nativesync")
		document.getElementById("cmpSync").setAttribute("checked", this.sync);

	},

	openCMP: function openCMP()
	{
		coomanPlusCore.openCMP();
	},

	_click: function _click(e)
	{
		if ((!e.button && e.detail != 2) && e.button != 2)
			return;

		let _cw = coomanPlus._cw,
				seln = _cw._tree.view.selection,
				item,
				cookies;
		if (!_cw._view._filtered)
			item = _cw._view._getItemAtIndex(seln.currentIndex);
		else
			item = _cw._view._filterSet[seln.currentIndex];

		if (item.container)
		{
			if (!e.button)
				return;
			
			cookies = item.cookies;
		}
		else
			cookies = [item];
		coomanPlus.openEdit({type: "edit", cookies: cookies, callback:function(list)
		{
			let i = 0,
					aCookie,
					_openIndices = [],
					_lastSelectedRanges = [];
			gCookiesWindow._saveState();
			for(let i = 0; i < gCookiesWindow._lastSelectedRanges.length; i++)
				_lastSelectedRanges.push(gCookiesWindow._lastSelectedRanges[i]);

			for(let i = 0; i < gCookiesWindow._openIndices.length; i++)
				_openIndices.push(gCookiesWindow._openIndices[i]);
			gCookiesWindow._lastSortProperty = "";//disable change order
			gCookiesWindow._populateList(true);
	    // Restore open state
	    for (let i = 0; i < _openIndices.length; ++i)
	      gCookiesWindow._view.toggleOpenState(_openIndices[i]);

    // Restore selection
    gCookiesWindow._view.selection.clearSelection();
    for (let i = 0; i < _lastSelectedRanges.length; ++i) {
      var range = _lastSelectedRanges[i];
      gCookiesWindow._view.selection.rangedSelect(range.min, range.max, true);
    }
	 		let selection = gCookiesWindow._tree.view.selection;
			while(aCookie = list[i++])
			{
//				selection.rangedSelect(
//					gCookiesWindow.onCookieSelected();
			}
		}});
		e.stopPropagation();
		e.preventDefault();
		return false;
	},

	_selected: function _selected(e)
	{
		var args = coomanPlus.args;
//		if (!args || !coomanPlusCore.cmpWindow || !coomanPlus.sync || !("coomanPlus" in coomanPlusCore.cmpWindow))
		if (!coomanPlusCore.cmpWindow || !coomanPlus.sync || !("coomanPlus" in coomanPlusCore.cmpWindow))
			return;
		var cmp = coomanPlusCore.cmpWindow.coomanPlus;
		var _cw = coomanPlus._cw;
		var seln = _cw._tree.view.selection;
		var item;
		if (!_cw._view._filtered)
			item = _cw._view._getItemAtIndex(seln.currentIndex);
		else
			item = _cw._view._filterSet[seln.currentIndex];

		if (!item)
			return;

		if (item.container)
			cmp._selected = item.cookies;
		else
			cmp._selected = [item];

		cmp.selectLastCookie();
		var s = cmp.getTreeSelections(cmp._cookiesTree);
		var f = cmp._cookiesTree.treeBoxObject.getFirstVisibleRow();
		var l = cmp._cookiesTree.treeBoxObject.getLastVisibleRow();
		for(var i = 0; i < s.length; i++)
			if (s[i] < f || s[i] > l)
			{
				var p = cmp._cookies.length - cmp._cookiesTree.treeBoxObject.getPageLength();
				if (s[0] > p)
					s[0] = p;

				cmp._cookiesTree.treeBoxObject.scrollToRow(s[0]);
				break;
			}
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
	forced = coomanPlus.args && coomanPlus.args.type == "forced";
}
if (coomanPlusCore.pref("alwaysusecmp") && !forced)
{
	gCookiesWindow.init = function(){};
	gCookiesWindow.uninit = function(){};
	coomanPlusCore.openCMP();
	let i = 3000;
	function winClose()
	{
		if (i-- && !window.closed)
		{
			window.close();
			try
			{
				coomanPlusCore.async(winClose);
			}catch(e){}
		}
	}
	winClose();
}
else
{
	window.addEventListener("load", coomanPlus.load, true);
}