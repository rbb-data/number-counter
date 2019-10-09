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

  let timer
  let frame
  let startTime = null

  function count() {
    const time = window.performance.now()
    const diff = time - startTime
    let progress = diff / totalTime
    if (progress > 1) progress = 1
    if (progress < 1) {
      timer = setTimeout(() => {
        frame = requestAnimationFrame(count)
      }, 100)
    }

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
