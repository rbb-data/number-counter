
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? undefined : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_update);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        if (component.$$.fragment) {
            run_all(component.$$.on_destroy);
            component.$$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            component.$$.on_destroy = component.$$.fragment = null;
            component.$$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, ret, value = ret) => {
                if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
                return ret;
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_update);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, detail));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /* Users/manuelreich/Documents/wundf-dev/RBB/number-counter/src/NumberAnimator.svelte generated by Svelte v3.12.1 */

    const file = "Users/manuelreich/Documents/wundf-dev/RBB/number-counter/src/NumberAnimator.svelte";

    function create_fragment(ctx) {
    	var strong, t;

    	const block = {
    		c: function create() {
    			strong = element("strong");
    			t = text(ctx.number);
    			attr_dev(strong, "class", "svelte-187e4mi");
    			add_location(strong, file, 74, 0, 1398);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, strong, anchor);
    			append_dev(strong, t);
    			ctx.strong_binding(strong);
    		},

    		p: function update(changed, ctx) {
    			if (changed.number) {
    				set_data_dev(t, ctx.number);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(strong);
    			}

    			ctx.strong_binding(null);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	
      let { countFrom, countTo, duration, startHack } = $$props;

      let observer;
      let elem;

      let timer;
      let frame;
      let startTime = null;

      function count() {
        const time = window.performance.now();
        const diff = time - startTime;
        let progress = diff / totalTime;
        if (progress > 1) progress = 1;
        if (progress < 1) {
          timer = setTimeout(() => {
            frame = requestAnimationFrame(count);
          }, 100);
        }

        const range = to - from;

        $$invalidate('number', number = Math.floor(from + progress * range));
      }

      function handleIntersection (entries) {
        entries.forEach(entry => {
          if (entry.isIntersecting && startTime === null) {
            $$invalidate('startHack', startHack = 1);
          }
        });
      }

      onMount(() => {
        const options = {
          rootMargin: '0px 0px 0px',
          threshold: 0,
        };
        observer = new IntersectionObserver(handleIntersection, options);
        observer.observe(elem);
      });

      onDestroy(() => {
        cancelAnimationFrame(frame);
        window.clearTimeout(timer);
        observer.unobserve(elem);
      });

    	const writable_props = ['countFrom', 'countTo', 'duration', 'startHack'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<NumberAnimator> was created with unknown prop '${key}'`);
    	});

    	function strong_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			$$invalidate('elem', elem = $$value);
    		});
    	}

    	$$self.$set = $$props => {
    		if ('countFrom' in $$props) $$invalidate('countFrom', countFrom = $$props.countFrom);
    		if ('countTo' in $$props) $$invalidate('countTo', countTo = $$props.countTo);
    		if ('duration' in $$props) $$invalidate('duration', duration = $$props.duration);
    		if ('startHack' in $$props) $$invalidate('startHack', startHack = $$props.startHack);
    	};

    	$$self.$capture_state = () => {
    		return { countFrom, countTo, duration, startHack, observer, elem, timer, frame, startTime, from, to, totalTime, number };
    	};

    	$$self.$inject_state = $$props => {
    		if ('countFrom' in $$props) $$invalidate('countFrom', countFrom = $$props.countFrom);
    		if ('countTo' in $$props) $$invalidate('countTo', countTo = $$props.countTo);
    		if ('duration' in $$props) $$invalidate('duration', duration = $$props.duration);
    		if ('startHack' in $$props) $$invalidate('startHack', startHack = $$props.startHack);
    		if ('observer' in $$props) observer = $$props.observer;
    		if ('elem' in $$props) $$invalidate('elem', elem = $$props.elem);
    		if ('timer' in $$props) timer = $$props.timer;
    		if ('frame' in $$props) frame = $$props.frame;
    		if ('startTime' in $$props) startTime = $$props.startTime;
    		if ('from' in $$props) $$invalidate('from', from = $$props.from);
    		if ('to' in $$props) to = $$props.to;
    		if ('totalTime' in $$props) totalTime = $$props.totalTime;
    		if ('number' in $$props) $$invalidate('number', number = $$props.number);
    	};

    	let from, to, totalTime, number;

    	$$self.$$.update = ($$dirty = { countFrom: 1, countTo: 1, duration: 1, from: 1, startHack: 1 }) => {
    		if ($$dirty.countFrom) { $$invalidate('from', from = +countFrom); }
    		if ($$dirty.countTo) { to = +countTo; }
    		if ($$dirty.duration) { totalTime = +duration; }
    		if ($$dirty.from) { $$invalidate('number', number = from); }
    		if ($$dirty.startHack) { if (startHack > 0) {
            $$invalidate('startHack', startHack = 0);
            startTime = window.performance.now();
            count();
          } }
    	};

    	return {
    		countFrom,
    		countTo,
    		duration,
    		startHack,
    		elem,
    		number,
    		strong_binding
    	};
    }

    class NumberAnimator extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, ["countFrom", "countTo", "duration", "startHack"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "NumberAnimator", options, id: create_fragment.name });

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.countFrom === undefined && !('countFrom' in props)) {
    			console.warn("<NumberAnimator> was created without expected prop 'countFrom'");
    		}
    		if (ctx.countTo === undefined && !('countTo' in props)) {
    			console.warn("<NumberAnimator> was created without expected prop 'countTo'");
    		}
    		if (ctx.duration === undefined && !('duration' in props)) {
    			console.warn("<NumberAnimator> was created without expected prop 'duration'");
    		}
    		if (ctx.startHack === undefined && !('startHack' in props)) {
    			console.warn("<NumberAnimator> was created without expected prop 'startHack'");
    		}
    	}

    	get countFrom() {
    		throw new Error("<NumberAnimator>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set countFrom(value) {
    		throw new Error("<NumberAnimator>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get countTo() {
    		throw new Error("<NumberAnimator>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set countTo(value) {
    		throw new Error("<NumberAnimator>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get duration() {
    		throw new Error("<NumberAnimator>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set duration(value) {
    		throw new Error("<NumberAnimator>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get startHack() {
    		throw new Error("<NumberAnimator>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set startHack(value) {
    		throw new Error("<NumberAnimator>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* Users/manuelreich/Documents/wundf-dev/RBB/number-counter/src/App.svelte generated by Svelte v3.12.1 */

    const file$1 = "Users/manuelreich/Documents/wundf-dev/RBB/number-counter/src/App.svelte";

    function create_fragment$1(ctx) {
    	var div, p0, span0, t0, t1, t2, span1, t3, t4, p1, t5, current;

    	var numberanimator = new NumberAnimator({
    		props: {
    		countFrom: +ctx.countFrom,
    		countTo: +ctx.countTo,
    		duration: +ctx.duration,
    		startHack: ctx.startHack
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			div = element("div");
    			p0 = element("p");
    			span0 = element("span");
    			t0 = text(ctx.textBefore);
    			t1 = space();
    			numberanimator.$$.fragment.c();
    			t2 = space();
    			span1 = element("span");
    			t3 = text(ctx.unit);
    			t4 = space();
    			p1 = element("p");
    			t5 = text(ctx.description);
    			attr_dev(span0, "class", "text-before svelte-522ski");
    			add_location(span0, file$1, 53, 4, 936);
    			attr_dev(span1, "class", "unit svelte-522ski");
    			add_location(span1, file$1, 55, 4, 1094);
    			attr_dev(p0, "class", "number-wrapper svelte-522ski");
    			add_location(p0, file$1, 52, 2, 905);
    			attr_dev(p1, "class", "svelte-522ski");
    			add_location(p1, file$1, 57, 2, 1136);
    			attr_dev(div, "class", "wrapper svelte-522ski");
    			add_location(div, file$1, 51, 0, 881);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p0);
    			append_dev(p0, span0);
    			append_dev(span0, t0);
    			append_dev(p0, t1);
    			mount_component(numberanimator, p0, null);
    			append_dev(p0, t2);
    			append_dev(p0, span1);
    			append_dev(span1, t3);
    			append_dev(div, t4);
    			append_dev(div, p1);
    			append_dev(p1, t5);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (!current || changed.textBefore) {
    				set_data_dev(t0, ctx.textBefore);
    			}

    			var numberanimator_changes = {};
    			if (changed.countFrom) numberanimator_changes.countFrom = +ctx.countFrom;
    			if (changed.countTo) numberanimator_changes.countTo = +ctx.countTo;
    			if (changed.duration) numberanimator_changes.duration = +ctx.duration;
    			if (changed.startHack) numberanimator_changes.startHack = ctx.startHack;
    			numberanimator.$set(numberanimator_changes);

    			if (!current || changed.unit) {
    				set_data_dev(t3, ctx.unit);
    			}

    			if (!current || changed.description) {
    				set_data_dev(t5, ctx.description);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(numberanimator.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(numberanimator.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div);
    			}

    			destroy_component(numberanimator);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$1.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	
      let { countFrom = 0, countTo = 100, duration = 2000, unit = '', textBefore = '', description = '', startHack = 0 } = $$props;

    	const writable_props = ['countFrom', 'countTo', 'duration', 'unit', 'textBefore', 'description', 'startHack'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('countFrom' in $$props) $$invalidate('countFrom', countFrom = $$props.countFrom);
    		if ('countTo' in $$props) $$invalidate('countTo', countTo = $$props.countTo);
    		if ('duration' in $$props) $$invalidate('duration', duration = $$props.duration);
    		if ('unit' in $$props) $$invalidate('unit', unit = $$props.unit);
    		if ('textBefore' in $$props) $$invalidate('textBefore', textBefore = $$props.textBefore);
    		if ('description' in $$props) $$invalidate('description', description = $$props.description);
    		if ('startHack' in $$props) $$invalidate('startHack', startHack = $$props.startHack);
    	};

    	$$self.$capture_state = () => {
    		return { countFrom, countTo, duration, unit, textBefore, description, startHack };
    	};

    	$$self.$inject_state = $$props => {
    		if ('countFrom' in $$props) $$invalidate('countFrom', countFrom = $$props.countFrom);
    		if ('countTo' in $$props) $$invalidate('countTo', countTo = $$props.countTo);
    		if ('duration' in $$props) $$invalidate('duration', duration = $$props.duration);
    		if ('unit' in $$props) $$invalidate('unit', unit = $$props.unit);
    		if ('textBefore' in $$props) $$invalidate('textBefore', textBefore = $$props.textBefore);
    		if ('description' in $$props) $$invalidate('description', description = $$props.description);
    		if ('startHack' in $$props) $$invalidate('startHack', startHack = $$props.startHack);
    	};

    	return {
    		countFrom,
    		countTo,
    		duration,
    		unit,
    		textBefore,
    		description,
    		startHack
    	};
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, ["countFrom", "countTo", "duration", "unit", "textBefore", "description", "startHack"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "App", options, id: create_fragment$1.name });
    	}

    	get countFrom() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set countFrom(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get countTo() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set countTo(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get duration() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set duration(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get unit() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set unit(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get textBefore() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set textBefore(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get description() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set description(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get startHack() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set startHack(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.12.1 */

    const file$2 = "src/App.svelte";

    function create_fragment$2(ctx) {
    	var h20, t1, p0, label0, t3, input0, t4, p1, label1, t6, input1, input1_updating = false, t7, p2, label2, t9, input2, input2_updating = false, t10, p3, label3, t12, input3, input3_updating = false, t13, p4, label4, t15, input4, t16, p5, label5, t18, input5, t19, h21, t21, t22, h22, t24, output, code, t25, current, dispose;

    	function input1_input_handler() {
    		input1_updating = true;
    		ctx.input1_input_handler.call(input1);
    	}

    	function input2_input_handler() {
    		input2_updating = true;
    		ctx.input2_input_handler.call(input2);
    	}

    	function input3_input_handler() {
    		input3_updating = true;
    		ctx.input3_input_handler.call(input3);
    	}

    	var hui = new App({
    		props: {
    		countFrom: ctx.countFrom,
    		countTo: ctx.countTo,
    		duration: ctx.duration,
    		textBefore: ctx.textBefore,
    		unit: ctx.unit,
    		description: ctx.description,
    		startHack: ctx.startHack
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			h20 = element("h2");
    			h20.textContent = "Paramter";
    			t1 = space();
    			p0 = element("p");
    			label0 = element("label");
    			label0.textContent = "text vor Zahl:";
    			t3 = space();
    			input0 = element("input");
    			t4 = space();
    			p1 = element("p");
    			label1 = element("label");
    			label1.textContent = "starte counter bei:";
    			t6 = space();
    			input1 = element("input");
    			t7 = space();
    			p2 = element("p");
    			label2 = element("label");
    			label2.textContent = "zähle bis zu:";
    			t9 = space();
    			input2 = element("input");
    			t10 = space();
    			p3 = element("p");
    			label3 = element("label");
    			label3.textContent = "dauer:";
    			t12 = space();
    			input3 = element("input");
    			t13 = space();
    			p4 = element("p");
    			label4 = element("label");
    			label4.textContent = "einheit:";
    			t15 = space();
    			input4 = element("input");
    			t16 = space();
    			p5 = element("p");
    			label5 = element("label");
    			label5.textContent = "text unter Zahl:";
    			t18 = space();
    			input5 = element("input");
    			t19 = space();
    			h21 = element("h2");
    			h21.textContent = "Vorschau";
    			t21 = space();
    			hui.$$.fragment.c();
    			t22 = space();
    			h22 = element("h2");
    			h22.textContent = "Embed code";
    			t24 = space();
    			output = element("output");
    			code = element("code");
    			t25 = text(ctx.iframeString);
    			add_location(h20, file$2, 26, 0, 675);
    			attr_dev(label0, "for", "countFrom");
    			attr_dev(label0, "class", "svelte-8aouof");
    			add_location(label0, file$2, 28, 2, 699);
    			attr_dev(input0, "id", "countFrom");
    			attr_dev(input0, "type", "text");
    			add_location(input0, file$2, 29, 2, 747);
    			add_location(p0, file$2, 27, 0, 693);
    			attr_dev(label1, "for", "countFrom");
    			attr_dev(label1, "class", "svelte-8aouof");
    			add_location(label1, file$2, 32, 2, 819);
    			attr_dev(input1, "id", "countFrom");
    			attr_dev(input1, "type", "number");
    			add_location(input1, file$2, 33, 2, 872);
    			add_location(p1, file$2, 31, 0, 813);
    			attr_dev(label2, "for", "countFrom");
    			attr_dev(label2, "class", "svelte-8aouof");
    			add_location(label2, file$2, 36, 2, 965);
    			attr_dev(input2, "id", "countFrom");
    			attr_dev(input2, "type", "number");
    			add_location(input2, file$2, 37, 2, 1012);
    			add_location(p2, file$2, 35, 0, 959);
    			attr_dev(label3, "for", "countFrom");
    			attr_dev(label3, "class", "svelte-8aouof");
    			add_location(label3, file$2, 40, 2, 1103);
    			attr_dev(input3, "id", "countFrom");
    			attr_dev(input3, "type", "number");
    			add_location(input3, file$2, 41, 2, 1143);
    			add_location(p3, file$2, 39, 0, 1097);
    			attr_dev(label4, "for", "countFrom");
    			attr_dev(label4, "class", "svelte-8aouof");
    			add_location(label4, file$2, 44, 2, 1235);
    			attr_dev(input4, "id", "countFrom");
    			attr_dev(input4, "type", "text");
    			add_location(input4, file$2, 45, 2, 1277);
    			add_location(p4, file$2, 43, 0, 1229);
    			attr_dev(label5, "for", "countFrom");
    			attr_dev(label5, "class", "svelte-8aouof");
    			add_location(label5, file$2, 48, 2, 1343);
    			attr_dev(input5, "id", "countFrom");
    			attr_dev(input5, "type", "text");
    			add_location(input5, file$2, 49, 2, 1393);
    			add_location(p5, file$2, 47, 0, 1337);
    			add_location(h21, file$2, 52, 0, 1461);
    			add_location(h22, file$2, 62, 0, 1647);
    			add_location(code, file$2, 64, 2, 1678);
    			add_location(output, file$2, 63, 0, 1667);

    			dispose = [
    				listen_dev(input0, "input", ctx.input0_input_handler),
    				listen_dev(input1, "input", input1_input_handler),
    				listen_dev(input1, "change", ctx.restart),
    				listen_dev(input2, "input", input2_input_handler),
    				listen_dev(input2, "change", ctx.restart),
    				listen_dev(input3, "input", input3_input_handler),
    				listen_dev(input3, "change", ctx.restart),
    				listen_dev(input4, "input", ctx.input4_input_handler),
    				listen_dev(input5, "input", ctx.input5_input_handler)
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, h20, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p0, anchor);
    			append_dev(p0, label0);
    			append_dev(p0, t3);
    			append_dev(p0, input0);

    			set_input_value(input0, ctx.textBefore);

    			insert_dev(target, t4, anchor);
    			insert_dev(target, p1, anchor);
    			append_dev(p1, label1);
    			append_dev(p1, t6);
    			append_dev(p1, input1);

    			set_input_value(input1, ctx.countFrom);

    			insert_dev(target, t7, anchor);
    			insert_dev(target, p2, anchor);
    			append_dev(p2, label2);
    			append_dev(p2, t9);
    			append_dev(p2, input2);

    			set_input_value(input2, ctx.countTo);

    			insert_dev(target, t10, anchor);
    			insert_dev(target, p3, anchor);
    			append_dev(p3, label3);
    			append_dev(p3, t12);
    			append_dev(p3, input3);

    			set_input_value(input3, ctx.duration);

    			insert_dev(target, t13, anchor);
    			insert_dev(target, p4, anchor);
    			append_dev(p4, label4);
    			append_dev(p4, t15);
    			append_dev(p4, input4);

    			set_input_value(input4, ctx.unit);

    			insert_dev(target, t16, anchor);
    			insert_dev(target, p5, anchor);
    			append_dev(p5, label5);
    			append_dev(p5, t18);
    			append_dev(p5, input5);

    			set_input_value(input5, ctx.description);

    			insert_dev(target, t19, anchor);
    			insert_dev(target, h21, anchor);
    			insert_dev(target, t21, anchor);
    			mount_component(hui, target, anchor);
    			insert_dev(target, t22, anchor);
    			insert_dev(target, h22, anchor);
    			insert_dev(target, t24, anchor);
    			insert_dev(target, output, anchor);
    			append_dev(output, code);
    			append_dev(code, t25);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (changed.textBefore && (input0.value !== ctx.textBefore)) set_input_value(input0, ctx.textBefore);
    			if (!input1_updating && changed.countFrom) set_input_value(input1, ctx.countFrom);
    			input1_updating = false;
    			if (!input2_updating && changed.countTo) set_input_value(input2, ctx.countTo);
    			input2_updating = false;
    			if (!input3_updating && changed.duration) set_input_value(input3, ctx.duration);
    			input3_updating = false;
    			if (changed.unit && (input4.value !== ctx.unit)) set_input_value(input4, ctx.unit);
    			if (changed.description && (input5.value !== ctx.description)) set_input_value(input5, ctx.description);

    			var hui_changes = {};
    			if (changed.countFrom) hui_changes.countFrom = ctx.countFrom;
    			if (changed.countTo) hui_changes.countTo = ctx.countTo;
    			if (changed.duration) hui_changes.duration = ctx.duration;
    			if (changed.textBefore) hui_changes.textBefore = ctx.textBefore;
    			if (changed.unit) hui_changes.unit = ctx.unit;
    			if (changed.description) hui_changes.description = ctx.description;
    			if (changed.startHack) hui_changes.startHack = ctx.startHack;
    			hui.$set(hui_changes);

    			if (!current || changed.iframeString) {
    				set_data_dev(t25, ctx.iframeString);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(hui.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(hui.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(h20);
    				detach_dev(t1);
    				detach_dev(p0);
    				detach_dev(t4);
    				detach_dev(p1);
    				detach_dev(t7);
    				detach_dev(p2);
    				detach_dev(t10);
    				detach_dev(p3);
    				detach_dev(t13);
    				detach_dev(p4);
    				detach_dev(t16);
    				detach_dev(p5);
    				detach_dev(t19);
    				detach_dev(h21);
    				detach_dev(t21);
    			}

    			destroy_component(hui, detaching);

    			if (detaching) {
    				detach_dev(t22);
    				detach_dev(h22);
    				detach_dev(t24);
    				detach_dev(output);
    			}

    			run_all(dispose);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$2.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let countFrom = 0;
      let countTo = 100;
      let duration = 2000;
      let textBefore = 'bis zu';
      let unit = '€';
      let description = 'kostet xyz';
      let startHack = 0;

      function restart () {
        $$invalidate('startHack', startHack += 1);
      }

    	function input0_input_handler() {
    		textBefore = this.value;
    		$$invalidate('textBefore', textBefore);
    	}

    	function input1_input_handler() {
    		countFrom = to_number(this.value);
    		$$invalidate('countFrom', countFrom);
    	}

    	function input2_input_handler() {
    		countTo = to_number(this.value);
    		$$invalidate('countTo', countTo);
    	}

    	function input3_input_handler() {
    		duration = to_number(this.value);
    		$$invalidate('duration', duration);
    	}

    	function input4_input_handler() {
    		unit = this.value;
    		$$invalidate('unit', unit);
    	}

    	function input5_input_handler() {
    		description = this.value;
    		$$invalidate('description', description);
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ('countFrom' in $$props) $$invalidate('countFrom', countFrom = $$props.countFrom);
    		if ('countTo' in $$props) $$invalidate('countTo', countTo = $$props.countTo);
    		if ('duration' in $$props) $$invalidate('duration', duration = $$props.duration);
    		if ('textBefore' in $$props) $$invalidate('textBefore', textBefore = $$props.textBefore);
    		if ('unit' in $$props) $$invalidate('unit', unit = $$props.unit);
    		if ('description' in $$props) $$invalidate('description', description = $$props.description);
    		if ('startHack' in $$props) $$invalidate('startHack', startHack = $$props.startHack);
    		if ('url' in $$props) $$invalidate('url', url = $$props.url);
    		if ('iframeString' in $$props) $$invalidate('iframeString', iframeString = $$props.iframeString);
    	};

    	let url, iframeString;

    	$$self.$$.update = ($$dirty = { countFrom: 1, countTo: 1, duration: 1, textBefore: 1, unit: 1, description: 1, url: 1 }) => {
    		if ($$dirty.countFrom || $$dirty.countTo || $$dirty.duration || $$dirty.textBefore || $$dirty.unit || $$dirty.description) { $$invalidate('url', url = `https://dj1.app.rbb-cloud.de/number-counter/#countFrom=${countFrom}&countTo=${countTo}&duration=${duration}&textBefore=${encodeURIComponent(textBefore)}&unit=${encodeURIComponent(unit)}&description=${encodeURIComponent(description)}`); }
    		if ($$dirty.url) { $$invalidate('iframeString', iframeString = `<iframe src="${url}" width="100%" height="150px"></iframe>`); }
    	};

    	return {
    		countFrom,
    		countTo,
    		duration,
    		textBefore,
    		unit,
    		description,
    		startHack,
    		restart,
    		iframeString,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler,
    		input3_input_handler,
    		input4_input_handler,
    		input5_input_handler
    	};
    }

    class App$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "App", options, id: create_fragment$2.name });
    	}
    }

    const app = new App$1({
      target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
