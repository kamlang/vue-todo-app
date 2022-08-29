import MarkdownIt from 'markdown-it'
import MarkdownItMark from 'markdown-it-mark'
import { computed, ref } from 'vue'
import { getMarkdown, markdownsWithATemplateFunction } from './markdown-definition'
import type { MarkdownProps, TemplateFunction, MarkdownTemplate } from './types'
export function useMarkdown() {

  const PLACE_HOLDER_CHAR = "$"
  const md = MarkdownIt('default', {
    linkify: true,
    typographer: true,
    breaks: true
  }).use(MarkdownItMark)

  const markdownText = ref("")
  const renderedMarkdownText = computed(() => {
    return renderMarkdownText(markdownText.value)
  })

  function renderMarkdownText(textWithMarkdown: string) {
    return md.render(textWithMarkdown)
  }

  function insertMarkdownAndGetCursorPosition(markdownProperties: MarkdownProps,
    cursorPosition: number): number {
    if (!markdownProperties.name) {
      throw new Error("Markdown name property has not been defined")
    }
    let { prefix, suffix } = _getPrefixAndSuffix(cursorPosition)
    let markdownTemplate = getMarkdown(markdownProperties.name).template as MarkdownTemplate

    if (markdownsWithATemplateFunction.includes(markdownProperties.name)) {
      if (!markdownProperties.link) {
        throw new Error("Markdown link property has not been defined")
      }
      markdownTemplate = (markdownTemplate as TemplateFunction)
        (markdownProperties.link, markdownProperties?.title) as string
    } else {
      markdownTemplate = markdownTemplate as string
    }
    let placeHolderPosition = markdownTemplate.indexOf(PLACE_HOLDER_CHAR)
    let markdownTemplateWithoutPlaceHolder = markdownTemplate.replace(PLACE_HOLDER_CHAR, "")
    markdownText.value = prefix + markdownTemplateWithoutPlaceHolder + suffix
    let newCursorPosition = cursorPosition + placeHolderPosition
    return newCursorPosition
  }

  function wrapTextInMarkdownAndGetCursorPosition(markdownProperties: MarkdownProps,
    cursorPosition: number, selectionLength: number): number {
    if (!markdownProperties.name) {
      throw new Error("Markdown name property has not been defined")
    }
    if (markdownsWithATemplateFunction.includes(markdownProperties.name)) {
      throw new Error("Can not wrap text into a template function.")
    }
    let { prefix, suffix } = _getPrefixAndSuffix(cursorPosition)
    let textToWrap = suffix.slice(0, selectionLength)
    suffix = suffix.slice(selectionLength,)

    let markdownTemplate = getMarkdown(markdownProperties.name).template as string
    let wrappedText = markdownTemplate.replace(PLACE_HOLDER_CHAR, textToWrap.trim())

    markdownText.value = prefix + wrappedText + suffix
    let newCursorPosition = markdownText.value.length - suffix.length
    return newCursorPosition
  }

  function _getPrefixAndSuffix(cursorPosition: number) {
    let prefix = markdownText.value.slice(0, cursorPosition)
    let suffix = markdownText.value.slice(cursorPosition,)
    return { prefix, suffix }
  }

  return {
    markdownText,
    renderedMarkdownText,
    renderMarkdownText,
    insertMarkdownAndGetCursorPosition,
    wrapTextInMarkdownAndGetCursorPosition,
  }
}