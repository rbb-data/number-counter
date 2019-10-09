# RBB Number Counter

## Usage


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
### With [now](https://zeit.co/now)

From within your project folder run:

```bash
npm run build
```

If you have set up access to the rbb server you can just run:

```bash
npm run deploy
```
to deploy it to [https://dj1.app.rbb-cloud.de/number-counter/](https://dj1.app.rbb-cloud.de/number-counter/)
