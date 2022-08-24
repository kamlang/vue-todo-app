// Define a Markdown, and markdown Definitions

export type MarkdownName = string
export type TemplateFunction = (link: string, title?: string) => string
export type MarkdownTemplate = TemplateFunction | string

export interface MarkdownDefinition {
  template: MarkdownTemplate
  icon: string
  title: string
  keyboardShortcut: string
}

export interface Markdowns {
  [index: MarkdownName]: MarkdownDefinition
}
export interface SelectedMarkdown {
  name?: MarkdownName
  icon?: string
  title?: string
  link?: string
  cursorPosition?: number
}