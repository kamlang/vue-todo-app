<script>
import dayjs from "dayjs"
import TaskCreater from "./TaskCreater.vue"
import axios from "axios"
import Warning from "./Warning.vue"
import FadeTransition from "./FadeTransition.vue"
import Calendar from "./Calendar.vue"
import LocalizedFormat from 'dayjs/plugin/localizedFormat'

export default {
  emits: ['refreshTaskBar', 'error'],
  inject: ['apiUrl'],
  components: {
    TaskCreater,
    Calendar,
    Warning,
    FadeTransition
  },
  data() {
    return {
      tasks: [],
      showCompletedTasks: false,
      draggedTaskIndex: "",
      touchTimerStart: 0,
      showTaskMenu: true,

      clearTouchTimeout: Object
    }
  },
  props: {
    selectedTaskList: Object,
    taskToUpdate: Object,
  },
  watch: {
    selectedTaskList() {
      if (this.selectedTaskList.name) {
        this.tasks = this.selectedTaskList.tasks
      }
    },
    taskToUpdate() {
      this.updateTask(this.taskToUpdate)
      for (let task of this.tasks) {
        if (this.taskToUpdate._id === task._id) {
          task.dueDate = this.taskToUpdate.dueDate
          task.completed = this.taskToUpdate.completed
          break
        }
      }
    }
  },
  computed: {
    computedTasks() {
      return this.tasks.filter(task => task.completed === this.showCompletedTasks)
    }
  },
  methods: {
    cancelEditTask(task) {
      task.selected = false
      task.edit = false
      task.dueDate = task.origDueDate
      task.editedBody = task.body
    },
    formatedDate(date) {
      dayjs.extend(LocalizedFormat)
      return dayjs(date).format("LLL")
    },
    setDueDateHandler(date, task) {
      if (task.origDueDate === undefined) {
        task.origDueDate = task.dueDate
      }
      task.dueDate = date
    },
    setErrorMessage(errorMessage) {
      this.$emit('error', errorMessage)
    },
    toggleTaskCompleted(task) {
      task.completed = !task.completed
      this.updateTask(task)
    },
    taskDeleteHandler(task) {
      /* mark a task a task as potentially deleted
      warning message is triggered then user can confirms if task should really be deleted */
      task.selected = false
      task.delete = true
    },

    pushTaskTop(index) {
      let taskToPush = this.tasks[index]
      taskToPush.selected = false
      this.tasks.splice(index, 1)
      this.tasks.unshift(taskToPush)
      this.updateTaskOrder()
    },

    newTaskCreatedHandler(data) {
      this.$emit('refreshTaskBar')
      this.tasks.unshift(data)
    },
    async updateTaskOrder() {
      try {
        const accessToken = await this.$auth0.getAccessTokenSilently();
        await axios.patch("https://" + this.apiUrl + "/updateTaskOrder",
          {
            name: this.selectedTaskList.name,
            tasks: this.tasks.map(task => task._id)
          },
          {
            headers: {
              "Authorization": `Bearer ${accessToken}`,
              "Content-type": "application/json; charset=UTF-8"
            }
          });
      } catch (e) {
        console.log(e)
      }
    },
    async deleteTask(task) {
      try {
        const accessToken = await this.$auth0.getAccessTokenSilently();
        await axios.delete("https://" + this.apiUrl + "/deleteTask", {
          data: {
            _id: task._id
          },
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-type": "application/json; charset=UTF-8"
          },
        })
        this.tasks = this.tasks.filter(t => t != task)
        this.$emit('refreshTaskBar')
      } catch (e) {
        console.log(e)
      }
    },
    async updateTask(task) {
      if (task.editedBody) {
        task.body = task.editedBody
      }
      try {
        const accessToken = await this.$auth0.getAccessTokenSilently();
        await axios.patch("https://" + this.apiUrl + "/updateTask",
          {
            _id: task._id,
            title: task.title,
            body: task.body,
            dueDate: task.dueDate,
            completed: task.completed
          },
          {
            headers: {
              "Authorization": `Bearer ${accessToken}`,
              "Content-type": "application/json; charset=UTF-8"
            }
          });
        task.selected = false
        task.edit = false
        task.origDueDate = task.dueDate
        this.$emit('refreshTaskBar')
      } catch (e) {
        console.log(e)
      }
    },
    handleDragEnter(index) {
      this.tasks[index].isDragTarget = true
    },
    handleDragStart(index) {
      this.draggedTaskIndex = index
    },
    unSetAllButSelected(index) {
      this.tasks = this.tasks.map((t, i) => {
        if (i !== index) t.selected = false
        return t
      })
    },
    handleTouchStart(index) {
      // Only shows menu for 4sec if user touches the task.
      this.showTaskMenu = true
      this.clearTouchTimeout && clearTimeout(this.clearTouchTimeout)
      this.clearTouchTimeout = setTimeout(() => this.showTaskMenu = false, 4000)

      this.unSetAllButSelected(index)
      if (this.draggedTaskIndex !== '') {
        this.handleDragEnter(index)
      }
      let now = new Date()
      this.touchTimerStart = now.valueOf()
    },
    unSetDragTarget() {
      this.tasks = this.tasks.map(t => {
        t.isDragTarget = false
        return t
      })
    },
    handleDropOver(index) {
      console.log(index)
      if (this.draggedTaskIndex === '') {
        this.unSetDragTarget()
        return
      }
      if (this.draggedTaskIndex < index) index += 1
      if (this.draggedTaskIndex != index) {
        let taskToInsert = this.tasks[this.draggedTaskIndex]
        let arr1 = this.tasks.slice(0, index).filter(task => task !== taskToInsert)
        arr1.push(taskToInsert)
        let arr2 = this.tasks.slice(index,).filter(task => task !== taskToInsert)
        console.log(this.tasks)
        this.tasks = arr1.concat(arr2)
        console.log(this.tasks)
        this.updateTaskOrder()
      }
    },
    handleDragEnd() {
      this.unSetDragTarget()
      this.draggedTaskIndex = ""
    },
    handleTouchMove() {
      this.showTaskMenu = false
      // If toucheMove event is fired then touchTimerStart is set in the future so it won't trigger move tasks functionality.
      this.touchTimerStart = new Date().setFullYear(3000)
    },
    handleTouchEnd(index) {
      /* If user touches a task longer than minduration, then he can moves it
      around to reorder his task list. If shorter simply select the task. */
      let minTouchDuration = 500
      let now = new Date()
      let touchDuration = now.valueOf() - this.touchTimerStart
      if (touchDuration >= minTouchDuration) this.handleDragStart(index)
      else if (this.tasks[index].isDragTarget !== true) {
        this.tasks[index].selected = true
      } else if (this.tasks[index].isDragTarget === true) {
        this.handleDropOver(index)
        this.handleDragEnd()
      }
      this.touchTimerStart = 0
    },
  },
}
</script>

