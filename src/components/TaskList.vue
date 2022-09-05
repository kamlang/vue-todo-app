<script>
import dayjs from "dayjs"
import TaskCreater from "./TaskCreater.vue"
import Warning from "./Warning.vue"
import FadeTransition from "./FadeTransition.vue"
import Calendar from "./Calendar.vue"
import LocalizedFormat from 'dayjs/plugin/localizedFormat'
import Notification from "./Notification.vue"
import MarkdownText from './MarkdownText.vue'
import { useMarkdown } from "../composition/markdown/useMarkdown"

import { store } from '../state/state'
import { httpRequest } from "../lib/httpRequest"

export default {
  emits: ['error'],
  components: {
    TaskCreater,
    Notification,
    Calendar,
    Warning,
    FadeTransition,
    MarkdownText
  },
  setup() {
    const { renderMarkdownText } = useMarkdown()
    return {
      renderMarkdownText
    }
  },
  data() {
    return {
      store,

      showCompletedTasks: false,
      taskToEdit: null,
      editingTask: false,
      deletingTask: false,
      taskToDelete: null,
      areTasksDraggable: true,
      draggedTaskIndex: -1,
      hoveredTaskIndex: -1,
      touchTimerStart: 0,
      showTaskMenu: true,

      clearTouchTimeout: Object
    }
  },
  methods: {
    cancelEditTask() {
      this.editingTask = false
      this.taskToEdit = null
    },

    beforeEditingTask(task) {
      this.editingTask = true
      this.taskToEdit = { ...task }
    },

    cancelDeleteTask() {
      this.deletingTask = false
      this.taskToDelete = null
    },

    showTaskBody(task) {
      if (this.taskToEdit) {
        return task._id !== this.taskToEdit._id
      } else if (this.taskToDelete) {
        return task._id !== this.taskToDelete._id
      }
      return true
    },

    formatedDate(date) {
      dayjs.extend(LocalizedFormat)
      return dayjs(date).format("LLL")
    },

    setErrorMessage(errorMessage) {
      this.$emit('error', errorMessage)
    },

    toggleTaskCompleted(task) {
      this.taskToEdit = { ...task }
      this.taskToEdit.completed = !this.taskToEdit.completed
      this.updateTask()
    },

    beforeDeletingTask(task) {
      /* mark task as potentially deleted
      warning message is triggered then user can confirms if task should really be deleted */
      this.deletingTask = true
      this.taskToDelete = { ...task }
    },

    async pushTaskToTheTop(index) {
      this.draggedTaskIndex = index
      this.hoveredTaskIndex = 0
      await this.updateTaskOrder()
      this.resetDragData()
    },

    async updateTaskOrder() {
      try {
        const accessToken = await this.$auth0.getAccessTokenSilently();
        await httpRequest(accessToken,
          "patch",
          "/tasks",
          {
            name: this.store.selectedProject.name,
            tasks: this.store.selectedProject.tasks.map(task => task._id)
          },
        )
        this.store.reOrderSelectedProject(this.draggedTaskIndex, this.hoveredTaskIndex)
      } catch (e) {
        console.log(e)
      }
    },

    async deleteTask() {
      try {
        const accessToken = await this.$auth0.getAccessTokenSilently();
        await httpRequest(accessToken,
          "delete",
          "/task",
          {
            _id: this.taskToDelete._id
          },
        )
        this.store.deleteTask(this.taskToDelete)
        this.deletingTask = false
        this.taskToDelete = null
      } catch (e) {
        console.log(e)
      }
    },

    async updateTask(index) {
      try {
        const accessToken = await this.$auth0.getAccessTokenSilently();
        await httpRequest(accessToken,
          "patch",
          "/task",
          this.taskToEdit,
        )
        this.store.updateTask(this.taskToEdit, index)
      } catch (e) {
        console.log(e)
      } finally {
        this.taskToEdit = null
        this.editingTask = false
      }
    },

    handleDragEnter(index) {
      this.hoveredTaskIndex = index
    },

    handleDragStart(index) {
      this.draggedTaskIndex = index
      this.hoveredTaskIndex = index
    },

    resetDragData() {
      this.draggedTaskIndex = -1
      this.hoveredTaskIndex = -1
    },

    async handleDragEnd() {
      if ((this.draggedTaskIndex !== -1 && this.hoveredTaskIndex !== -1)
        && (this.draggedTaskIndex !== this.hoveredTaskIndex)) {
        await this.updateTaskOrder()
      }
      this.resetDragData()
    },

    handleTouchStart(index) {
      // Only shows menu for 4sec if user touches the task.
      this.showTaskMenu = true
      this.clearTouchTimeout && clearTimeout(this.clearTouchTimeout)
      this.clearTouchTimeout = setTimeout(() => this.showTaskMenu = false, 4000)

      if (this.draggedTaskIndex !== -1) {
        this.handleDragEnter(index)
      }
      let now = new Date()
      this.touchTimerStart = now.valueOf()
    },

    handleTouchMove() {
      this.showTaskMenu = false
      // If touchmove event is fired then touchTimerStart is set in the future so it won't trigger move tasks functionality.
      this.touchTimerStart = new Date().setFullYear(3000)
    },
    handleTouchEnd(index) {
      /* If user touches a task longer than minduration, then he can moves it
      around to reorder his task list. If shorter simply select the task. */
      let minTouchDuration = 500
      let now = new Date()
      let touchDuration = now.valueOf() - this.touchTimerStart
      if (touchDuration >= minTouchDuration) {
        this.handleDragStart(index)
      } else if (this.hoveredTaskIndex === index) {
        this.handleDragEnd()
      } else {
        this.store.setSelectedTask(index)
      }
      this.touchTimerStart = 0
    },

    markNotifiedTaskAsCompleted(task) {
      this.taskToEdit = { ...task }
      this.taskToEdit.completed = true
      this.store.deleteNotification(task)
      this.updateTask()
    },

    dismissReminderOfNotifiedTask(task) {
      this.taskToEdit = { ...task }
      this.taskToEdit.dueDate = null
      this.store.deleteNotification(task)
      this.updateTask()
    },

    toggleDraggable() {
      this.areTasksDraggable = !this.areTasksDraggable
    },
  }
}
</script>

