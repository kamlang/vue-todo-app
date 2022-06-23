<script>
import moment from "moment"
import TaskCreater from "./TaskCreater.vue"
import axios from "axios"
import Warning from "./Warning.vue"
import FadeTransition from "./FadeTransition.vue"
import Calendar from "./Calendar.vue"

export default {
  emits: ['refreshTaskBar', 'error'],
  components: {
    TaskCreater,
    Calendar,
    Warning,
    FadeTransition
  },
  data() {
    return {
      tasks: [],
      showCompleted: false,
      draggedIndex: "",
      touchTimerStart: 0,
      showMenu: true,
      clearTimeout: Object
    }
  },
  props: {
    selectedTaskList: String
  },
  watch: {
    async selectedTaskList() {
      this.tasks = []
      if (this.selectedTaskList) {
        try {
          const accessToken = await this.$auth0.getAccessTokenSilently();
          const response = await axios.post("https://api-todo.glgmsh.com/getTasks",
            {
              name: this.selectedTaskList
            },
            {
              headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-type": "application/json; charset=UTF-8"
              },
            })
          this.tasks = await response.data
          this.newTask = ""
        } catch (e) {
          console.log(e)
        }
      }
    }
  },
  methods: {
    cancelEditTask(task) {
      task.selected = false
      task.title = undefined
      task.edit = false
      task.dueDate = task.origDueDate
    },

    formatedDate(date) {
      return moment(date).format("LLLL")
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
    markTaskAsCompleted(task) {
      task.completed = !task.completed
      this.updateTask(task)
    },
    taskDeleteHandler(task) {
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
        await axios.patch("https://api-todo.glgmsh.com/updateTaskOrder",
          {
            name: this.selectedTaskList,
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
        await axios.delete("https://api-todo.glgmsh.com/deleteTask", {
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
      try {
        const accessToken = await this.$auth0.getAccessTokenSilently();
        await axios.patch("https://api-todo.glgmsh.com/updateTask",
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
      this.draggedIndex = index
    },
    unSetAllButSelected(index) {
      this.tasks = this.tasks.map((t, i) => {
        if (i !== index) t.selected = false
        return t
      })
    },
    handleTouchStart(index) {
      this.showMenu = true
      this.clearTimeout && clearTimeout(this.clearTimeout)
      this.clearTimeout = setTimeout(() => this.showMenu = false, 4000)

      this.unSetAllButSelected(index)
      if (this.draggedIndex !== '') {
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
      if (this.draggedIndex === '') {
        this.unSetDragTarget()
        return
      }
      if (this.draggedIndex < index) index += 1
      if (this.draggedIndex != index) {
        let taskToInsert = this.tasks[this.draggedIndex]
        let arr1 = this.tasks.slice(0, index).filter(task => task !== taskToInsert)
        arr1.push(taskToInsert)
        let arr2 = this.tasks.slice(index,).filter(task => task !== taskToInsert)
        this.tasks = arr1.concat(arr2)
        this.updateTaskOrder()
      }
    },
    handleDragEnd() {
      this.unSetDragTarget()
      this.draggedIndex = ""
    },
    handleTouchMove(index) {
      this.showMenu = false
      this.touchTimerStart = new Date().setFullYear(3000)
    },
    handleTouchEnd(index) {
      let minduration = 500
      let now = new Date()
      let delta = now.valueOf() - this.touchTimerStart
      if (delta >= minduration) this.handleDragStart(index)
      else if (this.tasks[index].isDragTarget !== true) {
        //        this.tasks[index].selected = !this.tasks[index].selected
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
  <div v-if="selectedTaskList" class="ui text container">
    <div class="ui segments">
      <TaskCreater
        :selectedTaskList="selectedTaskList"
        @error="setErrorMessage"
        @newTaskCreated="newTaskCreatedHandler"
        @toggleShowCompleted="showCompleted = !showCompleted"
      ></TaskCreater>
      <TransitionGroup name="list">
        <div
          class="ui segment attached"
          style="padding-top: 5px; padding-left: 10px; padding-right: 10px; padding-bottom: 5px; border-bottom: none !important;"
          v-for="(task,index) in tasks"
          @dragover.prevent
          @dragstart="handleDragStart(index)"
          @drop="handleDropOver(index)"
          @dragenter="handleDragEnter(index)"
          @dragend="handleDragEnd"
          @dragexit="task.isDragTarget = false"
          @mouseleave="task.selected = false"
          @click="task.selected = true"
          @touchstart="handleTouchStart(index)"
          @touchend.prevent="handleTouchEnd(index)"
          @touchmove="handleTouchMove(index)"
          @blur="task.selected = false"
          :style="[task.isDragTarget ? 'border-top: solid' : 'border-top: none !important', 'z-index = -1']"
          :hidden="task.completed !== showCompleted"
          :key="index"
          :class="[task.selected && 'taskelement-active', index === this.draggedIndex ? 'horizontal-shake' : '', task.selected ? '' : 'secondary']"
          :draggable="task.draggable"
        >
          <div
            :class="task.completed ? 'completed' : 'notCompleted'"
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
                v-if="task.selected && !task.edit && !task.delete && showMenu"
                z-index="100"
              >
                <a
                  tabindex="0"
                  data-test-id="markAsCompletedButton"
                  class="ui icon item"
                  @mouseup.stop="markTaskAsCompleted(task)"
                  @click.prevent.stop
                  @touchstart.prevent.stop
                  @touchmove.prevent
                  @touchend.stop="markTaskAsCompleted(task)"
                >
                  <i :class="task.completed ? 'redo icon' : 'calendar check icon'"></i>
                </a>
                <a
                  tabindex="0"
                  data-test-id="deleteTaskButton"
                  class="ui icon item"
                  @mouseup.stop="taskDeleteHandler(task)"
                  @click.prevent.stop
                  @touchstart.prevent.stop
                  @touchmove.prevent
                  @touchend.stop="taskDeleteHandler(task)"
                >
                  <i class="calendar minus icon"></i>
                </a>

                <a
                  data-test-id="editTaskButton"
                  class="ui icon item"
                  @mouseup.stop="task.edit = !task.edit"
                  @click.prevent.stop
                  @touchstart.prevent.stop
                  @touchmove.prevent
                  @touchend.stop="task.edit = !task.edit"
                >
                  <i class="edit icon"></i>
                </a>
                <a
                  tabindex="0"
                  data-test-id="pushTopButton"
                  class="ui icon item"
                  @mouseup.stop="pushTaskTop(index)"
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
                    v-model="task.body"
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

<style scoped>
.completed {
  background-color: rgb(174, 243, 255);
}
.notCompleted {
  background-color: rgb(255, 129, 156);
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
  border-radius: 0px 0px 0px 0px !important;
}
.taskelement {
  min-height: 70px !important;
  border-radius: 0px 0px 10px 10px !important;
  opacity: 1;
}

.taskelement-active {
  opacity: 1;
}
.list-move, /* apply transition to moving elements */
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
  animation: horizontal-shaking 0.5s infinite;
}
@keyframes horizontal-shaking {
  0% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(2px);
  }
  50% {
    transform: translateX(-2px);
  }
  75% {
    transform: translateX(2px);
  }
  100% {
    transform: translateX(0);
  }
}
</style>