/** Subrayado manuscrito: dos trazos bezier estirados bajo el texto. */
export function Underline() {
  return (
    <svg className="underline__svg" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d="M2 6 C 18 2, 38 9, 58 5 S 88 3, 98 6" />
      <path d="M5 8.5 C 30 5.5, 56 10, 96 7.5" opacity="0.55" />
    </svg>
  )
}

export function Underlined({ as: Tag = 'span', className = '', children }) {
  return (
    <Tag className={`underline ${className}`.trim()}>
      {children}
      <Underline />
    </Tag>
  )
}
