import { config, mount, flushPromises } from '@vue/test-utils'
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
          { _id: uuidv4(), body: "bodyTest1", completed: false, dueDate: null },
          { _id: uuidv4(), body: "bodyTest2", completed: false, dueDate: null }]
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


describe("", () => {
  it("Testing rendering of user data and creation of a task list", async () => {

    /*  User arrives on the main page his data are supposed to be populated.
     User has two projects named "project1" with a task "bodyTest" and "TaskList2" 
     Meaning his task list has to include both.
     And he must have a task "bodyTest" rendered on project1.
     Then he creates a new task list named "taskTest", 
     name should be added in the taskbar and the task list should be selected.
     meaning he should not have any task listed. */

    const wrapper = mount(App)
    await flushPromises()
    expect(httpRequest).toHaveBeenCalledOnce()

    let projectsArray = wrapper.findAll('[data-test-id=projectName]')
    expect(projectsArray.length).toBe(2)
    expect(projectsArray.at(0).text()).toBe("project1 (2)")
    expect(projectsArray.at(1).text()).toBe("project2 (1)")

    const taskBody = wrapper.get('[data-test-id=taskBody-0]')
    expect(taskBody.text()).toBe("bodyTest1")

    const createTaskButton = wrapper.get('[data-test-id=createNewTaskListButton]')
    await createTaskButton.trigger("click")
    const createTaskInput = wrapper.get('[data-test-id=createNewTaskListInput]')
    await createTaskInput.setValue("taskListTest")

    httpRequest.mockImplementationOnce(() => {
      return { _id: uuidv4(), "name": "taskListTest", "tasks": [] }
    })
    const validateTaskListName = wrapper.get('[data-test-id=validateTaskListNameButton]')
    await validateTaskListName.trigger("click")
    await flushPromises()
    expect(httpRequest).toHaveBeenCalledTimes(2)

    projectsArray = await wrapper.findAll('[data-test-id="projectName"]')
    expect(projectsArray.at(0).text()).toBe("project1 (2)")
    expect(projectsArray.at(1).text()).toBe("project2 (1)")
    expect(projectsArray.at(2).text()).toBe("taskListTest (0)")
    expect(projectsArray.at(2).classes()).toContain('active')
    expect(wrapper.find('[data-test-id=taskBody]').exists()).toBe(false)

  })
  it("Deleting a project", async () => {
    /* A user has two projects project1 and project2, project1 is selected. 
    He clicks on delete button choose "No" at warning message so project1 
    should still exists. Then he clicks "Yes" project1 should have been deleted */

    const wrapper = mount(App)
    await flushPromises()

    const deleteButton = wrapper.find("[data-test-id=deleteProject]")
    await deleteButton.trigger("click")
    const warnNoButton = wrapper.find("[data-test-id=warnNo]")
    await warnNoButton.trigger("click")
    let projectsArray = wrapper.findAll('[data-test-id=projectName]')
    expect(projectsArray.at(0).text()).toBe("project1 (2)")
    expect(projectsArray.at(1).text()).toBe("project2 (1)")
    expect(projectsArray.length).toBe(2)
    await deleteButton.trigger("click")
    const warnYesButton = wrapper.find("[data-test-id=warnYes]")
    await warnYesButton.trigger("click")
    await flushPromises()
    expect(httpRequest).toHaveBeenCalledTimes(2)

    projectsArray = wrapper.findAll('[data-test-id=projectName]')

    expect(projectsArray.length).toBe(1)
    expect(projectsArray[0].text()).not.contain("project1 (2)")
  })
  it("rename project", async () => {
    /* User double click a project tab to rename it an inputbox should appear.
    First time it doesn't enter a new name and cancel it input box should disappear. 
    Next he clicks again and enter "project3" as new name.
    Project bar should be updated.
    */
    const wrapper = mount(App)
    await flushPromises()

    let projectsArray = wrapper.findAll('[data-test-id=projectName]')
    await projectsArray[0].trigger("dblclick")
    const inputNewTaskName = wrapper.get('[data-test-id=inputNewTaskName]')
    const cancelNewName = wrapper.get('[data-test-id=cancelNewName]')
    expect(wrapper.find('[data-test-id=confirmNewName]').exists()).toBe(false)
    await cancelNewName.trigger("click")
    expect(wrapper.find('[data-test-id=inputNewTaskName]').exists()).toBe(false)

    projectsArray = wrapper.findAll('[data-test-id=projectName]')
    expect(projectsArray.length).toEqual(2)
    await projectsArray[0].trigger("dblclick")
    await inputNewTaskName.setValue("project3")

    let confirmNewName = wrapper.get('[data-test-id=confirmNewName]')
    await confirmNewName.trigger("click")
    await flushPromises()
    expect(httpRequest).toHaveBeenCalledTimes(2)

    projectsArray = wrapper.findAll('[data-test-id=projectName]')
    expect(projectsArray.length).toEqual(2)
    expect(projectsArray.at(0).text()).toBe("project3 (2)")
    expect(projectsArray.at(1).text()).toBe("project2 (1)")
  })
  it("rename and create a project with already exisiting names.", async () => {
    /* User tries to rename a project with a name that already exists.
    Then he tries to create a new one with an already existing name, 
    an error message should be displayed and user should be able to close it using
    the close icon. Projects name should remain unchanged. */

    const wrapper = mount(App)
    await flushPromises()
    let projectsArray = wrapper.findAll('[data-test-id=projectName]')
    await projectsArray[0].trigger("dblclick")
    let inputNewTaskName = wrapper.find('[data-test-id=inputNewTaskName]')
    expect(inputNewTaskName.exists()).toBe(true)
    expect(wrapper.find('[data-test-id=confirmNewName]').exists()).toBe(false)

    // mocking http error returned by the server.
    httpRequest.mockImplementation(() =>
      new Promise((_, rej) => rej('error'))
    )

    await inputNewTaskName.setValue("project2 (1)")
    let confirmNewNameButton = wrapper.find('[data-test-id=confirmNewName]')
    expect(confirmNewNameButton.exists()).toBe(true)
    await confirmNewNameButton.trigger('click')
    await flushPromises()
    // change for called with
    expect(httpRequest).toHaveBeenCalledTimes(2)

    let errorMessageClose = wrapper.find('[data-test-id=errorMessageClose]')
    await errorMessageClose.trigger('click')
    expect(wrapper.find('[data-test-id=errorMessage]').exists()).toBe(false)

    projectsArray = wrapper.findAll('[data-test-id=projectName]')
    expect(projectsArray.at(0).text()).toBe("project1 (2)")
    expect(projectsArray.at(1).text()).toBe("project2 (1)")

    const createTaskButton = wrapper.get('[data-test-id=createNewTaskListButton]')
    await createTaskButton.trigger("click")

    const createTaskInput = wrapper.get('[data-test-id=createNewTaskListInput]')
    await createTaskInput.setValue("project1 (2)")

    expect(confirmNewNameButton.exists()).toBe(true)
    await createTaskInput.trigger('keydown.enter')
    await flushPromises()
    // change for called with
    expect(httpRequest).toHaveBeenCalledTimes(3)

    errorMessageClose = wrapper.find('[data-test-id=errorMessageClose]')
    await errorMessageClose.trigger('click')
    expect(wrapper.find('[data-test-id=errorMessage]').exists()).toBe(false)

    projectsArray = wrapper.findAll('[data-test-id=projectName]')
    expect(projectsArray.at(0).text()).toBe("project1 (2)")
    expect(projectsArray.at(1).text()).toBe("project2 (1)")

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

    const wrapper = mount(App)
    await flushPromises()

    let taskBody = wrapper.get('[data-test-id=taskBody-0]')
    expect(taskBody.text()).toBe("bodyTest1")
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

    expect(editInputBox.text()).toBe("bodyTest1")
    await editInputBox.setValue('editBodyTest')
    await confirmEditButton.trigger('click')
    await flushPromises()
    // change to calledWith
    expect(httpRequest).toHaveBeenCalledTimes(2)

    expect(taskBody.text()).toBe("editBodyTest")
    await taskBody.trigger('click')
    await deleteTaskButton.trigger('mouseup')

    const warnNo = wrapper.get('[data-test-id=warnNo]')
    await warnNo.trigger('click')
    taskBody = wrapper.find('[data-test-id=taskBody-1]')
    expect(taskBody.exists()).toBe(true)

    await taskBody.trigger('click')
    await deleteTaskButton.trigger('mouseup')
    const warnYes = wrapper.get('[data-test-id=warnYes]')
    await warnYes.trigger('click')
    await flushPromises()
    expect(httpRequest).toHaveBeenCalledTimes(3)
    taskBody = wrapper.find('[data-test-id=taskBody-1]')
    expect(taskBody.exists()).toBe(false)

  })

  it('testing drag and drop', async () => {
    /* User has two tasks, he takes the last task in the list and
    drag it over the first. Order of tasks should be switched. */
    // TODO: Add more task to the list
    const wrapper = mount(App)
    await flushPromises()

    let firstTaskHeader = wrapper.get('[data-test-id=taskHeader-0]')
    let lastTaskHeader = wrapper.get('[data-test-id=taskHeader-1]')
    let firstTask = wrapper.find('[data-test-id=taskBody-0]')
    expect(firstTask.text()).toEqual("bodyTest1")

    await lastTaskHeader.trigger('dragstart')
    await firstTaskHeader.trigger('dragenter')
    await firstTaskHeader.trigger('dragend')

    firstTask = wrapper.find('[data-test-id=taskBody-0]')
    expect(firstTask.text()).toEqual("bodyTest2")
    expect(httpRequest).toHaveBeenCalledTimes(2)
    // check that request has been done with appropriate parameters
  })

  it('push to the top button', async () => {
    /* User has two tasks, he clicks the push to the top button,
    previously second task should now be the first one.*/
    const wrapper = mount(App)
    await flushPromises()

    expect(httpRequest).toHaveBeenCalledOnce()
    let firstTask = wrapper.get('[data-test-id=taskBody-0]')
    let secondTask = wrapper.get('[data-test-id=taskBody-1]')
    expect(firstTask.text()).toBe("bodyTest1")
    expect(secondTask.text()).toBe("bodyTest2")
    await secondTask.trigger('click')

    let pushTopButton = wrapper.get('[data-test-id=pushTopButton]')
    await pushTopButton.trigger('mouseup')

    expect(httpRequest).toHaveBeenCalledTimes(2)
    // check that httpRequest has been called with
    firstTask = wrapper.get('[data-test-id=taskBody-0]')
    secondTask = wrapper.get('[data-test-id=taskBody-1]')

    expect(firstTask.text()).toBe("bodyTest2")
    expect(secondTask.text()).toBe("bodyTest1")
  })

  it('Mark a task as completed', async () => {
    /* User has two tasks he marks one as completed, so it should not be visible anymore.
    Then he clicks on the "toggle show completed" button he should see it there.
    Then he put it back as not completed, task should appear in the "not completed" list again.*/

    const wrapper = mount(App)
    await flushPromises()

    expect(httpRequest).toHaveBeenCalledOnce()
    let firstTask = wrapper.get('[data-test-id=taskBody-0]')
    let secondTask = wrapper.get('[data-test-id=taskBody-1]')
    expect(firstTask.text()).toBe("bodyTest1")
    expect(secondTask.text()).toBe("bodyTest2")
    await secondTask.trigger('click')

    let markAsCompletedButton = wrapper.get('[data-test-id=markAsCompletedButton]')
    await markAsCompletedButton.trigger('mouseup')
    await flushPromises()

    secondTask = wrapper.get('[data-test-id=taskBody-1]')
    expect(secondTask.isVisible()).toBe(false)

    let toggleButton = wrapper.get('[data-test-id=toggle-show-completed]')
    await toggleButton.trigger('click')
    expect(secondTask.isVisible()).toBe(true)

    await secondTask.trigger('click')
    await markAsCompletedButton.trigger('mouseup')
    await toggleButton.trigger('click')
    await flushPromises()
    expect(httpRequest).toHaveBeenCalledTimes(3)
    expect(secondTask.isVisible()).toBe(false)
  })
  it('edit duedate of a task using calendar component', async () => {
    /* A user chooses to edit a task. Then he clicks on the date input field,
  calendar should shows up. User select a date in the past this should not be taken into account. Then he chooses a date in the future (delete button should appear, if clicked due date should be set back to "") Then he tries to set a time which is not valid.
  Time value should be reset to 00:00. Then he sets a valid time.
  Then he clicks cancel button, changes should do not have been updated when user tries to edit the task again.
  Then he presses the editTask button once again and choose a valid date and time and press save. We're checking if the updateTask api request include the correct due date.
  When trying to edit the task for one more time we should see the correct due date and time in the input fields. */

    const date = new Date(2024, 6, 21, 19)
    // Set an arbitrary date to test calendar functionalities, date has to be set in the future otherwise troubles arise when some events are triggered.

    vi.useFakeTimers()
    vi.setSystemTime(date)
    const wrapper = mount(App)
    await flushPromises()

    expect(httpRequest).toHaveBeenCalledOnce()
    let firstTask = wrapper.get('[data-test-id=taskBody-0]')
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
        expect(httpRequest).toHaveBeenNthCalledWith(2, expect.anything(), "patch", "/updateTask",
          expect.objectContaining({ "dueDate": expect.stringMatching("Jul 26 2024 10:42") }))

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
    vi.useRealTimers()
  })
  it('Testing notification clicking mark as completed', async () => {
    /* In project1 a user has a task with an anterior duedate, notifictation should be triggerd then he clicks marked as completed and task should be marked as completed and should not be visible anymore.
    */
    const date = new Date(Date.now() - 10000).toString()
    httpRequest = vi.fn()
      .mockImplementationOnce(() => {
        return [{
          _id: uuidv4(), "name": "project1", "tasks": [
            { _id: uuidv4(), body: "bodyTest1", completed: false, dueDate: date },
            { _id: uuidv4(), body: "bodyTest2", completed: false, dueDate: null }
          ]
        },
        {
          _id: uuidv4(), "name": "project2", "tasks": [
            { _id: uuidv4(), body: "bodyTest3", completed: false, dueDate: null }
          ]
        }]
      })

    const wrapper = mount(App)
    await flushPromises()

    let firstTask = wrapper.get('[data-test-id=taskBody-0]')
    let secondTask = wrapper.get('[data-test-id=taskBody-1]')
    expect(firstTask.text()).toBe("bodyTest1")
    expect(secondTask.text()).toBe("bodyTest2")
    let notificationElement = wrapper.get('[data-test-id=notification-container]')
    expect(notificationElement.text()).toContain("bodyTest1")
    // not finished should click on the button and check for a call to server
    const markAsCompletedButton = wrapper.get('[data-test-id="notification-markascompleted"]')
    await markAsCompletedButton.trigger('click')

    notificationElement = wrapper.find('[data-test-id=notification-container]')
    expect(notificationElement.exists()).toBe(false)
  })

  it('Testing notification clicking dismiss', async () => {
    const date = new Date(Date.now() - 10000).toString()
    httpRequest = vi.fn()
      .mockImplementationOnce(() => {
        return [{
          _id: uuidv4(), "name": "project1", "tasks": [
            { _id: uuidv4(), body: "bodyTest1", completed: false, dueDate: date },
            { _id: uuidv4(), body: "bodyTest2", completed: false, dueDate: null }
          ]
        },
        {
          _id: uuidv4(), "name": "project2", "tasks": [
            { _id: uuidv4(), body: "bodyTest3", completed: false, dueDate: null }
          ]
        }]
      })

    const wrapper = mount(App)
    await flushPromises()

    let firstTask = wrapper.find('[data-test-id=taskBody-0]')
    let secondTask = wrapper.get('[data-test-id=taskBody-1]')
    expect(firstTask.text()).toBe("bodyTest1")
    expect(secondTask.text()).toBe("bodyTest2")

    const notificationElement = wrapper.get('[data-test-id=notification-container]')
    expect(notificationElement.text()).toContain("bodyTest1")

    let dismissButton = wrapper.get('[data-test-id=notification-dismiss]')
    await dismissButton.trigger('click')
    await firstTask.trigger('click')
    let editTaskButton = wrapper.get('[data-test-id=editTaskButton]')
    await editTaskButton.trigger('mouseup')

    let inputDate = wrapper.get('[data-test-id=input-duedate]')
    let inputTime = wrapper.get('[data-test-id=input-time]')

    expect(inputDate.text()).toEqual("")
    expect(inputTime.text()).toEqual("")

  })

  it('testing creation of a new task', async () => {

    const wrapper = mount(App)
    await flushPromises()

    let firstTask = wrapper.get('[data-test-id=taskBody-0]')
    let secondTask = wrapper.get('[data-test-id=taskBody-1]')
    expect(firstTask.text()).toBe("bodyTest1")
    expect(secondTask.text()).toBe("bodyTest2")

    let taskCreater = wrapper.get('[data-test-id=task-creater]')
    await taskCreater.trigger('click')

    let taskTitle = wrapper.get('[data-test-id=task-title]')
    let taskBody = wrapper.get('[data-test-id=task-body]')

    await taskTitle.setValue("newTaskTitle")
    await taskBody.setValue("newTaskBody")
    expect(taskBody.element.value).toContain("newTaskBody")

    httpRequest.mockImplementation(() => {
      return { body: "newTaskBody", title: "newTaskTitle", dueDate: null, completed: false }
    })

    let addTaskButton = wrapper.get('[data-test-id=add-task-button]')
    await addTaskButton.trigger('click')
    await flushPromises()
    expect(httpRequest).toHaveBeenCalledTimes(2)

    addTaskButton = wrapper.find('[data-test-id=add-task-button]')
    expect(addTaskButton.exists()).toBe(false)

    firstTask = wrapper.get('[data-test-id=taskBody-0]')
    let firstTaskHeader = wrapper.get('[data-test-id=taskHeader-0]')
    expect(firstTask.text()).toBe("newTaskBody")
    expect(firstTaskHeader.text()).toContain("newTaskTitle")

  })
})
// test touch