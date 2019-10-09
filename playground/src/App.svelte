<script>
  import Hui from '../../src/App.svelte'
  let countFrom = 0
  let countTo = 100
  let duration = 2000
  let textBefore = 'bis zu'
  let unit = '€'
  let description = 'kostet xyz'
  let startHack = 0

  function restart () {
    startHack += 1
  }

  $: url = `https://dj1.app.rbb-cloud.de/number-counter/#countFrom=${countFrom}&countTo=${countTo}&duration=${duration}&textBefore=${encodeURIComponent(textBefore)}&unit=${encodeURIComponent(unit)}&description=${encodeURIComponent(description)}`
  $: iframeString = `<iframe src="${url}" width="100%" height="150px"></iframe>`
</script>

<style>
  label {
    display: inline-block;
    width: 160px;
  }
</style>


<h2>Paramter</h2>
<p>
  <label for='countFrom'>text vor Zahl:</label>
  <input id='countFrom' type='text' bind:value={textBefore} />
</p>
<p>
  <label for='countFrom'>starte counter bei:</label>
  <input id='countFrom' type='number' bind:value={countFrom} on:change={restart} />
</p>
<p>
  <label for='countFrom'>zähle bis zu:</label>
  <input id='countFrom' type='number' bind:value={countTo} on:change={restart} />
</p>
<p>
  <label for='countFrom'>dauer:</label>
  <input id='countFrom' type='number' bind:value={duration} on:change={restart} />
</p>
<p>
  <label for='countFrom'>einheit:</label>
  <input id='countFrom' type='text' bind:value={unit} />
</p>
<p>
  <label for='countFrom'>text unter Zahl:</label>
  <input id='countFrom' type='text' bind:value={description} />
</p>

<h2>Vorschau</h2>
<Hui
  countFrom={countFrom}
  countTo={countTo}
  duration={duration}
  textBefore={textBefore}
  unit={unit}
  description={description}
  startHack={startHack}  />

<h2>Embed code</h2>
<output>
  <code>{iframeString}</code>
</output>