<template>
  <div v-if="selectedTaskList.name" class="ui fluid container">
    <div class="ui segments">
      <TaskCreater
        :selectedTaskList="selectedTaskList.name"
        @error="setErrorMessage"
        @newTaskCreated="newTaskCreatedHandler"
        @toggleShowCompleted="showCompletedTasks = !showCompletedTasks"
      ></TaskCreater>
      <TransitionGroup name="list">
        <div
          class="ui segment attached task-wrapper"
          v-for="(task,index) in tasks"
          @dragover.prevent
          @keydown.enter="task.selected = !task.selected"
          @dragstart="handleDragStart(index)"
          @drop="handleDropOver(index)"
          @dragenter="handleDragEnter(index)"
          @dragend="handleDragEnd"
          @click="task.selected = true"
          @mouseleave="task.selected = false"
          @dragexit="task.isDragTarget = false"
          @touchstart="handleTouchStart(index)"
          @touchend.prevent="handleTouchEnd(index)"
          @touchmove="handleTouchMove()"
          :style="[task.isDragTarget ? 'border-top: solid' : 'border-top: none !important', 'z-index = -1']"
          :key="index"
          :class="[task.selected && 'taskelement-active', task.isDragTarget ? 'horizontal-shake' : '', task.selected ? '' : 'secondary',]"
          :draggable="task.draggable"
          tabindex="0"
        >
          <div
            :class="task.completed ? 'completed' : 'not-completed'"
            :data-test-id="'taskHeader-' + index"
            class="ui segment vertically attached fitted taskheader"
            @click.prevent
            :style="task.draggable && 'cursor: grab'"
            style="display: flex; justify-content: space-between;"
            @touchstart.prevent.stop="handleTouchStart(index)"
            @mouseenter="task.draggable = true"
            @mouseleave="task.draggable = false"
          >
            <span style>{{ task.title && 'Title: ' }}{{ task.title }}</span>
            <span style>Created on: {{ formatedDate(task.createdAt) }}</span>
          </div>
          <div
            :data-test-id="'taskBody-' + index"
            :class="task.selected && 'taskelement-active'"
            class="ui clearing attached segment taskelement"
          >
            <FadeTransition>
              <div
                class="ui right floated borderless menu"
                style="border: 0px !important"
                v-if="task.selected && !task.edit && !task.delete && showTaskMenu"
                z-index="100"
              >
                <a
                  tabindex="0"
                  data-test-id="markAsCompletedButton"
                  class="ui icon item"
                  title="Mark this task as completed."
                  @mouseup.stop="toggleTaskCompleted(task)"
                  @keydown.enter="toggleTaskCompleted(task)"
                  @click.prevent.stop
                  @touchstart.prevent.stop
                  @touchmove.prevent
                  @touchend.stop="toggleTaskCompleted(task)"
                >
                  <i :class="task.completed ? 'redo icon' : 'calendar check icon'"></i>
                </a>
                <a
                  tabindex="0"
                  title="Delete this task."
                  data-test-id="deleteTaskButton"
                  class="ui icon item"
                  @mouseup.stop="taskDeleteHandler(task)"
                  @keydown.enter="taskDeleteHandler(task)"
                  @click.prevent.stop
                  @touchstart.prevent.stop
                  @touchmove.prevent
                  @touchend.stop="taskDeleteHandler(task)"
                >
                  <i class="calendar minus icon"></i>
                </a>

                <a
                  tabindex="0"
                  data-test-id="editTaskButton"
                  title="Edit this task."
                  class="ui icon item"
                  @mouseup.stop="task.edit = !task.edit;
                  task.editedBody = task.body"
                  @keydown.enter="task.edit = !task.edit;
                  task.editedBody = task.body"
                  @click.prevent.stop
                  @touchstart.prevent.stop
                  @touchmove.prevent
                  @touchend.stop="task.edit = !task.edit;
                  task.editedBody = task.body"
                >
                  <i class="edit icon"></i>
                </a>
                <a
                  tabindex="0"
                  data-test-id="pushTopButton"
                  title="Push this task to the top."
                  class="ui icon item"
                  @mouseup.stop="pushTaskTop(index)"
                  @keydown.enter="pushTaskTop(index)"
                  @click.prevent.stop
                  @touchstart.prevent.stop
                  @touchmove.prevent
                  @touchend.stop="pushTaskTop(index)"
                >
                  <i class="hand point up outline icon"></i>
                </a>
              </div>
            </FadeTransition>
            <span
              class
              v-if="!task.edit && !task.delete"
              style="white-space: pre-line;"
            >{{ task.body }}</span>
            <FadeTransition>
              <span v-if="task.delete" style="white-space: pre-line;">
                <Warning
                  @yes="deleteTask(task)"
                  @no="task.delete = false"
                  :message="'Are you sure you want to delete this task ?'"
                ></Warning>
              </span>
            </FadeTransition>

            <div class="ui container" v-if="task.edit">
              <div class="ui form">
                <div class="field">
                  <input
                    v-model="task.title"
                    @touchstart.self="(event) => event.target.focus()"
                    @blur.self="(event) => event.target.blur()"
                    placeholder="Give a title to this task..."
                  />
                </div>
                <div class="field">
                  <label></label>
                  <textarea
                    @touchstart.self="(event) => event.target.focus()"
                    @blur.self="(event) => event.target.blur()"
                    data-test-id="editInputBox"
                    rows="6"
                    v-model="task.editedBody"
                  >
          {{ task.body }}
          </textarea>
                </div>
                <Calendar
                  :active="task.selected"
                  :injectedDueDate="task.dueDate"
                  @dueDateSet="(date) => {
                    setDueDateHandler(date, task)
                  }"
                ></Calendar>

                <div v-if="task.body" class="ui buttons">
                  <button
                    tabindex="0"
                    data-test-id="cancelEditButton"
                    @click.stop="cancelEditTask(task)"
                    @touchstart.prevent.stop
                    @touchend.stop="cancelEditTask(task)"
                    @keydown.enter="cancelEditTask(task)"
                    class="ui button"
                  >Cancel</button>
                  <div class="or"></div>
                  <button
                    tabindex="0"
                    data-test-id="confirmEditButton"
                    class="ui button"
                    @click.stop="updateTask(task)"
                    @touchstart.prevent.stop
                    @touchend.stop="updateTask(task)"
                    @keydown.enter="updateTask(task)"
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
  --green-completed: #e5f9e7;
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