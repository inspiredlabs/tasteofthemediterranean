<script>
// Originally: https://www.youtube.com/watch?v=T64FIL1ii-0
import { prices } from './prices.js'; /* charachter symbols in JSON req. HexCode: javascripter.net/faq/accentedcharacters.htm */
import Price from './Price.svelte';
</script>

<table
	border="0" cellspacing="0" cellpadding="0"
	class="f6 f6-ns f5-m f5-l tl pb5
	pl1 pr1
	pl2-ns pr2-ns
	pl2-m pr2-m
	pl3-l pr3-l
	"
>
	{#each Object.keys($prices) as key}
		<Price key={key} price={$prices[key]} />
	{/each}
</table>


<!-- old school reset: https://stackoverflow.com/questions/9947041/how-to-delete-border-spacing-in-table -->

<!--pre class="debug">
{JSON.stringify($prices, null, 2)}
</pre-->