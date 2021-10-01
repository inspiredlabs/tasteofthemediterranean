
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
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
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function get_all_dirty_from_scope($$scope) {
        if ($$scope.ctx.length > 32) {
            const dirty = [];
            const length = $$scope.ctx.length / 32;
            for (let i = 0; i < length; i++) {
                dirty[i] = -1;
            }
            return dirty;
        }
        return -1;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
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
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
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
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function stop_propagation(fn) {
        return function (event) {
            event.stopPropagation();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
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
    function tick() {
        schedule_update();
        return resolved_promise;
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
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

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error('Cannot have duplicate keys in a keyed each');
            }
            keys.add(key);
        }
    }

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
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
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
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
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.41.0' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    function pannable(node) {
        const options = { passive: false };
        let x = 0, y = 0;

        function unify(e) { return e.changedTouches ? e.changedTouches[0] : e }
        function down(e) {
            x = unify(e).clientX;
            y = unify(e).clientY;

            node.dispatchEvent(new CustomEvent('panstart', {
                detail: { x, y }
            }));

            window.addEventListener('mousemove', move, options);
            window.addEventListener('mouseup', up, options);
            window.addEventListener('touchmove', move, options);
            window.addEventListener('touchend', up, options);
        }

        function move(e) {
            const dx = unify(e).clientX - x;
            const dy = unify(e).clientY - y;
            x = unify(e).clientX;
            y = unify(e).clientY;
            // if (dx !== 0) {
            // 	e.preventDefault ? e.preventDefault() : (e.returnValue = false);
            // }

            node.dispatchEvent(new CustomEvent('panmove', {
                detail: { x, y, dx, dy }
            }));
        }

        function up(e) {
            x = unify(e).clientX;
            y = unify(e).clientY;

            node.dispatchEvent(new CustomEvent('panend', {
                detail: { x, y }
            }));

            window.removeEventListener('mousemove', move, options);
            window.removeEventListener('mouseup', up, options);
            window.removeEventListener('touchmove', move, options);
            window.removeEventListener('touchend', up, options);
        }

        node.addEventListener('mousedown', down, options);
        node.addEventListener('touchstart', down, options);

        return {
            destroy() {
                node.removeEventListener('mousedown', down, options);
                node.removeEventListener('touchstart', down, options);
            }
        };
    }

    function resize(node) {
        let CR;
        let ET;

        const ro = new ResizeObserver((entries, observer) => {
            for (let entry of entries) {
                CR = entry.contentRect;
                ET = entry.target;
            }
            node.dispatchEvent(new CustomEvent('resize', {
                detail: { CR, ET }
            }));
        });

        ro.observe(node);

        return {
            destroy() {
                ro.disconnect();
            }
        }
    }

    function wheel(node) {
        let dx = 0, dy = 0;

        function handleWheel(e) {
            if ((navigator.platform.indexOf('Win') > -1) && e.shiftKey) {
                dx = e.deltaY;
            } else {
                dx = e.deltaX * 1.5;
                dy = e.deltaY * 1.5;
            }
            if (dx !== 0) {
                e.preventDefault ? e.preventDefault() : (e.returnValue = false);
            }
            node.dispatchEvent(new CustomEvent('wheels', {
                detail: { dx, dy }
            }));
        }

        node.addEventListener('wheel', handleWheel, { passive: false });

        return {
            destroy() {
                node.removeEventListener('wheel', handleWheel);
            }
        };
    }

    var action = /*#__PURE__*/Object.freeze({
        __proto__: null,
        pannable: pannable,
        resize: resize,
        wheel: wheel
    });

    /* node_modules/svelte-slidy/src/Slidy.svelte generated by Svelte v3.41.0 */

    const { Boolean: Boolean_1 } = globals;
    const file$b = "node_modules/svelte-slidy/src/Slidy.svelte";
    const get_dots_arrow_right_slot_changes_1 = dirty => ({ item: dirty[0] & /*slides*/ 1 });
    const get_dots_arrow_right_slot_context_1 = ctx => ({ item: /*item*/ ctx[64] });
    const get_dots_arrow_right_slot_changes = dirty => ({ item: dirty[0] & /*slides*/ 1 });
    const get_dots_arrow_right_slot_context = ctx => ({ item: /*item*/ ctx[64] });

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[61] = list[i];
    	child_ctx[63] = i;
    	return child_ctx;
    }

    const get_dot_slot_changes = dirty => ({
    	dot: dirty[0] & /*dots*/ 1024,
    	item: dirty[0] & /*slides*/ 1
    });

    const get_dot_slot_context = ctx => ({
    	dot: /*dot*/ ctx[61],
    	item: /*item*/ ctx[64]
    });

    const get_dots_arrow_left_slot_changes_1 = dirty => ({ item: dirty[0] & /*slides*/ 1 });
    const get_dots_arrow_left_slot_context_1 = ctx => ({ item: /*item*/ ctx[64] });
    const get_dots_arrow_left_slot_changes = dirty => ({ item: dirty[0] & /*slides*/ 1 });
    const get_dots_arrow_left_slot_context = ctx => ({ item: /*item*/ ctx[64] });
    const get_arrow_right_slot_changes_1 = dirty => ({ item: dirty[0] & /*slides*/ 1 });
    const get_arrow_right_slot_context_1 = ctx => ({ item: /*item*/ ctx[64] });
    const get_arrow_left_slot_changes_1 = dirty => ({ item: dirty[0] & /*slides*/ 1 });
    const get_arrow_left_slot_context_1 = ctx => ({ item: /*item*/ ctx[64] });
    const get_arrow_right_slot_changes = dirty => ({ item: dirty[0] & /*slides*/ 1 });
    const get_arrow_right_slot_context = ctx => ({ item: /*item*/ ctx[64] });
    const get_arrow_left_slot_changes = dirty => ({ item: dirty[0] & /*slides*/ 1 });
    const get_arrow_left_slot_context = ctx => ({ item: /*item*/ ctx[64] });

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[64] = list[i];
    	child_ctx[65] = list;
    	child_ctx[63] = i;
    	return child_ctx;
    }

    const get_default_slot_changes = dirty => ({ item: dirty[0] & /*slides*/ 1 });
    const get_default_slot_context = ctx => ({ item: /*item*/ ctx[64] });
    const get_loader_slot_changes = dirty => ({ item: dirty[0] & /*slides*/ 1 });
    const get_loader_slot_context = ctx => ({ item: /*item*/ ctx[64] });

    // (388:4) {#if !init}
    function create_if_block_13(ctx) {
    	let section;
    	let current;
    	const loader_slot_template = /*#slots*/ ctx[29].loader;
    	const loader_slot = create_slot(loader_slot_template, ctx, /*$$scope*/ ctx[28], get_loader_slot_context);
    	const loader_slot_or_fallback = loader_slot || fallback_block_10(ctx);

    	const block = {
    		c: function create() {
    			section = element("section");
    			if (loader_slot_or_fallback) loader_slot_or_fallback.c();
    			attr_dev(section, "id", "loader");
    			attr_dev(section, "class", "svelte-12il57o");
    			add_location(section, file$b, 388, 8, 11628);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);

    			if (loader_slot_or_fallback) {
    				loader_slot_or_fallback.m(section, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (loader_slot) {
    				if (loader_slot.p && (!current || dirty[0] & /*$$scope, slides*/ 268435457)) {
    					update_slot_base(
    						loader_slot,
    						loader_slot_template,
    						ctx,
    						/*$$scope*/ ctx[28],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[28])
    						: get_slot_changes(loader_slot_template, /*$$scope*/ ctx[28], dirty, get_loader_slot_changes),
    						get_loader_slot_context
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(loader_slot_or_fallback, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(loader_slot_or_fallback, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			if (loader_slot_or_fallback) loader_slot_or_fallback.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_13.name,
    		type: "if",
    		source: "(388:4) {#if !init}",
    		ctx
    	});

    	return block;
    }

    // (390:32) Loading...
    function fallback_block_10(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Loading...");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block_10.name,
    		type: "fallback",
    		source: "(390:32) Loading...",
    		ctx
    	});

    	return block;
    }

    // (395:8) {#if slides}
    function create_if_block_11(ctx) {
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_1_anchor;
    	let current;
    	let each_value_1 = /*slides*/ ctx[0];
    	validate_each_argument(each_value_1);
    	const get_key = ctx => /*key*/ ctx[3](/*item*/ ctx[64]);
    	validate_each_keys(ctx, each_value_1, get_each_context_1, get_key);

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		let child_ctx = get_each_context_1(ctx, each_value_1, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_1(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*slides, slide, nodes, index, controls, dragStart, dragSlide, dragStop, $$scope, key*/ 268665195) {
    				each_value_1 = /*slides*/ ctx[0];
    				validate_each_argument(each_value_1);
    				group_outros();
    				validate_each_keys(ctx, each_value_1, get_each_context_1, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_1, each_1_lookup, each_1_anchor.parentNode, outro_and_destroy_block, create_each_block_1, each_1_anchor, get_each_context_1);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d(detaching);
    			}

    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_11.name,
    		type: "if",
    		source: "(395:8) {#if slides}",
    		ctx
    	});

    	return block;
    }

    // (411:24) {#if !slide.backimg}
    function create_if_block_12(ctx) {
    	let img;
    	let img_alt_value;
    	let img_src_value;
    	let img_width_value;
    	let img_height_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			attr_dev(img, "alt", img_alt_value = /*item*/ ctx[64][/*slide*/ ctx[5].imgsrckey]);
    			if (!src_url_equal(img.src, img_src_value = /*item*/ ctx[64][/*slide*/ ctx[5].imgsrckey])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "width", img_width_value = /*item*/ ctx[64].width);
    			attr_dev(img, "height", img_height_value = /*item*/ ctx[64].height);
    			add_location(img, file$b, 411, 28, 12594);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*slides, slide*/ 33 && img_alt_value !== (img_alt_value = /*item*/ ctx[64][/*slide*/ ctx[5].imgsrckey])) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (dirty[0] & /*slides, slide*/ 33 && !src_url_equal(img.src, img_src_value = /*item*/ ctx[64][/*slide*/ ctx[5].imgsrckey])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty[0] & /*slides*/ 1 && img_width_value !== (img_width_value = /*item*/ ctx[64].width)) {
    				attr_dev(img, "width", img_width_value);
    			}

    			if (dirty[0] & /*slides*/ 1 && img_height_value !== (img_height_value = /*item*/ ctx[64].height)) {
    				attr_dev(img, "height", img_height_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_12.name,
    		type: "if",
    		source: "(411:24) {#if !slide.backimg}",
    		ctx
    	});

    	return block;
    }

    // (410:33)                          
    function fallback_block_9(ctx) {
    	let if_block_anchor;
    	let if_block = !/*slide*/ ctx[5].backimg && create_if_block_12(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (!/*slide*/ ctx[5].backimg) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_12(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block_9.name,
    		type: "fallback",
    		source: "(410:33)                          ",
    		ctx
    	});

    	return block;
    }

    // (396:12) {#each slides as item, i (key(item))}
    function create_each_block_1(key_2, ctx) {
    	let li;
    	let t;
    	let li_data_id_value;
    	let li_class_value;
    	let li_style_value;
    	let i = /*i*/ ctx[63];
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[29].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[28], get_default_slot_context);
    	const default_slot_or_fallback = default_slot || fallback_block_9(ctx);
    	const assign_li = () => /*li_binding*/ ctx[30](li, i);
    	const unassign_li = () => /*li_binding*/ ctx[30](null, i);

    	const block = {
    		key: key_2,
    		first: null,
    		c: function create() {
    			li = element("li");
    			if (default_slot_or_fallback) default_slot_or_fallback.c();
    			t = space();
    			attr_dev(li, "data-id", li_data_id_value = /*item*/ ctx[64].ix);
    			attr_dev(li, "class", li_class_value = "" + (null_to_empty(/*slide*/ ctx[5].class) + " svelte-12il57o"));

    			attr_dev(li, "style", li_style_value = /*slide*/ ctx[5].backimg === true
    			? `background-image: url(${/*item*/ ctx[64][/*slide*/ ctx[5].imgsrckey]})`
    			: null);

    			toggle_class(li, "active", /*item*/ ctx[64].ix === /*index*/ ctx[1]);
    			add_location(li, file$b, 396, 16, 11898);
    			this.first = li;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);

    			if (default_slot_or_fallback) {
    				default_slot_or_fallback.m(li, null);
    			}

    			append_dev(li, t);
    			assign_li();
    			current = true;

    			if (!mounted) {
    				dispose = [
    					action_destroyer(pannable(li)),
    					listen_dev(
    						li,
    						"panstart",
    						function () {
    							if (is_function(/*controls*/ ctx[6].drag ? /*dragStart*/ ctx[15] : null)) (/*controls*/ ctx[6].drag ? /*dragStart*/ ctx[15] : null).apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(
    						li,
    						"panmove",
    						function () {
    							if (is_function(/*controls*/ ctx[6].drag ? /*dragSlide*/ ctx[16] : null)) (/*controls*/ ctx[6].drag ? /*dragSlide*/ ctx[16] : null).apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(
    						li,
    						"panend",
    						function () {
    							if (is_function(/*controls*/ ctx[6].drag ? /*dragStop*/ ctx[17] : null)) (/*controls*/ ctx[6].drag ? /*dragStop*/ ctx[17] : null).apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (default_slot) {
    				if (default_slot.p && (!current || dirty[0] & /*$$scope, slides*/ 268435457)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[28],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[28])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[28], dirty, get_default_slot_changes),
    						get_default_slot_context
    					);
    				}
    			} else {
    				if (default_slot_or_fallback && default_slot_or_fallback.p && (!current || dirty[0] & /*slides, slide*/ 33)) {
    					default_slot_or_fallback.p(ctx, !current ? [-1, -1, -1] : dirty);
    				}
    			}

    			if (!current || dirty[0] & /*slides*/ 1 && li_data_id_value !== (li_data_id_value = /*item*/ ctx[64].ix)) {
    				attr_dev(li, "data-id", li_data_id_value);
    			}

    			if (!current || dirty[0] & /*slide*/ 32 && li_class_value !== (li_class_value = "" + (null_to_empty(/*slide*/ ctx[5].class) + " svelte-12il57o"))) {
    				attr_dev(li, "class", li_class_value);
    			}

    			if (!current || dirty[0] & /*slide, slides*/ 33 && li_style_value !== (li_style_value = /*slide*/ ctx[5].backimg === true
    			? `background-image: url(${/*item*/ ctx[64][/*slide*/ ctx[5].imgsrckey]})`
    			: null)) {
    				attr_dev(li, "style", li_style_value);
    			}

    			if (i !== /*i*/ ctx[63]) {
    				unassign_li();
    				i = /*i*/ ctx[63];
    				assign_li();
    			}

    			if (dirty[0] & /*slide, slides, index*/ 35) {
    				toggle_class(li, "active", /*item*/ ctx[64].ix === /*index*/ ctx[1]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot_or_fallback, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot_or_fallback, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			if (default_slot_or_fallback) default_slot_or_fallback.d(detaching);
    			unassign_li();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(396:12) {#each slides as item, i (key(item))}",
    		ctx
    	});

    	return block;
    }

    // (425:4) {#if controls.arrows && init}
    function create_if_block_7(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_8, create_else_block_2];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (!/*options*/ ctx[7].loop) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(425:4) {#if controls.arrows && init}",
    		ctx
    	});

    	return block;
    }

    // (437:8) {:else}
    function create_else_block_2(ctx) {
    	let button0;
    	let t;
    	let button1;
    	let current;
    	let mounted;
    	let dispose;
    	const arrow_left_slot_template = /*#slots*/ ctx[29]["arrow-left"];
    	const arrow_left_slot = create_slot(arrow_left_slot_template, ctx, /*$$scope*/ ctx[28], get_arrow_left_slot_context_1);
    	const arrow_left_slot_or_fallback = arrow_left_slot || fallback_block_8(ctx);
    	const arrow_right_slot_template = /*#slots*/ ctx[29]["arrow-right"];
    	const arrow_right_slot = create_slot(arrow_right_slot_template, ctx, /*$$scope*/ ctx[28], get_arrow_right_slot_context_1);
    	const arrow_right_slot_or_fallback = arrow_right_slot || fallback_block_7(ctx);

    	const block = {
    		c: function create() {
    			button0 = element("button");
    			if (arrow_left_slot_or_fallback) arrow_left_slot_or_fallback.c();
    			t = space();
    			button1 = element("button");
    			if (arrow_right_slot_or_fallback) arrow_right_slot_or_fallback.c();
    			attr_dev(button0, "class", "arrow-left svelte-12il57o");
    			add_location(button0, file$b, 437, 12, 13487);
    			attr_dev(button1, "class", "arrow-right svelte-12il57o");
    			add_location(button1, file$b, 440, 12, 13629);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button0, anchor);

    			if (arrow_left_slot_or_fallback) {
    				arrow_left_slot_or_fallback.m(button0, null);
    			}

    			insert_dev(target, t, anchor);
    			insert_dev(target, button1, anchor);

    			if (arrow_right_slot_or_fallback) {
    				arrow_right_slot_or_fallback.m(button1, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler_2*/ ctx[34], false, false, false),
    					listen_dev(button1, "click", /*click_handler_3*/ ctx[35], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (arrow_left_slot) {
    				if (arrow_left_slot.p && (!current || dirty[0] & /*$$scope, slides*/ 268435457)) {
    					update_slot_base(
    						arrow_left_slot,
    						arrow_left_slot_template,
    						ctx,
    						/*$$scope*/ ctx[28],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[28])
    						: get_slot_changes(arrow_left_slot_template, /*$$scope*/ ctx[28], dirty, get_arrow_left_slot_changes_1),
    						get_arrow_left_slot_context_1
    					);
    				}
    			}

    			if (arrow_right_slot) {
    				if (arrow_right_slot.p && (!current || dirty[0] & /*$$scope, slides*/ 268435457)) {
    					update_slot_base(
    						arrow_right_slot,
    						arrow_right_slot_template,
    						ctx,
    						/*$$scope*/ ctx[28],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[28])
    						: get_slot_changes(arrow_right_slot_template, /*$$scope*/ ctx[28], dirty, get_arrow_right_slot_changes_1),
    						get_arrow_right_slot_context_1
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(arrow_left_slot_or_fallback, local);
    			transition_in(arrow_right_slot_or_fallback, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(arrow_left_slot_or_fallback, local);
    			transition_out(arrow_right_slot_or_fallback, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button0);
    			if (arrow_left_slot_or_fallback) arrow_left_slot_or_fallback.d(detaching);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(button1);
    			if (arrow_right_slot_or_fallback) arrow_right_slot_or_fallback.d(detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_2.name,
    		type: "else",
    		source: "(437:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (426:8) {#if !options.loop}
    function create_if_block_8(ctx) {
    	let t;
    	let if_block1_anchor;
    	let current;
    	let if_block0 = /*index*/ ctx[1] > 0 && create_if_block_10(ctx);
    	let if_block1 = /*index*/ ctx[1] < /*slides*/ ctx[0].length - 1 && create_if_block_9(ctx);

    	const block = {
    		c: function create() {
    			if (if_block0) if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*index*/ ctx[1] > 0) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty[0] & /*index*/ 2) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_10(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(t.parentNode, t);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*index*/ ctx[1] < /*slides*/ ctx[0].length - 1) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty[0] & /*index, slides*/ 3) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_9(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(if_block1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_8.name,
    		type: "if",
    		source: "(426:8) {#if !options.loop}",
    		ctx
    	});

    	return block;
    }

    // (439:40) &#8592;
    function fallback_block_8(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("←");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block_8.name,
    		type: "fallback",
    		source: "(439:40) &#8592;",
    		ctx
    	});

    	return block;
    }

    // (442:41) &#8594;
    function fallback_block_7(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("→");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block_7.name,
    		type: "fallback",
    		source: "(442:41) &#8594;",
    		ctx
    	});

    	return block;
    }

    // (427:12) {#if index > 0}
    function create_if_block_10(ctx) {
    	let button;
    	let current;
    	let mounted;
    	let dispose;
    	const arrow_left_slot_template = /*#slots*/ ctx[29]["arrow-left"];
    	const arrow_left_slot = create_slot(arrow_left_slot_template, ctx, /*$$scope*/ ctx[28], get_arrow_left_slot_context);
    	const arrow_left_slot_or_fallback = arrow_left_slot || fallback_block_6(ctx);

    	const block = {
    		c: function create() {
    			button = element("button");
    			if (arrow_left_slot_or_fallback) arrow_left_slot_or_fallback.c();
    			attr_dev(button, "class", "arrow-left svelte-12il57o");
    			add_location(button, file$b, 427, 16, 13085);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (arrow_left_slot_or_fallback) {
    				arrow_left_slot_or_fallback.m(button, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[32], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (arrow_left_slot) {
    				if (arrow_left_slot.p && (!current || dirty[0] & /*$$scope, slides*/ 268435457)) {
    					update_slot_base(
    						arrow_left_slot,
    						arrow_left_slot_template,
    						ctx,
    						/*$$scope*/ ctx[28],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[28])
    						: get_slot_changes(arrow_left_slot_template, /*$$scope*/ ctx[28], dirty, get_arrow_left_slot_changes),
    						get_arrow_left_slot_context
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(arrow_left_slot_or_fallback, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(arrow_left_slot_or_fallback, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (arrow_left_slot_or_fallback) arrow_left_slot_or_fallback.d(detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_10.name,
    		type: "if",
    		source: "(427:12) {#if index > 0}",
    		ctx
    	});

    	return block;
    }

    // (429:44) &#8592;
    function fallback_block_6(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("←");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block_6.name,
    		type: "fallback",
    		source: "(429:44) &#8592;",
    		ctx
    	});

    	return block;
    }

    // (432:12) {#if index < slides.length - 1}
    function create_if_block_9(ctx) {
    	let button;
    	let current;
    	let mounted;
    	let dispose;
    	const arrow_right_slot_template = /*#slots*/ ctx[29]["arrow-right"];
    	const arrow_right_slot = create_slot(arrow_right_slot_template, ctx, /*$$scope*/ ctx[28], get_arrow_right_slot_context);
    	const arrow_right_slot_or_fallback = arrow_right_slot || fallback_block_5(ctx);

    	const block = {
    		c: function create() {
    			button = element("button");
    			if (arrow_right_slot_or_fallback) arrow_right_slot_or_fallback.c();
    			attr_dev(button, "class", "arrow-right svelte-12il57o");
    			add_location(button, file$b, 432, 16, 13301);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (arrow_right_slot_or_fallback) {
    				arrow_right_slot_or_fallback.m(button, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_1*/ ctx[33], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (arrow_right_slot) {
    				if (arrow_right_slot.p && (!current || dirty[0] & /*$$scope, slides*/ 268435457)) {
    					update_slot_base(
    						arrow_right_slot,
    						arrow_right_slot_template,
    						ctx,
    						/*$$scope*/ ctx[28],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[28])
    						: get_slot_changes(arrow_right_slot_template, /*$$scope*/ ctx[28], dirty, get_arrow_right_slot_changes),
    						get_arrow_right_slot_context
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(arrow_right_slot_or_fallback, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(arrow_right_slot_or_fallback, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (arrow_right_slot_or_fallback) arrow_right_slot_or_fallback.d(detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_9.name,
    		type: "if",
    		source: "(432:12) {#if index < slides.length - 1}",
    		ctx
    	});

    	return block;
    }

    // (434:45) &#8594;
    function fallback_block_5(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("→");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block_5.name,
    		type: "fallback",
    		source: "(434:45) &#8594;",
    		ctx
    	});

    	return block;
    }

    // (446:4) {#if controls.dots && init}
    function create_if_block$1(ctx) {
    	let ul;
    	let t0;
    	let t1;
    	let current;
    	let if_block0 = /*controls*/ ctx[6].dotsarrow && create_if_block_4(ctx);
    	let each_value = /*dots*/ ctx[10];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	let if_block1 = /*controls*/ ctx[6].dotsarrow && create_if_block_1$1(ctx);

    	const block = {
    		c: function create() {
    			ul = element("ul");
    			if (if_block0) if_block0.c();
    			t0 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t1 = space();
    			if (if_block1) if_block1.c();
    			attr_dev(ul, "class", "slidy-dots svelte-12il57o");
    			toggle_class(ul, "pure", /*controls*/ ctx[6].dotspure);
    			add_location(ul, file$b, 446, 8, 13825);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);
    			if (if_block0) if_block0.m(ul, null);
    			append_dev(ul, t0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			append_dev(ul, t1);
    			if (if_block1) if_block1.m(ul, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*controls*/ ctx[6].dotsarrow) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty[0] & /*controls*/ 64) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_4(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(ul, t0);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (dirty[0] & /*index, controls, $$scope, dots, slides*/ 268436547) {
    				each_value = /*dots*/ ctx[10];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(ul, t1);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (/*controls*/ ctx[6].dotsarrow) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty[0] & /*controls*/ 64) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_1$1(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(ul, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (dirty[0] & /*controls*/ 64) {
    				toggle_class(ul, "pure", /*controls*/ ctx[6].dotspure);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			each_blocks = each_blocks.filter(Boolean_1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);
    			if (if_block0) if_block0.d();
    			destroy_each(each_blocks, detaching);
    			if (if_block1) if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(446:4) {#if controls.dots && init}",
    		ctx
    	});

    	return block;
    }

    // (448:12) {#if controls.dotsarrow}
    function create_if_block_4(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_5, create_else_block_1];
    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (!/*options*/ ctx[7].loop) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_1(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_1(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(448:12) {#if controls.dotsarrow}",
    		ctx
    	});

    	return block;
    }

    // (457:16) {:else}
    function create_else_block_1(ctx) {
    	let li;
    	let current;
    	let mounted;
    	let dispose;
    	const dots_arrow_left_slot_template = /*#slots*/ ctx[29]["dots-arrow-left"];
    	const dots_arrow_left_slot = create_slot(dots_arrow_left_slot_template, ctx, /*$$scope*/ ctx[28], get_dots_arrow_left_slot_context_1);
    	const dots_arrow_left_slot_or_fallback = dots_arrow_left_slot || fallback_block_4(ctx);

    	const block = {
    		c: function create() {
    			li = element("li");
    			if (dots_arrow_left_slot_or_fallback) dots_arrow_left_slot_or_fallback.c();
    			attr_dev(li, "class", "dots-arrow-left svelte-12il57o");
    			add_location(li, file$b, 457, 20, 14318);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);

    			if (dots_arrow_left_slot_or_fallback) {
    				dots_arrow_left_slot_or_fallback.m(li, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(li, "click", /*click_handler_5*/ ctx[37], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dots_arrow_left_slot) {
    				if (dots_arrow_left_slot.p && (!current || dirty[0] & /*$$scope, slides*/ 268435457)) {
    					update_slot_base(
    						dots_arrow_left_slot,
    						dots_arrow_left_slot_template,
    						ctx,
    						/*$$scope*/ ctx[28],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[28])
    						: get_slot_changes(dots_arrow_left_slot_template, /*$$scope*/ ctx[28], dirty, get_dots_arrow_left_slot_changes_1),
    						get_dots_arrow_left_slot_context_1
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(dots_arrow_left_slot_or_fallback, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(dots_arrow_left_slot_or_fallback, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			if (dots_arrow_left_slot_or_fallback) dots_arrow_left_slot_or_fallback.d(detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(457:16) {:else}",
    		ctx
    	});

    	return block;
    }

    // (449:16) {#if !options.loop}
    function create_if_block_5(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*index*/ ctx[1] > 0 && create_if_block_6(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*index*/ ctx[1] > 0) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*index*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_6(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(449:16) {#if !options.loop}",
    		ctx
    	});

    	return block;
    }

    // (460:29) <button>
    function fallback_block_4(ctx) {
    	let button;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "←";
    			attr_dev(button, "class", "svelte-12il57o");
    			add_location(button, file$b, 459, 29, 14454);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block_4.name,
    		type: "fallback",
    		source: "(460:29) <button>",
    		ctx
    	});

    	return block;
    }

    // (450:20) {#if index > 0}
    function create_if_block_6(ctx) {
    	let li;
    	let current;
    	let mounted;
    	let dispose;
    	const dots_arrow_left_slot_template = /*#slots*/ ctx[29]["dots-arrow-left"];
    	const dots_arrow_left_slot = create_slot(dots_arrow_left_slot_template, ctx, /*$$scope*/ ctx[28], get_dots_arrow_left_slot_context);
    	const dots_arrow_left_slot_or_fallback = dots_arrow_left_slot || fallback_block_3(ctx);

    	const block = {
    		c: function create() {
    			li = element("li");
    			if (dots_arrow_left_slot_or_fallback) dots_arrow_left_slot_or_fallback.c();
    			attr_dev(li, "class", "dots-arrow-left svelte-12il57o");
    			add_location(li, file$b, 450, 24, 14013);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);

    			if (dots_arrow_left_slot_or_fallback) {
    				dots_arrow_left_slot_or_fallback.m(li, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(li, "click", /*click_handler_4*/ ctx[36], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dots_arrow_left_slot) {
    				if (dots_arrow_left_slot.p && (!current || dirty[0] & /*$$scope, slides*/ 268435457)) {
    					update_slot_base(
    						dots_arrow_left_slot,
    						dots_arrow_left_slot_template,
    						ctx,
    						/*$$scope*/ ctx[28],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[28])
    						: get_slot_changes(dots_arrow_left_slot_template, /*$$scope*/ ctx[28], dirty, get_dots_arrow_left_slot_changes),
    						get_dots_arrow_left_slot_context
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(dots_arrow_left_slot_or_fallback, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(dots_arrow_left_slot_or_fallback, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			if (dots_arrow_left_slot_or_fallback) dots_arrow_left_slot_or_fallback.d(detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(450:20) {#if index > 0}",
    		ctx
    	});

    	return block;
    }

    // (453:33) <button>
    function fallback_block_3(ctx) {
    	let button;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "←";
    			attr_dev(button, "class", "svelte-12il57o");
    			add_location(button, file$b, 452, 33, 14157);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block_3.name,
    		type: "fallback",
    		source: "(453:33) <button>",
    		ctx
    	});

    	return block;
    }

    // (470:43)                          
    function fallback_block_2(ctx) {
    	let button;

    	let t_value = (/*controls*/ ctx[6].dotsnum && !/*controls*/ ctx[6].dotspure
    	? /*i*/ ctx[63]
    	: "") + "";

    	let t;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(t_value);
    			attr_dev(button, "class", "svelte-12il57o");
    			add_location(button, file$b, 470, 24, 14830);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*controls*/ 64 && t_value !== (t_value = (/*controls*/ ctx[6].dotsnum && !/*controls*/ ctx[6].dotspure
    			? /*i*/ ctx[63]
    			: "") + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block_2.name,
    		type: "fallback",
    		source: "(470:43)                          ",
    		ctx
    	});

    	return block;
    }

    // (465:12) {#each dots as dot, i}
    function create_each_block$3(ctx) {
    	let li;
    	let current;
    	let mounted;
    	let dispose;
    	const dot_slot_template = /*#slots*/ ctx[29].dot;
    	const dot_slot = create_slot(dot_slot_template, ctx, /*$$scope*/ ctx[28], get_dot_slot_context);
    	const dot_slot_or_fallback = dot_slot || fallback_block_2(ctx);

    	function click_handler_6() {
    		return /*click_handler_6*/ ctx[38](/*i*/ ctx[63]);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			if (dot_slot_or_fallback) dot_slot_or_fallback.c();
    			attr_dev(li, "class", "svelte-12il57o");
    			toggle_class(li, "active", /*i*/ ctx[63] === /*index*/ ctx[1]);
    			add_location(li, file$b, 465, 16, 14628);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);

    			if (dot_slot_or_fallback) {
    				dot_slot_or_fallback.m(li, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(li, "click", stop_propagation(click_handler_6), false, false, true);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dot_slot) {
    				if (dot_slot.p && (!current || dirty[0] & /*$$scope, dots, slides*/ 268436481)) {
    					update_slot_base(
    						dot_slot,
    						dot_slot_template,
    						ctx,
    						/*$$scope*/ ctx[28],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[28])
    						: get_slot_changes(dot_slot_template, /*$$scope*/ ctx[28], dirty, get_dot_slot_changes),
    						get_dot_slot_context
    					);
    				}
    			} else {
    				if (dot_slot_or_fallback && dot_slot_or_fallback.p && (!current || dirty[0] & /*controls*/ 64)) {
    					dot_slot_or_fallback.p(ctx, !current ? [-1, -1, -1] : dirty);
    				}
    			}

    			if (dirty[0] & /*index*/ 2) {
    				toggle_class(li, "active", /*i*/ ctx[63] === /*index*/ ctx[1]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(dot_slot_or_fallback, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(dot_slot_or_fallback, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			if (dot_slot_or_fallback) dot_slot_or_fallback.d(detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(465:12) {#each dots as dot, i}",
    		ctx
    	});

    	return block;
    }

    // (479:12) {#if controls.dotsarrow}
    function create_if_block_1$1(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_2$1, create_else_block];
    	const if_blocks = [];

    	function select_block_type_2(ctx, dirty) {
    		if (!/*options*/ ctx[7].loop) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_2(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_2(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(479:12) {#if controls.dotsarrow}",
    		ctx
    	});

    	return block;
    }

    // (488:16) {:else}
    function create_else_block(ctx) {
    	let li;
    	let current;
    	let mounted;
    	let dispose;
    	const dots_arrow_right_slot_template = /*#slots*/ ctx[29]["dots-arrow-right"];
    	const dots_arrow_right_slot = create_slot(dots_arrow_right_slot_template, ctx, /*$$scope*/ ctx[28], get_dots_arrow_right_slot_context_1);
    	const dots_arrow_right_slot_or_fallback = dots_arrow_right_slot || fallback_block_1(ctx);

    	const block = {
    		c: function create() {
    			li = element("li");
    			if (dots_arrow_right_slot_or_fallback) dots_arrow_right_slot_or_fallback.c();
    			attr_dev(li, "class", "dots-arrow-right svelte-12il57o");
    			add_location(li, file$b, 488, 20, 15541);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);

    			if (dots_arrow_right_slot_or_fallback) {
    				dots_arrow_right_slot_or_fallback.m(li, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(li, "click", /*click_handler_8*/ ctx[40], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dots_arrow_right_slot) {
    				if (dots_arrow_right_slot.p && (!current || dirty[0] & /*$$scope, slides*/ 268435457)) {
    					update_slot_base(
    						dots_arrow_right_slot,
    						dots_arrow_right_slot_template,
    						ctx,
    						/*$$scope*/ ctx[28],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[28])
    						: get_slot_changes(dots_arrow_right_slot_template, /*$$scope*/ ctx[28], dirty, get_dots_arrow_right_slot_changes_1),
    						get_dots_arrow_right_slot_context_1
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(dots_arrow_right_slot_or_fallback, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(dots_arrow_right_slot_or_fallback, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			if (dots_arrow_right_slot_or_fallback) dots_arrow_right_slot_or_fallback.d(detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(488:16) {:else}",
    		ctx
    	});

    	return block;
    }

    // (480:16) {#if !options.loop}
    function create_if_block_2$1(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*index*/ ctx[1] < /*slides*/ ctx[0].length - 1 && create_if_block_3(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*index*/ ctx[1] < /*slides*/ ctx[0].length - 1) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*index, slides*/ 3) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_3(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(480:16) {#if !options.loop}",
    		ctx
    	});

    	return block;
    }

    // (491:29) <button>
    function fallback_block_1(ctx) {
    	let button;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "→";
    			attr_dev(button, "class", "svelte-12il57o");
    			add_location(button, file$b, 490, 29, 15679);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block_1.name,
    		type: "fallback",
    		source: "(491:29) <button>",
    		ctx
    	});

    	return block;
    }

    // (481:20) {#if index < slides.length - 1}
    function create_if_block_3(ctx) {
    	let li;
    	let current;
    	let mounted;
    	let dispose;
    	const dots_arrow_right_slot_template = /*#slots*/ ctx[29]["dots-arrow-right"];
    	const dots_arrow_right_slot = create_slot(dots_arrow_right_slot_template, ctx, /*$$scope*/ ctx[28], get_dots_arrow_right_slot_context);
    	const dots_arrow_right_slot_or_fallback = dots_arrow_right_slot || fallback_block(ctx);

    	const block = {
    		c: function create() {
    			li = element("li");
    			if (dots_arrow_right_slot_or_fallback) dots_arrow_right_slot_or_fallback.c();
    			attr_dev(li, "class", "dots-arrow-right svelte-12il57o");
    			add_location(li, file$b, 481, 24, 15234);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);

    			if (dots_arrow_right_slot_or_fallback) {
    				dots_arrow_right_slot_or_fallback.m(li, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(li, "click", /*click_handler_7*/ ctx[39], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dots_arrow_right_slot) {
    				if (dots_arrow_right_slot.p && (!current || dirty[0] & /*$$scope, slides*/ 268435457)) {
    					update_slot_base(
    						dots_arrow_right_slot,
    						dots_arrow_right_slot_template,
    						ctx,
    						/*$$scope*/ ctx[28],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[28])
    						: get_slot_changes(dots_arrow_right_slot_template, /*$$scope*/ ctx[28], dirty, get_dots_arrow_right_slot_changes),
    						get_dots_arrow_right_slot_context
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(dots_arrow_right_slot_or_fallback, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(dots_arrow_right_slot_or_fallback, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			if (dots_arrow_right_slot_or_fallback) dots_arrow_right_slot_or_fallback.d(detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(481:20) {#if index < slides.length - 1}",
    		ctx
    	});

    	return block;
    }

    // (484:33) <button>
    function fallback_block(ctx) {
    	let button;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "→";
    			attr_dev(button, "class", "svelte-12il57o");
    			add_location(button, file$b, 483, 33, 15380);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block.name,
    		type: "fallback",
    		source: "(484:33) <button>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let section;
    	let t0;
    	let ul;
    	let ul_style_value;
    	let t1;
    	let t2;
    	let section_id_value;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = !/*init*/ ctx[2] && create_if_block_13(ctx);
    	let if_block1 = /*slides*/ ctx[0] && create_if_block_11(ctx);
    	let if_block2 = /*controls*/ ctx[6].arrows && /*init*/ ctx[2] && create_if_block_7(ctx);
    	let if_block3 = /*controls*/ ctx[6].dots && /*init*/ ctx[2] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			section = element("section");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			ul = element("ul");
    			if (if_block1) if_block1.c();
    			t1 = space();
    			if (if_block2) if_block2.c();
    			t2 = space();
    			if (if_block3) if_block3.c();
    			attr_dev(ul, "class", "slidy-ul svelte-12il57o");
    			attr_dev(ul, "style", ul_style_value = /*move*/ ctx[12]());
    			add_location(ul, file$b, 393, 4, 11734);
    			attr_dev(section, "role", "region");
    			attr_dev(section, "tabindex", "0");
    			attr_dev(section, "aria-label", "Slidy");
    			attr_dev(section, "id", section_id_value = /*wrap*/ ctx[4].id);
    			attr_dev(section, "class", "slidy svelte-12il57o");
    			set_style(section, "--wrapw", /*wrap*/ ctx[4].width);
    			set_style(section, "--wraph", /*wrap*/ ctx[4].height);
    			set_style(section, "--wrapp", /*wrap*/ ctx[4].padding);
    			set_style(section, "--slidew", /*slide*/ ctx[5].width);
    			set_style(section, "--slideh", /*slide*/ ctx[5].height);
    			set_style(section, "--slidef", /*slide*/ ctx[5].objectfit);
    			set_style(section, "--slideo", /*slide*/ ctx[5].overflow);

    			set_style(section, "--slideg", /*axisy*/ ctx[9]
    			? `${/*slide*/ ctx[5].gap}px 0 0 0`
    			: `0 0 0 ${/*slide*/ ctx[5].gap}px`);

    			set_style(section, "--dur", /*options*/ ctx[7].duration + "ms");
    			toggle_class(section, "loaded", /*init*/ ctx[2]);
    			toggle_class(section, "axisy", /*axisy*/ ctx[9]);
    			toggle_class(section, "autowidth", /*slide*/ ctx[5].width === "auto");
    			toggle_class(section, "antiloop", /*options*/ ctx[7].loop === false);
    			toggle_class(section, "alignmiddle", /*wrap*/ ctx[4].align === "middle");
    			toggle_class(section, "alignstart", /*wrap*/ ctx[4].align === "start");
    			toggle_class(section, "alignend", /*wrap*/ ctx[4].align === "end");
    			add_location(section, file$b, 358, 0, 10701);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			if (if_block0) if_block0.m(section, null);
    			append_dev(section, t0);
    			append_dev(section, ul);
    			if (if_block1) if_block1.m(ul, null);
    			append_dev(section, t1);
    			if (if_block2) if_block2.m(section, null);
    			append_dev(section, t2);
    			if (if_block3) if_block3.m(section, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(ul, "contextmenu", /*contextmenu_handler*/ ctx[31], false, false, false),
    					action_destroyer(resize(section)),
    					listen_dev(section, "resize", /*resizeWrap*/ ctx[13], false, false, false),
    					action_destroyer(wheel(section)),
    					listen_dev(
    						section,
    						"wheels",
    						function () {
    							if (is_function(/*controls*/ ctx[6].wheel
    							? /*slidyWheel*/ ctx[14]
    							: null)) (/*controls*/ ctx[6].wheel
    							? /*slidyWheel*/ ctx[14]
    							: null).apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(
    						section,
    						"keydown",
    						function () {
    							if (is_function(/*controls*/ ctx[6].keys ? /*slidyKeys*/ ctx[18] : null)) (/*controls*/ ctx[6].keys ? /*slidyKeys*/ ctx[18] : null).apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (!/*init*/ ctx[2]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty[0] & /*init*/ 4) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_13(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(section, t0);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*slides*/ ctx[0]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty[0] & /*slides*/ 1) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_11(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(ul, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty[0] & /*move*/ 4096 && ul_style_value !== (ul_style_value = /*move*/ ctx[12]())) {
    				attr_dev(ul, "style", ul_style_value);
    			}

    			if (/*controls*/ ctx[6].arrows && /*init*/ ctx[2]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty[0] & /*controls, init*/ 68) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_7(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(section, t2);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}

    			if (/*controls*/ ctx[6].dots && /*init*/ ctx[2]) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);

    					if (dirty[0] & /*controls, init*/ 68) {
    						transition_in(if_block3, 1);
    					}
    				} else {
    					if_block3 = create_if_block$1(ctx);
    					if_block3.c();
    					transition_in(if_block3, 1);
    					if_block3.m(section, null);
    				}
    			} else if (if_block3) {
    				group_outros();

    				transition_out(if_block3, 1, 1, () => {
    					if_block3 = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty[0] & /*wrap*/ 16 && section_id_value !== (section_id_value = /*wrap*/ ctx[4].id)) {
    				attr_dev(section, "id", section_id_value);
    			}

    			if (!current || dirty[0] & /*wrap*/ 16) {
    				set_style(section, "--wrapw", /*wrap*/ ctx[4].width);
    			}

    			if (!current || dirty[0] & /*wrap*/ 16) {
    				set_style(section, "--wraph", /*wrap*/ ctx[4].height);
    			}

    			if (!current || dirty[0] & /*wrap*/ 16) {
    				set_style(section, "--wrapp", /*wrap*/ ctx[4].padding);
    			}

    			if (!current || dirty[0] & /*slide*/ 32) {
    				set_style(section, "--slidew", /*slide*/ ctx[5].width);
    			}

    			if (!current || dirty[0] & /*slide*/ 32) {
    				set_style(section, "--slideh", /*slide*/ ctx[5].height);
    			}

    			if (!current || dirty[0] & /*slide*/ 32) {
    				set_style(section, "--slidef", /*slide*/ ctx[5].objectfit);
    			}

    			if (!current || dirty[0] & /*slide*/ 32) {
    				set_style(section, "--slideo", /*slide*/ ctx[5].overflow);
    			}

    			if (!current || dirty[0] & /*axisy, slide*/ 544) {
    				set_style(section, "--slideg", /*axisy*/ ctx[9]
    				? `${/*slide*/ ctx[5].gap}px 0 0 0`
    				: `0 0 0 ${/*slide*/ ctx[5].gap}px`);
    			}

    			if (!current || dirty[0] & /*options*/ 128) {
    				set_style(section, "--dur", /*options*/ ctx[7].duration + "ms");
    			}

    			if (dirty[0] & /*init*/ 4) {
    				toggle_class(section, "loaded", /*init*/ ctx[2]);
    			}

    			if (dirty[0] & /*axisy*/ 512) {
    				toggle_class(section, "axisy", /*axisy*/ ctx[9]);
    			}

    			if (dirty[0] & /*slide*/ 32) {
    				toggle_class(section, "autowidth", /*slide*/ ctx[5].width === "auto");
    			}

    			if (dirty[0] & /*options*/ 128) {
    				toggle_class(section, "antiloop", /*options*/ ctx[7].loop === false);
    			}

    			if (dirty[0] & /*wrap*/ 16) {
    				toggle_class(section, "alignmiddle", /*wrap*/ ctx[4].align === "middle");
    			}

    			if (dirty[0] & /*wrap*/ 16) {
    				toggle_class(section, "alignstart", /*wrap*/ ctx[4].align === "start");
    			}

    			if (dirty[0] & /*wrap*/ 16) {
    				toggle_class(section, "alignend", /*wrap*/ ctx[4].align === "end");
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(if_block2);
    			transition_in(if_block3);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			transition_out(if_block3);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let render;
    	let axisy;
    	let move;
    	let { $$slots: slots = {}, $$scope } = $$props;

    	validate_slots('Slidy', slots, [
    		'loader','default','arrow-left','arrow-right','dots-arrow-left','dot','dots-arrow-right'
    	]);

    	let { slides = [], key = item => item.id || item[slide.imgsrckey], wrap = {
    		id: null,
    		width: "100%",
    		height: "50%",
    		padding: "0",
    		align: "middle",
    		alignmargin: 0
    	}, slide = {
    		gap: 0,
    		class: "",
    		width: "50%",
    		height: "100%",
    		backimg: false,
    		imgsrckey: "src",
    		objectfit: "cover",
    		overflow: "hidden"
    	}, controls = {
    		dots: true,
    		dotsnum: true,
    		dotsarrow: true,
    		dotspure: false,
    		arrows: true,
    		keys: true,
    		drag: true,
    		wheel: true
    	}, options = {
    		axis: "x",
    		loop: true,
    		duration: 450,
    		sensity: 0.3
    	}, index = 4, init = true, timeout = 0 } = $$props;

    	function slidyInit() {
    		if (slides) {
    			$$invalidate(0, slides = $$invalidate(10, dots = slides.map((s, i) => {
    				return { ix: i, ...s };
    			})));

    			timeout > 0
    			? setTimeout(() => $$invalidate(2, init = true), timeout)
    			: $$invalidate(2, init);
    		}
    	}

    	// SIZES ---------------------------------------------------
    	let nodes = [], dots = [], el = {}, aix = 0;

    	function slidySizes() {
    		if (render) {
    			aix = options.loop ? Math.floor(slides.length / 2) : index;

    			$$invalidate(20, el = {
    				active: {
    					ix: slides[aix].ix,
    					width: nodes[aix].offsetWidth + slide.gap,
    					height: nodes[aix].offsetHeight + slide.gap
    				},
    				first: {
    					width: nodes[0].offsetWidth + slide.gap,
    					height: nodes[0].offsetHeight + slide.gap
    				},
    				last: {
    					width: nodes[slides.length - 1].offsetWidth + slide.gap,
    					height: nodes[slides.length - 1].offsetHeight + slide.gap
    				},
    				before: {
    					width: nodes.map((a, i) => i < index ? a.offsetWidth + slide.gap : null).reduce((p, v) => p + v),
    					height: nodes.map((a, i) => i < index ? a.offsetHeight + slide.gap : null).reduce((p, v) => p + v)
    				},
    				after: {
    					width: nodes.map((a, i) => i > index ? a.offsetWidth + slide.gap : null).reduce((p, v) => p + v),
    					height: nodes.map((a, i) => i > index ? a.offsetHeight + slide.gap : null).reduce((p, v) => p + v)
    				}
    			});
    		}
    	}

    	let size = {}, diff = {};

    	function slidyMatch() {
    		if (render) {
    			$$invalidate(21, size = {
    				first: axisy ? el.first.height : el.first.width,
    				last: axisy ? el.last.height : el.last.width,
    				active: axisy ? el.active.height : el.active.width,
    				before: axisy ? el.before.height : el.before.width,
    				after: axisy ? el.after.height : el.after.width,
    				wrap: axisy ? wh : ww
    			});

    			$$invalidate(22, diff = {
    				align: (size.wrap - size.active + slide.gap) / 2 - wrap.alignmargin,
    				pos: (size.before - size.after) / 2 - pos
    			});
    		}
    	}

    	// RESIZE-OBSERVER ----------------------------------------------
    	let ww, wh;

    	function resizeWrap(e) {
    		ww = e.detail.CR.width;
    		wh = e.detail.CR.height;
    		slidySizes();
    	}

    	// CONTROLS & ANIMATION -----------------------------------------
    	let pos = 0, comp = 0, translate = 0, transition = options.duration;

    	function prev() {
    		$$invalidate(0, slides = [slides[slides.length - 1], ...slides.slice(0, -1)]);
    	}

    	function next() {
    		$$invalidate(0, slides = [...slides.slice(1), slides[0]]);
    	}

    	let ix = index;

    	function slidyIndex(id) {
    		while (ix > id) {
    			$$invalidate(26, transition = options.duration);

    			if (options.loop) {
    				$$invalidate(23, pos += size.last);
    				$$invalidate(24, comp = -pos);
    				prev();
    			}

    			ix--;
    		}

    		while (ix < id) {
    			$$invalidate(26, transition = options.duration);

    			if (options.loop) {
    				$$invalidate(23, pos -= size.first);
    				$$invalidate(24, comp = -pos);
    				next();
    			}

    			ix++;
    		}
    	}

    	// LOOP ------------------------------------------------------
    	function slidyLoop() {
    		if (pos >= size.last) {
    			options.loop ? prev() : $$invalidate(1, index = ix -= 1);
    			$$invalidate(23, pos = $$invalidate(24, comp = 0));
    		} else if (pos <= -size.first) {
    			options.loop ? next() : $$invalidate(1, index = ix += 1);
    			$$invalidate(23, pos = $$invalidate(24, comp = 0));
    		}

    		options.loop
    		? $$invalidate(1, index = ix = el.active.ix)
    		: pos >= size.before || pos <= -size.after
    			? $$invalidate(23, pos = pos / 1.5)
    			: $$invalidate(23, pos);
    	}

    	// STOP ---------------------------------------------------------------------------
    	let transtime;

    	function slidyStop() {
    		$$invalidate(26, transition = options.duration);

    		const nulled = direct => {
    			if (direct) {
    				if (options.loop) {
    					// direct();
    					slidyLoop();

    					$$invalidate(23, pos = speed = $$invalidate(26, transition = 0));
    					tick().then(() => $$invalidate(1, index = ix = el.active.ix));
    					clearTimeout(transtime);
    				} else {
    					$$invalidate(1, index = direct);
    					$$invalidate(23, pos = speed = 0);
    				}
    			} else {
    				$$invalidate(23, pos = $$invalidate(24, comp = speed = 0));
    			}
    		};

    		if (pos > size.last / 3 || speed < -options.sensity) {
    			if (options.loop) {
    				$$invalidate(23, pos += size.last - pos);
    				transtime = setTimeout(() => nulled(prev), transition);
    			} else {
    				nulled($$invalidate(1, index = ix -= 1));
    			}
    		} else if (pos < -size.first / 3 || speed > options.sensity) {
    			if (options.loop) {
    				$$invalidate(23, pos -= size.first + pos);
    				transtime = setTimeout(() => nulled(next), transition);
    			} else {
    				nulled($$invalidate(1, index = ix += 1));
    			}
    		} else {
    			nulled();
    		}
    	}

    	// NULL ------------------------------------------------------
    	function slidyNull() {
    		$$invalidate(26, transition = 0);
    		comp !== 0 && $$invalidate(24, comp = $$invalidate(23, pos = speed = 0));
    		transtime !== null && clearTimeout(transtime);
    		wheeltime !== null && clearTimeout(wheeltime);
    		dragtime !== null && clearInterval(dragtime);
    		return;
    	}

    	// WHEEL -----------------------------------------------------
    	const axiscoord = e => Math.floor(axisy ? e.detail.dy : e.detail.dx) * 1.6;

    	let iswheel = false, wheeltime;

    	function slidyWheel(e) {
    		slidyNull();
    		iswheel = true;
    		$$invalidate(23, pos -= axiscoord(e));
    		slidyLoop();

    		wheeltime = setTimeout(
    			() => {
    				iswheel = false;
    				clearTimeout(wheeltime);
    				slidyStop();
    			},
    			options.duration / 2
    		);
    	}

    	// DRAG -------------------------------------------------------
    	let isdrag = false, htx = 0, speed = 0, dragtime;

    	function dragStart() {
    		slidyNull();
    		$$invalidate(11, isdrag = true);
    	}

    	function dragSlide(e) {
    		$$invalidate(23, pos += axiscoord(e));
    		dragtime = setInterval(() => htx = pos, 60);
    		speed = (htx - pos) / 60;
    		slidyLoop();
    	}

    	function dragStop() {
    		$$invalidate(11, isdrag = false);
    		$$invalidate(23, pos += pos * speed / 1.6);
    		clearInterval(dragtime);
    		slidyStop();
    	}

    	// KEYS -------------------------------------------------------
    	function slidyKeys(e) {
    		if (e.keyCode === 37 || e.keyCode === 38) {
    			$$invalidate(1, index--, index);
    		} else if (e.keyCode === 39 || e.keyCode === 40) {
    			$$invalidate(1, index++, index);
    		}
    	}

    	const writable_props = [
    		'slides',
    		'key',
    		'wrap',
    		'slide',
    		'controls',
    		'options',
    		'index',
    		'init',
    		'timeout'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Slidy> was created with unknown prop '${key}'`);
    	});

    	function li_binding($$value, i) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			nodes[i] = $$value;
    			$$invalidate(8, nodes);
    			$$invalidate(0, slides);
    		});
    	}

    	const contextmenu_handler = () => $$invalidate(11, isdrag = false);
    	const click_handler = () => $$invalidate(1, index--, index);
    	const click_handler_1 = () => $$invalidate(1, index++, index);
    	const click_handler_2 = () => $$invalidate(1, index--, index);
    	const click_handler_3 = () => $$invalidate(1, index++, index);
    	const click_handler_4 = () => $$invalidate(1, index--, index);
    	const click_handler_5 = () => $$invalidate(1, index--, index);
    	const click_handler_6 = i => $$invalidate(1, index = i);
    	const click_handler_7 = () => $$invalidate(1, index++, index);
    	const click_handler_8 = () => $$invalidate(1, index++, index);

    	$$self.$$set = $$props => {
    		if ('slides' in $$props) $$invalidate(0, slides = $$props.slides);
    		if ('key' in $$props) $$invalidate(3, key = $$props.key);
    		if ('wrap' in $$props) $$invalidate(4, wrap = $$props.wrap);
    		if ('slide' in $$props) $$invalidate(5, slide = $$props.slide);
    		if ('controls' in $$props) $$invalidate(6, controls = $$props.controls);
    		if ('options' in $$props) $$invalidate(7, options = $$props.options);
    		if ('index' in $$props) $$invalidate(1, index = $$props.index);
    		if ('init' in $$props) $$invalidate(2, init = $$props.init);
    		if ('timeout' in $$props) $$invalidate(19, timeout = $$props.timeout);
    		if ('$$scope' in $$props) $$invalidate(28, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		tick,
    		action,
    		slides,
    		key,
    		wrap,
    		slide,
    		controls,
    		options,
    		index,
    		init,
    		timeout,
    		slidyInit,
    		nodes,
    		dots,
    		el,
    		aix,
    		slidySizes,
    		size,
    		diff,
    		slidyMatch,
    		ww,
    		wh,
    		resizeWrap,
    		pos,
    		comp,
    		translate,
    		transition,
    		prev,
    		next,
    		ix,
    		slidyIndex,
    		slidyLoop,
    		transtime,
    		slidyStop,
    		slidyNull,
    		axiscoord,
    		iswheel,
    		wheeltime,
    		slidyWheel,
    		isdrag,
    		htx,
    		speed,
    		dragtime,
    		dragStart,
    		dragSlide,
    		dragStop,
    		slidyKeys,
    		axisy,
    		move,
    		render
    	});

    	$$self.$inject_state = $$props => {
    		if ('slides' in $$props) $$invalidate(0, slides = $$props.slides);
    		if ('key' in $$props) $$invalidate(3, key = $$props.key);
    		if ('wrap' in $$props) $$invalidate(4, wrap = $$props.wrap);
    		if ('slide' in $$props) $$invalidate(5, slide = $$props.slide);
    		if ('controls' in $$props) $$invalidate(6, controls = $$props.controls);
    		if ('options' in $$props) $$invalidate(7, options = $$props.options);
    		if ('index' in $$props) $$invalidate(1, index = $$props.index);
    		if ('init' in $$props) $$invalidate(2, init = $$props.init);
    		if ('timeout' in $$props) $$invalidate(19, timeout = $$props.timeout);
    		if ('nodes' in $$props) $$invalidate(8, nodes = $$props.nodes);
    		if ('dots' in $$props) $$invalidate(10, dots = $$props.dots);
    		if ('el' in $$props) $$invalidate(20, el = $$props.el);
    		if ('aix' in $$props) aix = $$props.aix;
    		if ('size' in $$props) $$invalidate(21, size = $$props.size);
    		if ('diff' in $$props) $$invalidate(22, diff = $$props.diff);
    		if ('ww' in $$props) ww = $$props.ww;
    		if ('wh' in $$props) wh = $$props.wh;
    		if ('pos' in $$props) $$invalidate(23, pos = $$props.pos);
    		if ('comp' in $$props) $$invalidate(24, comp = $$props.comp);
    		if ('translate' in $$props) $$invalidate(25, translate = $$props.translate);
    		if ('transition' in $$props) $$invalidate(26, transition = $$props.transition);
    		if ('ix' in $$props) ix = $$props.ix;
    		if ('transtime' in $$props) transtime = $$props.transtime;
    		if ('iswheel' in $$props) iswheel = $$props.iswheel;
    		if ('wheeltime' in $$props) wheeltime = $$props.wheeltime;
    		if ('isdrag' in $$props) $$invalidate(11, isdrag = $$props.isdrag);
    		if ('htx' in $$props) htx = $$props.htx;
    		if ('speed' in $$props) speed = $$props.speed;
    		if ('dragtime' in $$props) dragtime = $$props.dragtime;
    		if ('axisy' in $$props) $$invalidate(9, axisy = $$props.axisy);
    		if ('move' in $$props) $$invalidate(12, move = $$props.move);
    		if ('render' in $$props) $$invalidate(27, render = $$props.render);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*nodes*/ 256) {
    			$$invalidate(8, nodes = nodes.filter(Boolean));
    		}

    		if ($$self.$$.dirty[0] & /*nodes, slides*/ 257) {
    			$$invalidate(27, render = nodes.length !== 0 && slides.length !== 0 && nodes.length === slides.length);
    		}

    		if ($$self.$$.dirty[0] & /*render, slides*/ 134217729) {
    			// INIT -------------------------------------------------
    			render && slidyInit();
    		}

    		if ($$self.$$.dirty[0] & /*init, index, options, slides*/ 135) {
    			// INDEX ------------------------------------------------------
    			if (init) {
    				if (index < 0) {
    					if (options.loop) {
    						$$invalidate(1, index = slides.length - 1);
    						ix = slides.length;
    					} else {
    						$$invalidate(1, index = 0);
    					}
    				} else if (index > slides.length - 1) {
    					if (options.loop) {
    						$$invalidate(1, index = 0);
    						ix = -1;
    					} else {
    						$$invalidate(1, index = slides.length - 1);
    					}
    				}
    			}
    		}

    		if ($$self.$$.dirty[0] & /*render, pos, index*/ 142606338) {
    			render && slidySizes();
    		}

    		if ($$self.$$.dirty[0] & /*options*/ 128) {
    			$$invalidate(9, axisy = options.axis === "y");
    		}

    		if ($$self.$$.dirty[0] & /*render, el*/ 135266304) {
    			render && slidyMatch();
    		}

    		if ($$self.$$.dirty[0] & /*wrap, slides, options, pos, diff, size*/ 14680209) {
    			if (wrap.align === "end") {
    				$$invalidate(25, translate = slides.length % 2 === 0
    				? options.loop
    					? pos + diff.align - size.active / 2
    					: -diff.pos + diff.align
    				: options.loop ? pos + diff.align : -diff.pos + diff.align);
    			} else if (wrap.align === "start") {
    				$$invalidate(25, translate = slides.length % 2 === 0
    				? options.loop
    					? pos - diff.align - size.active / 2
    					: -diff.pos - diff.align
    				: options.loop ? pos - diff.align : -diff.pos - diff.align);
    			} else {
    				$$invalidate(25, translate = slides.length % 2 === 0
    				? options.loop ? pos - size.active / 2 : -diff.pos
    				: options.loop ? pos : -diff.pos);
    			}
    		}

    		if ($$self.$$.dirty[0] & /*axisy, translate, comp, transition*/ 117441024) {
    			$$invalidate(12, move = () => {
    				if (axisy) {
    					return `transform: translate(0, ${translate}px); top: ${comp}px; transition: transform ${transition}ms;`;
    				} else {
    					return `transform: translate(${translate}px, 0); left: ${comp}px; transition: transform ${transition}ms;`;
    				}
    			});
    		}

    		if ($$self.$$.dirty[0] & /*init, index*/ 6) {
    			init && slidyIndex(index);
    		}
    	};

    	return [
    		slides,
    		index,
    		init,
    		key,
    		wrap,
    		slide,
    		controls,
    		options,
    		nodes,
    		axisy,
    		dots,
    		isdrag,
    		move,
    		resizeWrap,
    		slidyWheel,
    		dragStart,
    		dragSlide,
    		dragStop,
    		slidyKeys,
    		timeout,
    		el,
    		size,
    		diff,
    		pos,
    		comp,
    		translate,
    		transition,
    		render,
    		$$scope,
    		slots,
    		li_binding,
    		contextmenu_handler,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5,
    		click_handler_6,
    		click_handler_7,
    		click_handler_8
    	];
    }

    class Slidy extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$b,
    			create_fragment$b,
    			safe_not_equal,
    			{
    				slides: 0,
    				key: 3,
    				wrap: 4,
    				slide: 5,
    				controls: 6,
    				options: 7,
    				index: 1,
    				init: 2,
    				timeout: 19
    			},
    			null,
    			[-1, -1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Slidy",
    			options,
    			id: create_fragment$b.name
    		});
    	}

    	get slides() {
    		throw new Error("<Slidy>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set slides(value) {
    		throw new Error("<Slidy>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get key() {
    		throw new Error("<Slidy>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set key(value) {
    		throw new Error("<Slidy>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get wrap() {
    		throw new Error("<Slidy>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set wrap(value) {
    		throw new Error("<Slidy>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get slide() {
    		throw new Error("<Slidy>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set slide(value) {
    		throw new Error("<Slidy>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get controls() {
    		throw new Error("<Slidy>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set controls(value) {
    		throw new Error("<Slidy>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get options() {
    		throw new Error("<Slidy>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set options(value) {
    		throw new Error("<Slidy>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get index() {
    		throw new Error("<Slidy>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set index(value) {
    		throw new Error("<Slidy>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get init() {
    		throw new Error("<Slidy>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set init(value) {
    		throw new Error("<Slidy>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get timeout() {
    		throw new Error("<Slidy>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set timeout(value) {
    		throw new Error("<Slidy>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/CtaBottom.svelte generated by Svelte v3.41.0 */

    const file$a = "src/CtaBottom.svelte";

    function create_fragment$a(ctx) {
    	let nav;
    	let button0;
    	let t1;
    	let button1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			button0 = element("button");
    			button0.textContent = "Mobile";
    			t1 = space();
    			button1 = element("button");
    			button1.textContent = "Mobile";
    			attr_dev(button0, "class", "\n    h4 w-50\n    pointer hover-white transition\n    bn bg-oxford\n    f3 tc mercury white-60 ts1-dark-gray");
    			add_location(button0, file$a, 4, 0, 210);
    			attr_dev(button1, "class", "\n    h4 w-50\n    pointer hover-white transition\n    bn bg-spa\n    f3 tc mercury white-60 ts1-dark-gray");
    			add_location(button1, file$a, 14, 0, 467);
    			attr_dev(nav, "class", "w-third-m w-third-l z-1 fl\ndn dn-ns flex-m flex-l flex-nowrap flex-row justify-center");
    			add_location(nav, file$a, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, button0);
    			append_dev(nav, t1);
    			append_dev(nav, button1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[0], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[1], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('CtaBottom', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<CtaBottom> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => window.location.href = 'tel:+447426646183';
    	const click_handler_1 = () => window.location.href = 'tel:+447861686443';
    	return [click_handler, click_handler_1];
    }

    class CtaBottom extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CtaBottom",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    /* src/Thumbs.svelte generated by Svelte v3.41.0 */
    const file$9 = "src/Thumbs.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	child_ctx[7] = i;
    	return child_ctx;
    }

    // (47:2) {#each items as thumb, i}
    function create_each_block$2(ctx) {
    	let button;
    	let t0_value = /*thumb*/ ctx[5].header + "";
    	let t0;
    	let t1;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[4](/*i*/ ctx[7]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(button, "class", "\n      h4\n      pointer glow transition\n      o-70 bn bg-transparent backface-hidden\n      ph0 ph0-ns ph0-m ph3-l\n      f4 f4-ns f3-m f3-l tc mercury lemon ts1-dark-gray svelte-5jfvee");
    			set_style(button, "will-change", "opacity");
    			set_style(button, "background-image", "url(" + /*thumb*/ ctx[5].src + ") no-repeat center center fixed");
    			toggle_class(button, "active", /*i*/ ctx[7] === /*index*/ ctx[0]);
    			add_location(button, file$9, 47, 4, 932);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t0);
    			append_dev(button, t1);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*items*/ 4 && t0_value !== (t0_value = /*thumb*/ ctx[5].header + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*items*/ 4) {
    				set_style(button, "background-image", "url(" + /*thumb*/ ctx[5].src + ") no-repeat center center fixed");
    			}

    			if (dirty & /*index*/ 1) {
    				toggle_class(button, "active", /*i*/ ctx[7] === /*index*/ ctx[0]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(47:2) {#each items as thumb, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let ctabottom;
    	let t;
    	let nav;
    	let current;
    	let mounted;
    	let dispose;
    	ctabottom = new CtaBottom({ $$inline: true });
    	let each_value = /*items*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			create_component(ctabottom.$$.fragment);
    			t = space();
    			nav = element("nav");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(nav, "class", "w-100 w-100-ns w-two-thirds-m w-two-thirds-l z-1 fr\nflex flex-nowrap flex-row justify-around svelte-5jfvee");
    			add_location(nav, file$9, 44, 0, 793);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(ctabottom, target, anchor);
    			insert_dev(target, t, anchor);
    			insert_dev(target, nav, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(nav, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(window, "keydown", /*handleKeydown*/ ctx[3], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*items, index, duration, setTimeout*/ 7) {
    				each_value = /*items*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(nav, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(ctabottom.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(ctabottom.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(ctabottom, detaching);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(nav);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Thumbs', slots, []);
    	let { items, index, duration } = $$props;

    	//import PrevNextKeys from './PrevNextKeys.svelte'
    	// Named functions are better, how is Slidy instance exposed up here?
    	/* dragging and event propagation:
        svelte.dev/repl/adf5a97b91164c239cc1e6d0c76c2abe?version=3.14.1
    */
    	function handleKeydown(event) {
    		if (event.key === 'ArrowRight') {
    			$$invalidate(0, index++, index);
    		} else if (event.key === 'ArrowLeft') {
    			$$invalidate(0, index--, index);
    		} else {
    			//alert(`pressed the ${event.key} key`);
    			return;
    		}
    	}

    	const writable_props = ['items', 'index', 'duration'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Thumbs> was created with unknown prop '${key}'`);
    	});

    	const click_handler = i => {
    		($$invalidate(1, duration = 0), $$invalidate(0, index = i));

    		setTimeout(
    			() => {
    				$$invalidate(1, duration = 360);
    			},
    			80
    		);
    	};

    	$$self.$$set = $$props => {
    		if ('items' in $$props) $$invalidate(2, items = $$props.items);
    		if ('index' in $$props) $$invalidate(0, index = $$props.index);
    		if ('duration' in $$props) $$invalidate(1, duration = $$props.duration);
    	};

    	$$self.$capture_state = () => ({
    		items,
    		index,
    		duration,
    		CtaBottom,
    		handleKeydown
    	});

    	$$self.$inject_state = $$props => {
    		if ('items' in $$props) $$invalidate(2, items = $$props.items);
    		if ('index' in $$props) $$invalidate(0, index = $$props.index);
    		if ('duration' in $$props) $$invalidate(1, duration = $$props.duration);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [index, duration, items, handleKeydown, click_handler];
    }

    class Thumbs extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { items: 2, index: 0, duration: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Thumbs",
    			options,
    			id: create_fragment$9.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*items*/ ctx[2] === undefined && !('items' in props)) {
    			console.warn("<Thumbs> was created without expected prop 'items'");
    		}

    		if (/*index*/ ctx[0] === undefined && !('index' in props)) {
    			console.warn("<Thumbs> was created without expected prop 'index'");
    		}

    		if (/*duration*/ ctx[1] === undefined && !('duration' in props)) {
    			console.warn("<Thumbs> was created without expected prop 'duration'");
    		}
    	}

    	get items() {
    		throw new Error("<Thumbs>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set items(value) {
    		throw new Error("<Thumbs>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get index() {
    		throw new Error("<Thumbs>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set index(value) {
    		throw new Error("<Thumbs>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get duration() {
    		throw new Error("<Thumbs>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set duration(value) {
    		throw new Error("<Thumbs>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Welcome.svelte generated by Svelte v3.41.0 */

    const file$8 = "src/Welcome.svelte";

    function create_fragment$8(ctx) {
    	let div;
    	let header;
    	let h1;
    	let t1;
    	let h2;

    	const block = {
    		c: function create() {
    			div = element("div");
    			header = element("header");
    			h1 = element("h1");
    			h1.textContent = "G. Miliotis & Son";
    			t1 = space();
    			h2 = element("h2");
    			h2.textContent = "Wholesale Mediterranean Foods";
    			attr_dev(h1, "class", "underline mb0");
    			add_location(h1, file$8, 9, 4, 250);
    			attr_dev(h2, "class", "f3 mt0");
    			add_location(h2, file$8, 10, 2, 320);
    			attr_dev(header, "class", "dtc v-mid tc mercury lemon ts1-dark-gray");
    			add_location(header, file$8, 8, 2, 188);
    			attr_dev(div, "id", "thing");
    			attr_dev(div, "class", "vh-50 dt cover z-1 bg-center");
    			set_style(div, "background-image", "url(" + /*cover*/ ctx[0] + ")");
    			set_style(div, "width", "101%");
    			set_style(div, "overflow", "hidden");
    			add_location(div, file$8, 3, 0, 59);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, header);
    			append_dev(header, h1);
    			append_dev(header, t1);
    			append_dev(header, h2);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Welcome', slots, []);
    	let cover = './images/rslide-06.jpg';
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Welcome> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ cover });

    	$$self.$inject_state = $$props => {
    		if ('cover' in $$props) $$invalidate(0, cover = $$props.cover);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [cover];
    }

    class Welcome extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Welcome",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src/History.svelte generated by Svelte v3.41.0 */

    const file$7 = "src/History.svelte";

    function create_fragment$7(ctx) {
    	let p0;
    	let img;
    	let img_src_value;
    	let t0;
    	let t1;
    	let p1;
    	let strong;

    	const block = {
    		c: function create() {
    			p0 = element("p");
    			img = element("img");
    			t0 = text("\n\tGeorge Miliotis has been supplying England with traditional greek foods for over 30 years and like any good tradition, George Miliotis & Son still continue to supply the finest food the Mediterranean has to offer. Our red vans have been driven hundreds of\u0003 thousands of miles bringing the chefs, caterers, deli owners, sandwich makers, & restaurateurs what we believe to be our special service.");
    			t1 = space();
    			p1 = element("p");
    			strong = element("strong");
    			strong.textContent = "Find out more & explore our app.";
    			if (!src_url_equal(img.src, img_src_value = /*thumbnail*/ ctx[0])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "A young George Miliotis");
    			attr_dev(img, "class", "w-auto-important h-auto-important no-select w3 h3 fl mt0 mr2 mb1 ml0");
    			add_location(img, file$7, 5, 1, 80);
    			add_location(p0, file$7, 4, 0, 75);
    			add_location(strong, file$7, 10, 3, 628);
    			add_location(p1, file$7, 10, 0, 625);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p0, anchor);
    			append_dev(p0, img);
    			append_dev(p0, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p1, anchor);
    			append_dev(p1, strong);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('History', slots, []);
    	let thumbnail = './images/rslide-george-miliotis.jpg';
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<History> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ thumbnail });

    	$$self.$inject_state = $$props => {
    		if ('thumbnail' in $$props) $$invalidate(0, thumbnail = $$props.thumbnail);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [thumbnail];
    }

    class History extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "History",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src/Foods.svelte generated by Svelte v3.41.0 */

    const file$6 = "src/Foods.svelte";

    function create_fragment$6(ctx) {
    	let p0;
    	let strong0;
    	let t1;
    	let t2;
    	let p1;
    	let strong1;
    	let t4;
    	let t5;
    	let p2;
    	let t7;
    	let p3;
    	let a;

    	const block = {
    		c: function create() {
    			p0 = element("p");
    			strong0 = element("strong");
    			strong0.textContent = "From our London premises we supply";
    			t1 = text(" wholesale & retail to the south of England as far as Birmingham, Leicester & around Oxfordshire.");
    			t2 = space();
    			p1 = element("p");
    			strong1 = element("strong");
    			strong1.textContent = "Products include, but not limited to";
    			t4 = text(" extra virgin olive oil, dips, cheeses, pestos, breads, marinated vegetables, crudité & a patisserie & cake selection.");
    			t5 = space();
    			p2 = element("p");
    			p2.textContent = "We also have special dietary variations for people with allergies and intolerances.";
    			t7 = space();
    			p3 = element("p");
    			a = element("a");
    			a.textContent = "Contact us for samples.";
    			add_location(strong0, file$6, 3, 3, 49);
    			add_location(p0, file$6, 3, 0, 46);
    			add_location(strong1, file$6, 4, 3, 213);
    			add_location(p1, file$6, 4, 0, 210);
    			add_location(p2, file$6, 5, 0, 397);
    			attr_dev(a, "class", "link pa2 bg-lemon o-80 inherit glow transition underline");
    			attr_dev(a, "href", "mailto:hr.miliotisandsons@gmail.com?subject=We've seen your app…");
    			add_location(a, file$6, 7, 0, 492);
    			add_location(p3, file$6, 6, 0, 488);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p0, anchor);
    			append_dev(p0, strong0);
    			append_dev(p0, t1);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, p1, anchor);
    			append_dev(p1, strong1);
    			append_dev(p1, t4);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, p2, anchor);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, p3, anchor);
    			append_dev(p3, a);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(p1);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(p2);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(p3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Foods', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Foods> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Foods extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Foods",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src/Variations.svelte generated by Svelte v3.41.0 */

    const file$5 = "src/Variations.svelte";

    function create_fragment$5(ctx) {
    	let p0;
    	let t1;
    	let p1;
    	let t3;
    	let p2;
    	let strong;

    	const block = {
    		c: function create() {
    			p0 = element("p");
    			p0.textContent = "Catering to special dietary needs is a substantial part of our service. We supply savoury and sweet food for people with allergies and intolerances, such as vegetarian, vegan and gluten free products.";
    			t1 = space();
    			p1 = element("p");
    			p1.textContent = "This online brochure contains our complete range\u0003 of produce. We regularly have seasonal\u0003 specials and can keep you up-dated with \u0003variations, so check our price list* or call us for \u0003more information.";
    			t3 = space();
    			p2 = element("p");
    			strong = element("strong");
    			strong.textContent = "*Price list subject to changes.";
    			add_location(p0, file$5, 4, 0, 21);
    			add_location(p1, file$5, 6, 0, 350);
    			add_location(strong, file$5, 7, 3, 562);
    			add_location(p2, file$5, 7, 0, 559);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p1, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, p2, anchor);
    			append_dev(p2, strong);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p1);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(p2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Variations', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Variations> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Variations extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Variations",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    let prices = writable({

    	"dips & sauces": [
        {
          "Item": "HOUMOUS",
          "Volume": "2.0KG",
          "Price": "\xA37.50"
        },
        {
          "Item": "AVOCADO WITH HOUMOUS",
          "Volume": "2.0KG",
          "Price": "\xA311.00"
        },
        {
          "Item": "LEMON & CORIANDER HOUMOUS",
          "Volume": "2.0KG",
          "Price": "\xA39.00"
        },
        {
          "Item": "RED PEPPER HOUMOUS",
          "Volume": "2.0KG",
          "Price": "\xA39.00"
        },
        {
          "Item": "CHUNKY VEGETABLE HOUMOUS",
          "Volume": "2.0KG",
          "Price": "\xA39.00"
        },
        {
          "Item": "TARAMASALATA",
          "Volume": "2.0KG",
          "Price": "\xA37.50"
        },
        {
          "Item": "TSATZIKI (V)",
          "Volume": "2.0KG",
          "Price": "\xA310.00"
        },
        {
          "Item": "GUACAMOLE (V)",
          "Volume": "2.0KG",
          "Price": "\xA311.00"
        },
        {
          "Item": "AUBERGINE DIP (V)",
          "Volume": "1.0KG",
          "Price": "\xA36.00"
        },
        {
          "Item": "FRESH SALSA (V)",
          "Volume": "2.0KG",
          "Price": "\xA38.50"
        },
        {
          "Item": "FELAFEL (V)",
          "Volume": "x40",
          "Price": "\xA39.50"
        },
        {
          "Item": "FRESH DOLMAS (V)",
          "Volume": "x60",
          "Price": "\xA312.00"
        },
        {
          "Item": "COUS-COUS SALAD (V)",
          "Volume": "2.0KG",
          "Price": "\xA39.00"
        },
        {
          "Item": "CHICK PEA SALAD (V)",
          "Volume": "2.0KG",
          "Price": "\xA38.00"
        },
        {
          "Item": "THREE BEAN SALAD (V)",
          "Volume": "2.0KG",
          "Price": "\xA38.00"
        },
        {
          "Item": "TABOULI SALAD (V)",
          "Volume": "2.0KG",
          "Price": "\xA38.00"
        },
        {
          "Item": "PUY LENTILS & COUS-COUS (V)",
          "Volume": "2.0KG",
          "Price": "\xA39.00"
        },
        {
          "Item": "EDAMAME BEANS WITH CHEESE",
          "Volume": "2.0KG",
          "Price": "\xA38.00"
        },
        {
          "Item": "QUINOA",
          "Volume": "2.0KG",
          "Price": "\xA39.00"
        }
      ],
      "Small Pots": [
        {
          "Item": "QUINOA",
          "Volume": "190G",
          "Price": "\xA30.90"
        },
        {
          "Item": "HOUMOUS (V)",
          "Volume": "170G",
          "Price": "\xA30.90"
        },
        {
          "Item": "CARROT HOUMOUS",
          "Volume": "170G",
          "Price": "\xA30.90"
        },
        {
          "Item": "LOW FAT HOUMOUS",
          "Volume": "170G",
          "Price": "\xA30.90"
        },
        {
          "Item": "RED PEPPER HOUMOUS",
          "Volume": "170G",
          "Price": "\xA30.90"
        },
        {
          "Item": "BLACK OLIVE HOUMOUS",
          "Volume": "170G",
          "Price": "\xA30.90"
        },
        {
          "Item": "AVOCADO WITH HOUMOUS (V)",
          "Volume": "150G",
          "Price": "\xA30.90"
        },
        {
          "Item": "TARAMASALATA",
          "Volume": "170G",
          "Price": "\xA30.90"
        },
        {
          "Item": "TABOULI SALAD (V)",
          "Volume": "170G",
          "Price": "\xA30.90"
        },
        {
          "Item": "TSATZIKI (V)",
          "Volume": "170G",
          "Price": "\xA30.90"
        },
        {
          "Item": "GUACAMOLE (V)",
          "Volume": "150G",
          "Price": "\xA30.90"
        },
        {
          "Item": "FRESH SALSA (V)",
          "Volume": "170G",
          "Price": "\xA30.90"
        },
        {
          "Item": "FELAFEL",
          "Volume": "150G",
          "Price": "\xA30.90"
        },
        {
          "Item": "TOMATO & FETA SALAD",
          "Volume": "180G",
          "Price": "\xA30.90"
        },
        {
          "Item": "CHICK PEA SALAD",
          "Volume": "170G",
          "Price": "\xA30.90"
        },
        {
          "Item": "SUN BLUSHED TOMATOES",
          "Volume": "150G",
          "Price": "\xA31.20"
        },
        {
          "Item": "LENTIL SALAD",
          "Volume": "220G",
          "Price": "\xA30.90"
        },
        {
          "Item": "RED PEPPER SALAD",
          "Volume": "170G",
          "Price": "\xA30.90"
        },
        {
          "Item": "RED KIDNEY BEAN & CRACKED WHEAT SALAD",
          "Volume": "200G",
          "Price": "\xA30.90"
        },
        {
          "Item": "RED PEPPERS STUFFED",
          "Volume": "160G",
          "Price": "\xA30.90"
        },
        {
          "Item": "COLESLAW",
          "Volume": "220G",
          "Price": "\xA30.90"
        },
        {
          "Item": "DOLMADES",
          "Volume": "150G",
          "Price": "\xA31.00"
        }
      ],
      "Pesto": [
        {
          "Item": "BASILICO BASIL PESTO (V)",
          "Volume": "2.8KG",
          "Price": "\xA336.00"
        },
        {
          "Item": "RUCOLA ROCKET",
          "Volume": "2.8KG",
          "Price": "\xA337.50"
        },
        {
          "Item": "PAESANO SPICY (V)",
          "Volume": "2.8KG",
          "Price": "\xA336.00"
        },
        {
          "Item": "VERDE BASIL (V)",
          "Volume": "2.8KG",
          "Price": "\xA332.00"
        },
        {
          "Item": "VERDE BASIL (V)",
          "Volume": "1.0KG",
          "Price": "\xA311.00"
        },
        {
          "Item": "ROSSO SUN DRIED TOMATO (V)",
          "Volume": "1.0KG",
          "Price": "\xA311.00"
        },
        {
          "Item": "BLACK OLIVE TAPENADE (V)",
          "Volume": "1.00KG",
          "Price": "\xA311.00"
        }
      ],
      "Dairy, Meats & Cheeses": [
        {
          "Item": "GREEK YOGURT STRAINED (V)",
          "Volume": "10.0KG",
          "Price": "\xA333.00"
        },
        {
          "Item": "GREEK YOGURT STRAINED (V)",
          "Volume": "5.0KG",
          "Price": "\xA316.50"
        },
        {
          "Item": "GREEK YOGURT COW (V)",
          "Volume": "200G",
          "Price": "\xA30.85"
        },
        {
          "Item": "LEBNEH (V)",
          "Volume": "10.0KG",
          "Price": "\xA328.00"
        },
        {
          "Item": "TINNED FETA (V) (GREEK)",
          "Volume": "16.0KG",
          "Price": "\xA350.00"
        },
        {
          "Item": "TINNED FETA (V) (GREEK P.D.O)",
          "Volume": "16.0KG",
          "Price": "\xA3100.00"
        },
        {
          "Item": "RICOTTA CHEESE (V)",
          "Volume": "12x 200G",
          "Price": "\xA336.00"
        },
        {
          "Item": "GREEK FETA (V) VACUM PACKED",
          "Volume": "1.00KG",
          "Price": "\xA38.00"
        },
        {
          "Item": "GREEK FETA (V) VACUUM PACKED IN 12S",
          "Volume": "12x 200G",
          "Price": "\xA320.00"
        },
        {
          "Item": "CHEDDAR BLOCKS MATURE (V)",
          "Volume": "4x 5.0KG",
          "Price": "\xA3100.00"
        },
        {
          "Item": "CHEDDAR BLOCKS MILD (V)",
          "Volume": "4x 5.0KG",
          "Price": "\xA395.00"
        },
        {
          "Item": "HALLOUMI CHEESE (V)",
          "Volume": "PACKS x8",
          "Price": "\xA317.00"
        },
        {
          "Item": "HALLOUMI CHEESE BOX approx. 40packs (V)",
          "Volume": "10.0KG",
          "Price": "\xA369.00"
        },
        {
          "Item": "BRIE",
          "Volume": "1.00KG",
          "Price": "\xA37.50"
        },
        {
          "Item": "GRANA PADANO",
          "Volume": "PER KILO",
          "Price": "\xA311.00"
        },
        {
          "Item": "STILTON",
          "Volume": "PER KILO",
          "Price": "\xA39.50"
        },
        {
          "Item": "MILD CHEDDAR GRATED",
          "Volume": "1.00KG",
          "Price": "\xA36.00"
        },
        {
          "Item": "MATURE CHEDDAR GRATED",
          "Volume": "1.00KG",
          "Price": "\xA36.70"
        },
        {
          "Item": "MOZZARELLA GRATED",
          "Volume": "1.00KG",
          "Price": "\xA36.70"
        },
        {
          "Item": "MOZARELLA BLOCK",
          "Volume": "PER KILO",
          "Price": "\xA37.00"
        },
        {
          "Item": "GOATS LOG",
          "Volume": "1.00KG",
          "Price": "\xA39.50"
        },
        {
          "Item": "SLICED EMMENTHAL",
          "Volume": "50 SLICES",
          "Price": "\xA38.50"
        },
        {
          "Item": "MATURE CHEDDAR",
          "Volume": "50 SLICES",
          "Price": "\xA38.50"
        },
        {
          "Item": "MOZARELLA",
          "Volume": "50 SLICES",
          "Price": "\xA38.00"
        },
        {
          "Item": "WAFER SLICED PROSCIUTTO",
          "Volume": "500G",
          "Price": "\xA39.50"
        },
        {
          "Item": "GREEK SAUSAGES LOUKANIKA PORK",
          "Volume": "2.0KG",
          "Price": "\xA317.00"
        },
        {
          "Item": "GREEK SAUSAGES LOUKANIKA PORK",
          "Volume": "1.0KG",
          "Price": "\xA39.00"
        },
        {
          "Item": "GREEK SAUSAGES BASTOURMA BEEF",
          "Volume": "2.0KG",
          "Price": "\xA317.00"
        },
        {
          "Item": "SPICY SAUSAGE SUCHUC",
          "Volume": "1.0KG",
          "Price": "\xA39.00"
        }
      ],
      "Oils, Vinegars & Breads": [
        {
          "Item": "ORGANIC OLIVE OIL, GREEK, EXTRA VIRGIN",
          "Volume": "20LTRS (4x 5LTR)",
          "Price": "\xA3100.00"
        },
        {
          "Item": "OLIVE OIL, GREEK, EXTRA VIRGIN",
          "Volume": "20LTRS (4x 5LTR)",
          "Price": "\xA378.00"
        },
        {
          "Item": "OLIVE OIL SPANISH EXTRA VIRGIN",
          "Volume": "4x 5LTR",
          "Price": "\xA368.00"
        },
        {
          "Item": "POMACE OIL",
          "Volume": "20LTRS (4x 5LTR)",
          "Price": "\xA345.00"
        },
        {
          "Item": "GREEK EXTRA VIRGIN OLIVE OIL",
          "Volume": "12x1LTR",
          "Price": "\xA350.00"
        },
        {
          "Item": "BALSAMIC VINEGAR 5 YR.",
          "Volume": "6x1LTR (CASE)",
          "Price": "\xA348.00"
        },
        {
          "Item": "BALSAMIC VINEGAR 5 YR.",
          "Volume": "5LTR",
          "Price": "\xA318.00"
        },
        {
          "Item": "PITTA BREAD WHOLEMEAL (vacuum packed)",
          "Volume": "20PACKS  x6",
          "Price": "\xA314.30"
        },
        {
          "Item": "PITTA BREAD WHITE (vacuum packed)",
          "Volume": "18PACKS  x6",
          "Price": "\xA315.00"
        },
        {
          "Item": "FRESH PITTA BREAD",
          "Volume": "30 x6",
          "Price": "\xA316.80"
        },
        {
          "Item": "SMALL PITTA BREAD",
          "Volume": "20x12",
          "Price": "\xA318.80"
        },
        {
          "Item": "TORTILLA CHIPS CHILLI",
          "Volume": "12x500G",
          "Price": "\xA321.00"
        },
        {
          "Item": "WRAPS ARABIC FLAT BREAD 12",
          "Volume": "10x5",
          "Price": "\xA310.00"
        },
        {
          "Item": "WRAPS ARABIC FLAT BREAD 10",
          "Volume": "10x5",
          "Price": "\xA310.00"
        },
        {
          "Item": "FRESH GREEK BREAD",
          "Volume": "x1",
          "Price": "\xA31.50"
        }
      ],
      "Seafood": [
        {
          "Item": "FILLETTI DI ALICI (ANCHOVY FILLETS)",
          "Volume": "1.0KG",
          "Price": "\xA315.00"
        },
        {
          "Item": "TINNED TUNA",
          "Volume": "6x1.77KG",
          "Price": "\xA345.00"
        }
      ],
      "Vegetables, Tomatoes & crudit\xE9": [
        {
          "Item": "CHICK PEAS TINNED",
          "Volume": "6X3KG",
          "Price": "\xA323.00"
        },
        {
          "Item": "TINNED OKRA IN TOMATO SAUCE",
          "Volume": "24X28",
          "Price": "\xA333.00"
        },
        {
          "Item": "TINNED YIANDER BEANS IN TOMATO SAUCE",
          "Volume": "24X280G",
          "Price": "\xA333.00"
        },
        {
          "Item": "TINNED YIANDER BEANS CATERING SIZE",
          "Volume": "6X2.1KG",
          "Price": "\xA338.00"
        },
        {
          "Item": "TINNED ARTICHOKES",
          "Volume": "6X2.5KG",
          "Price": "\xA343.00"
        },
        {
          "Item": "TINNED TOMATO PASTE GREEK",
          "Volume": "3X4.5KG",
          "Price": "\xA345.00"
        },
        {
          "Item": "TINNED TOMATO PASTE GREEK",
          "Volume": "12X1KG",
          "Price": "\xA328.00"
        },
        {
          "Item": "TINNED DOLMAS",
          "Volume": "24X280G",
          "Price": "\xA333.00"
        },
        {
          "Item": "TINNED DOLMAS CATERING SIZE",
          "Volume": "6X2.1KG",
          "Price": "\xA338.00"
        },
        {
          "Item": "TAHINI JARS",
          "Volume": "1X12",
          "Price": "\xA327.00"
        },
        {
          "Item": "TAHINI",
          "Volume": "5.0KG",
          "Price": "\xA325.00"
        },
        {
          "Item": "GARLIC CLOVES MARINATED",
          "Volume": "3.0KG",
          "Price": "\xA314.00"
        },
        {
          "Item": "MATURE CAPERS IN WINE VINEGAR",
          "Volume": "1.0KG",
          "Price": "\xA311.00"
        },
        {
          "Item": "GRILLED AUBERGINES MARINATED",
          "Volume": "2.8KG",
          "Price": "\xA324.50"
        },
        {
          "Item": "SUN DRIED TOMATOES DRY",
          "Volume": "10.0KG",
          "Price": "\xA365.00"
        },
        {
          "Item": "SUN DRIED TOMATOES MARINATED IN OLIVE OIL",
          "Volume": "5.0KG",
          "Price": "\xA328.00"
        },
        {
          "Item": "SUN DRIED TOMATO BITS PEZZETTI",
          "Volume": "3.0KG",
          "Price": "\xA327.00"
        },
        {
          "Item": "SUN BLUSH TOMATOES",
          "Volume": "1.0KG",
          "Price": "\xA39.50"
        },
        {
          "Item": "CARCIOFI MARINATED WHOLE ARTICHOKES",
          "Volume": "3.0KG",
          "Price": "\xA327.50"
        },
        {
          "Item": "ANTIPASTO PRIMAVERA",
          "Volume": "3.0KG",
          "Price": "\xA324.00"
        }
      ],
      "Mixed Marinated Vegetables": [
        {
          "Item": "RED CHILLIES STUFFED WITH FETA",
          "Volume": "2.0KG",
          "Price": "\xA314.00"
        },
        {
          "Item": "YELLOW CHILLIES IN BRINE TIN",
          "Volume": "8.0KG",
          "Price": "\xA313.00"
        },
        {
          "Item": "GRILLED AUBERGINES MARINATED",
          "Volume": "2.8KG",
          "Price": "\xA324.50"
        },
        {
          "Item": "GRILLED RED & YELLOW PEPPERS MARINATED",
          "Volume": "2.8KG",
          "Price": "\xA324.50"
        },
        {
          "Item": "GREEK PASTA RICE",
          "Volume": "12X500G",
          "Price": "\xA314.00"
        },
        {
          "Item": "MACARONI PASTA",
          "Volume": "12X500G",
          "Price": "\xA314.00"
        },
        {
          "Item": "COUS COUS",
          "Volume": "12X500G",
          "Price": "\xA315.00"
        },
        {
          "Item": "VINE LEAF SACHETS IN BRINE",
          "Volume": "12x 227G",
          "Price": "\xA319.00"
        }
      ],
      "Olives": [
        {
          "Item": "PITTED MAMOUTH GREEN OLIVES",
          "Volume": "13.00KG",
          "Price": "\xA348.00"
        },
        {
          "Item": "KALAMATA OLIVES SUPER GIANT",
          "Volume": "13.0KG",
          "Price": "\xA352.00"
        },
        {
          "Item": "KALAMATA OLIVES",
          "Volume": "3.0KG",
          "Price": "\xA316.00"
        },
        {
          "Item": "GREEN OLIVES (MAMOUTH)",
          "Volume": "12.0KG",
          "Price": "\xA345.00"
        },
        {
          "Item": "BLACK OLIVES (GIANT)",
          "Volume": "12.0KG",
          "Price": "\xA340.00"
        },
        {
          "Item": "GREEN OLIVES (GIANT)",
          "Volume": "12.0KG",
          "Price": "\xA342.00"
        },
        {
          "Item": "GREEN OLIVES STUFFED WITH FETA",
          "Volume": "2.0KG",
          "Price": "\xA314.00"
        },
        {
          "Item": "GREEN OLIVES STUFFED WITH SUN DRIED TOMATOES",
          "Volume": "2.0KG",
          "Price": "\xA314.00"
        },
        {
          "Item": "PITTED BLACK OLIVES",
          "Volume": "6X4.2KG",
          "Price": "\xA338.00"
        },
        {
          "Item": "PITTED BLACK OLIVES COLOSSAL",
          "Volume": "4.00KG",
          "Price": "\xA319.00"
        },
        {
          "Item": "PITTED GREEN OLIVES",
          "Volume": "6X4.2KG",
          "Price": "\xA338.00"
        },
        {
          "Item": "PITTED BLACK SLICED OLIVES",
          "Volume": "6X3.0KG",
          "Price": "\xA332.00"
        },
        {
          "Item": "LEMOLIVA LARGE GREEN OLIVES STUFFED WITH LEMON",
          "Volume": "3.0KG",
          "Price": "\xA325.00"
        },
        {
          "Item": "AGLOLIVA LARGE GREEN OLIVES STUFFED WITH GARLIC",
          "Volume": "3.0KG",
          "Price": "\xA325.00"
        },
        {
          "Item": "MANDORLIVA LARGE GREEN OLIVES STUFFED WITH ALMONDS",
          "Volume": "3.0KG",
          "Price": "\xA325.00"
        },
        {
          "Item": "ETNA LARGE GREEN CRACKED OLIVES",
          "Volume": "5.35KG",
          "Price": "\xA328.00"
        },
        {
          "Item": "BOSCAIOLA MARINATED LARGE GREEN PITTED OLIVES",
          "Volume": "5.35KG",
          "Price": "\xA331.00"
        },
        {
          "Item": "RUSTICA MARINATED LARGE BLACK OLIVES",
          "Volume": "5.35KG",
          "Price": "\xA330.00"
        },
        {
          "Item": "KALAMATA MARINATED PITTED KALAMATA OLIVES",
          "Volume": "5.35KG",
          "Price": "\xA335.00"
        },
        {
          "Item": "MISTO MARINATED BLACK/GREEN PITTED OLIVES",
          "Volume": "5.35KG",
          "Price": "\xA331.00"
        },
        {
          "Item": "PAESANA MARINATED BLACK PITTED OLIVES",
          "Volume": "5.35KG",
          "Price": "\xA331.00"
        },
        {
          "Item": "LEMON OLIVES MARINATED WITH FRESH DILL, PARSLEY & LEMON PEEL",
          "Volume": "5.35KG",
          "Price": "\xA328.00"
        }
      ],
      "Tray Bakes": [
        {
          "Item": "CRUNCHY CHOCOLATE OR CARAMEL",
          "Portions": "12  portion",
          "Price": "\xA36.00"
        },
        {
          "Item": "ROCKY ROAD",
          "Portions": "12  portion",
          "Price": "\xA36.00"
        },
        {
          "Item": "CARAMELS DARK CHOCOLATE",
          "Portions": "15  portion",
          "Price": "\xA36.00"
        },
        {
          "Item": "FRUIT & NUT WHITE OR DARK CHOCOLATE",
          "Portions": "15  portion",
          "Price": "\xA36.00"
        },
        {
          "Item": "FLAKEY CAKE",
          "Portions": "15  portion",
          "Price": "\xA36.00"
        },
        {
          "Item": "FUDGE BROWNIES",
          "Portions": "15  portion",
          "Price": "\xA38.50"
        },
        {
          "Item": "CAPPUCCINO SLICE",
          "Portions": "16  portion",
          "Price": "\xA36.00"
        },
        {
          "Item": "MARBLE CRUNCHY",
          "Portions": "15  portion",
          "Price": "\xA38.15"
        },
        {
          "Item": "TIFFIN",
          "Portions": "15  portion",
          "Price": "\xA38.15"
        },
        {
          "Item": "JAFFA SLICE",
          "Portions": "15  portion",
          "Price": "\xA38.15"
        },
        {
          "Item": "ALMOND SLICE",
          "Portions": "15  portion",
          "Price": "\xA38.15"
        },
        {
          "Item": "ALMOND SLICE",
          "Portions": "8  portion",
          "Price": "\xA38.15"
        },
        {
          "Item": "YOGURT & CRANBERRY TIFFIN",
          "Portions": "12  portion",
          "Price": "\xA37.00"
        },
        {
          "Item": "TOFFEE TIFFIN",
          "Portions": "12  portion",
          "Price": "\xA37.00"
        },
        {
          "Item": "DARK MILLIONAIRES SHORTBREAD",
          "Portions": "15  portion",
          "Price": "\xA38.15"
        },
        {
          "Item": "WHITE MILLIONAIRES SHORTBREAD",
          "Portions": "15  portion",
          "Price": "\xA38.15"
        },
        {
          "Item": "MILK MILLIONAIRES SHORTBREAD",
          "Portions": "15  portion",
          "Price": "\xA38.15"
        },
        {
          "Item": "FLORENTINE MILLIONAIRES",
          "Portions": "15  portion",
          "Price": "\xA38.15"
        },
        {
          "Item": "CUPPUCCINO MILLIONAIRES (Coffee filling)",
          "Portions": "15  portion",
          "Price": "\xA38.15"
        },
        {
          "Item": "ECCLES CAKE SHORTBREAD",
          "Portions": "15  portion",
          "Price": "\xA37.20"
        },
        {
          "Item": "STRAWBERRY SHORTBREAD",
          "Portions": "15  portion",
          "Price": "\xA37.20"
        },
        {
          "Item": "CHERRY SHORTBREAD",
          "Portions": "15  portion",
          "Price": "\xA37.20"
        },
        {
          "Item": "ALL BUTTER SHORTBREAD",
          "Portions": "15  portion",
          "Price": "\xA37.20"
        },
        {
          "Item": "LEMON CURD SHORTBREAD",
          "Portions": "15  portion",
          "Price": "\xA37.20"
        },
        {
          "Item": "BLACKCURRENT SHORTBREAD",
          "Portions": "15  portion",
          "Price": "\xA37.20"
        },
        {
          "Item": "APRICOT & PECAN SHORTBREAD",
          "Portions": "15  portion",
          "Price": "\xA37.20"
        },
        {
          "Item": "TRADITIONAL FLAPJACK",
          "Portions": "15  portion",
          "Price": "\xA37.20"
        },
        {
          "Item": "STRAWBERRY FLAPJACK",
          "Portions": "12  portion",
          "Price": "\xA38.15"
        },
        {
          "Item": "APPLE & RASPBERRY FLAPJACK",
          "Portions": "15  portion",
          "Price": "\xA37.90"
        },
        {
          "Item": "SEEDED DATE FLAPJACK",
          "Portions": "15  portion",
          "Price": "\xA37.90"
        },
        {
          "Item": "PUMPKIN SEED AND APRICOT FLAPJACK",
          "Portions": "15  portion",
          "Price": "\xA37.90"
        },
        {
          "Item": "DUCHESS SLICE",
          "Portions": "15  portion",
          "Price": "\xA38.15"
        },
        {
          "Item": "CUPPUCCINO MILLIONAIRES",
          "Portions": "15  portion",
          "Price": "\xA38.15"
        },
        {
          "Item": "GRANOLA SLICE",
          "Portions": "15  portion",
          "Price": "\xA38.15"
        },
        {
          "Item": "TORTEN SLICE",
          "Portions": "15  portion",
          "Price": "\xA38.15"
        },
        {
          "Item": "COCONUT PARADISE",
          "Portions": "15  portion",
          "Price": "\xA38.15"
        },
        {
          "Item": "CARROT LOAF CAKE",
          "Portions": "8  portion",
          "Price": "\xA35.80"
        },
        {
          "Item": "LEMON LOAF CAKE",
          "Portions": "8  portion",
          "Price": "\xA35.80"
        },
        {
          "Item": "CHOCOLATE LOAF CAKE",
          "Portions": "8  portion",
          "Price": "\xA35.80"
        },
        {
          "Item": "BANANA LOAF CAKE",
          "Portions": "8  portion",
          "Price": "\xA35.80"
        },
        {
          "Item": "RICH FRUIT LOAF CAKE",
          "Portions": "8  portion",
          "Price": "\xA35.80"
        }
      ],
      "Fresh Cream Individual Pastries": [
        {
          "Item": "MILLE FEUILLES",
          "Portions": "18  portion",
          "Price": "\xA316.50"
        },
        {
          "Item": "PROFITEROLES & SAUCE",
          "Portions": "36  portion",
          "Price": "\xA316.50"
        },
        {
          "Item": "BANOFFEE TARTS",
          "Portions": "12  portion",
          "Price": "\xA311.50"
        },
        {
          "Item": "STRAWBERRY TARTS",
          "Portions": "12  portion",
          "Price": "\xA311.50"
        }
      ],
      "Patisserie, Pre-cut and Papered": [
        {
          "Item": "CERANO",
          "Portions": "14  portion",
          "Price": "\xA314.60"
        },
        {
          "Item": "BANOFFEE",
          "Portions": "14  portion",
          "Price": "\xA314.60"
        },
        {
          "Item": "CAPPUCCINO TORTE",
          "Portions": "14  portion",
          "Price": "\xA314.60"
        },
        {
          "Item": "BLACK FOREST",
          "Portions": "14  portion",
          "Price": "\xA314.60"
        },
        {
          "Item": "STICKY TOFFEE APPLE",
          "Portions": "14  portion",
          "Price": "\xA314.60"
        },
        {
          "Item": "CHOCOLATE FUDGE CAKE",
          "Portions": "14  portion",
          "Price": "\xA314.60"
        },
        {
          "Item": "PASSION CAKE",
          "Portions": "14  portion",
          "Price": "\xA314.60"
        },
        {
          "Item": "PECAN PIE",
          "Portions": "14  portion",
          "Price": "\xA315.70"
        },
        {
          "Item": "DEATH BY CHOCOLATE",
          "Portions": "14  portion",
          "Price": "\xA314.60"
        },
        {
          "Item": "TIRAMISU",
          "Portions": "14  portion",
          "Price": "\xA314.60"
        },
        {
          "Item": "FRESH FRUIT G\xC2TEAUX",
          "Portions": "14  portion",
          "Price": "\xA315.00"
        },
        {
          "Item": "HEAVENLY G\xC2TEAUX",
          "Portions": "14  portion",
          "Price": "\xA314.60"
        }
      ],
      "Patisserie, Pies and Cakes": [
        {
          "Item": "DEEP APPLE PIE",
          "Portions": "14  portion",
          "Price": "\xA314.60"
        },
        {
          "Item": "LEMON MERINGUE PIE",
          "Portions": "14  portion",
          "Price": "\xA314.60"
        },
        {
          "Item": "FRUIT CAKE",
          "Portions": "10  portion",
          "Price": "\xA311.00"
        },
        {
          "Item": "WHITE LUMPY BUMPY CAKE",
          "Portions": "14  portion",
          "Price": "\xA314.60"
        },
        {
          "Item": "CHOCOLATE CUSTARD BAR",
          "Portions": "12-14  portion",
          "Price": "\xA310.00"
        },
        {
          "Item": "COCONUT BAR",
          "Portions": "12-14  portion",
          "Price": "\xA310.00"
        },
        {
          "Item": "CARROT BAR",
          "Portions": "12-14  portion",
          "Price": "\xA310.00"
        },
        {
          "Item": "LEMON DRIZZLE BAR",
          "Portions": "12-14  portion",
          "Price": "\xA310.00"
        },
        {
          "Item": "COFFEE & WALNUT BAR",
          "Portions": "12-14  portion",
          "Price": "\xA310.00"
        },
        {
          "Item": "STRAWBEERY TART WITH JAM",
          "Portions": "12  portion",
          "Price": "\xA310.50"
        },
        {
          "Item": "CARROT SLICE",
          "Portions": "12  portion",
          "Price": "\xA310.00"
        },
        {
          "Item": "CHERRY SLICE",
          "Portions": "12  portion",
          "Price": "\xA312.00"
        },
        {
          "Item": "MINCE SLICE",
          "Portions": "12  portion",
          "Price": "\xA39.50"
        },
        {
          "Item": "APPLE SLICE",
          "Portions": "12  portion",
          "Price": "\xA39.50"
        },
        {
          "Item": "LEMON SLICE",
          "Portions": "12  portion",
          "Price": "\xA39.50"
        },
        {
          "Item": "FRESH FRUIT TART",
          "Portions": "12  portion",
          "Price": "\xA314.00"
        },
        {
          "Item": "MISSISSIPPI TART",
          "Portions": "12  portion",
          "Price": "\xA310.50"
        },
        {
          "Item": "LEMON MERINGUE TART",
          "Portions": "12  portion",
          "Price": "\xA310.50"
        },
        {
          "Item": "BAKEWELL TART (PRE PACKED)",
          "Portions": "12  portion",
          "Price": "\xA310.00"
        },
        {
          "Item": "CUSTARD TART",
          "Portions": "12  portion",
          "Price": "\xA39.50"
        },
        {
          "Item": "RUM BABA",
          "Portions": "12  portion",
          "Price": "\xA310.00"
        }
      ],
      "Patisserie, Muffins and Trays": [
        {
          "Item": "MUFFINS BLACKCURRANT",
          "Portions": "12  portion",
          "Price": "\xA37.00"
        },
        {
          "Item": "MUFFINS CHOCOLATE",
          "Portions": "12  portion",
          "Price": "\xA37.00"
        },
        {
          "Item": "LUXURY CHOCOLATE MUFFINS",
          "Portions": "18  portion",
          "Price": "\xA313.00"
        },
        {
          "Item": "LUXURY LEMON & CRANBERRY MUFFINS",
          "Portions": "18  portion",
          "Price": "\xA313.00"
        },
        {
          "Item": "LUXURY TOFFEE & PECAN MUFFINS",
          "Portions": "18  portion",
          "Price": "\xA313.00"
        },
        {
          "Item": "ECLAIRS (LONG LIFE)",
          "Portions": "12  portion",
          "Price": "\xA310.50"
        },
        {
          "Item": "FLORENTINES",
          "Portions": "12  portion",
          "Price": "\xA38.50"
        },
        {
          "Item": "CHOCOLATE COOKIES (PRE-PACKED)",
          "Portions": "18  portion",
          "Price": "\xA310.00"
        },
        {
          "Item": "SMARTIE COOKIES (PRE-PACKED)",
          "Portions": "18  portion",
          "Price": "\xA39.70"
        },
        {
          "Item": "APPLE STRUDEL",
          "Portions": "12  portion",
          "Price": "\xA311.50"
        },
        {
          "Item": "CHOCOLATE FUDGE BROWNIES",
          "Portions": "15  portion",
          "Price": "\xA39.50"
        },
        {
          "Item": "SPANACOPITTES",
          "Portions": "12  portion",
          "Price": "\xA39.50"
        },
        {
          "Item": "SMALL SPANACOPITTES",
          "Portions": "48  portion",
          "Price": "\xA322.00"
        },
        {
          "Item": "BAKLAVA",
          "Portions": "18  portion",
          "Price": "\xA311.70"
        },
        {
          "Item": "SMALL BAKLAVA",
          "Portions": "48  portion",
          "Price": "\xA314.00"
        },
        {
          "Item": "TWISTER CINNAMON & ALMOND",
          "Portions": "12  portion",
          "Price": "\xA39.50"
        },
        {
          "Item": "VIENNESE FINGERS",
          "Portions": "12  portion",
          "Price": "\xA39.50"
        },
        {
          "Item": "KATAIFI",
          "Portions": "18  portion",
          "Price": "\xA312.90"
        },
        {
          "Item": "GALATOPOUREKO",
          "Portions": "15  portion",
          "Price": "\xA312.60"
        },
        {
          "Item": "GALATOPOUREKO",
          "Portions": "27  portion",
          "Price": "\xA313.90"
        },
        {
          "Item": "KOURAPIEDES (GREEK SHORTBREAD)",
          "Portions": "36  portion",
          "Price": "\xA315.00"
        }
      ],
      "American Baked Cheesecakes": [
        {
          "Item": "BLACK CHERRY",
          "Portions": "14  portion",
          "Price": "\xA314.60"
        },
        {
          "Item": "BLACKCURRANT",
          "Portions": "14  portion",
          "Price": "\xA314.60"
        },
        {
          "Item": "STRAWBERRY",
          "Portions": "14  portion",
          "Price": "\xA314.60"
        },
        {
          "Item": "LEMON & SULTANA",
          "Portions": "14  portion",
          "Price": "\xA314.60"
        },
        {
          "Item": "FRESH FRUIT",
          "Portions": "14  portion",
          "Price": "\xA315.50"
        },
        {
          "Item": "CARAMEL CRUNCH",
          "Portions": "14  portion",
          "Price": "\xA315.70"
        },
        {
          "Item": "LOVABLE LEMON",
          "Portions": "14  portion",
          "Price": "\xA315.70"
        },
        {
          "Item": "RAVING RASPBERRY",
          "Portions": "14  portion",
          "Price": "\xA315.70"
        }
      ],
      "Cold Processed Cheescakes": [
        {
          "Item": "LEMON & SULTANA",
          "Portions": "14  portion",
          "Price": "\xA314.60"
        },
        {
          "Item": "WHITE CHOCOLATE",
          "Portions": "14  portion",
          "Price": "\xA314.60"
        },
        {
          "Item": "CHOCOLATE",
          "Portions": "14  portion",
          "Price": "\xA314.60"
        }
      ],
      "Fresh Cream Birthday Cakes. Inc. personal iced lettering": [
        {
          "Item": "SMALL 8",
          "Portions": "10-15  portion",
          "Price": "\xA320.00"
        },
        {
          "Item": "MEDIUM 10",
          "Portions": "12-18  portion",
          "Price": "\xA326.50"
        },
        {
          "Item": "LARGE 11",
          "Portions": "20-25  portion",
          "Price": "\xA330.00"
        }
      ],
      "Miscellaneous": [
        {
          "Item": "FILO PASTRY FRESH",
          "Volume": "10 PACKETS",
          "Price": "\xA315.50"
        },
        {
          "Item": "BOTTLES LEMON JUICE",
          "Volume": "24X400ML",
          "Price": "\xA312.00"
        },
        {
          "Item": "TURKISH DELIGHT ROSE & LEMON",
          "Volume": "3.0KG",
          "Price": "\xA315.50 (inc. VAT)"
        },
        {
          "Item": "TURKISH DELIGHT PISTACHIO",
          "Volume": "5.0KG",
          "Price": "\xA338.50"
        },
        {
          "Item": "BOXED PISTACHIOS",
          "Volume": "10.0KG",
          "Price": "\xA3100.00"
        },
        {
          "Item": "BOXED ALMONDS",
          "Volume": "10.0KG",
          "Price": "\xA395.00"
        },
        {
          "Item": "BOXED CASHEWS",
          "Volume": "10.0KG",
          "Price": "\xA3100.00"
        },
        {
          "Item": "MIXED NUTS",
          "Volume": "10.0KG",
          "Price": "\xA365.00"
        },
        {
          "Item": "GREEK COFFEE CAFITIERRE GRIND",
          "Volume": "10x200G",
          "Price": "\xA328.00"
        }
      ],
      "Halva Blocks": [
        {
          "Item": "HALVA PISTACHIO",
          "Volume": "3.0KG",
          "Price": "\xA322.00"
        },
        {
          "Item": "HALVA VANILLA",
          "Volume": "3.0KG",
          "Price": "\xA320.00"
        },
        {
          "Item": "HALVA CHOCOLATE",
          "Volume": "3.0KG",
          "Price": "\xA318.00"
        },
        {
          "Item": "HALVA ALMOND",
          "Volume": "3.0KG",
          "Price": "\xA318.00"
        }
      ],
      "Flapjacks & Malted Bars": [
        {
          "Item": "MALTED FRUIT & SEED BAR, Vegan, No Wheat",
          "Portions": 16,
          "Price": "\xA312.75"
        },
        {
          "Item": "ALL BUTTER FLAPJACK, No Wheat",
          "Portions": 16,
          "Price": "\xA312.15"
        },
        {
          "Item": "OLD-FASHIONED TREACLE FLAPJACK, Vegan, No Wheat",
          "Portions": 16,
          "Price": "\xA311.65"
        },
        {
          "Item": "CINNAMON & APPLE FILLED FLAPJACK, Vegan, No Wheat",
          "Portions": 16,
          "Price": "\xA311.65"
        },
        {
          "Item": "APRICOT FILLED FLAPJACK, Vegan, No Wheat",
          "Portions": 16,
          "Price": "\xA311.65"
        },
        {
          "Item": "APPLE & BLACKCURRANT FILLED FLAPJACK, Vegan, No Wheat",
          "Portions": 16,
          "Price": "\xA311.65"
        },
        {
          "Item": "CHOCOLATE & COCONUT FLAPJACK, Vegan, No Wheat",
          "Portions": 16,
          "Price": "\xA312.75"
        },
        {
          "Item": "RICH CARAMEL-TOPPED FLAPJACK, No Wheat",
          "Portions": 16,
          "Price": "\xA312.75"
        },
        {
          "Item": "YOGHURT-TOPPED CINNAMON APPLE FLAPJACK",
          "Portions": 16,
          "Price": "\xA313.25"
        },
        {
          "Item": "YOGHURT-TOPPED APRICOT FILLED FLAPJACK",
          "Portions": 16,
          "Price": "\xA313.25"
        },
        {
          "Item": "YOGHURT-TOPPED APPLE & BLACKCURRANT FILLED FLAPJACK",
          "Portions": 16,
          "Price": "\xA313.25"
        }
      ],
      "Brownies": [
        {
          "Item": "CHOCOLATE BROWNIE with WALNUTS, Gluten Free",
          "Portions": 16,
          "Price": "\xA313.25"
        },
        {
          "Item": "CHOCOLATE BROWNIE with RASPBERRIES, Gluten Free",
          "Portions": 16,
          "Price": "\xA313.25"
        }
      ],
      "Shortbreads": [
        {
          "Item": "PURE BUTTER SHORTBREAD",
          "Portions": 16,
          "Price": "\xA312.15"
        },
        {
          "Item": "PURE BUTTER SHORTBREAD with CHERRIES",
          "Portions": 16,
          "Price": "\xA312.75"
        },
        {
          "Item": "APPLE & DATE SHORTBREAD, Vegan",
          "Portions": 16,
          "Price": "\xA312.75"
        },
        {
          "Item": "MINCEMEAT SHORTBREAD, Vegan",
          "Portions": 16,
          "Price": "\xA312.75"
        },
        {
          "Item": "LUXURY CHOCOLATE CARAMEL SHORTBREAD",
          "Portions": 16,
          "Price": "\xA313.25"
        },
        {
          "Item": "RASPBERRY & ALMOND FRANGIPANE",
          "Portions": 16,
          "Price": "\xA317.35"
        }
      ],
      "10 Round Cakes": [
        {
          "Item": "CARROT CAKE with CREAM CHEESE FROSTING, Vegan",
          "Portions": "12-16 portion",
          "Price": "\xA316.85"
        },
        {
          "Item": "BRAMLEY APPLE CAKE, Vegan",
          "Portions": "12-16 portion",
          "Price": "\xA315.45"
        },
        {
          "Item": "COFFEE CAKE, Vegan",
          "Portions": "12-16 portion",
          "Price": "\xA316.85"
        },
        {
          "Item": "VICTORIA with VANILLA BUTTERCREAM & DEVON RASPBERRY JAM, Vegan",
          "Portions": "12-16 portion",
          "Price": "\xA316.85"
        },
        {
          "Item": "CHOCOLATE FUDGE CAKE (fully coated), Vegan",
          "Portions": "12-16 portion",
          "Price": "\xA319.75"
        }
      ],
      "10 Loaf Cakes": [
        {
          "Item": "SPICED GINGER CAKE, Vegan",
          "Portions": "10-12 portion",
          "Price": "\xA39.10"
        },
        {
          "Item": "MOIST FRUIT CAKE with CHERRIES, Vegan",
          "Portions": "10-12 portion",
          "Price": "\xA310.20"
        }
      ],
      "Vegetarian Savoury Pies & Flan": [
        {
          "Item": "POTATO & MATURE CHEDDAR PIE w. HERBS & TOMATO",
          "Portions": "10-12 portion",
          "Price": "\xA317.65"
        },
        {
          "Item": "HOMITY PIE",
          "Portions": "10-12 portion",
          "Price": "\xA317.65"
        },
        {
          "Item": "SPICY RED LENTIL & CHEDDAR FLAN",
          "Portions": "10-12 portion",
          "Price": "\xA317.65"
        },
        {
          "Item": "LEEK & MUSHROOM PIE w. CREAM & FRESH GARLIC (Lidded)",
          "Portions": "10-12 portion",
          "Price": "\xA320.15"
        },
        {
          "Item": "MEDITERRANEAN VEGETABLE FLAN with FETA",
          "Portions": "10-12 portion",
          "Price": "\xA320.15"
        },
        {
          "Item": "CHEDDAR & SPRING ONION TART",
          "Portions": "10-12 portion",
          "Price": "\xA317.85"
        },
        {
          "Item": "GRUY\xC8RE & BROCCOLI TART",
          "Portions": "10-12 portion",
          "Price": "\xA320.15"
        },
        {
          "Item": "STILTON & MUSHROOM TART",
          "Portions": "10-12 portion",
          "Price": "\xA320.15"
        },
        {
          "Item": "SPICED CHICK PEA & SPINACH PIE (Lidded), Vegan",
          "Portions": "10-12 portion",
          "Price": "\xA320.15"
        }
      ]
    });

    /* src/Price.svelte generated by Svelte v3.41.0 */

    const file$4 = "src/Price.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	child_ctx[4] = i;
    	return child_ctx;
    }

    // (10:1) {#each price as p, index }
    function create_each_block$1(ctx) {
    	let tr;
    	let td0;
    	let t0_value = /*p*/ ctx[2].Item + "";
    	let t0;
    	let t1;
    	let td1;
    	let t2_value = (/*p*/ ctx[2].Volume ? /*p*/ ctx[2].Volume : '') + "";
    	let t2;
    	let t3;
    	let td2;
    	let t4_value = /*p*/ ctx[2].Price + "";
    	let t4;
    	let t5;

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			t2 = text(t2_value);
    			t3 = space();
    			td2 = element("td");
    			t4 = text(t4_value);
    			t5 = space();
    			attr_dev(td0, "class", "w-two-thirds ttu");
    			add_location(td0, file$4, 11, 3, 206);
    			attr_dev(td1, "class", "w-20 tr");
    			add_location(td1, file$4, 12, 3, 254);
    			attr_dev(td2, "class", "tr");
    			add_location(td2, file$4, 13, 3, 311);
    			attr_dev(tr, "class", "hover-bg-lemon transition");
    			attr_dev(tr, "data-num", /*index*/ ctx[4] + 1);
    			add_location(tr, file$4, 10, 2, 145);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, t0);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			append_dev(td1, t2);
    			append_dev(tr, t3);
    			append_dev(tr, td2);
    			append_dev(td2, t4);
    			append_dev(tr, t5);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*price*/ 1 && t0_value !== (t0_value = /*p*/ ctx[2].Item + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*price*/ 1 && t2_value !== (t2_value = (/*p*/ ctx[2].Volume ? /*p*/ ctx[2].Volume : '') + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*price*/ 1 && t4_value !== (t4_value = /*p*/ ctx[2].Price + "")) set_data_dev(t4, t4_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(10:1) {#each price as p, index }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let tr;
    	let th;
    	let t0;
    	let t1;
    	let each_1_anchor;
    	let each_value = /*price*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			th = element("th");
    			t0 = text(/*key*/ ctx[1]);
    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    			attr_dev(th, "colspan", "3");
    			attr_dev(th, "class", "ttu pt3");
    			add_location(th, file$4, 7, 3, 64);
    			add_location(tr, file$4, 6, 1, 56);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, th);
    			append_dev(th, t0);
    			insert_dev(target, t1, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*key*/ 2) set_data_dev(t0, /*key*/ ctx[1]);

    			if (dirty & /*price*/ 1) {
    				each_value = /*price*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			if (detaching) detach_dev(t1);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Price', slots, []);
    	let { price } = $$props;
    	let { key } = $$props;
    	const writable_props = ['price', 'key'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Price> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('price' in $$props) $$invalidate(0, price = $$props.price);
    		if ('key' in $$props) $$invalidate(1, key = $$props.key);
    	};

    	$$self.$capture_state = () => ({ price, key });

    	$$self.$inject_state = $$props => {
    		if ('price' in $$props) $$invalidate(0, price = $$props.price);
    		if ('key' in $$props) $$invalidate(1, key = $$props.key);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [price, key];
    }

    class Price extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { price: 0, key: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Price",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*price*/ ctx[0] === undefined && !('price' in props)) {
    			console.warn("<Price> was created without expected prop 'price'");
    		}

    		if (/*key*/ ctx[1] === undefined && !('key' in props)) {
    			console.warn("<Price> was created without expected prop 'key'");
    		}
    	}

    	get price() {
    		throw new Error("<Price>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set price(value) {
    		throw new Error("<Price>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get key() {
    		throw new Error("<Price>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set key(value) {
    		throw new Error("<Price>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Prices.svelte generated by Svelte v3.41.0 */

    const { Object: Object_1 } = globals;
    const file$3 = "src/Prices.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    // (16:1) {#each Object.keys($prices) as key}
    function create_each_block(ctx) {
    	let price;
    	let current;

    	price = new Price({
    			props: {
    				key: /*key*/ ctx[1],
    				price: /*$prices*/ ctx[0][/*key*/ ctx[1]]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(price.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(price, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const price_changes = {};
    			if (dirty & /*$prices*/ 1) price_changes.key = /*key*/ ctx[1];
    			if (dirty & /*$prices*/ 1) price_changes.price = /*$prices*/ ctx[0][/*key*/ ctx[1]];
    			price.$set(price_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(price.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(price.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(price, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(16:1) {#each Object.keys($prices) as key}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let table;
    	let current;
    	let each_value = Object.keys(/*$prices*/ ctx[0]);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			table = element("table");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(table, "border", "0");
    			attr_dev(table, "cellspacing", "0");
    			attr_dev(table, "cellpadding", "0");
    			attr_dev(table, "class", "f6 f6-ns f5-m f5-l tl pb5\n\tpl1 pr1\n\tpl2-ns pr2-ns\n\tpl2-m pr2-m\n\tpl3-l pr3-l\n\t");
    			add_location(table, file$3, 6, 0, 244);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, table, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(table, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*Object, $prices*/ 1) {
    				each_value = Object.keys(/*$prices*/ ctx[0]);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(table, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(table);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $prices;
    	validate_store(prices, 'prices');
    	component_subscribe($$self, prices, $$value => $$invalidate(0, $prices = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Prices', slots, []);
    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Prices> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ prices, Price, $prices });
    	return [$prices];
    }

    class Prices extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Prices",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    //import Contact from './Contact.svelte';

    /* How to pass a component: https://linguinecode.com/post/how-to-pass-a-svelte-component-to-another-svelte-component */

    var items = [
    {
    id:0,
    src: './images/award.jpg',
    header: "Welcome",
    text: undefined,
    component: Welcome
    },
    {
    id:1,
    src: './images/bowers.jpg',
    header: "History",
    text: "A London based family business",
    component: History
    },
    {
    id:2,
    src: './images/locality.svg',
    header: "Foods",
    text: "Fresh never frozen",
    component: Foods
    },
    {
    id:3,
    src: './images/marzo.jpg',
    header: "Variations",
    text: undefined,
    component: Variations
    },
    {
    id:4,
    src: './images/marzo.svg',
    header: "Prices",
    text: undefined,
    component: Prices
    }
    ];

    /* src/CtaTop.svelte generated by Svelte v3.41.0 */

    const file$2 = "src/CtaTop.svelte";

    function create_fragment$2(ctx) {
    	let nav;
    	let button0;
    	let t1;
    	let button1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			button0 = element("button");
    			button0.textContent = "Mobile";
    			t1 = space();
    			button1 = element("button");
    			button1.textContent = "Mobile";
    			attr_dev(button0, "class", "\n\t\th3 pt1\n\t\tw-third mw5\n    pointer hover-white transition\n    bn bg-oxford\n    f3 tc mercury white-60 ts1-dark-gray");
    			add_location(button0, file$2, 6, 0, 239);
    			attr_dev(button1, "class", "\n\t\th3 pt1\n\t\tw-third mw5\n    pointer hover-white transition\n    bn bg-spa\n    f3 tc mercury white-60 ts1-dark-gray");
    			add_location(button1, file$2, 17, 0, 504);
    			set_style(nav, "pointer-events", "fill");
    			attr_dev(nav, "class", "w-third-m w-third-l z-1 pt4\nflex flex-ns dn-m dn-l flex-nowrap flex-row justify-around");
    			add_location(nav, file$2, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, button0);
    			append_dev(nav, t1);
    			append_dev(nav, button1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[0], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[1], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('CtaTop', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<CtaTop> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => window.location.href = 'tel:+447426646183';
    	const click_handler_1 = () => window.location.href = 'tel:+447861686443';
    	return [click_handler, click_handler_1];
    }

    class CtaTop extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CtaTop",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/SlidyInstance.svelte generated by Svelte v3.41.0 */
    const file$1 = "src/SlidyInstance.svelte";

    // (96:40) 
    function create_if_block_2(ctx) {
    	let h3;
    	let t_value = /*item*/ ctx[7].header + "";
    	let t;

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			t = text(t_value);
    			attr_dev(h3, "class", "\n\t\t\t\t\t\tf4 f3-ns f4-m f3-l\n\t\t\t\t\t\tdb bg-lemon tc black ma0 pa2");
    			add_location(h3, file$1, 96, 5, 2552);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			append_dev(h3, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*item*/ 128 && t_value !== (t_value = /*item*/ ctx[7].header + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(96:40) ",
    		ctx
    	});

    	return block;
    }

    // (94:69) 
    function create_if_block_1(ctx) {
    	const block = { c: noop, m: noop, p: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(94:69) ",
    		ctx
    	});

    	return block;
    }

    // (90:5) {#if item.text }
    function create_if_block(ctx) {
    	let h3;
    	let t_value = /*item*/ ctx[7].text + "";
    	let t;

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			t = text(t_value);
    			attr_dev(h3, "class", "\n\t\t\t\t\t\tf4 f3-ns f4-m f3-l\n\t\t\t\t\t\tdb bg-lemon tc black ma0 pa2");
    			add_location(h3, file$1, 90, 6, 2343);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			append_dev(h3, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*item*/ 128 && t_value !== (t_value = /*item*/ ctx[7].text + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(90:5) {#if item.text }",
    		ctx
    	});

    	return block;
    }

    // (66:0) <Slidy {...carousel} let:item bind:index bind:duration >
    function create_default_slot(ctx) {
    	let section;
    	let article;
    	let div;
    	let header;
    	let t;
    	let switch_instance;
    	let current;

    	function select_block_type(ctx, dirty) {
    		if (/*item*/ ctx[7].text) return create_if_block;
    		if (/*item*/ ctx[7].text === undefined && /*item*/ ctx[7].header === 'Welcome') return create_if_block_1;
    		if (/*item*/ ctx[7].text === undefined) return create_if_block_2;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type && current_block_type(ctx);
    	var switch_value = /*item*/ ctx[7].component;

    	function switch_props(ctx) {
    		return { $$inline: true };
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    	}

    	const block = {
    		c: function create() {
    			section = element("section");
    			article = element("article");
    			div = element("div");
    			header = element("header");
    			if (if_block) if_block.c();
    			t = space();
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			add_location(header, file$1, 88, 4, 2306);
    			set_style(div, "background-color", "hsla(60,71%,93%,0.8)");
    			attr_dev(div, "class", "\n\t\t\t\t\tts-white\n\t\t\t\t\tf3 verdana\n\t\t\t\t\tmid-gray\n\t\t\t\t");
    			add_location(div, file$1, 81, 3, 2183);
    			set_style(article, "padding-top", "10vh");
    			set_style(article, "padding-bottom", "10vh");
    			attr_dev(article, "class", "highlight measure-wide mr-auto ml-auto");
    			add_location(article, file$1, 78, 2, 2072);
    			set_style(section, "pointer-events", "fill");
    			attr_dev(section, "class", "\n\t\tw-100 mr-auto ml-auto\n\t\toverflow-x-scroll\n\t\th-100");
    			add_location(section, file$1, 71, 1, 1965);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, article);
    			append_dev(article, div);
    			append_dev(div, header);
    			if (if_block) if_block.m(header, null);
    			append_dev(div, t);

    			if (switch_instance) {
    				mount_component(switch_instance, div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if (if_block) if_block.d(1);
    				if_block = current_block_type && current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(header, null);
    				}
    			}

    			if (switch_value !== (switch_value = /*item*/ ctx[7].component)) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, div, null);
    				} else {
    					switch_instance = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);

    			if (if_block) {
    				if_block.d();
    			}

    			if (switch_instance) destroy_component(switch_instance);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(66:0) <Slidy {...carousel} let:item bind:index bind:duration >",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let ctatop;
    	let t0;
    	let slidy;
    	let updating_index;
    	let updating_duration;
    	let t1;
    	let footer;
    	let div;
    	let span;
    	let t2;
    	let thumbs;
    	let updating_duration_1;
    	let updating_index_1;
    	let current;
    	ctatop = new CtaTop({ $$inline: true });
    	const slidy_spread_levels = [/*carousel*/ ctx[2]];

    	function slidy_index_binding(value) {
    		/*slidy_index_binding*/ ctx[3](value);
    	}

    	function slidy_duration_binding(value) {
    		/*slidy_duration_binding*/ ctx[4](value);
    	}

    	let slidy_props = {
    		$$slots: {
    			default: [
    				create_default_slot,
    				({ item }) => ({ 7: item }),
    				({ item }) => item ? 128 : 0
    			]
    		},
    		$$scope: { ctx }
    	};

    	for (let i = 0; i < slidy_spread_levels.length; i += 1) {
    		slidy_props = assign(slidy_props, slidy_spread_levels[i]);
    	}

    	if (/*index*/ ctx[0] !== void 0) {
    		slidy_props.index = /*index*/ ctx[0];
    	}

    	if (/*duration*/ ctx[1] !== void 0) {
    		slidy_props.duration = /*duration*/ ctx[1];
    	}

    	slidy = new Slidy({ props: slidy_props, $$inline: true });
    	binding_callbacks.push(() => bind(slidy, 'index', slidy_index_binding));
    	binding_callbacks.push(() => bind(slidy, 'duration', slidy_duration_binding));

    	function thumbs_duration_binding(value) {
    		/*thumbs_duration_binding*/ ctx[5](value);
    	}

    	function thumbs_index_binding(value) {
    		/*thumbs_index_binding*/ ctx[6](value);
    	}

    	let thumbs_props = { items };

    	if (/*duration*/ ctx[1] !== void 0) {
    		thumbs_props.duration = /*duration*/ ctx[1];
    	}

    	if (/*index*/ ctx[0] !== void 0) {
    		thumbs_props.index = /*index*/ ctx[0];
    	}

    	thumbs = new Thumbs({ props: thumbs_props, $$inline: true });
    	binding_callbacks.push(() => bind(thumbs, 'duration', thumbs_duration_binding));
    	binding_callbacks.push(() => bind(thumbs, 'index', thumbs_index_binding));

    	const block = {
    		c: function create() {
    			create_component(ctatop.$$.fragment);
    			t0 = space();
    			create_component(slidy.$$.fragment);
    			t1 = space();
    			footer = element("footer");
    			div = element("div");
    			span = element("span");
    			t2 = space();
    			create_component(thumbs.$$.fragment);
    			attr_dev(span, "class", "fixed z-8 bg-mid-gray o-50 w-100 h4");
    			add_location(span, file$1, 127, 2, 3263);
    			set_style(div, "pointer-events", "fill");
    			attr_dev(div, "class", "\n\t\t\tflex items-center flex-row\n\t\t\tml-auto mr-auto\n\t\t\tpa0");
    			add_location(div, file$1, 116, 1, 3052);
    			attr_dev(footer, "class", "fixed z-999 w-100 bottom-0");
    			add_location(footer, file$1, 115, 0, 3007);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(ctatop, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(slidy, target, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, footer, anchor);
    			append_dev(footer, div);
    			append_dev(div, span);
    			append_dev(div, t2);
    			mount_component(thumbs, div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const slidy_changes = (dirty & /*carousel*/ 4)
    			? get_spread_update(slidy_spread_levels, [get_spread_object(/*carousel*/ ctx[2])])
    			: {};

    			if (dirty & /*$$scope, item*/ 384) {
    				slidy_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_index && dirty & /*index*/ 1) {
    				updating_index = true;
    				slidy_changes.index = /*index*/ ctx[0];
    				add_flush_callback(() => updating_index = false);
    			}

    			if (!updating_duration && dirty & /*duration*/ 2) {
    				updating_duration = true;
    				slidy_changes.duration = /*duration*/ ctx[1];
    				add_flush_callback(() => updating_duration = false);
    			}

    			slidy.$set(slidy_changes);
    			const thumbs_changes = {};

    			if (!updating_duration_1 && dirty & /*duration*/ 2) {
    				updating_duration_1 = true;
    				thumbs_changes.duration = /*duration*/ ctx[1];
    				add_flush_callback(() => updating_duration_1 = false);
    			}

    			if (!updating_index_1 && dirty & /*index*/ 1) {
    				updating_index_1 = true;
    				thumbs_changes.index = /*index*/ ctx[0];
    				add_flush_callback(() => updating_index_1 = false);
    			}

    			thumbs.$set(thumbs_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(ctatop.$$.fragment, local);
    			transition_in(slidy.$$.fragment, local);
    			transition_in(thumbs.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(ctatop.$$.fragment, local);
    			transition_out(slidy.$$.fragment, local);
    			transition_out(thumbs.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(ctatop, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(slidy, detaching);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(footer);
    			destroy_component(thumbs);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let duration;
    	let index;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('SlidyInstance', slots, []);

    	const carousel = {
    		// any name you like. --Note: careful not to scramble the array: `$: carousel = {...}`
    		slides: items, // `items` new name "slides" for slides elements
    		wrap: {
    			//id: 'carousel', // customize this instance Slidy by #id
    			width: '100%',
    			height: '100%',
    			padding: '0',
    			align: 'middle',
    			alignmargin: 0
    		},
    		slide: {
    			gap: 0, //50 default
    			//class: 'slide', // styling slide: `class="slide"`
    			width: '100%',
    			height: '100%',
    			backimg: false, // `false` no background image
    			imgsrckey: 'src', // prop for image src key
    			objectfit: 'cover', // new in 2.3.0
    			overflow: 'hidden', // new in 2.4.1
    			
    		},
    		controls: {
    			dots: false,
    			dotsnum: true,
    			dotsarrow: true,
    			dotspure: false, // dotnav like realy dots :)
    			arrows: false,
    			keys: true, // nav by arrow keys
    			drag: true, // nav by mousedrag
    			wheel: false, // mousewheel (shift + wheel) or swipe on touch/trackpads
    			
    		},
    		options: {
    			sensity: 6.25, // 0.001 very sensitive, 1 not. 5 better.
    			axis: 'x', // new in 2.2.0 axis direction
    			loop: true, // new in 2.3.0 loop/no options
    			duration: 222, // duration slides animation, default: 360
    			
    		}, // Use template literal `${duration}`: youtu.be/NgF9-pdTDGs?t=275
    		
    	};

    	onMount(() => {
    		$$invalidate(1, duration = 0); //carousel.options.duration
    		$$invalidate(0, index = 0); // https://stackoverflow.com/questions/59629947/how-do-i-load-an-external-js-library-in-svelte-sapper/59632158#59632158
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<SlidyInstance> was created with unknown prop '${key}'`);
    	});

    	function slidy_index_binding(value) {
    		index = value;
    		$$invalidate(0, index);
    	}

    	function slidy_duration_binding(value) {
    		duration = value;
    		$$invalidate(1, duration);
    	}

    	function thumbs_duration_binding(value) {
    		duration = value;
    		$$invalidate(1, duration);
    	}

    	function thumbs_index_binding(value) {
    		index = value;
    		$$invalidate(0, index);
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		Slidy,
    		Thumbs,
    		items,
    		CtaTop,
    		carousel,
    		index,
    		duration
    	});

    	$$self.$inject_state = $$props => {
    		if ('index' in $$props) $$invalidate(0, index = $$props.index);
    		if ('duration' in $$props) $$invalidate(1, duration = $$props.duration);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$invalidate(1, duration = 0);
    	$$invalidate(0, index = 2);

    	return [
    		index,
    		duration,
    		carousel,
    		slidy_index_binding,
    		slidy_duration_binding,
    		thumbs_duration_binding,
    		thumbs_index_binding
    	];
    }

    class SlidyInstance extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SlidyInstance",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.41.0 */
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let slidyinstance;
    	let current;
    	slidyinstance = new SlidyInstance({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(slidyinstance.$$.fragment);
    			attr_dev(main, "class", "overflow-hidden w-100 vh-100 backface-hidden z-1 relative no-select");
    			add_location(main, file, 35, 0, 1237);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(slidyinstance, main, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(slidyinstance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(slidyinstance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(slidyinstance);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const prerender = true;

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ prerender, SlidyInstance });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	// props: {	name: 'world' }
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
