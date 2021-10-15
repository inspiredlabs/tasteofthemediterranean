<script context="module">
	export const prerender = true;
</script>

<script>
export let items, index, duration
import CtaBottom from './CtaBottom.svelte'
//import PrevNextKeys from './PrevNextKeys.svelte'

// Named functions are better, how is Slidy instance exposed up here?
/* dragging and event propagation:
    svelte.dev/repl/adf5a97b91164c239cc1e6d0c76c2abe?version=3.14.1
*/

function handleKeydown(event) {
	if (event.key === 'ArrowRight') {
	  index ++;
	} else if (event.key === 'ArrowLeft') {
	  index --;
	} else {
		//alert(`pressed the ${event.key} key`);
		return;
	}
}

</script>

<svelte:window on:keydown={handleKeydown}/>
<!-- <PrevNextKeys/> -->

<!--
draggable=true
on:click={ping}
on:dragenter={ping}
on:touchmove={ping}
-->

<!--
<pre>
  <ul>
{#each items as thumb, i}
<li>{thumb.component}</li>
{/each}
  </ul>
</pre>
-->

<CtaBottom />
<nav class="w-100 w-100-ns w-two-thirds-m w-two-thirds-l z-1 fr
flex flex-nowrap flex-row justify-around">
  {#each items as thumb, i}
    <button
      class="
      h4
      pointer glow transition
      o-70 bn bg-transparent backface-hidden
      ph0 ph0-ns ph0-m ph3-l
      f4 f4-ns f3-m f3-l tc mercury lemon ts1-dark-gray"
			style="will-change:opacity;background-image: url({thumb.src}) no-repeat center center fixed;"
      class:active={i === index}
      on:click={() => {
        duration = 0,
        index = i
        setTimeout( () => { duration = 360 }, 80);
      }}
    >
    {thumb.header}
		</button>
	{/each}
</nav>

<style>

nav button.active {
  color: white;
  opacity: 1;
  text-decoration:underline /* `mw-20` VS `justify-around`, this is the better trade off because of irregular `{thumb.header}` lengths */
}
</style>