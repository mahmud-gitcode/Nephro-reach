/**
 * Marks a control whose feature does not exist yet.
 *
 * The audit found 35 buttons in this app that rendered, looked pressable,
 * and did nothing at all — Edit, Delete, Download PDF, Scan Results. A
 * member pressing one has no way to tell whether it worked, whether the app
 * is broken, or whether they mis-clicked. Silence is the worst of the
 * available answers.
 *
 * So a control that cannot work yet says so:
 *
 *     <Button {...notBuiltYet("Downloading results")}>Download PDF</Button>
 *
 * It is deliberately one call rather than a scattering of `disabled` props,
 * because it is also the to-do list: `grep notBuiltYet` returns everything
 * still waiting on a feature, and each call says which feature.
 *
 * A note on the limits: `disabled` removes the button from the tab order,
 * so the `title` never reaches a screen reader. That is an acceptable
 * trade while nothing behind the button works — an unreachable control is
 * closer to the truth than a reachable one that lies. When the feature
 * lands, delete the call; nothing else about the button changes.
 */
export function notBuiltYet(feature: string) {
  return {
    disabled: true,
    title: `${feature} is not available yet`,
  } as const;
}