<template>
  <div v-if="store.selectedProject" class="ui fluid container">
    <Notification
      @markTaskAsCompleted="markNotifiedTaskAsCompleted(task)"
      @dismissTaskReminder="dismissReminderOfNotifiedTask
      (task)"
      v-for="task in store.notifications"
      :task="task"
    ></Notification>

    <div class="ui segments">
      <TaskCreater
        @error="setErrorMessage"
        @toggle-show-completed="showCompletedTasks = !showCompletedTasks"
      ></TaskCreater>
      <TransitionGroup name="list">
        <div
          class="ui segment attached task-wrapper"
          v-for="(task,index) in store.selectedProject.tasks"
          @dragover.prevent
          @drop.prevent
          @keydown.enter="store.setSelectedTask(index)"
          @click="store.setSelectedTask(index)"
          @dragstart="handleDragStart(index)"
          @dragenter="handleDragEnter(index)"
          @dragend="handleDragEnd"
          @mouseleave="store.setSelectedTask(-1)"
          @touchstart.prevent="handleTouchStart(index)"
          @touchend.prevent="handleTouchEnd(index)"
          @touchmove="handleTouchMove()"
          :style="[hoveredTaskIndex === index ? 'border-top: solid' : 'border-top: none !important', 'z-index = -1']"
          :key="task._id"
          :class="[store.selectedTask === task && 'taskelement-active',
          hoveredTaskIndex === index ? 'horizontal-shake' : '', store.selectedTask === task ? '' : 'secondary',]"
          :draggable="!editingTask && areTasksDraggable"
          v-show="task.completed === showCompletedTasks"
        >
          <div
            :class="task.completed ? 'completed' : 'not-completed'"
            :data-test-id="'taskHeader-' + index"
            class="ui segment vertically attached fitted taskheader"
            @click.prevent
            style="display: flex; justify-content: space-between;"
            @touchstart.prevent.stop="handleTouchStart(index)"
          >
            <span style>{{ task.title && 'Title: ' }}{{ task.title }}</span>
            <span style>Created on: {{ formatedDate(task.createdAt) }}</span>
          </div>
          <div
            :data-test-id="'taskBody-' + index"
            :class="store.selectedTask === task && 'taskelement-active'"
            class="ui clearing attached segment taskelement"
          >
            <FadeTransition>
              <div
                class="ui right floated borderless menu"
                style="border: 0px !important"
                v-if="store.selectedTask === task && !editingTask && !deletingTask && showTaskMenu"
                z-index="100"
              >
                <a
                  tabindex="0"
                  data-test-id="markAsCompletedButton"
                  class="ui icon item"
                  :title="task.completed ? 'Mark this task as not completed.' :
                  'Mark this task as completed'"
                  @mouseup.stop="toggleTaskCompleted(task)"
                  @keydown.enter="toggleTaskCompleted(task)"
                  @touchend.stop="toggleTaskCompleted(task)"
                  @click.prevent.stop
                  @touchstart.prevent.stop
                  @touchmove.prevent
                >
                  <i :class="task.completed ? 'redo icon' : 'calendar check icon'"></i>
                </a>
                <a
                  tabindex="0"
                  title="Delete this task."
                  data-test-id="deleteTaskButton"
                  class="ui icon item"
                  @mouseup.stop="beforeDeletingTask(task)"
                  @keydown.enter="beforeDeletingTask(task)"
                  @touchend.stop="beforeDeletingTask(task)"
                  @click.prevent.stop
                  @touchstart.prevent.stop
                  @touchmove.prevent
                >
                  <i class="calendar minus icon"></i>
                </a>

                <a
                  tabindex="0"
                  data-test-id="editTaskButton"
                  title="Edit this task."
                  class="ui icon item"
                  @mouseup.stop="beforeEditingTask(task)"
                  @keydown.enter="beforeEditingTask(task)"
                  @touchend.stop="beforeEditingTask(task)"
                  @click.prevent.stop
                  @touchstart.prevent.stop
                  @touchmove.prevent
                >
                  <i class="edit icon"></i>
                </a>
                <a
                  tabindex="0"
                  data-test-id="pushTopButton"
                  title="Push this task to the top."
                  class="ui icon item"
                  @mouseup.stop="pushTaskToTheTop(index)"
                  @keydown.enter="pushTaskToTheTop(index)"
                  @touchend.stop="pushTaskToTheTop(index)"
                  @click.prevent.stop
                  @touchstart.prevent.stop
                  @touchmove.prevent
                >
                  <i class="hand point up outline icon"></i>
                </a>
              </div>
            </FadeTransition>
            <span
              v-if="showTaskBody(task)"
              class="taskbody"
              @mouseenter="toggleDraggable"
              @mouseleave="toggleDraggable"
              v-html="renderMarkdownText(task.body)"
            ></span>
            <FadeTransition>
              <span v-if="deletingTask && taskToDelete._id === task._id">
                <Warning
                  @yes="deleteTask"
                  @no="cancelDeleteTask"
                  :message="'Are you sure you want to delete this task ?'"
                ></Warning>
              </span>
            </FadeTransition>

            <div class="ui container" v-if="editingTask && taskToEdit._id === task._id">
              <div class="ui form">
                <div class="field">
                  <input
                    v-model="taskToEdit.title"
                    @touchstart.self="(event) => event.target.focus()"
                    @blur.self="(event) => event.target.blur()"
                    placeholder="Give a title to this task..."
                  />
                </div>
                <div class="field">
                  <label></label>
                  <MarkdownText
                    :textAreaDataTestId="'editInputBox'"
                    :taskBody="task.body"
                    @task-body-set="(taskBody) => { taskToEdit.body = taskBody }"
                    @touchstart.self="(event) => event.target.focus()"
                    @blur.self="(event) => event.target.blur()"
                  ></MarkdownText>
                </div>
                <Calendar
                  :active="store.selectedTask === task"
                  :injectedDueDate="taskToEdit.dueDate"
                  @dueDateSet="date => taskToEdit.dueDate = date"
                ></Calendar>

                <div v-if="task.body" class="ui buttons">
                  <button
                    tabindex="0"
                    data-test-id="cancelEditButton"
                    @click.stop="cancelEditTask"
                    @touchstart.prevent.stop
                    @touchend.stop="cancelEditTask"
                    @keydown.enter="cancelEditTask"
                    class="ui button"
                  >Cancel</button>
                  <div class="or"></div>
                  <button
                    tabindex="0"
                    data-test-id="confirmEditButton"
                    class="ui button"
                    @touchstart.prevent.stop
                    @click.stop="updateTask(index)"
                    @touchend.stop="updateTask(index)"
                    @keydown.enter="updateTask(index)"
                  >Save</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>
