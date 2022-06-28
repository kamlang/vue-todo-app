import { config, mount, flushPromises } from '@vue/test-utils'
import App from './App.vue';
import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import axios from 'axios'


beforeAll(async () => {
  config.global.mocks = {
    $auth0: {
      user: { nickname: "userTest" },
      isAuthenticated: true,
      isLoading: false,
      getAccessTokenSilently: () => vi.fn()
    }
  }
})

beforeEach(async () => {
  axios.get = vi.fn()
    .mockImplementation(() => {
      return {
        data:
          [{ "name": "taskList1", "tasks": [1] }, { "name": "taskList2", "tasks": [1] }]
      }
    })
  axios.post = vi.fn()
    .mockImplementationOnce(() => {
      return { data: [{ body: "bodyTest", completed: false }] }
    })
    .mockImplementationOnce(() => {
      return { data: [] }
    })
})

describe("", () => {
  it("Testing rendering of user data and creation of a task list", async () => {
    /*  User arrives on the main page his data are supposed to be populated.
     User has two tasklist named "taskList1" with a task "bodyTest" and "TaskList2" 
     Meaning his task list has to include both.
     And he must have a task "bodyTest" rendered on taskList1.
     Then he creates a new task list named "taskTest", 
     name should be added in the taskbar and the task list should be selected.
     meaning he should not have any task listed. */
    axios.put = vi.fn()
      .mockImplementationOnce(() => {
        return {
          data:
            { "name": "taskListTest", "tasks": [] }
        }
      })

    const wrapper = mount(App)

    await flushPromises()
    expect(axios.get).toHaveBeenCalledOnce()

    let taskArray = wrapper.findAll('[data-test-id=taskListName]')
    expect(taskArray.at(0).text()).toBe("taskList1 (1)")
    expect(taskArray.at(1).text()).toBe("taskList2 (1)")
    expect(axios.post).toHaveBeenCalledOnce()

    const taskBody = wrapper.get('[data-test-id=taskBody-0]')
    expect(taskBody.text()).toBe("bodyTest")

    const createTaskButton = wrapper.get('[data-test-id=createNewTaskListButton]')
    await createTaskButton.trigger("click")
    const createTaskInput = wrapper.get('[data-test-id=createNewTaskListInput]')
    await createTaskInput.setValue("taskListTest")

    const validateTaskListName = wrapper.get('[data-test-id=validateTaskListNameButton]')
    await validateTaskListName.trigger("click")
    await flushPromises()
    expect(axios.put).toHaveBeenCalledOnce()
    expect(axios.post).toHaveBeenCalledTimes(2)

    taskArray = await wrapper.findAll('[data-test-id="taskListName"]')
    expect(taskArray.at(0).text()).toBe("taskList1 (1)")
    expect(taskArray.at(1).text()).toBe("taskList2 (1)")
    expect(taskArray.at(2).text()).toBe("taskListTest (0)")
    expect(taskArray.at(2).classes()).toContain('active')
    expect(() => wrapper.get('[data-test-id=taskBody]'))
      .toThrowError()
  })
  it("Deleting a task list", async () => {
    /* User have two tasks list taskList1 and taskList2, taskList1 is selected. 
    He clicks on delete button choose "No" at warning message so taskList1 
    should still exists. Then he clicks "Yes" taskList1 should have been deleted */
    axios.delete = vi.fn()
    const wrapper = mount(App)
    await flushPromises()
    expect(axios.get).toHaveBeenCalledOnce()

    let taskArray = wrapper.findAll('[data-test-id=taskListName]')
    expect(taskArray.at(0).text()).toBe("taskList1 (1)")
    expect(taskArray.at(1).text()).toBe("taskList2 (1)")

    const deleteButton = wrapper.find("[data-test-id=deleteTaskList]")
    await deleteButton.trigger("click")
    const warnNoButton = wrapper.find("[data-test-id=warnNo]")
    await warnNoButton.trigger("click")
    taskArray = wrapper.findAll('[data-test-id=taskListName]')
    expect(taskArray.at(0).text()).toBe("taskList1 (1)")
    expect(taskArray.at(1).text()).toBe("taskList2 (1)")

    await deleteButton.trigger("click")
    const warnYesButton = wrapper.find("[data-test-id=warnYes]")
    await warnYesButton.trigger("click")
    await flushPromises()
    expect(axios.delete).toHaveBeenCalledOnce()

    taskArray = wrapper.findAll('[data-test-id=taskListName]')
    expect(taskArray.length).toBe(1)
    expect(taskArray[0].text()).not.contain("taskList1 (1)")

  })
  it("rename task list", async () => {
    /* User double click a taskname to rename it an inputbox should appear.
    First time it doesn't enter a new name and cancel it input box should disappear. 
    Next he clicks again and enter "taskList3" as new name.
    name should be updated in task list bar. Then he tries to rename taskList2 to taskList3
    which should display and error message as two task list can't have the same name.
    */
    axios.patch = vi.fn()
      .mockImplementationOnce(() => { return { data: {} } })

    const wrapper = mount(App)
    await flushPromises()
    expect(axios.get).toHaveBeenCalledOnce()

    let taskArray = wrapper.findAll('[data-test-id=taskListName]')
    expect(taskArray.at(0).text()).toBe("taskList1 (1)")
    expect(taskArray.at(1).text()).toBe("taskList2 (1)")

    await taskArray[0].trigger("dblclick")
    const inputNewTaskName = wrapper.get('[data-test-id=inputNewTaskName]')
    const cancelNewName = wrapper.get('[data-test-id=cancelNewName]')
    expect(() => wrapper.get('[data-test-id=confirmNewName]')).toThrowError()
    await cancelNewName.trigger("click")
    expect(() => wrapper.get('[data-test-id=inputNewTaskName]')).toThrowError()

    taskArray = wrapper.findAll('[data-test-id=taskListName]')
    expect(taskArray.length).toEqual(2)
    await taskArray[0].trigger("dblclick")
    await inputNewTaskName.setValue("taskList3")

    let confirmNewName = wrapper.get('[data-test-id=confirmNewName]')
    await confirmNewName.trigger("click")
    await flushPromises()
    expect(axios.patch).toHaveBeenCalledOnce()

    taskArray = wrapper.findAll('[data-test-id=taskListName]')
    expect(taskArray.length).toEqual(2)
    expect(taskArray.at(0).text()).toBe("taskList3 (1)")
    expect(taskArray.at(1).text()).toBe("taskList2 (1)")
  })
  it("rename and create a task list with already exisiting names.", async () => {
    /* User tries to rename a task list with a name which already exists
    Then he tries to create a new one with an already existing name, 
    an error message should be displayed and user should be able to close it using
    the close icon. Task list name in the task bar should remain unchanged. */

    // mocking http error returned by the server.
    axios.patch = vi.fn()
      .mockImplementation(() =>
        new Promise((_, rej) => rej({ response: { data: { message: 'error' } } }))
      )

    axios.put = vi.fn()
      .mockImplementation(() =>
        new Promise((_, rej) => rej({ response: { data: { message: 'error' } } }))
      )

    const wrapper = mount(App)
    await flushPromises()
    expect(axios.get).toHaveBeenCalledOnce()

    let taskArray = wrapper.findAll('[data-test-id=taskListName]')
    expect(taskArray.at(0).text()).toBe("taskList1 (1)")
    expect(taskArray.at(1).text()).toBe("taskList2 (1)")

    await taskArray[0].trigger("dblclick")
    let inputNewTaskName = wrapper.find('[data-test-id=inputNewTaskName]')
    expect(inputNewTaskName.exists()).toBe(true)
    expect(wrapper.find('[data-test-id=confirmNewName]').exists()).toBe(false)

    await inputNewTaskName.setValue("taskList2 (1)")
    let confirmNewNameButton = wrapper.find('[data-test-id=confirmNewName]')
    expect(confirmNewNameButton.exists()).toBe(true)
    await confirmNewNameButton.trigger('click')
    await flushPromises()
    expect(axios.patch).toHaveBeenCalledOnce()

    let errorMessageClose = wrapper.find('[data-test-id=errorMessageClose]')
    await errorMessageClose.trigger('click')
    expect(wrapper.find('[data-test-id=errorMessage]').exists()).toBe(false)

    taskArray = wrapper.findAll('[data-test-id=taskListName]')
    expect(taskArray.at(0).text()).toBe("taskList1 (1)")
    expect(taskArray.at(1).text()).toBe("taskList2 (1)")

    const createTaskButton = wrapper.get('[data-test-id=createNewTaskListButton]')
    await createTaskButton.trigger("click")

    const createTaskInput = wrapper.get('[data-test-id=createNewTaskListInput]')
    await createTaskInput.setValue("taskList1 (1)")

    expect(confirmNewNameButton.exists()).toBe(true)
    await createTaskInput.trigger('keydown.enter')
    await flushPromises()
    expect(axios.put).toHaveBeenCalledOnce()

    errorMessageClose = wrapper.find('[data-test-id=errorMessageClose]')
    await errorMessageClose.trigger('click')
    expect(wrapper.find('[data-test-id=errorMessage]').exists()).toBe(false)

    taskArray = wrapper.findAll('[data-test-id=taskListName]')
    expect(taskArray.at(0).text()).toBe("taskList1 (1)")
    expect(taskArray.at(1).text()).toBe("taskList2 (1)")

  })

  it('Testing editing and deleting a task', async () => {
    /* A user has a task "bodyTest" he clicks on it, 
    icon to edit delete and mark as completed should be displayed.
    Then he clicks on edit and use the cancel button, so task should remains
    unchanged, then he clicks on edit and change the content of the task to
    editBodyTest" change should be reflected.
    Then he tries to delete the task, a warning message should be displayed. 
    He clicks the "Yes" button, so there should be no task left.
    */

    axios.patch = vi.fn()
    axios.delete = vi.fn()

    const wrapper = mount(App)
    await flushPromises()
    expect(axios.get).toHaveBeenCalledOnce()

    let taskArray = wrapper.findAll('[data-test-id=taskListName]')
    expect(taskArray.at(0).text()).toBe("taskList1 (1)")
    expect(taskArray.at(1).text()).toBe("taskList2 (1)")

    let taskBody = wrapper.get('[data-test-id=taskBody-0]')
    expect(taskBody.text()).toBe("bodyTest")
    await taskBody.trigger('click')

    let editTaskButton = wrapper.get('[data-test-id=editTaskButton]')
    let deleteTaskButton = wrapper.get('[data-test-id=deleteTaskButton]')
    let markAsCompletedButton = wrapper.get('[data-test-id=markAsCompletedButton]')
    await editTaskButton.trigger('mouseup')
    let editInputBox = wrapper.get('[data-test-id=editInputBox]')
    await editInputBox.setValue('editBodyTest')

    /* Editing the task and pressing cancel, task should remain unchanged
    (Added later on as regression test)*/

    const confirmEditButton = wrapper.get('[data-test-id=confirmEditButton]')
    const cancelEditButton = wrapper.get('[data-test-id=cancelEditButton]')
    await cancelEditButton.trigger('click')
    await taskBody.trigger('click')
    await editTaskButton.trigger('mouseup')

    expect(editInputBox.text()).toBe("bodyTest")
    await editInputBox.setValue('editBodyTest')
    await confirmEditButton.trigger('click')
    await flushPromises()
    expect(axios.patch).toHaveBeenCalledOnce()

    expect(taskBody.text()).toBe("editBodyTest")
    await taskBody.trigger('click')
    await deleteTaskButton.trigger('mouseup')
    const warnYes = wrapper.get('[data-test-id=warnYes]')
    await warnYes.trigger('click')
    await flushPromises()
    expect(axios.delete).toHaveBeenCalledOnce()
    taskBody = wrapper.find('[data-test-id=taskBody-0]')
    expect(taskBody.exists()).toBe(false)

  })

  it('testing drag and drop', async () => {
    /* User has two tasks, he takes the last task in the list and
    drag it over the first. Order of tasks should be switched. */
    axios.post = vi.fn()
      .mockImplementationOnce(() => {
        return { data: [{ body: "bodyTest1", completed: false }, { body: "bodyTest2", completed: false }] }
      })
    const wrapper = mount(App)

    await flushPromises()
    expect(axios.get).toHaveBeenCalledOnce()

    let taskListArray = wrapper.findAll('[data-test-id=taskListName]')
    expect(taskListArray.at(0).text()).toBe("taskList1 (1)")
    expect(taskListArray.at(1).text()).toBe("taskList2 (1)")
    expect(axios.post).toHaveBeenCalledOnce()

    let firstTaskHeader = wrapper.get('[data-test-id=taskHeader-0]')
    let lastTaskHeader = wrapper.get('[data-test-id=taskHeader-1]')
    let firstTask = wrapper.find('[data-test-id=taskBody-0]')
    expect(firstTask.text()).toEqual("bodyTest1")

    await lastTaskHeader.trigger('dragstart')
    await firstTaskHeader.trigger('dragenter')
    await firstTaskHeader.trigger('drop')

    expect(firstTask.text()).toEqual("bodyTest2")
  })

  it('push to the top button', async () => {
    /* User has two tasks, he clicks the push to the top button,
    previously second task should now be the first one.*/
    axios.post = vi.fn()
      .mockImplementationOnce(() => {
        return { data: [{ body: "bodyTest1", completed: false }, { body: "bodyTest2", completed: false }] }
      })
    const wrapper = mount(App)

    await flushPromises()
    expect(axios.get).toHaveBeenCalledOnce()
    let firstTask = wrapper.find('[data-test-id=taskBody-0]')
    let secondTask = wrapper.get('[data-test-id=taskBody-1]')
    expect(firstTask.text()).toBe("bodyTest1")
    expect(secondTask.text()).toBe("bodyTest2")
    await secondTask.trigger('click')

    let pushTopButton = wrapper.get('[data-test-id=pushTopButton]')
    await pushTopButton.trigger('mouseup')

    firstTask = wrapper.get('[data-test-id=taskBody-0]')
    secondTask = wrapper.get('[data-test-id=taskBody-1]')

    expect(firstTask.text()).toBe("bodyTest2")
    expect(secondTask.text()).toBe("bodyTest1")
  })

  it('mark as completed', async () => {
    /* User has two tasks he marks one as completed, so it should be removed.
    Then he clicks on the "toggle show completed" button he should see it there.
    Then he put it back as not completed, task should appear in the "not completed" list again.*/
    axios.post = vi.fn()
      .mockImplementationOnce(() => {
        return { data: [{ body: "bodyTest1", completed: false }, { body: "bodyTest2", completed: false }] }
      })
    const wrapper = mount(App)

    await flushPromises()
    expect(axios.get).toHaveBeenCalledOnce()
    let firstTask = wrapper.find('[data-test-id=taskBody-0]')
    let secondTask = wrapper.get('[data-test-id=taskBody-1]')
    await secondTask.trigger('click')

    let markAsCompletedButton = wrapper.get('[data-test-id=markAsCompletedButton]')
    await markAsCompletedButton.trigger('mouseup')

    secondTask = wrapper.find('[data-test-id=taskBody-1]')
    expect(secondTask.exists()).toBe(false)

    let toggleButton = wrapper.get('[data-test-id=toggle-show-completed]')
    await toggleButton.trigger('click')
    expect(firstTask.text()).toBe("bodyTest2")

    await firstTask.trigger('click')
    await markAsCompletedButton.trigger('mouseup')
    await toggleButton.trigger('click')

    secondTask = wrapper.get('[data-test-id=taskBody-1]')
    expect(secondTask.text()).toBe("bodyTest2")

  })
  it('edit duedate of a task using calendar component', async () => {
    /* A user chooses to edit a task. Then he clicks on the date input field,
 calendar component should shows up. User select a date in the past this should not be taken into account. Then he chooses a date in the future ( delete button should appear, if clicked input should be set back to "") Then he tries to set a time which is not valid.
 Time value should be reset to 00:00. Then he sets a valid time.
 Then he clicks cancel button, changes should do not have been updated when user tries to edit the task again.
 Then he presses the editTask button once again and choose a valid date and time and press save. We're checking if the update request include the correct due date.
 When trying to edit the task for one more time we should see the correct due date and time in the input fields. */

    const date = new Date(2022, 6, 21, 19)
    vi.setSystemTime(date)

    axios.post = vi.fn()
      .mockImplementation(() => {
        return { data: [{ body: "bodyTest1", completed: false, dueDate: null }, { body: "bodyTest2", completed: false, dueDate: null }] }
      })
    axios.patch = vi.fn()
    const wrapper = mount(App)
    await flushPromises()
    let firstTask = wrapper.find('[data-test-id=taskBody-0]')
    let secondTask = wrapper.get('[data-test-id=taskBody-1]')
    expect(firstTask.text()).toBe("bodyTest1")
    expect(secondTask.text()).toBe("bodyTest2")
    await secondTask.trigger('click')

    let editTaskButton = wrapper.get('[data-test-id=editTaskButton]')
    await editTaskButton.trigger('mouseup')

    let inputDate = wrapper.get('[data-test-id=input-duedate]')
    let inputTime = wrapper.get('[data-test-id=input-time]')

    await inputDate.trigger('mouseup')
    wrapper.get('[data-test-id=calendar]')

    // Pressing inc and dec month button.
    let incMonthButton = wrapper.get('[data-test-id=inc-month]')
    let decMonthButton = wrapper.get('[data-test-id=dec-month]')
    let currentMonth = wrapper.get('[data-test-id=current-month]')

    await incMonthButton.trigger('click')
    expect(currentMonth.text()).toContain("Aug")
    await decMonthButton.trigger('click')
    expect(currentMonth.text()).toContain("Jul")

    let prevDate = wrapper.get('[data-test-id="6-19"]')
    let futureDate = wrapper.get('[data-test-id="6-26"]')
    // clicking a previous date should not do anything and calendar should remain opened.
    await prevDate.trigger('click')
    await futureDate.trigger('click')
    // when a date is chosen calendar should be closed.
    expect(wrapper.find('[data-test-id=calendar]')
      .exists()).toBe(false)
    expect(inputDate.element.value).toContain("July 26")
    // if delete button is clicked then input field should be reset.
    let deleteButton = wrapper.get('[data-test-id=delete-duedate-button]')
    await deleteButton.trigger('click')
    expect(inputDate.element.value).toBe("")

    let cancelEditButton = wrapper.get('[data-test-id=cancelEditButton]')
    let confirmEditButton = wrapper.get('[data-test-id=confirmEditButton]')

    async function enterDueDate(action) {
      await inputDate.trigger('mouseup')
      futureDate = wrapper.get('[data-test-id="6-26"]')
      await futureDate.trigger('click')

      expect(inputDate.element.value).toContain("July 26")
      // Invalid time should not be acceptable and field should be set back to 00:00
      await inputTime.setValue("67:89")
      await inputTime.trigger('blur')
      expect(inputTime.element.value).toContain("00:00")
      await inputTime.setValue("10:42")
      expect(inputTime.element.value).toContain("10:42")

      if (action === 'confirm') {
        await confirmEditButton.trigger('click')
        await flushPromises()
        expect(axios.patch).toHaveBeenCalledWith(expect.anything(),
          expect.objectContaining({ "dueDate": expect.stringMatching("Jul 26 2022 10:42") }), expect.anything())

        await secondTask.trigger('click')
        await editTaskButton.trigger('mouseup')

        expect(inputDate.element.value).toContain("July 26")
        expect(inputTime.element.value).toContain("10:42")
      }
      if (action === 'cancel') {
        await cancelEditButton.trigger('click')
        await secondTask.trigger('click')
        await editTaskButton.trigger('mouseup')

        inputDate = wrapper.get('[data-test-id=input-duedate]')
        inputTime = wrapper.get('[data-test-id=input-time]')

        expect(inputTime.element.value).toEqual("00:00")
        expect(inputDate.element.value).toEqual("")
      }
    }

    const testCases = ['cancel', 'confirm']
    for (let testCase of testCases) await enterDueDate(testCase)
  })
})

// Test Task Creater