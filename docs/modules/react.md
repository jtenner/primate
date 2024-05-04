# React

This handler module supports SSR and hydration and serves React (JSX)
components with the `.jsx` extension.

## Install

`npm install @primate/frontend react@18 react-dom@18`

## Configure

Import and initialize the module in your configuration.

```js caption=primate.config.js
import { react } from "@primate/frontend";

export default {
  modules: [
    react(),
  ],
};
```

## Use

Create a JSX component in `components`.

```jsx caption=components/PostIndex.jsx
export default function PostIndex({ posts }) {
  return (<>
    <h1>All posts</h1>
    { posts.map(({ id, title }) => (
      <h2><a href={`/post/${id}`}>{title}</a></h2>
    )) }
  </>);
}
```

Serve it from a route.

```js caption=routes/react.js
import { view } from "primate";

const posts = [{
  id: 1,
  title: "First post",
}];

export default {
  get() {
    return view("PostIndex.jsx", { posts });
  },
};
```

The rendered component will be accessible at http://localhost:6161/react.

## Configuration options

### extension

Default `".jsx"`

The file extension associated with React JSX components.

### spa

Default `true`

Whether SPA browsing using `fetch` should be active.

## Resources

* [Repository][repo]

[repo]: https://github.com/primatejs/primate/tree/master/packages/frontend
