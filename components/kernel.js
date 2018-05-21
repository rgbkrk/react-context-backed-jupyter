// @flow

import * as React from "react";
import type { HostState } from "./host";

import { tap, map, catchError, filter } from "rxjs/operators";
import { of } from "rxjs/observable/of";

const { kernels } = require("rx-jupyter");

// A component that gets a kernel for you

const { Provider, Consumer } = React.createContext();

export { Consumer };

type KernelProps = {
  children?: React.Node,
  kernelName: string,
  host: HostState
};

type KernelState = {
  channels: any,
  connections: ?number,
  execution_state: ?string,
  id: ?string,
  last_activity: ?Date,
  name: ?string
};

export default class Kernel extends React.Component<KernelProps, KernelState> {
  static defaultProps = {
    kernelName: "python"
  };

  constructor(props: KernelProps) {
    super(props);
    this.state = {};
  }

  getKernel() {
    console.log("getting kernel");
    if (this.props.host) {
      const host = this.props.host;

      kernels.start(host, "python", "/").subscribe(xhr => {
        this.setState({
          ...xhr.response,
          channels: kernels.connect(host, xhr.response.id),
          last_activity: new Date(xhr.response.last_activity)
        });
      });
    }
  }

  componentDidUpdate(prevProps: KernelProps, prevState: KernelState) {
    if (prevProps.host !== this.props.host) {
      this.getKernel();
    }
  }

  componentDidMount() {
    if (this.props.host) {
      this.getKernel();
    }
  }

  render() {
    console.log(this.state);
    if (!this.props.children || !this.state || !this.state.channels) {
      return null;
    }
    return <Provider value={this.state}>{this.props.children}</Provider>;
  }
}
