# Isomorphism versus Universalism

React can be rendered *isomorphically*, which means that it can be in platforms other than the browser. This means we can render our UI on the server before it ever gets to the browser. Taking advantage of server rendering, we can improve the performance, portability, and security of our applications.

The terms *isomorphic* and *universal* are often used to describe applications that work on both the client and the server. Although these terms are used interchangeably to describe the same application, there is a subtle difference between them that is worth investigating.

- *Isomorphic* applications are applications that can be rendered on multiple platforms.
- *Universal* code means that the exact same code can run in multiple environments. Universal JavaScript  can run on the server or in the browser without error

**Universal example:** work in both client and server

Node.js will allow us to reuse the same code that we’ve written in the browser in other applications such as servers, CLIs, and even native applications. Let’s take a look at some universal JavaScript:

```javascript
var printNames = response => {
  var people = JSON.parse(response).results,
      names = people.map(({name}) => `${name.last}, ${name.first}`)
  console.log(names.join('\n'))
}
```

**Isomorphic example:** make code compatible for both client and server

```javascript
var printNames = response => {
  var people = JSON.parse(response).results,
  names = people.map(({name}) => `${name.last}, ${name.first}`)
  console.log(names.join('\n'))
}

if (typeof window !== 'undefined') {

  const request = new XMLHttpRequest()
  request.open('GET', 'http://api.randomuser.me/?nat=US&results=10')
  request.onload = () => printNames(request.response)
  request.send()

} else {

  const https = require('https')
  https.get(
    'http://api.randomuser.me/?nat=US&results=10',
    res => {
      let results = ''
      res.setEncoding('utf8')
      res.on('data', chunk => results += chunk)
      res.on('end', () => printNames(results))
    }
  )

}
```

it contains universal JavaScript. All of the code is not universal, but the file itself will work in both environments. It can run it with Node.js or include it in a `<script>` tag in the browser.

## Isomorphic-fetch

We have been using `isomorphic-fetch` over other implementations of the WHATWG fetch function because `isomorphic-fetch` works in multiple environments.

Let’s take a look at the `Star` component. Is this component universal?

```jsx
const Star = ({ selected=false, onClick=f=>f }) =>
    <div className={(selected) ? "star selected" : "star"}
         onClick={onClick}>
    </div>
```

Sure it is: remember, the JSX compiles to JavaScript. The `Star` component is simply a function:

```jsx
const Star = ({ selected=false, onClick=f=>f }) =>
    React.createElement(
        "div",
        {
            className: selected ? "star selected" : "star",
            onClick: onClick
        }
    )
```

We can render this component directly in the browser, or render it in a different environment and capture the HTML output as a string. `ReactDOM` has a `renderToString` method that we can use to render UI to a HTML string:

```jsx
// Renders html directly in the browser
ReactDOM.render(<Star />)

// Renders html as a string
var html = ReactDOM.renderToString(<Star />)
```

We can build isomorphic applications that render components on different platforms, and we can architect these applications in a way that reuses JavaScript code universally across multiple environments. Additionally, we can build isomorphic applications using other languages such as Go or Python. We are not restricted to Node.js.

## Server Rendering React

Using the `ReactDOM.renderToString` method allows us to render UI on the server. Servers are powerful; they have access to all kinds of resources that browsers do not. Servers can be secure, and access secure data. You can use all of these added benefits to your advantage by rendering initial content on the server.

Here we will use the `babel-cli` to run this Express app because it contains ES6 import statements that are not supported by the current version of Node.js.

> `babel-cli` is not a great solution for running apps in production, and we don’t have to use to `babel-cli` to run every Node.js app that uses ES6. As of this writing, the current version of Node.js supports a lot of ES6 syntax. You could simply choose not to use import statements. Future versions of Node.js will support import statements.

Another option is to create a webpack build for your backend code. webpack can export a JavaScript bundle that can be ran with older versions of Node.js.

In order to run `babel-node`, there is a little bit of setup involved. First, we need to install the `babel-cli`, `babel-loader`, `babel-preset-es2015`, `babel-preset-react`:

```bash
npm install babel-cli babel-loader babel-preset-env babel-preset-react --save
```

Next, we need to make sure we add a *.babelrc* file to the root of our project. When we run `babel-node server.js`, Babel will look for this file and apply the presets that we have installed:

```json
{
  "presets": [
    "env",
    "react"
  ]
}
```

Finally, let’s add a `start` script to our *package.json* file. If you do not already have a *package.json* file, create one by running `npm init`:

```json
"scripts": {
    "start": "./node_modules/.bin/babel-node server.js"
}
```

Now we can run our Express server with the command `npm start`:

```bash
npm start

Recipe app running at 'http://localhost:3000'
```

