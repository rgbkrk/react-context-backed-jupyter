import Link from "next/link";
import Head from "../components/head";
import Nav from "../components/nav";

import Host, { Consumer as HostConsumer } from "../components/host";

import type { HostState } from "../components/host";

const DebugView = (props: HostState) => {
  if (!props) {
    return "Loading server";
  }

  const url = `${props.url}nteract/edit/?token=${props.token}`;

  return (
    <>
      <div href={url} className="card">
        <a href={url} target="_blank">
          Open on nteract
        </a>
        <pre>{JSON.stringify(props, null, 2)}</pre>
      </div>
      <style jsx>{`
        .card {
          display: block;
          padding: 18px 18px 24px;
          text-align: left;
          text-decoration: none;
          color: #434343;
          border: 1px solid #9b9b9b;
        }
        .card:hover {
          border-color: #067df7;
        }
        .card a {
          margin: 0;
          color: #067df7;
          font-size: 18px;
        }
        .card pre {
          pointer-events: none;
          margin: 0;
          padding: 12px 0 0;
          font-size: 13px;
          color: #333;
        }
      `}</style>
    </>
  );
};

export default () => (
  <div>
    <Head title="Home" />

    <Host>
      <HostConsumer>{DebugView}</HostConsumer>
    </Host>
  </div>
);
