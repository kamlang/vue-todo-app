import { config, mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import { describe, it, expect, vi, beforeEach, beforeAll, afterEach } from "vitest";
import App from './App.vue';
import { httpRequest } from './lib/httpRequest'
import { v4 as uuidv4 } from 'uuid';

beforeAll(async () => {
  config.global.mocks = {
    $auth0: {
      user: { nickname: "userTest" },
      isAuthenticated: true,
      isLoading: false,
      getAccessTokenSilently: () => vi.fn(),
    },
  }
  vi.mock('./lib/httpRequest', () => {
    return {
      httpRequest: vi.fn()
    }
  })
})

beforeEach(async () => {
  httpRequest
    .mockImplementationOnce(() => {
      return [{
        _id: uuidv4(), "name": "project1", "tasks": [
          { _id: uuidv4(), body: "==bodyTest1==", completed: false, dueDate: null },
          { _id: uuidv4(), body: "[bodyTest2](test)", completed: false, dueDate: null }]
      },
      {
        _id: uuidv4(), "name": "project2", "tasks": [
          { _id: uuidv4(), body: "bodyTest3", completed: false, dueDate: null }]
      }]
    })
})

afterEach(async () => {
  httpRequest = vi.fn().mockReset()
})

describe("Testing markdown integration.", () => {
  it("Testing rendering of markdown in the task list", async () => {

    const wrapper = mount(App)
    await flushPromises()
    expect(httpRequest).toHaveBeenCalledOnce()

    let projectsArray = wrapper.findAll('[data-test-id=projectName]')
    expect(projectsArray.length).toBe(2)
    expect(projectsArray.at(0).text()).toBe("project1 (2)")
    expect(projectsArray.at(1).text()).toBe("project2 (1)")

    const taskBody1 = wrapper.get('[data-test-id=taskBody-0]')
    expect(taskBody1.html()).toContain("<p><mark>bodyTest1</mark></p>")

    const taskBody2 = wrapper.get('[data-test-id=taskBody-1]')
    expect(taskBody2.html()).toContain('<p><a href="test">bodyTest2</a></p>')
  })

  it("Testing if preview works correctly", async () => {
    const wrapper = mount(App)
    await flushPromises()
    expect(httpRequest).toHaveBeenCalledOnce()

    let taskCreater = wrapper.get('[data-test-id=task-creater]')
    await taskCreater.trigger('click')

    const markdownToolBar = wrapper.get('[data-test-id=markdownToolbar]')
    const taskBody = wrapper.get('[data-test-id=task-body]')
    await taskBody.setValue("a")
    const listMarkdown = wrapper.get('[data-test-id=markdown-list]')
    await listMarkdown.trigger('click')
    await flushPromises()
    expect(taskBody.text()).toContain("+")
    await taskBody.setValue("+ a")

    const previewButton = wrapper.get('[data-test-id=previewButton]')
    await previewButton.trigger('click')
    const previewBox = wrapper.get('[data-test-id=previewBox]')
    expect(previewBox.html()).toContain("<li>a</li>")
    // await createTaskInput.setValue("+ taskListTest")


  })


  //  it("Test link using dialogbox",() => {
  //  it("Test list using rendering",() => {
  //  it("Test markdown using keyboard shortcut ",() => {
  //  it("Test link simple link without marker",() => {

})