```javascript
import React from 'react'
import express from 'express'
import { renderToString } from 'react-dom/server'
import Menu from './app/components/Menu'
import data from './data/recipes.json'

global.React = React

const html = renderToString(<Menu recipes={data}/>)

const logger = (req, res, next) => {
    console.log(`${req.method} request for '${req.url}'`)
    next()
}

const sendHTMLPage = (req, res) =>
    res.status(200).send(`
<!DOCTYPE html>
<html>
    <head>
        <title>React Recipes App</title>
    </head>
    <body>
        <div id="app">${html}</div>
    </body>
</html>
    `)

const app = express()
    .use(logger)
    .use(sendHTMLPage)

app.listen(3000, () =>
    console.log(`Recipe app running at 'http://localhost:3000'`)
)
```

First we import `react`, the `renderToString` method, the `Menu` component, and some recipes for our initial data. React is exposed globally, so the `renderToString` method can work properly.

Next, the HTML is obtained by invoking the `renderToString` function and sending it the `Menu` component.

Finally, we can create a new middleware function, `sendHTMLPage`, that responds to all requests with an HTML string. This string wraps the server-rendered HTML in boilerplate that is necessary for creating a page.

Now when you start this application and navigate to *http://localhost:3000* in a browser, you will see that the recipes have been rendered. We have not included any JavaScript in this response. The recipes are already on the page as HTML.

------

So far we have server-rendered the `Menu` component. Our application is not yet isomorphic, as the components are only rendered on the server. To make it isomorphic we will add some JavaScript to the response so that the same components can be rendered in the browser.

Let’s create an /app/*client.js* file that will run in the browser:

```javascript
import React from 'react'
import { render } from 'react-dom'
import Menu from './components/Menu'

window.React = React

alert('bundle loaded, Rendering in browser')

render(
    <Menu recipes={window.__DATA__} />,
    document.getElementById("app")
)

alert('render complete')
```

This file will render the same `Menu` component, with the same recipe data. We know that the data is the same because it will already be included in our response as a string. When the browser loads this script, the `__DATA__` will already exist in the global scope. The `alert` methods are used to see when the browser renders the UI.

We’ll need to build this *client.js* file into a bundle that can be used by the browser. Here, basic webpack configuration will handle the build.

Don’t forget to install `webpack`; we’ve already installed `babel` and the necessary presets:

```bash
npm install webpack --save-dev
```

Here, basic webpack configuration will handle the build:

```javascript
var webpack = require("webpack")

module.exports = {
    entry: "./app/client.js",
    output: {
        path: "dist",
        filename: "bundle.js"
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules)/,
                loader: 'babel-loader',
                query: {
                    presets: ['env', 'stage-0', 'react']
                }
            }
        ]
    }
}
```

We want to build the client bundle every time we start our app, so we’ll need to add a prestart script to the *package.json* file:

```json
"scripts": {
  "prestart": "./node_modules/.bin/webpack --progress",
  "start": "./node_modules/.bin/babel-node server.js"
},
```

The last step is to modify the server. We need to write the initial `__DATA__` to the response as a string. We also need to include a `script` tag with a reference to our client bundle. Lastly, we need to make sure our server sends static files from the *./assets/* directory:

```javascript
const sendHTMLPage = (req, res) =>
    res.status(200).send(`
<!DOCTYPE html>
<html>
    <head>
        <title>React Recipes App</title>
    </head>
    <body>
        <div id="app">${html}</div>
        <script>
            window.__DATA__ = ${JSON.stringify(data)}
        </script>
        <script src="bundle.js"></script>
    </body>
</html>
    `)

const app = express()
    .use(logger)
    .use(express.static('./dist'))
    .use(sendHTMLPage)
```

`script` tags have been added directly to the response. The data is written to the first `script` tag and the bundle is loaded in the second one. Additionally, middleware has been added to our request pipeline. When the */bundle.js* file is requested, the `express.static` middleware will respond with that file instead of the server-rendered HTML because it is in the *./dist* folder.

> Note: cannot have a static html under dist folder, since it will cause express.static instead of server rendering

Now we are isomorphically rendering the React components, first on the server and then in the browser. When you run this app, you will see alert pop ups before and after the components are rendered in the browser. You may notice that before you clear the first alert, the content is already there. This is because it is initially rendered on the server.

## Sum

It may seem silly to render the same content twice, but there are advantages. This application renders the same content in all browsers, even if JavaScript is turned off. Because the content is loaded with the initial request, your website will run faster and deliver necessary content to your mobile users more quickly. It will not have to wait for a mobile processor to render the UI since the UI is already in place. Additionally, this app gains all of the advantages of an SPA. Isomorphic React applications give you the best of both worlds.