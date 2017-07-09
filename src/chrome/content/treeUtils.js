coomanPlus.getTreeSelections = function getTreeSelections(tree)
{
	var selections = [];
	var select;

	try
	{
		if (tree.treeBoxObject.view && tree.treeBoxObject.view.selection)
			select = tree.treeBoxObject.view.selection;
	}
	catch(e){};


	if (select)
	{
		let count = select.getRangeCount(),
				min = new Object(),
				max = new Object();
		for (let i = 0; i < count; i++)
		{
			select.getRangeAt(i, min, max);
			for (let k = min.value; k <= max.value; k++)
			{
				if (k != -1)
					selections[selections.length] = k;
			}
		}
	}
	return selections;
}

coomanPlus.fixColumnName = function fixColumnName(c)
{
	if (this._cookies.length > 0 && !c in this._cookies[0])
		c = this.defaultSort;

	return c;
}
coomanPlus.defaultSort = "rawHost";
coomanPlus.sortTreeData = function sortTreeData(tree, table, columnName)
{
log.debug("sort begin");
	let order = tree.getAttribute("sortDirection") == "ascending",
			column = tree.getAttribute("sortResource") || this.defaultSort;

	column = this.fixColumnName(column);

	if (column == columnName)
		order = !order;

	if (columnName)
	{
		column = columnName;
	}
	if (!$(column))
		column = this.defaultSort;

	tree.setAttribute("sortResource", column);
	tree.setAttribute("sortDirection", order ? "ascending" : "descending");

	// do the sort or re-sort
	let h = coomanPlus.prefSimpleHost > 0 && column == "rawHost" ? (coomanPlus.prefSimpleHost == 1 ? "simpleHost" : "rootHost") : column,
			f = column == "expiresString" ? "expires" : h.replace(/String$/, "");

	if (f == "originAttributes")
		f = "originAttributesText";

//log.debug([f, h]);
	function compareFunc(a, b)
	{
		let r;
		if (typeof(a[f]) == "string")
			r = a[f].toLowerCase().localeCompare(b[f].toLowerCase());
//			r = a[f].toLowerCase().localeCompare(b[f].toLowerCase(), undefined, {ignorePunctuation: true});
		else if (f == "readonly")
		{
			let _a = a[f] ? true : false,
					_b = b[f] ? true : false;
			r = (_a > _b) - (_a < _b);
		}
		else
		{
			r = (a[f] > b[f]) - (a[f] < b[f]);
		}

		if (!r)
		{
			let alt = [(column == "rawHost" ?  (coomanPlus.prefSimpleHost > 0 ? "rawHost" : "name") : "name"), "name", "path", "value", "originAttributesText"];
			for(let i = 0; i < alt.length; i++)
			{
				r = a[alt[i]].toLowerCase().localeCompare(b[alt[i]].toLowerCase());
//				r = a[alt[i]].toLowerCase().localeCompare(b[alt[i]].toLowerCase(), undefined, {ignorePunctuation: true});
				if (r)
					break;
			}
		}
//log([r, a[f], b[f]], 1);
		return r;
	}
	table.sort(compareFunc);
	for(let i = 0; i < table.length; i++)
	{
//		table[i].index = i;
	}
	
	if (!order)
		table.reverse();

	let cols = tree.getElementsByTagName("treecol");
	for (let i = 0; i < cols.length; i++)
	{
		cols[i].removeAttribute("sortDirection");
	}
	document.getElementById(column).setAttribute("sortDirection", order ? "ascending" : "descending");
log.debug("sort end", 1);
}
coomanPlus.sortTree = function sortTree(tree, table, columnName)
{
	this.sortTreeData(tree, table, columnName);

	// display the results
//	tree.treeBoxObject.invalidate();
	tree.treeBoxObject.invalidateRange(tree.treeBoxObject.getFirstVisibleRow(), tree.treeBoxObject.getLastVisibleRow());
}

