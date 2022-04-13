<script context="module">
	export const prerender = true;
</script>

<script>
import { onMount } from 'svelte';
import { Slidy } from 'svelte-slidy' // install: `npm i -D svelte-slidy`
import Thumbs from './Thumbs.svelte' // req:`let index;` -from: svelte.dev/repl/5979bd8521324a9b82a584521fbca6f9?version=3.41.0
import items from './items.js';
import CtaTop from './CtaTop.svelte'


/* DEMO: https://slidy.valexr.online/ const carousel = {} // slidy settings for current instance */

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
		overflow: 'hidden' // new in 2.4.1
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
			duration: 222 // duration slides animation, default: 360
			// Use template literal `${duration}`: youtu.be/NgF9-pdTDGs?t=275
		}
	}

$: duration = 0;
$: index = 0;

onMount(() => {
	duration = 0;//carousel.options.duration
	index = 0 // https://stackoverflow.com/questions/59629947/how-do-i-load-an-external-js-library-in-svelte-sapper/59632158#59632158
});



</script>
<!-- Thumbs req. `bind:index` -->

<CtaTop />

<Slidy
{...carousel}
let:item
bind:index
bind:duration
>
	<section
		style="pointer-events:fill"
		class="
		w-100 mr-auto ml-auto
		overflow-x-scroll
		h-100"
	>
		<article
			style="padding-top:10vh;padding-bottom:10vh"
			class="highlight measure-wide mr-auto ml-auto">
			<div
				style="background-color: hsla(60,71%,93%,0.8)"
				class="
					ts-white
					f3 verdana
					mid-gray
				">
				<header>
					{#if item.text }
						<h3 class="
						f4 f3-ns f4-m f3-l
						db bg-lemon tc black ma0 pa2">{ item.text }</h3>
					{:else if item.text === undefined && item.header === 'Welcome' }

					{:else if item.text === undefined }
					<h3 class="
						f4 f3-ns f4-m f3-l
						db bg-lemon tc black ma0 pa2">{ item.header }</h3>
					{/if}
				</header>
				<svelte:component this={item.component} />
				<!-- `bind:index {items}` expose them: `export let items, index` see <Thumbs />. -->
			</div>
		</article>
	</section>
<!-- <img alt="{item.header}" src="{item.src}"/> -->
<!-- <article class="center tc gold">
	<h2>{item.header}</h2>
	<p>
		{item.text}
	</p>
</article> -->
</Slidy>

<footer class="fixed z-999 w-100 bottom-0">
	<div
		style="pointer-events:fill"
		class="
			flex items-center flex-row
			ml-auto mr-auto
			pa0">
		<!-- flex-column-m
		w-90
		w-80-ns ml1-ns mr1-ns
		w-two-thirds-m ml4-m mr4-m
		w-75-l ml5-l mr5-l -->
		<span class="fixed z-8 bg-mid-gray o-50 w-100 h4"></span>
		<Thumbs
		bind:duration
		bind:index
		{items}
		/>
	</div>
</footer>