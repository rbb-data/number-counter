<script>
  import { onMount } from 'svelte'
  import { onDestroy } from 'svelte'
  import NumberAnimator from './NumberAnimator.svelte'
  export let countFrom = 0
  export let countTo = 100
  export let duration = 2000
  export let unit = ''
  export let description = ''

</script>

<div>
  <p>
    <NumberAnimator countFrom={+countFrom} countTo={+countTo} duration={+duration} />
    {unit}
  </p>
  <p>{description}</p>
</div>
