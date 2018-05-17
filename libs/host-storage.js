// @flow

import { formBinderURL, binder } from "rx-binder";

import { kernels } from "rx-jupyter";

import { map, catchError, filter } from "rxjs/operators";
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

type UpHost = {
  type: "updog",
  url: string,
  token: string
};

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

  checkUp(host: HostRecord): Promise<boolean> {
    if (host.type === GETTING_UP) {
      return Promise.resolve(false);
    }
    return kernels
      .list(host)
      .pipe(map(() => true), catchError(() => of(false)))
      .toPromise();
  }

  async allocate(binderOpts: BinderOptions): Promise<UpHost> {
    let original = this.get(binderOpts);

    if (!original) {
      original = { type: "isitupdog" };
      this.set(binderOpts, original);
    } else if (original.type === UP) {
      // TODO: Check if really up
      const isUp = await this.checkUp(original);
      if (isUp) {
        return original;
      }
      // Assume that we need to launch one
    } else if (original.type === GETTING_UP) {
      // TODO: Do we wait on a prior to eventually come up or kick off a new one
      // Could do coordination here by recording timestamps in the GETTING_UP type
    }

    const host = await binder(binderOpts)
      .pipe(
        filter(msg => msg.phase === "ready"),
        map(msg => ({
          type: UP,
          url: msg.url,
          token: msg.token
        }))
      )
      .toPromise();

    this.set(binderOpts, host);

    console.log("allocated ", host);
    return host;
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
