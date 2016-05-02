log.debug("libOut.js loaded");
coomanPlus.log = log;
coomanPlus.debug = log.debug;
function _bench(c, s)
{
	let t = (new Date()).getTime();
	if (c && _bench.time)
	{
		let t2 = _bench.time;
		if (!s)
			_bench.time = t;

		log(c + " " + _bench.sec(t - t2) + " (" + _bench.sec(t - _bench.timeBegin) + ")");
		return;
	}
	_bench.time = t;
	_bench.timeBegin = t;
	log("begin bench");
}
_bench.sec = function(tms)
{
	let min = Math.floor(tms / 60000),
			sec = Math.floor(tms / 1000) - min * 60,
			ms = tms - (min * 60 + sec) * 1000;
	return (min ? min + ":" : "") + sec + "." + ms;
}