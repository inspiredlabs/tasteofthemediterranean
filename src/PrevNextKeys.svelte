<script context="module">
	export const prerender = true;
</script>

<script>

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
