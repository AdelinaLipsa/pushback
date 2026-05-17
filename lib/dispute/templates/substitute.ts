// Unknown `{key}` placeholders are preserved literally so typos surface in
// golden snapshots rather than crashing the render.
export function substitute(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_m, k) => (k in vars ? vars[k] : `{${k}}`))
}
