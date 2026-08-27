import type { ClientContext } from "@deepseek-ai/dsh-client-runtime/client";
import type {
  InjectFace,
  PropsLocale,
  PropsRuntime,
} from "@deepseek-ai/dsh-client-ui-slots";
import type {} from "@deepseek-ai/dsh-client-locale/client";
import type {} from "@deepseek-ai/dsh-client-ui-settings/client";
import type {} from "@deepseek-ai/dsh-client-ui-settings-plugins/client";
import { useState, type CSSProperties } from "react";
import {
  SleevSettingsController,
  type SleevSettingsCardFace,
  type SleevSettingsCardState,
} from "./settings-controller.js";
import { SLEEV_SETTINGS_NAMESPACE_ID } from "../shared/settings.js";

export * from "./settings-controller.js";

const LOCALE_NAMESPACE = "dsh-sleev";
const SETTINGS_NAMESPACE = SLEEV_SETTINGS_NAMESPACE_ID;

type SleevLocaleKey =
  | "title"
  | "description"
  | "expand"
  | "collapse"
  | "unsaved"
  | "overridden"
  | "routes"
  | "routesHint"
  | "routePrefixes"
  | "routePrefixesHint"
  | "maxRecentCalls"
  | "maxRecentCallsHint"
  | "logLevel"
  | "logLevelHint"
  | "logOff"
  | "logInfo"
  | "logDebug"
  | "invalidNumber"
  | "readOnly"
  | "saveFailed"
  | "discard"
  | "resetDefaults"
  | "save"
  | "saving";

declare module "@deepseek-ai/dsh-client-ui-slots" {
  interface LocaleNamespaceMap {
    "dsh-sleev": SleevLocaleKey;
  }
}

const en: Record<SleevLocaleKey, string> = {
  title: "Sleev",
  description: "Observed routes and telemetry retention.",
  expand: "Show settings",
  collapse: "Hide settings",
  unsaved: "Unsaved",
  overridden: "Overridden",
  routes: "Exact routes",
  routesHint: "One DSH provider alias per line. Empty means no exact matches.",
  routePrefixes: "Route prefixes",
  routePrefixesHint: "One prefix per line. The default is sleev-.",
  maxRecentCalls: "Recent calls retained",
  maxRecentCallsHint: "Maximum secret-free telemetry records kept in memory.",
  logLevel: "Telemetry logging",
  logLevelHint: "Controls structured call start/end logging.",
  logOff: "Off",
  logInfo: "Completed calls",
  logDebug: "Call starts and completions",
  invalidNumber: "Enter a positive whole number.",
  readOnly: "This deployment stores settings read-only.",
  saveFailed: "The deployment did not accept these values.",
  discard: "Discard",
  resetDefaults: "Reset overrides",
  save: "Save",
  saving: "Saving…",
};

const zh: Record<SleevLocaleKey, string> = {
  title: "Sleev",
  description: "观测路由和遥测保留设置。",
  expand: "展开设置",
  collapse: "收起设置",
  unsaved: "未保存",
  overridden: "已覆盖",
  routes: "精确路由",
  routesHint: "每行一个 DSH 提供商别名。留空表示不进行精确匹配。",
  routePrefixes: "路由前缀",
  routePrefixesHint: "每行一个前缀。默认值为 sleev-。",
  maxRecentCalls: "保留最近调用数",
  maxRecentCallsHint: "内存中最多保留多少条无敏感信息的遥测记录。",
  logLevel: "遥测日志",
  logLevelHint: "控制结构化调用开始和结束日志。",
  logOff: "关闭",
  logInfo: "仅完成的调用",
  logDebug: "调用开始和完成",
  invalidNumber: "请输入正整数。",
  readOnly: "此部署的设置为只读。",
  saveFailed: "部署未接受这些值。",
  discard: "放弃修改",
  resetDefaults: "恢复默认",
  save: "保存",
  saving: "保存中…",
};

const styles: Record<string, CSSProperties> = {
  card: {
    listStyle: "none",
    border: "1px solid var(--border-color, #dedede)",
    borderRadius: 14,
    overflow: "hidden",
    background: "var(--background-color, #fff)",
  },
  header: {
    width: "100%",
    border: 0,
    background: "transparent",
    padding: "18px 16px",
    display: "flex",
    alignItems: "center",
    gap: 12,
    cursor: "pointer",
    textAlign: "left",
    color: "inherit",
  },
  headText: { display: "grid", gap: 4, flex: 1 },
  title: { fontWeight: 650, fontSize: 16 },
  description: { color: "var(--text-secondary, #777)", fontSize: 14 },
  pending: { color: "#a86600", fontSize: 12 },
  body: { borderTop: "1px solid var(--border-color, #e5e5e5)", padding: 16 },
  grid: { display: "grid", gap: 16 },
  field: { display: "grid", gap: 7 },
  label: { fontWeight: 600, fontSize: 14 },
  control: {
    boxSizing: "border-box",
    width: "100%",
    minHeight: 38,
    border: "1px solid var(--border-color, #ccc)",
    borderRadius: 8,
    padding: "8px 10px",
    background: "var(--background-color, #fff)",
    color: "inherit",
    font: "inherit",
  },
  textarea: { minHeight: 72, resize: "vertical" },
  hint: { margin: 0, color: "var(--text-secondary, #777)", fontSize: 12 },
  error: { margin: 0, color: "#c23b32", fontSize: 12 },
  footer: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 18,
  },
  button: {
    border: "1px solid var(--border-color, #ccc)",
    borderRadius: 8,
    padding: "8px 14px",
    background: "transparent",
    color: "inherit",
    cursor: "pointer",
  },
  primary: { background: "#171717", borderColor: "#171717", color: "#fff" },
};

