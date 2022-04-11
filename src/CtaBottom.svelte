<script>
import App from "./App.svelte";

</script>


<nav class="w-third-m w-third-l z-1 dn dn-ns flex-m flex-l">
<!-- style="box-shadow: inset 0 0 1rem #0ff;/* stackoverflow.com/questions/8452739/css-inset-borders */" -->
<!-- <a href="https://web.whatsapp.com/send?text=I%27d%20like%20to%20order...&phone=+447426646183&abid=+447426646183">Whatsapp desktop</a> -->
  <a
    style="line-height:8rem"
    href="whatsapp://send?text=I%27d%20like%20to%20order...&phone=+447426646183"
    class="
    link
    h4 w-50
    pointer hover-white transition
    bn bg-whatsapp
    f3 tc mercury white-80 ts1-dark-gray"
  >Whatsapp</a>
  <!-- style="box-shadow: inset 0 0 1rem #0f0" -->
  <a
  style="line-height:8rem"
  href='tel:+447426646183'
  class="
  link
  h4 w-50
  pointer hover-white transition
  bn bg-oxford
  f3 tc mercury white-60 ts1-dark-gray"
  >Mobile</a>
</nav>