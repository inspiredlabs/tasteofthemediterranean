<script context="module">
	// Track deploy: app.netlify.com/sites/greekfoods/deploys/
	export const prerender = true;
</script>
<script>
	import SlidyInstance from './SlidyInstance.svelte'; /* Simple: https://svelte.dev/repl/8910cf8db1c947dba57faaf5711c8314?version=3.41.0*/
/*
Tween basics: https://svelte.dev/examples#tweened
*/

/* spread operator `[...thing]` works with: `const thing = {my:"thing_one",}`, see: FrontEnd Masters, 4. Props */

/* default: https://svelte.dev/examples#text-inputs `start`=left || `middle`=centred || `end`=right, see: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/text-anchor */

</script>

<!-- bg-blur  -->

<!-- <Banner bg="bg-petrol">
<img
class="w2 h2 white"
src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="
style="background-image: url({myfile});"
alt={myfile}
>
<!-- <div class="ttu tracked-mega">Three</div> -- >
<!-- <div class="ttu tracked-mega">Four</div> -- >

<!-- <button
	class="dib pointer no-underline br0 f6 f5-ns f6-l b pv3 ph2 ph1-ns ph3-m pv2-l ph2-l ba bw2-ns bb b--black black bg-white grow ttu tracked tracked-mega-ns"
	class:test="{current === true}"
	on:click="{() => current = true}"
>Offerta speciale!</button> -- >
</Banner-->

<main class="overflow-hidden w-100 vh-100 backface-hidden z-1 relative no-select">
<SlidyInstance/>
</main>
<!--style global>
	/* remove border -From: stackoverflow.com/questions/28870932/how-to-remove-white-border-from-blur-background-image#42963980 */
	.bg-blur::after {
		content: "";
		position: absolute;
		width: 100%;
		height: 100%;
		backdrop-filter: blur(4px); /* apply the blur */
		pointer-events: none; /* make the overlay click-through */
	}
	</style-->