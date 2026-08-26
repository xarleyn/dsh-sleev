import { randomUUID } from "node:crypto";
import type { GenerateOptions, TokenUsage } from "@deepseek-ai/dsh-llm";
import type { ResolvedConfig } from "../shared/config.js";
import type {
  CallResult,
  OptimizerCallTelemetry,
  ProviderUsageTelemetry,
  RequestKind,
} from "../shared/telemetry.js";
import { deriveUsage, normalizeUsage } from "./usage.js";

/** Minimal logger face used by Cordis and isolated unit tests. */
export interface TelemetryLogger {
  debug(message: string): void;
  info(message: string): void;
}

/** Mutable handle kept only for the duration of a streaming call. */
export interface CallHandle {
  observeUsage(usage: TokenUsage): void;
  finish(result: CallResult): void;
}

interface StoreOptions {
  readonly now?: () => number;
  readonly createId?: () => string;
}

/** Bounded, process-local telemetry owner for the M1 observer. */
export class CallTelemetryStore {
  private readonly completed: OptimizerCallTelemetry[] = [];
  private readonly now: () => number;
  private readonly createId: () => string;

  constructor(
    private readonly logger: TelemetryLogger,
    private readonly config: ResolvedConfig,
    options: StoreOptions = {},
  ) {
    this.now = options.now ?? Date.now;
    this.createId = options.createId ?? randomUUID;
  }

  /** Begin one call and return an idempotent lifecycle sink. */
  begin(options: GenerateOptions, kind: RequestKind): CallHandle {
    const callId = this.createId();
    const startedAt = this.now();
    let usage: ProviderUsageTelemetry | undefined;
    let finished = false;

    if (this.config.logLevel === "debug") {
      this.logger.debug(
        `dsh-sleev: call-start ${JSON.stringify({ callId, provider: options.provider, model: options.model, kind, sessionId: options.sessionId })}`,
      );
    }

    return {
      observeUsage: (value) => {
        usage = normalizeUsage(value);
      },
      finish: (result) => {
        if (finished) return;
        finished = true;
        const finishedAt = this.now();
        const telemetry: OptimizerCallTelemetry = Object.freeze({
          schemaVersion: 1,
          callId,
          ...(options.sessionId === undefined
            ? {}
            : { sessionId: String(options.sessionId) }),
          kind,
          provider: options.provider,
          model: options.model,
          optimizer: "sleev",
          startedAt,
          finishedAt,
          durationMs: Math.max(0, finishedAt - startedAt),
          ...(usage === undefined
            ? {}
            : { providerUsage: usage, derived: deriveUsage(usage) }),
          result,
        });
        this.completed.push(telemetry);
        if (this.completed.length > this.config.maxRecentCalls) {
          this.completed.splice(
            0,
            this.completed.length - this.config.maxRecentCalls,
          );
        }
        if (this.config.logLevel !== "off") {
          const message = `dsh-sleev: call-end ${JSON.stringify(telemetry)}`;
          if (this.config.logLevel === "debug") this.logger.debug(message);
          else this.logger.info(message);
        }
      },
    };
  }

  /** Return a detached newest-last snapshot for diagnostics and future UI. */
  listRecent(): readonly OptimizerCallTelemetry[] {
    return this.completed.slice();
  }
}
