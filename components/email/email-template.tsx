import type { ReactNode } from "react"

/**
 * Basic HTML email wrapper used by Resend / SendGrid.
 * Feel free to customize styles later.
 */
export function EmailTemplate({
  title,
  children,
}: {
  title?: string
  children: ReactNode
}) {
  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        lineHeight: "1.5",
        color: "#000",
      }}
    >
      {title ? <h1 style={{ margin: 0 }}>{title}</h1> : null}
      <div>{children}</div>
    </div>
  )
}
