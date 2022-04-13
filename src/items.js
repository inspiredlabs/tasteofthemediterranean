//import Contact from './Contact.svelte';
import Welcome from './Welcome.svelte';
import History from './History.svelte';
import Foods from './Foods.svelte';
import Variations from './Variations.svelte';
import Prices from './Prices.svelte';

/* How to pass a component: https://linguinecode.com/post/how-to-pass-a-svelte-component-to-another-svelte-component */

export default [
{
id:0,
src: './images/marzo.svg',
header: "Items",
text: undefined,
component: Prices
},
{
id:1,
src: './images/marzo.svg',
header: "Items",
text: undefined,
component: Prices
}
]
