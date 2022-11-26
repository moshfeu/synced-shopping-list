import { set, omit } from 'lodash';
import { dbRef } from './converters';

type Event = 'value';

const emptyData: dbRef = {
  categories: {},
  items: {},
  list: {},
};

type Updates = Record<string, any>;
type Snapshot = {
  toJSON: () => dbRef | null;
};

export class Lsbase {
  private data: dbRef;
  private listeners: { [key in Event]?: Function } = {};
  private queue: Array<Updates>;
  private isOnline: boolean = false;
  public hasLocal: boolean = false;

  constructor(public db: firebase.database.Database) {
    this.data = this.getFromLocalOrDefault('data', emptyData);
    this.queue = this.getFromLocalOrDefault('queue', []);
    db.ref().on('value', (snapshot) => {
      this.data = snapshot.toJSON() as dbRef;
      this.save();
    });
    db.ref('.info/connected').on('value', async (snapshot) => {
      this.isOnline = snapshot.val();
      if (this.isOnline) {
        await this.execQueue();
      }
    });
    if (this.data !== emptyData) {
      this.hasLocal = true;
    }
  }

  private async execQueue() {
    const ref = this.db.ref();
    const updatePromises = this.queue.map((updates) => ref.update(updates));
    await Promise.all(updatePromises);
    this.queue = [];
    this.save();
  }

  private getFromLocalOrDefault(
    key: string,
    defaultValue: Object | Array<unknown>
  ) {
    const lsData = localStorage.getItem(key);
    return lsData ? JSON.parse(lsData) : defaultValue;
  }

  private handleListener() {
    this.listeners.value?.({
      toJSON: () => this.data,
    });
  }

  private save(silent?: boolean) {
    localStorage.setItem('data', JSON.stringify(this.data));
    localStorage.setItem('queue', JSON.stringify(this.queue));
    if (!silent) {
      this.handleListener();
    }
  }

  private fireBasetoJsPath<T extends string | undefined>(firebasePath?: T) {
    if (!firebasePath) {
      return '';
    }
    return firebasePath.replace(/\//g, '.');
  }

  private throwIfOffline = async (promise: Promise<unknown>) => {
    return new Promise<unknown>(async (resolve, reject) => {
      if (!this.isOnline) {
        return reject();
      }
      const timeout = setTimeout(reject, 2000);
      const result = await promise;
      clearTimeout(timeout);
      resolve(result);
    });
  };

  ref = (path?: string) => {
    return {
      update: async (updates: Updates) => {
        Object.entries(updates).forEach(([path, value]) => {
          const jsPath = this.fireBasetoJsPath(path);
          if (value) {
            set(this.data, jsPath, value);
          } else {
            this.data = omit(this.data, jsPath) as dbRef;
          }
        });
        this.save();
        try {
          await this.throwIfOffline(this.db.ref(path).update(updates));
        } catch (e) {
          console.error('failed to update', e, updates);
          this.queue.push(updates);
          this.save();
        }
      },
      push: async (item: unknown) => {
        const jsPath = this.fireBasetoJsPath(path);
        const { key } = this.db.ref().child(path!).push();
        const updates = { [`${path}/${key}`]: item };
        set(this.data, [jsPath, key!], item);
        this.save();

        try {
          await this.throwIfOffline(this.db.ref().update(updates));
        } catch (e) {
          console.error(e);
          this.queue.push(updates);
          this.save(true);
        }
        return { key };
      },
      remove: () => {
        this.data = omit(this.data, path || '') as dbRef;
        this.save();
        return this.db.ref(path).remove();
      },
      off: (event: Event) => {
        delete this.listeners[event];
      },
      on: (
        event: 'value',
        onSucess: (snapshot: Snapshot) => void,
        onError?: (error: string) => void
      ) => {
        if (event === 'value') {
          this.listeners[event] = onSucess;
          try {
            this.handleListener();
          } catch (error) {
            onError?.(error as string);
          }
        }
      },
    };
  };
}
