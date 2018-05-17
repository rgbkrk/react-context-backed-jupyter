## React 16.3, Jupyter, and Binder

Experimenting with some components with an interface like so:

```js
import HostProvider, { Consumer as HostConsumer } from "@rgbkrk/binder-hosts"

<HostProvider repo="nteract/vdom">
  <HostConsumer>
    {host => <pre>{JSON.stringify(host, null, 2)}</pre>}
  </HostConsumer>
</HostProvider>
```

## Available Scripts

In the project directory, you can run:

### `npm run dev`

Runs the app in the development mode.<br>
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br>
You will also see any errors in the console.

### `npm run build`

Builds the app for production to the `.next` folder.<br>
It correctly bundles React in production mode and optimizes the build for the best performance.

### `npm run start`

Starts the application in production mode.
The application should be compiled with \`next build\` first.

See the section in Next docs about [deployment](https://github.com/zeit/next.js/wiki/Deployment) for more information.

## Using CSS

[`styled-jsx`](https://github.com/zeit/styled-jsx) is bundled with next to provide support for isolated scoped CSS. The aim is to support "shadow CSS" resembling of Web Components, which unfortunately [do not support server-rendering and are JS-only](https://github.com/w3c/webcomponents/issues/71).

```jsx
export default () => (
  <div>
    Hello world
    <p>scoped!</p>
    <style jsx>{`
      p {
        color: blue;
      }
      div {
        background: red;
      }
      @media (max-width: 600px) {
        div {
          background: blue;
        }
      }
    `}</style>
  </div>
);
```

Read more about [Next's CSS features](https://github.com/zeit/next.js#css).

## Adding Components

We recommend keeping React components in `./components` and they should look like:

### `./components/simple.js`

```jsx
const Simple = () => <div>Simple Component</div>;

export default Simple; // don't forget to export default!
```

### `./components/complex.js`

```jsx
import { Component } from "react";

class Complex extends Component {
  state = {
    text: "World"
  };

  render() {
    const { text } = this.state;
    return <div>Hello {text}</div>;
  }
}

export default Complex; // don't forget to export default!
```
