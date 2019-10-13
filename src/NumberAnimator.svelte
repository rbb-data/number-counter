<script>
  import { onMount } from 'svelte'
  import { onDestroy } from 'svelte'
  export let countFrom
  export let countTo
  export let duration
  export let startHack

  $: number = countFrom

  let observer
  let elem

  let timer
  let frame
  let startTime = null

  const germanNumberFormart = new Intl.NumberFormat('de-DE')

  function count() {
    const time = window.performance.now()
    const diff = time - startTime
    let progress = diff / duration
    if (progress > 1) progress = 1
    if (progress < 1) {
      timer = setTimeout(() => {
        frame = requestAnimationFrame(count)
      }, 100)
    }

    const range = countTo - countFrom
    const result = countFrom + progress * range
    const floor = progress === 1 ? result : Math.floor(result)
    number = germanNumberFormart.format(floor)
  }

  function handleIntersection (entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting && startTime === null) {
        startHack = 1
      }
    })
  }

  $: if (startHack > 0) {
    startHack = 0
    startTime = window.performance.now()
    count()
  } else {
  }

  onMount(() => {
    const options = {
      rootMargin: '0px 0px 0px',
      threshold: 0,
    }
    observer = new IntersectionObserver(handleIntersection, options)
    observer.observe(elem)
  });

  onDestroy(() => {
    cancelAnimationFrame(frame)
    window.clearTimeout(timer)
    observer.unobserve(elem)
  })
</script>

<style>
  strong {
    color: #e31818;
    font-size: 2.5em;
  }
</style>

<strong bind:this={elem}>{number}</strong>
