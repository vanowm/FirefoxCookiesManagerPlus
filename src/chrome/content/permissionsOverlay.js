//not working yet

function $(id)
{
	return document.getElementById(id);
}
var log = coomanPlusCore.log;
var coomanPlus = {
	inited: false,
	template: {value: "{HOST}	{TYPE_RAW}	{CAPABILITY}	{EXPIRETIME}	{EXPIRETYPE}", extra: false},
	pm: Cc["@mozilla.org/permissionmanager;1"].getService(Ci.nsIPermissionManager),
	load: function load()
	{
		window.removeEventListener("load", coomanPlus.load, true);
		coomanPlus.init();
	},

	unload: function unload()
	{
		let os = Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);
		os.removeObserver(coomanPlus, "perm-changed", false);
	},

	init: function init()
	{
		if(this.inited)
			return;

		$("removeAllPermissions").parentNode.insertBefore($("coomanPlusButton"), $("removeAllPermissions").nextSibling);
		let os = Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);
		os.addObserver(this, "perm-changed", false);
		this.observe("", "perm-changed");
		this.inited = true;
	},

	observe: function observe(aSubject, aTopic, aData)
	{
		if (aTopic == "perm-changed")
			coomanPlus.onPermissionSelected();
	},

	onPermissionSelected: function onPermissionSelected()
	{
		let hasSelection = gPermissionManager._tree.view.selection.count > 0,
				hasRows = gPermissionManager._tree.view.rowCount > 0;
		$("backup").disabled = !hasRows;
		$("backupsel").disabled = !hasRows || !hasSelection;
	},

	openCMP: function openCMP()
	{
		coomanPlusCore.openCMP();
	},

	backup: function backup(s)
	{
		let t = new Date(),
				list = [],
				sel = [],
				permList = [],
				enumerator = this.pm.enumerator,
				file = "backup_exceptions_"
								+ t.getFullYear()
								+ coomanPlus.right("00" + t.getMonth(), 2)
								+ coomanPlus.right("00" + t.getDate(), 2)
								+ coomanPlus.right("00" + t.getHours(), 2)
								+ coomanPlus.right("00" + t.getMinutes(), 2)
								+ coomanPlus.right("00" + t.getSeconds(), 2)
								+ ".txt",
				inArray = function(array, obj)
				{
					for(let i = 0; i < array.length; i++)
						if (obj.host == array[i].host
								&& gPermissionManager._getCapabilityString(obj.capability) == array[i].capability)
							return i

					return -1;
				}
		if (s)
		{
			let selection = gPermissionManager._tree.view.selection,
					rc = selection.getRangeCount();
			permList = [];
			for (let i = 0; i < rc; ++i)
			{
				let min = {},
						max = {};

				selection.getRangeAt(i, min, max);
				for (let j = min.value; j <= max.value; ++j)
					permList.push(gPermissionManager._permissions[j]);
			}
		}
		while (enumerator.hasMoreElements())
		{
			let perm = enumerator.getNext().QueryInterface(Ci.nsIPermission);
log(perm, 2);
			perm = new this.permissionObject(perm);
			if (perm.type != "cookie" || (permList.length && inArray(permList, perm) == -1))
				continue;

			list.push(perm);
			sel.push(sel.length);
		}
log(permList, 2);
log(list, 2);
		list.sort(function(a, b)
		{
			let x = a.host.toLowerCase(),
					y = b.host.toLowerCase();
			return x < y ? -1 : x > y ? 1 : 0;
		});
		this.backupAll([sel, list], file, this.template, "\r\n#exceptions");
	}, //backup()

	restore: function restore()
	{
		let cookieObject = this.cookieObject,
				templ = [["host", "string"],
								["type", "string"],
								["capability", "int"],
								["expireTime", "int"],
								["expireType", "int"]];
		this.cookieObject = this.permissionObject;
		let file = this.restoreOpen(false, templ);
log(file,1);
		if (!file || file[0] == "canceled"
				|| (!/#exceptions/.exec(file[3])
						&& !this.confirm(this.strings.restore_warning_text, this.strings.restore_warning)))
			return;
		this.cookieObject = cookieObject;
		let success = 0,
				error = 0,
				skipped = 0;
		for(let n = 0; n < file[1].length; n++)
		{
			let aCapability = file[1][n].capability;
//chrome://browser/content/preferences/permissions.js
	    var host = file[1][n].host.replace(/^\s*([-\w]*:\/+)?/, ""); // trim any leading space and scheme
	    try {
	      var ioService = Components.classes["@mozilla.org/network/io-service;1"]
	                                .getService(Components.interfaces.nsIIOService);
	      var uri = ioService.newURI("http://"+host, null, null);
	      host = uri.host;
	    } catch(ex) {
	    	error++;
	    	continue;
	    }

	    try
	    {
	    	var capabilityString = gPermissionManager._getCapabilityString(aCapability);
	    }
	    catch(e)
	    {
	    	error++;
	    	continue;
	    }

	    // check whether the permission already exists, if not, add it
	    var exists = false;
	    for (var i = 0; i < gPermissionManager._permissions.length; ++i) {
	      if (gPermissionManager._permissions[i].rawHost == host) {
	        // Avoid calling the permission manager if the capability settings are
	        // the same. Otherwise allow the call to the permissions manager to
	        // update the listbox for us.
	        exists = gPermissionManager._permissions[i].capability == capabilityString;
	        break;
	      }
	    }

	    if (!exists) {
	      host = (host.charAt(0) == ".") ? host.substring(1,host.length) : host;
	      var uri = ioService.newURI("http://" + host, null, null);
	      try
	      {
	      	gPermissionManager._pm.add(uri, file[1][n].type, aCapability, file[1][n].expireType, file[1][n].expireTime);
		      success++;
	      }
	      catch(e)
	      {
	      	error++;
	      }
	    }
	    else
	    {
	    	skipped++
	    }
		}
		this.alert(this.strings.permissions_restored.replace("{SUCCESS}", success).replace("{SKIPPED}", skipped).replace("{ERROR}", error), this.strings.restore_complete)

	},//restore()


	permissionObject: function permissionObject(aPerm)
	{
		this.host					= aPerm.host;
		this.type					= aPerm.type;
		this.capability		= aPerm.capability;
		this.expireTime		= aPerm.expireTime;
		this.expireType		= aPerm.expireType;
	},
	permissionObject: function permissionObject(aPerm)
	{
		this.host					= aPerm.principal.origin;
		this.type					= aPerm.type;
		this.capability		= aPerm.capability;
		this.expireTime		= aPerm.expireTime;
		this.expireType		= aPerm.expireType;
	}
}
window.addEventListener("load", coomanPlus.load, true);
window.addEventListener("unload", coomanPlus.unload, true);
