// @flow

import { formBinderURL, binder } from "rx-binder";

import { kernels, apiVersion } from "rx-jupyter";

import * as rxJupyter from "rx-jupyter";

import * as operators from "rxjs/operators";

import { tap, map, catchError, filter } from "rxjs/operators";
import { of } from "rxjs/observable/of";

export opaque type BinderKey = string;

type BinderOptions = {
  repo: string,
  ref?: string,
  binderURL?: string
};

type HostStatus = "alive" | "acquiring" | "yes";

export const UP = "updog";
export const GETTING_UP = "isitupdog";

type IsItUpHost = {
  type: "isitupdog"
};

type ServerConfig = {
  url: string,
  token: string,
  crossDomain: true
};

type UpHost = {
  type: "updog",
  config: ServerConfig
};

function makeHost({ url, token }: { url: string, token: string }): UpHost {
  return {
    type: UP,
    config: {
      crossDomain: true,
      url,
      token
    }
  };
}

type HostRecord = UpHost | IsItUpHost;

export class LocalForage<K: string, V> {
  set(key: K, value: V) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  get(key: K, default_?: ?V = null): ?V {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(default_));
  }
}

const prefix = "@BinderKey@";

const mybinderURL = "https://mybinder.org";

function sleep(duration: number) {
  return new Promise(resolve => setTimeout(resolve, duration));
}

export class LocalHostStorage {
  localForage: LocalForage<BinderKey, HostRecord>;

  constructor() {
    this.localForage = new LocalForage();
    window.addEventListener("storage", this.handleStorageEvent);
  }

  // Developer has to call this to cleanup :(
  close() {
    window.removeEventListener("storage", this.handleStorageEvent);
  }

  handleStorageEvent(event: {
    key: string,
    oldValue: string,
    newValue: string
  }) {
    const { key, newValue } = event;
    // TODO: Not yet implemented

    console.warn(
      "Handling storage updates is not implemented. It would be super fantastic to let subscribers know about changes."
    );

    if (event.key.startsWith(prefix)) {
      // I am a monster
      const binderOpts = JSON.parse(key.slice(prefix.length));
      console.log(binderOpts);
      console.log(newValue);
    }
  }

  createKey({
    repo = "jupyter/notebook",
    ref = "master",
    binderURL = mybinderURL
  }: BinderOptions): BinderKey {
    return `${prefix}${JSON.stringify({ repo, ref, binderURL })}`;
  }

  async checkUp(host: HostRecord): Promise<boolean> {
    if (host.type === GETTING_UP) {
      return false;
    }

    // Short circuit it for now
    return true;

    return kernels
      .list(host.config)
      .pipe(
        map(() => true),
        catchError(err => {
          console.error("wtf", err);
          return of(false);
        })
      )
      .toPromise();
  }

  async allocate(binderOpts: BinderOptions): Promise<ServerConfig> {
    let original = this.get(binderOpts);

    if (!original || !original.config) {
      original = { type: "isitupdog" };
      this.set(binderOpts, original);
      // Fall through, don't return as we allocate below
    } else if (original.type === UP) {
      // TODO: Check if really up
      const isUp = await this.checkUp(original);
      if (isUp) {
        return original.config;
      }
      // If it wasn't up, launch a new one
    } else if (original.type === GETTING_UP) {
      // TODO: Do we wait on a prior to eventually come up or kick off a new one
      // Could do coordination here by recording timestamps in the GETTING_UP type

      while (!original && original.type !== UP) {
        await sleep(1000);
        original = this.get(binderOpts);
        if (original && original.type === UP) {
          return original.config;
        }
      }
    }

    console.log("getting new host");

    const host = await binder(binderOpts)
      .pipe(
        filter(msg => msg.phase === "ready"),
        tap(x => {
          console.log(x);
        }),
        map(msg => makeHost(msg))
      )
      .toPromise();

    this.set(binderOpts, host);

    console.log("allocated ", host);
    return host.config;
  }

  get(opts: BinderOptions): ?HostRecord {
    const key = this.createKey(opts);
    return this.localForage.get(key);
  }

  set(opts: BinderOptions, host: HostRecord) {
    const key = this.createKey(opts);
    this.localForage.set(key, host);
  }
}
