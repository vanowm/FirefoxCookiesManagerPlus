function $(id)
{
	return document.getElementById(id);
}
var _args = "arguments" in window && window.arguments.length ? window.arguments[0] : {},
		args = {},
coomanPlus = {
	load: function load()
	{
		coomanPlus.init();
	},//load()

	action: function action(button)
	{
		args.button = button;
		if (button)
		{
			let list = {};
			for(let c in this.treeView.childData)
			{
				let children = this.treeView.childData[c];
				if (c != "pref")
					list[c] = {};

				for(let i = 0; i < children.length; i++)
				{
					if (children[i].sel != 2)
						continue;

					if (c == "pref")
						list[children[i].id] = children[i]._value;
					else
						list[c][children[i].id] = children[i]._value;
				}
				if (c != "pref" && JSON.stringify(list[c]) == "{}")
					delete list[c];
			}
			for(let i in args.data)
			{
				if (!(i in list))
					delete args.data[i];
			}
		}
	},//action()

	unload: function unload()
	{
		$("tree").removeEventListener("keypress", this.treeKeypress, true);
		$("tree").removeEventListener("click", this.treeClick, true);
		window.close();
	},//unload()

	init: function init()
	{
		if (!args.data)
			return this.unload();

		this.buildList(args.data, "pref", 0);
		$("tree").view = this.treeView;
		for(let i = this.treeView.visibleData.length - 1; i >= 0; i--)
		{
			this.treeView.toggleOpenState(i);
		}
		$("tree").addEventListener("keypress", this.treeKeypress, true);
		$("tree").addEventListener("click", this.treeClick, true);
		this.selColumn();

	},//init()

	treeClick: function treeClick(e)
	{
		if (e.type == "click" && e.target.id == "sel")
		{
log.debug();
			coomanPlus.selectAllToggle(e.button);
			return;
		}
	},
	selectAllToggle: function selectAllToggle(button)
	{
log.debug();
		if (button == 2)
			return this.invertSelection();

		if (button)
			return;

		let list = this.treeView.visibleData,
				state = 0;

		for(let i = 0; i < list.length; i++)
		{
			state |= list[i].sel;
			if (state > 2)
				break;
		}
		if (state > 2)
			state = 1;

		state  ^= 3;
		for (let i = 0; i < list.length; i++)
		{
			if (list[i].container)
			{
				if (list[i].opened)
					continue;
				let children = this.treeView.childData[list[i].id];
				for(let c = 0; c < children.length; c++)
					children[c].sel = state;
			}

			list[i].sel = state;
		}

		this.treeView.treeBox.invalidateRange(this.treeView.treeBox.getFirstVisibleRow(), this.treeView.treeBox.getLastVisibleRow())
		this.selColumn();
	},//selectAllToggle()

	invertSelection: function invertSelection()
	{
log.debug();
		let list = this.treeView.visibleData;

		for (let i = 0; i < list.length; i++)
		{
			if (list[i].container)
			{
				if (list[i].opened)
					continue;

				let children = this.treeView.childData[list[i].id];
				for(let c = 0; c < children.length; c++)
					children[c].sel ^= 3;
			}

			list[i].sel ^= 3;
		}
		this.treeView.treeBox.invalidateRange(this.treeView.treeBox.getFirstVisibleRow(), this.treeView.treeBox.getLastVisibleRow());
		this.selColumn();
	},//invertSelection()

	selColumn: function selColumn()
	{
		let list = this.treeView.childData;
				state = 0;

		for (let c in list)
		{
			for (let i = 0; i < list[c].length; i++)
			{
				state |= list[c][i].sel;
				if (state > 2)
					break;
			}
		}
		$("sel").setAttribute("checked", state);
	},//selColumn()

	treeKeypress: function treeKeypress(e)
	{
		if (e.charCode == e.DOM_VK_SPACE)
		{
			let self = coomanPlus,
					sel = self.getTreeSelections($("tree")),
					idx = self.treeView.selection.currentIndex,
					list = self.treeView.visibleData,
					state = self.treeView.getCheckboxState(list[idx]);
			if (state > 2)
				state = 2;
			else
				state ^= 3;

			for(let i = 0; i < sel.length; i++)
			{
				list[sel[i]].sel = state;
			}
			self.treeView.treeBox.invalidateRange(self.treeView.treeBox.getFirstVisibleRow(),self.treeView.treeBox.getLastVisibleRow())
		}
	},//treeKeypress()

	buildList: function buildList(data, id, objName)
	{
		let obj = $("main");
		if (!obj)
			return;

		this.treeView.visibleData.push({
			name: this.strings["optionsRestore_" + id] || id,
			id: id,
			value: "",
			objName: objName,
			container: true,
			opened: false,
			sel: 2
		})

		for(let i in data)
		{

			if (data[i] && typeof(data[i]) == "object")
			{
				if (i == "persist")
				{
					this.buildList(data[i], i);
					continue;
				}
			}
			let value = typeof(data[i]) == "object" && data[i].constructor.name != "Array" ? null : data[i];

			if (typeof(this.treeView.childData[id]) == "undefined")
				this.treeView.childData[id] = [];

			this.treeView.childData[id].push({
				name: this.strings["optionsRestore_" + i] || i,
				id: i,
				value: value,
				parent: id,
				_value: data[i],
				sel: 2
			})
		}
		for(let c in this.treeView.childData)
		{
			let list = this.treeView.childData[c];
			list.sort(function(a,b)
			{
				return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
			})
		}
		this.selColumn();
	},//buildList()

	treeView: {
		childData : {
		},

		visibleData : [
		],

		treeBox: null,
		selection: null,

		get rowCount()                     { return this.visibleData.length; },
		setTree: function(treeBox)         { this.treeBox = treeBox; },
		getCellText: function(row, col)
		{
			if (col.id != "sel")
				return this.visibleData[row][col.id];
		},
		isContainer: function(row)         { return this.visibleData[row].container; },
		isContainerOpen: function(row)     { return this.visibleData[row].opened; },
		isContainerEmpty: function(row)    { return false; },
		isSeparator: function(row)         { return false; },
		isSorted: function()               { return false; },
		isEditable: function(row, col)  { return col.id == "sel"; },

		getParentIndex: function(row) {
			if (this.isContainer(row)) return -1;
			for (let t = row - 1; t >= 0 ; t--) {
				if (this.isContainer(t)) return t;
			}
		},
		getLevel: function(row) {
			if (this.isContainer(row)) return 0;
			return 1;
		},
		hasNextSibling: function(row, after) {
			let thisLevel = this.getLevel(row);
			for (let t = after + 1; t < this.visibleData.length; t++) {
				var nextLevel = this.getLevel(t);
				if (nextLevel == thisLevel) return true;
				if (nextLevel < thisLevel) break;
			}
			return false;
		},
		toggleOpenState: function(row) {
			let item = this.visibleData[row];
			if (!item.container)
				return;

			if (item.opened) {
				item.opened = false;

				let thisLevel = this.getLevel(row),
						deletecount = 0;

				for (let t = row + 1; t < this.visibleData.length; t++)
				{
					if (this.getLevel(t) > thisLevel)
						deletecount++;
					else
						break;
				}
				if (deletecount)
				{
					this.visibleData.splice(row + 1, deletecount);
					this.treeBox.rowCountChanged(row + 1, -deletecount);
				}
			}
			else {
				item.opened = true;

				let label = this.visibleData[row].name,
						toinsert = this.childData[this.visibleData[row].id];

				for (let i = 0; i < toinsert.length; i++)
				{
					this.visibleData.splice(row + i + 1, 0, toinsert[i]);
					toinsert[i].row = row + i + 1;
				}
				this.treeBox.rowCountChanged(row + 1, toinsert.length);
			}
			this.treeBox.invalidateRow(row);
		},

		getImageSrc: function(row, col) {},
		getProgressMode : function(row,col) {},
		getCellValue: function(row, col){},
		setCellValue: function(row, col, val )
		{
			let state = this.getCheckboxState(this.visibleData[row]);
			if (state == 3)
				state = 2;
			else
				state ^= 3;

			if (this.visibleData[row].container)
			{
				let children = this.childData[this.visibleData[row].id];
				for(let i = 0; i < children.length; i++)
					children[i].sel = state;

			}

			this.visibleData[row][col.id] = state;
			coomanPlus.selColumn();
		},
		cycleHeader: function(col, elem) {},
		cycleCell: function(row, col) {},
		performAction: function(action) {},
		performActionOnCell: function(action, index, col){},
		getRowProperties: function(row, props) {},
		getCheckboxState: function(obj)
		{
			let state = 0;
			if (obj.container)
			{
				let children = this.childData[obj.id];
				for(let i = 0; i < children.length; i++)
				{
					state |= children[i].sel;
					if (state > 2)
						break;
				}
			}
			else
				state = obj.sel;

			return state;
		},
		getCellProperties: function(row, col, props)
		{
			let old = typeof(props) != "undefined",
					aserv;

			let state = 0;
			if (col.id == "sel")
				state = this.getCheckboxState(this.visibleData[row]);

			if (old)
			{
				aserv = Cc["@mozilla.org/atom-service;1"].getService(Ci.nsIAtomService);

				if (col.id == "sel")
					props.AppendElement(aserv.getAtom("checked" + state));
			}
			else
			{
				props = "";
				if (col.id == "sel")
					props += " checked" + state;
			}
			return props;
		},
		getColumnProperties: function(col, element, props) {},
},
}//coomanPlus
if (typeof(_args) == "object" && _args.wrappedJSObject)
	args = _args.wrappedJSObject;

delete _args;

