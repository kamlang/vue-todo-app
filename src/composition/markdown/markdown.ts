import MarkdownIt from 'markdown-it'
import MarkdownItMark from 'markdown-it-mark'
import { markdownsDefinition } from './markdown-definition'
import type { TemplateFunction, MarkdownTemplate, SelectedMarkdown } from './types'
import { computed, ref } from 'vue'

export function useMarkdown() {

  const PLACE_HOLDER_CHAR = "$"

  const markdowns = ref(markdownsDefinition)
  const md = MarkdownIt('default', {
    linkify: true,
    typographer: true,
    breaks: true
  }).use(MarkdownItMark)
  const markdownText = ref("")
  const renderedMarkdownText = computed(() => {
    return md.render(markdownText.value)
  })

  function renderMarkdownText(textWithMarkdown: string) {
    return md.render(textWithMarkdown)
  }

  function insertMarkdownAt(markdownToInsert: SelectedMarkdown, cursorPosition: number): number {
    let { prefix, suffix } = _getPrefixAndSuffix(cursorPosition)

    let markdownTemplate

    if (markdownToInsert.link && (markdownToInsert.name === 'link' ||
      markdownToInsert.name === 'image')) {
      let markdownTemplateFunction = _getMarkdownTemplate(markdownToInsert.name) as TemplateFunction
      markdownTemplate = markdownTemplateFunction(markdownToInsert.link, markdownToInsert.title) as string
    } else {
      markdownTemplate = _getMarkdownTemplate(markdownToInsert.name as string) as string
    }
    let placeHolderPosition = markdownTemplate.indexOf(PLACE_HOLDER_CHAR)
    let markdownTemplateWithoutPlaceHolder = markdownTemplate
      .replace(PLACE_HOLDER_CHAR, "")
    markdownText.value = prefix + markdownTemplateWithoutPlaceHolder + suffix
    let newCursorPosition = cursorPosition + placeHolderPosition
    return newCursorPosition
  }

  function wrapTextInMarkdown(markdownToWrapTextIn: SelectedMarkdown, cursorPosition: number, selectionLength: number): number {

    let { prefix, suffix } = _getPrefixAndSuffix(cursorPosition)
    let textToWrap = suffix.slice(0, selectionLength)
    suffix = suffix.slice(selectionLength,)
    let markdownTemplate = _getMarkdownTemplate(markdownToWrapTextIn.name as string) as string
    let [markdownPrefix, markdownSuffix] = markdownTemplate
      .split(PLACE_HOLDER_CHAR)
    markdownText.value = prefix + markdownPrefix + textToWrap + markdownSuffix + suffix
    let newCursorPosition = markdownText.value.length - suffix.length
    return newCursorPosition
  }

  function _getPrefixAndSuffix(cursorPosition: number) {
    let prefix = markdownText.value.slice(0, cursorPosition)
    let suffix = markdownText.value.slice(cursorPosition,)
    return { prefix, suffix }
  }

  function _getMarkdownTemplate(markdownName: string): MarkdownTemplate {
    let selectedMarkdown = markdowns.value[markdownName].template
    if (selectedMarkdown) {
      return selectedMarkdown
    } else {
      throw new Error('Markdown not found')
    }
  }

  return {
    markdownText,
    renderedMarkdownText,
    insertMarkdownAt,
    wrapTextInMarkdown,
    renderMarkdownText,
    markdowns
  }
}