import Handlebars from "handlebars"

/**
 * Renders an email template string with Handlebars.
 *
 * @param template The Handlebars template string.
 * @param data     The values to interpolate into the template.
 * @returns        Rendered HTML string.
 */
export function renderEmailTemplate(template: string, data: Record<string, unknown>): string {
  const compiled = Handlebars.compile(template)
  return compiled(data)
}
