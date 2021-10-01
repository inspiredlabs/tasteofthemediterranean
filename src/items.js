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
]
