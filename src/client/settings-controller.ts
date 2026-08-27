import {
  createSnapshotStore,
  type SettingsScope,
  type SnapshotStore,
} from "@deepseek-ai/dsh-client-runtime/client";

export type SleevLogLevel = "off" | "info" | "debug";

/** Browser-visible shape of the Host `sleev` settings namespace. */
export interface SleevSettings {
  readonly routes?: string[];
  readonly routePrefixes?: string[];
  readonly maxRecentCalls?: number;
  readonly logLevel?: SleevLogLevel;
}

type Field = keyof SleevSettings;

interface Draft {
  readonly text: string;
  readonly reset: boolean;
}

export interface SleevSettingsCardState {
  readonly available: boolean;
  readonly writable: boolean;
  readonly dirty: boolean;
  readonly invalid: boolean;
  readonly saving: boolean;
  readonly failed: boolean;
  readonly overridden: boolean;
  readonly routes: string;
  readonly routePrefixes: string;
  readonly maxRecentCalls: string;
  readonly logLevel: SleevLogLevel;
}

export interface SleevSettingsCardFace {
  readonly hooks: {
    readonly sleevSettings: SnapshotStore<SleevSettingsCardState>;
  };
  readonly edit: (field: Field, value: string) => void;
  readonly save: () => void;
  readonly discard: () => void;
  readonly resetDefaults: () => void;
}

const DEFAULTS: Required<SleevSettings> = {
  routes: [],
  routePrefixes: ["sleev-"],
  maxRecentCalls: 100,
  logLevel: "info",
};

function lines(values: readonly string[]): string {
  return values.join("\n");
}

function parseLines(value: string): string[] {
  return [
    ...new Set(
      value
        .split(/\r?\n/u)
        .map((part) => part.trim())
        .filter(Boolean),
    ),
  ];
}

/** Staged form controller for the official plugin-configuration slot. */
export class SleevSettingsController {
  private readonly drafts = new Map<Field, Draft>();
  private readonly store: SnapshotStore<SleevSettingsCardState>;
  private readonly unsubscribe: () => void;
  private saving = false;
  private failed = false;

  constructor(private readonly scope: SettingsScope<SleevSettings>) {
    this.store = createSnapshotStore(this.project());
    this.unsubscribe = scope.subscribe(() => this.publish());
  }

  inject(): SleevSettingsCardFace {
    return {
      hooks: { sleevSettings: this.store },
      edit: (field, value) => {
        this.drafts.set(field, { text: value, reset: false });
        this.failed = false;
        this.publish();
      },
      save: () => void this.save(),
      discard: () => {
        this.drafts.clear();
        this.failed = false;
        this.publish();
      },
      resetDefaults: () => {
        const snapshot = this.scope.getSnapshot();
        const user = snapshot.user as Record<string, unknown> | undefined;
        const base = { ...DEFAULTS, ...(snapshot.base as SleevSettings) };
        for (const field of Object.keys(DEFAULTS) as Field[]) {
          if (user !== undefined && Object.hasOwn(user, field)) {
            const value = base[field];
            this.drafts.set(field, {
              text:
                field === "routes" || field === "routePrefixes"
                  ? lines(value as string[])
                  : String(value),
              reset: true,
            });
          } else {
            this.drafts.delete(field);
          }
        }
        this.failed = false;
        this.publish();
      },
    };
  }

  dispose(): void {
    this.unsubscribe();
  }

  private effective(): Required<SleevSettings> {
    return { ...DEFAULTS, ...this.scope.getSnapshot().value };
  }

  private value(field: Field): string {
    const draft = this.drafts.get(field);
    if (draft !== undefined) return draft.text;
    const current = this.effective();
    if (field === "routes" || field === "routePrefixes") {
      return lines(current[field]);
    }
    return String(current[field]);
  }

  private project(): SleevSettingsCardState {
    const snapshot = this.scope.getSnapshot();
    const maxRecentCalls = this.value("maxRecentCalls");
    const parsedMax = Number(maxRecentCalls.trim());
    const logLevel = this.value("logLevel");
    const invalid =
      !Number.isSafeInteger(parsedMax) ||
      parsedMax < 1 ||
      !["off", "info", "debug"].includes(logLevel);
    return {
      available: snapshot.status === "ready",
      writable: snapshot.writable,
      dirty: this.drafts.size > 0,
      invalid,
      saving: this.saving,
      failed: this.failed,
      overridden:
        snapshot.user !== undefined &&
        Object.keys(snapshot.user as Record<string, unknown>).length > 0,
      routes: this.value("routes"),
      routePrefixes: this.value("routePrefixes"),
      maxRecentCalls,
      logLevel: ["off", "info", "debug"].includes(logLevel)
        ? (logLevel as SleevLogLevel)
        : "info",
    };
  }

  private async save(): Promise<void> {
    const state = this.project();
    if (!state.dirty || state.invalid || state.saving || !state.writable)
      return;
    const writes = [...this.drafts.entries()];
    this.saving = true;
    this.failed = false;
    this.publish();
    try {
      for (const [field, draft] of writes) {
        if (draft.reset) {
          await this.scope.unset(field);
        } else if (field === "routes" || field === "routePrefixes") {
          await this.scope.set(field, parseLines(draft.text));
        } else if (field === "maxRecentCalls") {
          await this.scope.set(field, Number(draft.text.trim()));
        } else {
          await this.scope.set(field, draft.text as SleevLogLevel);
        }
      }
      const user = this.scope.getSnapshot().user as
        Record<string, unknown> | undefined;
      const landed = writes.every(([field, draft]) => {
        if (draft.reset)
          return user === undefined || !Object.hasOwn(user, field);
        const expected =
          field === "routes" || field === "routePrefixes"
            ? parseLines(draft.text)
            : field === "maxRecentCalls"
              ? Number(draft.text.trim())
              : draft.text;
        return JSON.stringify(user?.[field]) === JSON.stringify(expected);
      });
      if (landed) {
        for (const [field, draft] of writes) {
          if (this.drafts.get(field) === draft) this.drafts.delete(field);
        }
      } else {
        this.failed = true;
      }
    } catch {
      this.failed = true;
    } finally {
      this.saving = false;
      this.publish();
    }
  }

  private publish(): void {
    this.store.set(this.project());
  }
}
