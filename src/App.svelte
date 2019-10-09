<script>
  import { onMount } from 'svelte'
  import { onDestroy } from 'svelte'
  export let countFrom = 0
  export let countTo = 100
  export let duration = 2000

  let from = +countFrom
  let to = +countTo
  let totalTime = +duration
  let number = from

  let observer
  let elem

  let frame
  let startTime = null

  function count() {
    const time = window.performance.now()
    const diff = time - startTime
    let progress = diff / totalTime
    if (progress > 1) progress = 1
    if (progress < 1) frame = requestAnimationFrame(count)

    const range = to - from

    number = Math.floor(from + progress * range)
  }

  function handleIntersection (entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting && startTime === null) {
        startTime = window.performance.now()
        count()
      }
    })
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
    observer.unobserve(elem)
  })
</script>

<style>
  h1 {
    color: purple;
  }
</style>

<h1 bind:this={elem}>{number}</h1>
