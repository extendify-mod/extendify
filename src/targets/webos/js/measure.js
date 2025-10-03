(function (e) {
  var r = Date.now ? Date.now() : +new Date();
  var n = e.performance || {};
  var o = [];
  var t = {};
  var a = function e(r, n) {
    var t = 0;
    var a = o.length;
    var i = [];
    for (; t < a; t++) {
      if (o[t][r] === n) {
        i.push(o[t]);
      }
    }
    return i;
  };
  var i = function e(r, n) {
    var t = o.length;
    var a;
    while (t--) {
      a = o[t];
      if (a.entryType === r && (n === void 0 || a.name === n)) {
        o.splice(t, 1);
      }
    }
  };
  if (!n.now) {
    n.now =
      n.webkitNow ||
      n.mozNow ||
      n.msNow ||
      function () {
        return (Date.now ? Date.now() : +new Date()) - r;
      };
  }
  if (!n.mark) {
    n.mark =
      n.webkitMark ||
      function (e) {
        var r = { name: e, entryType: "mark", startTime: n.now(), duration: 0 };
        o.push(r);
        t[e] = r;
      };
  }
  if (!n.measure) {
    n.measure =
      n.webkitMeasure ||
      function (e, r, n) {
        r = t[r].startTime;
        n = t[n].startTime;
        o.push({ name: e, entryType: "measure", startTime: r, duration: n - r });
      };
  }
  if (!n.getEntriesByType) {
    n.getEntriesByType =
      n.webkitGetEntriesByType ||
      function (e) {
        return a("entryType", e);
      };
  }
  if (!n.getEntriesByName) {
    n.getEntriesByName =
      n.webkitGetEntriesByName ||
      function (e) {
        return a("name", e);
      };
  }
  if (!n.clearMarks) {
    n.clearMarks =
      n.webkitClearMarks ||
      function (e) {
        i("mark", e);
      };
  }
  if (!n.clearMeasures) {
    n.clearMeasures =
      n.webkitClearMeasures ||
      function (e) {
        i("measure", e);
      };
  }
  e.performance = n;
  if (typeof define === "function" && (define.amd || define.ajs)) {
    define("performance", [], function () {
      return n;
    });
  }
  if (typeof module === "object" && module.exports) {
    module.exports = n;
  }
})(window);
