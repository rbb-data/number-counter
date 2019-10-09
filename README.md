# RBB Number Counter

## Usage

You can embed this counter on any website. Just include it as an iframe like this:

```html
<iframe src="https://dj1.app.rbb-cloud.de/number-counter/#countTo=42"></iframe>
```

### Options

You can set various options as a hash parameter on the iframe url.
If you omit an option the default value is used.

`countFrom` the initial state of the counter *default: 0*  
`countTo` the final state of the counter *default: 100*  
`duration` the time in ms it takes to get from the inital state to the final state *default: 2000*  
`unit` a unit string rendered after the number *default: empty*  
`description` a string displayeed below the number *default: empty*

So a counter with all options set would look like this:

```html
<iframe src="https://dj1.app.rbb-cloud.de/number-counter/#countFrom=14,81&countTo=6,45&duration=1000&unit=Euro&description=Angebotsmieten im Altbau aktuell und nach Mietendeckel"></iframe>
```

## Development

*Note that you will need to have [Node.js](https://nodejs.org) installed.*


### Get started

Install the dependencies...

```bash
cd number-counter
npm install
```

...then start [Rollup](https://rollupjs.org):

```bash
npm run dev
```

Navigate to [localhost:5000](http://localhost:5000). You should see your app running. Edit a component file in `src`, save it, and reload the page to see your changes.

By default, the server will only respond to requests from localhost. To allow connections from other computers, edit the `sirv` commands in package.json to include the option `--host 0.0.0.0`.


### Build and Deploy

From within your project folder run:

```bash
npm run build
```

If you have set up access to the rbb server you can just run:

```bash
npm run deploy
```
to deploy it to [https://dj1.app.rbb-cloud.de/number-counter/](https://dj1.app.rbb-cloud.de/number-counter/)
