import MarkdownIt from 'markdown-it'
import MarkdownItMark from 'markdown-it-mark'
import { computed, ref } from 'vue'
import { getMarkdownDefinition } from './markdown-definition'
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
    return md.render(markdownText.value)
  })

  function renderMarkdownText(textWithMarkdown: string) {
    return md.render(textWithMarkdown)
  }

  function insertMarkdownAndGetCursorPosition(markdownProperties: MarkdownProps, cursorPosition: number): number {
    let { prefix, suffix } = _getPrefixAndSuffix(cursorPosition)
    let markdownTemplate

    if (markdownProperties.link &&
      (markdownProperties.name === 'link' || markdownProperties.name === 'image')) {
      let markdownTemplateFunction = _getMarkdownTemplate(markdownProperties.name) as TemplateFunction
      markdownTemplate = markdownTemplateFunction(markdownProperties.link, markdownProperties.title) as string
    } else {
      markdownTemplate = _getMarkdownTemplate(markdownProperties.name as string) as string
    }
    let placeHolderPosition = markdownTemplate.indexOf(PLACE_HOLDER_CHAR)
    let markdownTemplateWithoutPlaceHolder = markdownTemplate
      .replace(PLACE_HOLDER_CHAR, "")
    markdownText.value = prefix + markdownTemplateWithoutPlaceHolder + suffix
    let newCursorPosition = cursorPosition + placeHolderPosition
    return newCursorPosition
  }

  function wrapTextInMarkdownAndGetCursorPosition(markdownToWrapTextIn: MarkdownProps, cursorPosition: number, selectionLength: number): number {
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
    let selectedMarkdownTemplate = getMarkdownDefinition(markdownName).template
    return selectedMarkdownTemplate
  }

  return {
    markdownText,
    renderedMarkdownText,
    renderMarkdownText,
    insertMarkdownAndGetCursorPosition,
    wrapTextInMarkdownAndGetCursorPosition,
  }
}