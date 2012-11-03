(function(global, document, isArray, isNodeList) {
	'use strict';

	var NS = "tt",
        querySelectorRe = /^(.+[\#\.\s\[>:]|[\[:])/,
        loaded = false,
        queue = [];

    // Object.keys - MDN https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Object/keys#Compatiblity
    Object.keys || (Object.keys = function(){var e=Object.prototype.hasOwnProperty,f=!{toString:null}.propertyIsEnumerable("toString"),c="toString toLocaleString valueOf hasOwnProperty isPrototypeOf propertyIsEnumerable constructor".split(" "),g=c.length;return function(b){if("object"!==typeof b&&"function"!==typeof b||null===b)throw new TypeError("Object.keys called on non-object");var d=[],a;for(a in b)e.call(b,a)&&d.push(a);if(f)for(a=0;a<g;a++)e.call(b,c[a])&&d.push(c[a]);return d}}());

    document.addEventListener("DOMContentLoaded", function() {
        var i = 0, iz = queue.length;

        loaded = true;
        for (; i < iz; ++i) {
            queue[i]();
        }
    }, false);

	function tt(mix, parent) {
        var target = null;

        if (typeof mix === "string") {
            parent = parent || document;
            target = querySelectorRe.test(mix) ?
                        parent.querySelectorAll(mix) :
                     mix[0] === "#" ?
                        parent.getElementById(mix.substring(1, mix.length)) :
                     mix[0] === "." ?
                        parent.getElementsByClassName(mix.substring(1, mix.length)) :
                        parent.getElementsByTagName(mix);
        } else if (mix && (mix.nodeType === 1 || isNodeList(mix))) {
            target = mix;
        } else if (mix instanceof TT) {
            return mix;
        } else if (typeof mix === "function") {
            loaded ? mix() : queue.push(mix);
            return;
        }
        return new TT(target);
	}

    /**
     *
     * tt("pluginName", function() { // @arg this Object: ttObject
     *      // do something
     *      return this; // if you want continue prototype chain, must always return "this"
     * });
     *
     * tt("", {});
     * @throw Error: arguments error
     */
    tt.plugin = function(name, fn) {
        if (!TT.prototype[name] ||
            typeof name !== "string" ||
            typeof fn !== "function" ||
            name.length === 0) {

            throw new Error("arguments error");
        }
        TT.prototype[name] = fn;
    }

    /**
     *
     * tt.isArray([]);
     * @return true
     *
     * tt.isArray(document.querySelectorAll(".hoge"));
     * @return false
     */
    tt.isArray = isArray;

    /**
     *
     * tt.isArray(document.querySelectorAll(".hoge"));
     * @return true
     *
     * tt.isNodeList([]);
     * @return false
     */
    tt.isNodeList = isNodeList;

    /**
     *
     * tt.each([1, 2, 3], function(value,   // @arg mix:    array value
     *                             index) { // @arg Number: array index
     *      // do something
     * });
     */
    tt.each = function(arr, fn) {
        var i = 0, iz = arr.length;

        for (; i < iz; ++i) {
            fn(arr[i], i);
        }
    }

    /**
     *
     * tt.match([1, 2, 3], function(value,   // @arg mix:    array value
     *                              index) { // @arg Number: array index
     *      if (value === 3) {
     *          return true;
     *      }
     *      return false;
     * });
     * @return Number: 3
     */
    tt.match = function(arr, fn) {
        var i = 0, iz = arr.length;

        for (; i < iz; ++i) {
            if (fn(arr[i], i)) {
                return arr[i];
            }
        }
        return null;
    }

    /**
     * var obj01 = { 0: "hoge", 1: "fuga" };
     * var obj02 = { 1: "piyo", 2: "foo" };
     *
     * tt.extend(obj01, obj02);
     * @return { 0: "hoge", 1: "piyo", 2: "foo" }
     */
    tt.extend = function() {
        var arg, args = [].slice.call(arguments),
            result = {},
            i = 0, iz = args.length,
            k = 0, kz, key, keys;

        for (; i < iz; ++i) {
            arg = args[i];
            if (!arg || typeof arg !== "object") {
                continue;
            }
            keys = Object.keys(arg);
            kz = keys.length;
            for (; k < kz; ++k) {
                key = keys[k];
                result[key] = arg[key];
            }
        }
        return result;
    };

    /**
     * pull request from kyo-ago (twitter@kyo_ago)
     *
     * tt.query2object("hoge=huga&foo=bar");
     * @reutrn Object: { 'hoge' : 'huga', 'foo' : 'bar' }
     */
    tt.query2object = function(hash) {
        if (!hash) {
            return {};
        }
        var result = {},
            pair = hash.split('&'),
            i = 0, iz = pair.length;

        for (; i < iz; ++i) {
            var k_v = pair[i].split('=');

            result[k_v[0]] = k_v[1];
        }
        return result;
    };

    /**
     * pull request from kyo-ago (twitter@kyo_ago)
     *
     * tt.param({"hoge": "huga", "foo&bar": "kiyo&piyo"});
     * @reutrn String: "hoge=huga&foo%26bar=kiyo%26piyo"
     */
    tt.param = function(obj) {
        var key, keys = Object.keys(obj),
            i = 0, iz = keys.length,
            results = [];

        for (;i < iz; ++i) {
            key = keys[i];
            results.push(encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]));
        }
        return results.join('&');
    };

    /**
     * pull request from kyo-ago (twitter@kyo_ago)
     *
     * tt.triggerEvent(HTMLElement, "Event", "originalEvent", false, true);
     * @effect firing "originalEvent" to HTMLElement
     */
    tt.triggerEvent = function(node, event, type, bubbles, cancelable) {
        if (!node) {
            return;
        }
        if (!event) {
            throw new Error('require event name');
        }
        if ('string' !== typeof type) {
            type = event;
            event = type === 'click' ? 'MouseEvents' : 'Event';
        }
        var ev = document.createEvent(event);

        ev.initEvent(type, bubbles || true, cancelable || true);
        node.dispatchEvent(ev);
    };

    /**
     *
     * tt.cssPrefix("box");
     * @return ["-webkit-box", "-moz-box", "-o-box", "-ms-box"];
     */
    tt.cssPrefix = function(value, prefix) {
        var res = [];

        prefix = prefix || ["webkit", "moz", "o", "ms"];
        tt.each(function(str, index) {
            res[index] = "-" + str + "-" + value;
        });
        return res;
    };

    /**
     *
     * tt(navigator);
     * @return {android: bool, ios: bool .., }
     */
    tt.createEnvData = function(navigator) {
        var res = {},
            ua = navigator.userAgent.toLowerCase();

        res.android = /android/.test(ua);
        res.ios = /ip(hone|od|ad)/.test(ua);
        res.windowsPhone = /windows\sphone/.test(ua);
        res.chrome = /chrome/.test(ua);
        res.firefox = /firefox/.test(ua);
        res.opera = /opera/.test(ua);
        res.ie = /msie/.test(ua);
        res.androidBrowser = res.android && /applewebkit/.test(ua);
        res.mobileSafari = res.ios && /applewebkit/.test(ua);
        res.other = !(res.androidBrowser || res.mobileSafari || res.chrome || res.firefox || res.opera || res.ie);
        res.version =
            (res.androidBrowser || res.chrome) ? ua.match(/android\s(\S.*?)\;/) :
            res.mobileSafari ? ua.match(/os\s(\S.*?)\s/) :
            null;
        res.version = res.version && res.version[1];
        res.versionCode = _getVersionCode(res.version);

        return res;

        function _getVersionCode(version) {
            if (!version) {
                return null;
            }
            var res, digit = 4, diff = 0;

            version = version.replace(/\D/g, "");
            diff = digit - version.length;

            if (diff > 0) {
                res = (+version) * Math.pow(10, diff);
            } else if (diff < 0) {
                res = +(version.substr(0, digit));
            } else {
                res = +version;
            }
            return res;
        }
    }

    /**
     *
     * createEnvData() result object
     */
    tt.env = tt.createEnvData(global.navigator);


    function TT(node) {
        var i = 0, iz;

        this.nodes = [];
        this.stash = {};
        this.length = 0;
        if (node) {
            if (node.nodeType) {
                this.nodes[0] = node;
                this.length = 1;
            } else {
                iz = this.length = node.length;
                for (; i < iz; ++i) {
                    this.nodes[i] = node[i];
                }
            }
        }
        return this;
    }

    TT.prototype = {
        constructor: TT,

        /**
         * <div id="first" class="hoge"></div>
         * <div id="second" class="hoge"></div>
         *
         * tt(".hoge").get();
         * @return HTMLDivElement: div#first
         *
         * tt(".hoge").get(1);
         * @return HTMLDivElement: div#second
         */
        get: function(index) {
            return this.nodes[index || 0];
        },

        /**
         * <div class="hoge"></div>
         * <div class="hoge"></div>
         *
         *  tt(".hoge").toArray();
         *  @return Array: [HTMLDivElement, HTMLDivElement] (nodeList like array)
         */
        toArray: function() {
            return this.nodes;
        },

        /**
         * <div class="hoge"></div>
         *
         * tt(".hoge").each(function(node,    // HTMLElement: search result element
         *                           index) { // Number:      array index
         *      // do something
         * });
         * @return Object: ttObject
         */
        each: function(fn) {
            var i = 0, iz = this.length;

            for (; i < iz; ++i) {
                fn(this.nodes[i], i);
            }
            return this;
        },

        /**
         * <div class="hoge"></div>
         *
         * tt(".hoge").match(function(node,    // HTMLElement: search result element
         *                            index) { // Number:      array index
         *      if (node === something) {
         *          return true;
         *      }
         *      return false;
         * });
         * @return HTMLElement: something to match element
         */
        match: function(fn) {
            var i = 0, iz = this.length;

            for (; i < iz; ++i) {
                if (fn(this.nodes[i], i)) {
                    return this.nodes[i];
                }
            }
            return null;
        },

        /**
         * <div class="hoge"></div>
         *
         * tt(".hoge").on("click", function(event) {}, useCapture);
         * @return Object: ttObject
         */
        on: function(type, mix, capture) {
            this.each(function(node) {
                node.addEventListener(type, mix, capture);
            }, true);
            return this;
        },

        /**
         * <div class="hoge"></div>
         *
         * tt(".hoge").off("click", eventFunction);
         * @return Object: ttObject
         */
        off: function(type, mix) {
            this.each(function(node) {
                node.removeEventListener(type, mix);
            }, true);
            return this;
        },

        /**
         * <div class="hoge"></div>
         *
         * tt(".hoge").addClass("fuga");
         * @effect <div class="hoge fuga"></div>
         * @return Object: ttObject
         */
        addClass:
            ((tt.env.android && tt.env.versionCode < 3000) ||
             (tt.env.ios && tt.env.versionCode < 5000) ||
             (tt.env.opera)) ?
                _addClassByClassName :
                _addClassByClassList,

        /**
         * <div class="hoge fuga"></div>
         *
         * tt(".hoge").removeClass("fuga");
         * @effect <div class="hoge"></div>
         * @return Object: ttObject
         */
        removeClass:
            ((tt.env.android && tt.env.versionCode < 3000) ||
             (tt.env.ios && tt.env.versionCode < 5000) ||
             (tt.env.opera)) ?
                _removeClassByClassName :
                _removeClassByClassList,

        /**
         * <div class="hoge"></div>
         *
         * tt(".hoge").hasClass("hoge");
         * @return Bool: true
         */
        hasClass:
            ((tt.env.android && tt.env.versionCode < 3000) ||
             (tt.env.ios && tt.env.versionCode < 5000) ||
             (tt.env.opera)) ?
                _hasClassByClassName :
                _hasClassByClassList,

        /**
         * <div class="hoge"></div>
         *
         * tt(".hoge").toggleClass("hoge");
         * @effect <div class=""></div>
         * @return Object: ttObject
         *
         * tt(".hoge").toggleClass("fuga");
         * @effect <div class="hoge fuga"></div>
         */
        toggleClass: function(className, strict) {
            var self = this;

            strict ? _strictToggle() : _simpleToggle();
            return this;

            function _strictToggle() {
                self.each(function(node) {
                    var ttObj = tt(node);

                    node.className.search(className) >= 0 ?
                    ttObj.removeClass(className) :
                    ttObj.addClass(className);
                });
            }

            function _simpleToggle() {
                if (self.nodes[0].className.search(className) >= 0) {
                    self.removeClass(className);
                } else {
                    self.addClass(className);
                }
            }
        },

        /**
         *
         * ## sample
         * <div hoge="fuga"></div>
         *
         * tt("div").attr("hoge");
         * @return "fuga"
         *
         * tt("div").attr("hoge", "piyo");
         * @effect <div hoge="piyo"></div>
         * @return this
         *
         * tt("div").attr("hoge", "");
         * @effect <div></div>
         * @return this
         */
        attr: function(key, value) {
            value = value || "";
            this.each(function(node) {
                if (value === "") {
                    node.removeAttribute(key);
                    return;
                }
                node.setAttribute(key, value);
            });
            return this;
        },

        /**
         *
         * <div class="hoge">anything</div>
         *
         * tt(".hoge").html("something");
         * @effect <div class="hoge">something</div>
         *
         * tt(".hoge").html("something", "afterend");
         * @effect <div class="hoge">anything</div>something
         *
         * tt(".hoge").html(HTMLDivElement);
         * @effect <div class="hoge"><div></div></div>
         * @see    ttObject.add
         */
        html: function(mix) {
            if (mix && mix.nodeType) {
                this.each(function(node) {
                    _clearNode(node);
                    node.appendChild(mix);
                });
                return this;
            }

            this.each(function(node) {
                _clearNode(node);
                node.insertAdjacentHTML("beforeend", mix);
            });
            return this;

            function _clearNode(node) {
                while (node.firstChild) {
                    node.removeChild(node.firstChild);
                }
            }
        },

        /**
         *
         * <div class="hoge"></div>
         *
         * tt(".hoge").add(HTMLDivElement);
         * @effect <div class="hoge"><div></div></div>
         */
        add: function(mix) {
            if (typeof mix === "string") {
                this.each(function(node) {
                    node.insertAdjacentHTML("beforeend", mix);
                });
                return this;
            }

            this.each(function(node) {
                node.appendmix(mix);
            });
            return this;
        },

        /**
         *
         * <div class="hoge"><div class="fuga"></div></div>
         *
         * tt(".fuga").remove();
         * @effect <div class="hoge"></div>
         */
        remove: function() {
            this.each(function(node) {
                node.parentNode.removeChild(node);
            });
            return this;
        },

        /**
         *
         * <div class="hoge">something</div>
         *
         * tt(".fuga").clear();
         * @effect <div class="hoge"></div>
         */
        clear: function() {
            this.each(function(node) {
                while (node.firstChild) {
                    node.removeChild(node.firstChild);
                }
            });
            return this;
        },

        /**
         *
         * <div class="hoge" style="display:block;"></div>
         *
         * tt(".hoge").css("display");
         * @return String: "none" CSS value
         *
         * tt(".hoge").css("display", "none");
         * @effect <div class="hoge" style="display:none;"></div>
         *
         * tt(".hoge").css({ "display": "none", "visibility": "hidden" [, "CSS property": "CSS value"] });
         * @effect <div class="hoge" style="display:none;visibility:hidden;"></div>
         */
        css: function(mix, value) {
            var prop, val,
                self = this,
                css = "";

            if (typeof mix === "object") {
                for (prop in mix) {
                    if (mix[prop] === "") {
                        _removeProperty(prop);
                        return;
                    }
                    _setStyle(prop, mix[prop]);
                }
            } else {
                if (value) {
                    _setStyle(mix, value);
                } else if (value === "") {
                    _removeProperty(mix);
                } else {
                    return global.getComputedStyle(this.nodes[0]).getPropertyValue(mix);
                }
            }

            function _removeProperty(prop) {
                self.each(function(node) {
                    node.style.removeProperty(prop);
                });
            }

            function _setStyle(prop, val) {
                self.each(function(node) {
                    node.style[prop] = val;
                });
            }
        },

        /***
         * <div data-hoge="fuga"></div>
         *
         * tt(mix).data();
         * @return Object: {hoge: "fuga"} dataset attributes object
         *
         * tt(mix).data("hoge");
         * @return String: "fuga"
         *
         * tt(mix).data("hoge", "fugafuga");
         * @effect <div data-hoge="fugafuga"></div>
         * @return Object: ttObject
         *
         * tt(mix).data("hoge", "");
         * @effect <div></div>
         * @return Object: ttObject
         *
         * tt(mix).data({ "hoge": "fugafuga", "piyo": "zonu" });
         * @effect <div data-hoge="fugafuga" data-piyo="zonu"></div>
         * @return Object: ttObject
         */
        data: function() {
            var self = this,
                args = arguments,
                data = {},
                useCompatible = ((tt.env.android && tt.env.versionCode < 3000) || (tt.env.ios && tt.env.versionCode < 5000) || (tt.env.opera));

            switch (arg.length) {
            case 0:
                return useCompatible ?
                            _getAttrByAttributes() :
                            _getAttrByDataSet();
            case 1:
                if (typeof args[0] === "object") {
                    useCompatible ?
                        _setAttrByAttributes(args[0]) :
                        _setAttrByDataSet(args[0]);
                    return this;
                } else {
                    return useCompatible ?
                                _getAttrByAttributes(args[0]) :
                                _getAttrByDataSet(args[0]);
                }
            case 2:
                data[args[0]] = args[1];
                useCompatible ?
                    _setAttrByAttributes(data) :
                    _setAttrByDataSet(data);
                return this;
            }

            function _getAttrByDataSet(name) {
                return name ? self.nodes[0].dataset[name] : self.nodes[0].dataset;
            }

            function _getAttrByAttributes(name) {
                var res = {},
                    node = self.nodes[0],
                    attr, attrs = node.attributes,
                    dataName = "data-",
                    i = 0, iz = attrs.length;

                name && (dataName += name);
                for (; i < iz; ++i) {
                    attr = attrs[i].name;
                    if (!attr.indexOf(dataName)) {
                        res[attr.substr(6, attr.length)] = node.getAttribute(attr);
                    }
                }
                return name ? res[name] : res;
            }

            function _setAttrByDataSet(obj) {
                var name;

                for (name in obj) {
                    self.each(function(node) {
                        var value = obj[name];

                        if (value === "") {
                            delete node.dataset[name];
                            return;
                        }
                        node.dataset[name] = value;
                    });
                }
            }

            function _setAttrByAttributes(obj) {
                var name, value;

                for (name in obj) {
                    self.attr("data-" + name, obj[name]);
                }
            }
        },

        /**
         * <div class="hoge" style="display:none;"></div>
         *
         * tt(".hoge").show();
         * @effect <div class="hoge" style="display:block;"></div>
         * @return Object: ttObject
         */
        show: function(value) {
            var computedStyle = this.css("display"),
                stashedStyle = this.stash["display"];

            if (stashedStyle) {
                delete this.stash["display"];
            }
            if (computedStyle !== "none") {
                return this;
            }
            return this.css("display", value || stashedStyle || "block");
        },

        /**
         * <div class="hoge"></div>
         *
         * tt(".hoge").hide();
         * @effect <div class="hoge" style="display:none;"></div>
         * @return Object: ttObject
         */
        hide: function() {
            var computedStyle = this.css("display");

            if (computedStyle !== "none") {
                this.stash["display"] = computedStyle;
            } else {
                return this;
            }
            return this.css('display', 'none');
        },

        /**
         * <div class="hoge"></div>
         *
         * tt(".hoge").trigger("Event", "ontrigger", false, true);
         * @return Object: ttObject
         */
        trigger: function(event, type, bubbles, cancelable) {
            this.each(function(node) {
                tt.triggerEvent(node, event, type, bubbles, cancelable);
            });
            return this;
        },

        /**
         *
         * <div class="hoge"><div class="fuga"></div></div>
         *
         * tt(".fuga").replace("<div class="piyo"></div>");
         * @effect <div class="hoge"><div class="piyo"></div></div>
         * @return Object: ttObject
         *
         *
         */
        replace: function(mix) {
            var fn = null;

            if (mix && mix.nodeType) {
                fn = _insertNode;
            } else if (typeof mix === "string") {
                fn = _insertHTML;
            }
            fn && this.each(fn).remove();
            return this;

            function _insertNode(node) {
                node.parentNode.insertBefore(mix, node);
            }

            function _insertHTML(node) {
                node.insertAdjacentHTML("beforebegin", mix);
            }
        },

        /**
         *  document.body
         *  +--------------------------
         *  |             |
         *  |            top
         *  |             v
         *  | -- left --> +----------+
         *  |             | div#hoge |
         *  |             +----------+
         *  |
         *
         * <div id="hoge" class="fuga"></div>
         * <div class="fuga"></div>
         *
         * tt("#hoge").offset();
         * @return Object: { left: Number, top: Number }
         *
         * tt(".fuga").offset();
         * @return Array: [{ left: Number, top: Number }, { left: Number, top: Number }]
         */
        offset: function() {
            var res = [];

            this.each(function(node, index) {
                var offset = node.getBoundingClientRect();

                res[index] = {
                    left: offset.left + window.pageXOffset,
                    top: offset.top + window.pageYOffset
                };
            });
            return this.length === 1 ? res[0] : res;
        }
    };

    /**
     * Alias to on, off method
     */
    TT.prototype.bind = TT.prototype.on;
    TT.prototype.unbind = TT.prototype.off;


    function _addClassByClassList(className) {
        this.each(function(node) {
            node.classList.add(className);
        });
        return this;
    }

    function _addClassByClassName(className) {
        var stashName = this.nodes[0].className,
            newName = _createName(stashName, className);

        this.each(function(node, index) {
            if (tt(node).hasClass(className)) {
                return;
            }
            if (index && stashName !== node.className) {
                stashName = node.className;
                newName = _createName(stashName, className);
            }
            node.className = newName;
        });
        return this;

        function _createName(currentName, newName) {
            var res = currentName.split(" ");

            res[res.length] = newName;
            return res.join(" ");
        }
    }

    function _removeClassByClassList(className) {
        this.each(function(node) {
            node.classList.remove(className);
        });
        return this;
    }

    function _removeClassByClassName(className) {
        this.each(function(node) {
            node.className = node.className.replace(className ,"");
        });
        return this;
    }

    function _hasClassByClassList(className) {
        var res;

        className = className.trim();
        res = this.match(function(node) {
            return node.classList.contain(className);
        });
        return res ? true : false;
    }

    function _hasClassByClassName(className) {
        var res;

        className = className.trim();
        res = this.match(function(node) {
            return (" " + node.className + " ").indexOf(" " + className + " ") > -1;
        });
        return res ? true : false;
    }

    global[NS] = global[NS] || tt;
})(
    this,
    document,
    Array.isArray ||
    function(target) {
        return Object.prototype.toString.call(target) === "[object Array]";
    },
    function(target) {
        return Object.prototype.toString.call(target) === "[object NodeList]";
    }
);
