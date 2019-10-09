import App from './App.svelte'

var parseQueryString = function( queryString ) {
    var params = {}, queries, temp, i, l
    // Split into key/value pairs
    queries = queryString.split("&")
    // Convert the array of strings into an object
    for ( i = 0, l = queries.length; i < l; i++ ) {
        temp = queries[i].split('=')
        params[temp[0]] = temp[1]
    }
    return params
}

const hash = window.location.hash.replace('#', '')
const params = parseQueryString(hash)

for (const param in params) {
  params[param] = decodeURIComponent(params[param])
}

const app = new App({
  target: document.body,
  props: params
})

export default app
