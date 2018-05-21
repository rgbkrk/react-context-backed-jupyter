// @flow
import * as React from "react";

import { UP, LocalHostStorage } from "../libs/host-storage.js";
const { binder } = require("rx-binder");
const { kernels } = require("rx-jupyter");

const { Provider, Consumer } = React.createContext();

export { Consumer };

type HostProps = {
  children?: React.Node,
  repo: string,
  ref?: string,
  binderURL?: string
};

export type HostState = {
  url: string,
  token: string
};

export default class Host extends React.Component<HostProps, HostState> {
  lhs: LocalHostStorage;

  componentDidMount() {
    this.lhs = new LocalHostStorage();

    const binderOpts = { repo: "nteract/vdom" };

    this.lhs
      .allocate(binderOpts)
      .then(host => {
        this.setState({ url: host.url, token: host.token });
      })
      .catch(e => {
        console.error("seriously say what", e);
      });
  }

  componentWillUnmount() {
    this.lhs.close();
  }

  render() {
    if (!this.props.children) {
      return null;
    }
    return <Provider value={this.state}>{this.props.children}</Provider>;
  }
}
