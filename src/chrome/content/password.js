Components.utils.import("resource://cookiesmanagerplus/coomanPlusCore.jsm");
coomanPlusCore.lastKeyDown = [];

function $(id)
{
	return document.getElementById(id);
}

var coomanPlus = {
	_cmpWindow: null,
	_params: null,

	load: function()
	{
		coomanPlus.init();
	},

	init: function()
	{
		this._params = window.arguments[0];
		this._cmpWindow = coomanPlusCore.cmpWindow;
		coomanPlusCore.cmpWindow = window;

		if (this._params.title)
			document.title = this._params.title;

//let fails in FF15???
		var file = $("file");
		file.parentNode.collapsed = !this._params.file;
		file.value = this._params.file;
		file.tooltipText = this._params.file;
		$("msg").value = this._params.msg;
		$("msg").collapsed = !this._params.msg;

		$("password").focus();
		if (!this._params.newPass)
		{
			$("pass2").collapsed = true;
			$("msg.warning").collapsed = true;
		}
		$("msg.info").collapsed = !this._params.newPass || this._params.set ? true : false;
		let observer = new MutationObserver(function()
		{
			coomanPlus.check()
		});
		observer.observe($("password"), {attributes: true, attributeFilter:["show"]});
		this.check();
	},

	check: function()
	{
//		document.documentElement.getButton("accept").disabled = (this._params.newPass && $("password").value != $("password2").value)
		document.documentElement.getButton("accept").disabled = ((!this._params.newPass && $("password").value === "")
																															|| (this._params.newPass
//																																	&& $("password").getAttribute("show") != "true"
																																	&& $("password").value != $("password2").value))
		$("password2").disabled = $("password").value === "";
	},

	action: function(b)
	{
		coomanPlusCore.cmpWindow = this._cmpWindow;

		if (b)
			this._params.return = $("password").value;

		window.close();
	}
}