type SleevSettingsCardProps = PropsRuntime<"settings.plugin.item"> &
  PropsLocale<"dsh-sleev"> &
  InjectFace<SleevSettingsCardFace>;

function Field(props: {
  readonly id: string;
  readonly label: string;
  readonly hint: string;
  readonly children: React.ReactNode;
}): React.ReactNode {
  return (
    <div style={styles.field}>
      <label htmlFor={props.id} style={styles.label}>
        {props.label}
      </label>
      {props.children}
      <p style={styles.hint}>{props.hint}</p>
    </div>
  );
}

/** Settings card contributed to the official Plugins → Plugin configuration tab. */
export function SleevSettingsCard(props: SleevSettingsCardProps) {
  const [open, setOpen] = useState(false);
  const state = props.useSleevSettings((snapshot) => snapshot);
  if (!state.available) return null;
  const blocked =
    !state.dirty || state.invalid || state.saving || !state.writable;
  const edit =
    (field: Parameters<typeof props.edit>[0]) =>
    (
      event: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) =>
      props.edit(field, event.target.value);
  return (
    <li style={styles.card}>
      <button
        type="button"
        style={styles.header}
        aria-expanded={open}
        aria-label={`${props.t(open ? "collapse" : "expand")}: Sleev`}
        onClick={() => setOpen(!open)}
      >
        <span style={styles.headText}>
          <span style={styles.title}>{props.t("title")}</span>
          <span style={styles.description}>{props.t("description")}</span>
        </span>
        {state.dirty ? (
          <span style={styles.pending}>{props.t("unsaved")}</span>
        ) : null}
        {!state.dirty && state.overridden ? (
          <span style={styles.pending}>{props.t("overridden")}</span>
        ) : null}
        <span aria-hidden="true">{open ? "▴" : "▾"}</span>
      </button>
      {open ? (
        <div style={styles.body}>
          {!state.writable ? <p role="status">{props.t("readOnly")}</p> : null}
          <div style={styles.grid}>
            <Field
              id="sleev-routes"
              label={props.t("routes")}
              hint={props.t("routesHint")}
            >
              <textarea
                id="sleev-routes"
                style={{ ...styles.control, ...styles.textarea }}
                value={state.routes}
                disabled={!state.writable}
                onChange={edit("routes")}
              />
            </Field>
            <Field
              id="sleev-route-prefixes"
              label={props.t("routePrefixes")}
              hint={props.t("routePrefixesHint")}
            >
              <textarea
                id="sleev-route-prefixes"
                style={{ ...styles.control, ...styles.textarea }}
                value={state.routePrefixes}
                disabled={!state.writable}
                onChange={edit("routePrefixes")}
              />
            </Field>
            <Field
              id="sleev-max-recent-calls"
              label={props.t("maxRecentCalls")}
              hint={props.t("maxRecentCallsHint")}
            >
              <input
                id="sleev-max-recent-calls"
                style={styles.control}
                type="number"
                min={1}
                step={1}
                value={state.maxRecentCalls}
                disabled={!state.writable}
                aria-invalid={state.invalid}
                onChange={edit("maxRecentCalls")}
              />
              {state.invalid ? (
                <p style={styles.error}>{props.t("invalidNumber")}</p>
              ) : null}
            </Field>
            <Field
              id="sleev-log-level"
              label={props.t("logLevel")}
              hint={props.t("logLevelHint")}
            >
              <select
                id="sleev-log-level"
                style={styles.control}
                value={state.logLevel}
                disabled={!state.writable}
                onChange={edit("logLevel")}
              >
                <option value="off">{props.t("logOff")}</option>
                <option value="info">{props.t("logInfo")}</option>
                <option value="debug">{props.t("logDebug")}</option>
              </select>
            </Field>
          </div>
          {state.failed ? (
            <p style={styles.error} role="status">
              {props.t("saveFailed")}
            </p>
          ) : null}
          <div style={styles.footer}>
            <button
              type="button"
              style={styles.button}
              disabled={!state.overridden || state.saving}
              onClick={props.resetDefaults}
            >
              {props.t("resetDefaults")}
            </button>
            <button
              type="button"
              style={styles.button}
              disabled={!state.dirty || state.saving}
              onClick={props.discard}
            >
              {props.t("discard")}
            </button>
            <button
              type="button"
              style={{ ...styles.button, ...styles.primary }}
              disabled={blocked}
              onClick={props.save}
            >
              {props.t(state.saving ? "saving" : "save")}
            </button>
          </div>
        </div>
      ) : null}
    </li>
  );
}

export const inject = ["slots", "settingsScope", "locale"];

/** Register Sleev's localized settings card in the official keyed plugin slot. */
export function apply(ctx: ClientContext): void {
  ctx.effect(
    () => ctx.locale.register(LOCALE_NAMESPACE, { en, zh }),
    "dsh-sleev: settings dictionaries",
  );
  const controller = new SleevSettingsController(
    ctx.settingsScope.bind({ namespace: SETTINGS_NAMESPACE }),
  );
  ctx.slots.inject("settings.plugin.item", () => {
    const unregister = ctx.slots.register(
      {
        name: "settings.plugin.item",
        key: SETTINGS_NAMESPACE,
        locale: LOCALE_NAMESPACE,
        inject: () => controller.inject(),
      },
      SleevSettingsCard,
    );
    return () => {
      controller.dispose();
      unregister();
    };
  });
}
