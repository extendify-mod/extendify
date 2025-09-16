function o(t, e, r) {
  var o;
  return e && !Array.isArray(e) && "number" == typeof e.length ? ((o = e.length), i(e, void 0 !== r && r < o ? r : o)) : t(e, r);
}
function n(t, e) {
  return c(t) || s(t, e) || a(t, e) || r();
}
function r() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function a(t, e) {
  var r;
  if (t) return "string" == typeof t ? i(t, e) : "Map" === (r = "Object" === (r = {}.toString.call(t).slice(8, -1)) && t.constructor ? t.constructor.name : r) || "Set" === r ? Array.from(t) : "Arguments" === r || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r) ? i(t, e) : void 0;
}
function i(t, e) {
  (null == e || e > t.length) && (e = t.length);
  for (var r = 0, o = Array(e); r < e; r++) o[r] = t[r];
  return o;
}
function s(t, e) {
  var r = null == t ? null : ("undefined" != typeof Symbol && t[Symbol.iterator]) || t["@@iterator"];
  if (null != r) {
    var o,
      n,
      a,
      i,
      s = [],
      c = !0,
      l = !1;
    try {
      if (((a = (r = r.call(t)).next), 0 === e)) {
        if (Object(r) !== r) return;
        c = !1;
      } else for (; !(c = (o = a.call(r)).done) && (s.push(o.value), s.length !== e); c = !0);
    } catch (t) {
      (l = !0), (n = t);
    } finally {
      try {
        if (!c && null != r.return && ((i = r.return()), Object(i) !== i)) return;
      } finally {
        if (l) throw n;
      }
    }
    return s;
  }
}
function c(t) {
  if (Array.isArray(t)) return t;
}
function t() {
  var e = "DIAGNOSTICS_STORE_REDIRECT_RETRIES",
    r = "DIAGNOSTICS_STORE_REDIRECT_RETRIES_TIMESTAMP",
    t = "DIAGNOSTICS_STORE_REDIRECT_URL",
    l = "diagnosticsClearCache",
    u = "diagnosticsRunRedirectCheck",
    f = "diagnosticsOriginalUrl",
    h = "diagnosticsSwitchRedirectUrl";
  function o() {
    try {
      var t,
        e,
        r = g(location.href),
        o = r.has(f) ? r.get(f) : location.href;
      I(o)
        ? ((e =
            ((n = o),
            ((t = {})[f] = ""),
            (t[h] = ""),
            (t[l] = "true"),
            (t[u] = "false"),
            (a = t),
            (i = g(n)),
            Object.keys(a).forEach(function (t) {
              var e = a[t];
              e ? i.set(t, e) : i.delete(t);
            }),
            (s = S(n)),
            (n = 0 <= (c = n.indexOf("#")) ? n.slice(c) : ""),
            (c = i.toString()),
            s + (i ? "?" + c : "") + n)),
          (location.href = e))
        : console.error("[DiagnosticsBootLoader][clearBootLoaderCache] Invalid or unsafe redirect URL blocked: ", o);
    } catch (t) {
      console.error("[DiagnosticsBootLoader][clearBootLoaderCache] Failed: ", t);
    }
    var n, a, i, s, c;
  }
  function n() {
    var t = parseInt(localStorage.getItem(r));
    if (t)
      if (t + 6e4 < Date.now()) localStorage.setItem(e, "1"), localStorage.setItem(r, Date.now().toString());
      else {
        t = parseInt(localStorage.getItem(e));
        if (t) {
          if (3 < ++t) return localStorage.removeItem(e), localStorage.setItem(r, Date.now().toString()), 1;
          localStorage.setItem(e, t.toString());
        } else localStorage.setItem(e, "1");
      }
    else localStorage.setItem(e, "1"), localStorage.setItem(r, Date.now().toString());
  }
  function a() {
    return {
      has: function (t) {
        return !!this.get(t);
      },
      get: function (t) {
        if (this.queryStrParams) return this.queryStrParams[t];
      },
      set: function (t, e) {
        t && (this.queryStrParams || (this.queryStrParams = {}), (this.queryStrParams[t] = decodeURIComponent(e)));
      },
      delete: function (t) {
        this.queryStrParams && delete this.queryStrParams[t];
      },
      toString: function () {
        var e = this;
        return this.queryStrParams
          ? Object.keys(this.queryStrParams)
              .map(function (t) {
                return t + "=" + encodeURIComponent(e.queryStrParams[t]);
              })
              .join("&")
          : "";
      },
      forEach: function (e) {
        var r = this;
        e &&
          this.queryStrParams &&
          Object.keys(this.queryStrParams).forEach(function (t) {
            e(r.queryStrParams[t], t);
          });
      },
    };
  }
  function i(e, t) {
    t.split("&").forEach(function (t) {
      t = t.split("=");
      e.set(t[0], t[1] || "");
    });
  }
  function g(t) {
    if ("undefined" != typeof URLSearchParams && "undefined" != typeof URL && new URL("http://spotify.com?param=10").searchParams) return new URL(t).searchParams;
    var e = a(),
      r = t.indexOf("?");
    if (0 <= r) {
      t = t.substring(r + 1);
      if (0 < t.length)
        try {
          var o = t.split("#")[0];
          o.length && i(e, o);
        } catch (t) {
          console.error("[DiagnosticsBootLoader] Could not parse queryString parameters: ", t);
        }
    }
    return e;
  }
  function s(t) {
    var t = "undefined" != typeof URL && new URL("http://spotify.com?param=10#frag=30").hash ? new URL(t).hash.slice(1) : t.split("#")[1] || "",
      e = a();
    try {
      i(e, t);
    } catch (t) {
      console.error("[DiagnosticsBootLoader] Could not parse queryString parameters: ", t);
    }
    return e;
  }
  function c(t, e) {
    var r = a();
    return (
      t.forEach(function (t, e) {
        r.set(e, t);
      }),
      e.forEach(function (t, e) {
        r.set(e, t);
      }),
      r
    );
  }
  function S(t) {
    var e = t.indexOf("?"),
      e = 0 <= e ? t.substring(0, e) : t;
    return e.split("#")[0];
  }
  function m(t, e) {
    var r, o, n;
    I(t) ? ((n = g(t)).set(l, "false"), n.set(u, "false"), n.set(f, location.href), n.delete(h), (r = s(t)), (e = (e ? ((o = c(n, g(location.href)).toString()), c(r, s(location.href))) : ((o = n.toString()), r)).toString()), (n = S(t)), (location.href = n + (o ? "?" + o : "") + (e ? "#" + e : ""))) : console.error("[DiagnosticsBootLoader] Invalid or unsafe redirect URL blocked: ", t);
  }
  try {
    var d,
      y,
      p = g(location.href);
    p.has(h) ? ((d = p.get(h)), localStorage.setItem(t, d), n() ? o() : m(d)) : !(y = localStorage.getItem(t)) || (p.has(u) && "true" !== p.get(u)) ? p.has(l) && "true" === p.get(l) && localStorage.removeItem(t) : n() ? o() : m(y, !0);
  } catch (t) {
    console.error("[DiagnosticsBootLoader] Failed: ", t);
  }
}
var l = ["spotify.com", "scdn.co"];
function I(t) {
  var e,
    t = o(n, t.toLowerCase().trim().split("://"), 2),
    r = t[0],
    t = t[1];
  return (
    -1 !== ["http", "https"].indexOf(r) &&
    ((e = o(n, t.split("/"), 1)[0]),
    l.some(function (t) {
      return e === t || e.endsWith("." + t);
    }))
  );
}
t();