<style>
:root {
  --teal: #e1f7f7;
  --dark-teal: #22aaaa;
  --green-completed: #e5f9e7;
}
.taskelement p,
.taskelement ul {
  margin: 0 !important;
}
.taskbody {
  display: inline-block;
}
.taskbody * {
  width: fit-content;
}

.taskelement a {
  color: var(--dark-teal);
  font-weight: bold !important;
}
.taskelement a:hover {
  text-decoration: underline;
}

.taskelement mark {
  background-color: var(--dark-teal) !important;
  border-radius: 5px;
  padding: 0.2em;
}
</style>
<style scoped>
.ui.segments {
  display: flex;
  flex-direction: column;
  border: none;
  gap: 15px;
}

.task-wrapper {
  display: flex;
  flex-direction: column;
  padding: 0;
  background-color: rgb(0, 0, 0, 0) !important;
  border: none !important;
}

.task-wrapper .segment {
  flex: auto;
  margin: 0;
  width: 100% !important;
}
.completed {
  background-color: var(--green-completed);
}
.not-completed {
  background-color: var(--teal);
}
.icon[class*="right floated"] {
  float: right !important;
  margin-right: 0em !important;
  margin-left: 1em !important;
}
.icon[class*="left floated"] {
  float: left !important;
  margin-left: 0em !important;
  margin-right: 1em !important;
}
.taskheader {
  font-style: italic;
  border-radius: 5px 5px 0px 0px !important;
}
.taskelement {
  min-height: 70px !important;
  border-radius: 0px 0px 10px 10px !important;
  opacity: 1;
  word-break: break-word;
}

.taskelement-active {
  opacity: 1;
}
.list-move,
.list-enter-active {
  transition: all 0.6s ease;
}
.list-leave-active {
  transition: all cubic-bezier(0.55, 0.055, 0.675, 0.19) ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateY(60px);
}
.horizontal-shake {
  animation: horizontal-shaking 0.7s infinite;
}

@keyframes horizontal-shaking {
  0% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(1px);
  }
  50% {
    transform: translateX(-1px);
  }
  75% {
    transform: translateX(1px);
  }
  100% {
    transform: translateX(0);
  }
}
@media screen and (max-width: 600px) {
  .ui.text.container {
    margin: 0 !important;
  }
}
</style>