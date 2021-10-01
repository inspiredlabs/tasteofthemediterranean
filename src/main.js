import App from './App.svelte';
import "./css/tachyon.shower.css"; //css-tricks.com/what-i-like-about-writing-styles-with-svelte/

const app = new App({
	target: document.body,
	// props: {	name: 'world' }
});

export default app;
