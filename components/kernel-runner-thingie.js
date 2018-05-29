// @flow

import * as React from "react";

import { first, map, mapTo, filter, tap } from "rxjs/operators";

// The dash that is low
var _ = require("lodash");

// Little helpers for creating jupyter messages
var messaging = require("@nteract/messaging");

function sleep(duration) {
  return new Promise(resolve => setTimeout(resolve, duration));
}

export class RunThings extends React.Component<*, *> {
  subscription: rxjs$Subscription;

  constructor(props: *) {
    super(props);
    this.state = {
      messageCollections: {}
    };
  }

  async getKernelInfo() {
    // Set up a receiver for kernel info
    let kernelInfo = null;
    this.props.kernel.channels
      .pipe(
        messaging.ofMessageType("kernel_info_reply"),
        first(),
        map(msg => msg.content)
      )
      .subscribe(content => {
        kernelInfo = content;
      });

    // Keep trying to get kernel info
    while (!kernelInfo) {
      // Send the message until we've got it
      this.props.kernel.channels.next(messaging.kernelInfoRequest());
      await sleep(60);
    }
  }

  componentDidMount() {
    this.subscription = this.props.kernel.channels.subscribe(
      msg => {
        if (msg.parent_header && typeof msg.parent_header.msg_id === "string") {
          const parent_id = msg.parent_header.msg_id;

          // Collect all messages
          const messages = _.get(this.state.messageCollections, parent_id, []);
          messages.push(msg);
          this.setState({
            messageCollections: {
              ...this.state.messageCollections,
              [parent_id]: messages
            }
          });
        }
      },
      err => console.error(err)
    );

    this.getKernelInfo();
  }

  render() {
    return <pre>{JSON.stringify(this.state.messageCollections, null, 2)}</pre>;
  }
}
