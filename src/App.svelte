<script>
  import { onMount } from 'svelte'
  import { onDestroy } from 'svelte'
  import NumberAnimator from './NumberAnimator.svelte'
  export let countFrom = 0
  export let countTo = 100
  export let duration = 2000
  export let unit = ''
  export let textBefore = ''
  export let description = ''
  export let startHack = 0

</script>

<style>
  .wrapper {
    /* background-color: #dfded2; */
    padding: 20px 40px 30px;
    text-align: center;
  }

  p {
    color: #585856;
    margin: 0;
    text-align: center;
  }

  .number-wrapper {
    position: relative;
    display: inline-block;
    margin: 0 auto 10px;
  }

  .text-before {
    position: absolute;
    left: -210px;
    top: 17px;
    width: 200px;
    text-align: right;
    color: #868686;
    font-size: 0.8em;
  }

  .unit {
    text-align: left;
    font-weight: bold;
    font-size: 1.5em;
  }

</style>

<div class='wrapper'>
  <p class="number-wrapper">
    <span class='text-before'>{textBefore}</span>
    <NumberAnimator
      countFrom={parseFloat(countFrom)}
      countTo={parseFloat(countTo)}
      duration={parseInt(duration)}
      startHack={startHack}
    />
    <span class="unit">{unit}</span>
  </p>
  <p>{description}</p>
</div>
