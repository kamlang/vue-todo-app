// Define a Markdown, and markdown Definitions
export type MarkdownName = string
export type TemplateFunction = (link: string, title?: string) => string
export type MarkdownTemplate = TemplateFunction | string

export interface Markdown {
  template: MarkdownTemplate
  icon: string
  title: string
  keyboardShortcut: string
}

export interface MarkdownsDefinitions {
  [index: MarkdownName]: Markdown
}

export interface MarkdownProps {
  name?: MarkdownName
  title?: string
  link?: string
  cursorPosition?: number
}