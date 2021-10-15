<script context="module">
	export const prerender = true;
</script>
<script>
export let price;
export let key;
</script>


	<tr>
		 <th colspan="3" class="ttu pt3">{key}</th>
	 </tr>
	{#each price as p, index }
		<tr class="hover-bg-lemon transition" data-num={index+1}>
			<td class="w-two-thirds ttu">{ p.Item }</td>
			<td class="w-20 tr">{ p.Volume ? p.Volume : '' }</td>
			<td class="tr">{ p.Price }</td>
		</tr>
	{/each}

<!-- <style>

	table tr::before {
		content: attr(data-num) '.';
		float: left;
		margin-left: -40px;
		width: 32px;
		text-align: right;
	}
</style> -->
