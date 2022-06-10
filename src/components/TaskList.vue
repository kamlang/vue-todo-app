<script>
import moment from "moment"
import TaskCreater from "./TaskCreater.vue"
import axios from "axios"
import Warning from "./Warning.vue"
import FadeTransition from "./FadeTransition.vue"
import Calendar from "./Calendar.vue"

export default {
  emits: ['error'],
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
      draggedIndex: ""
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
          const response = await axios.post("http://localhost:8080/getTasks",
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
      task.edit = false
      task.origDueDate && (task.dueDate = task.origDueDate)
    },

    formatedDate(date) {
      return moment(date).format("LLLL")
    },
    setDueDateHandler(date, task) {
      task.origDueDate = task.dueDate
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
    handleDragEnter(index) {
      this.tasks[index].isDragTarget = true
    },
    handleDragStart(index) {
      this.draggedIndex = index
    },
    pushTaskTop(index) {
      let taskToPush = this.tasks[index]
      taskToPush.selected = false
      this.tasks.splice(index, 1)
      this.tasks.unshift(taskToPush)
      this.updateTaskOrder()
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
        this.unSetDragTarget()
      }
    },
    handleDragEnd() {
      this.unSetDragTarget()
      this.draggedIndex = ""
    },
    newTaskCreatedHandler(data) {
      this.tasks.unshift(data)
    },
    async updateTaskOrder() {
      try {
        const accessToken = await this.$auth0.getAccessTokenSilently();
        await axios.patch("http://localhost:8080/updateTaskOrder",
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
        await axios.delete("http://localhost:8080/deleteTask", {
          data: {
            _id: task._id
          },
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-type": "application/json; charset=UTF-8"
          },
        })
        this.tasks = this.tasks.filter(t => t != task)
      } catch (e) {
        console.log(e)
      }
    },
    async updateTask(task) {
      try {
        const accessToken = await this.$auth0.getAccessTokenSilently();
        await axios.patch("http://localhost:8080/updateTask",
          {
            _id: task._id,
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
      } catch (e) {
        console.log(e)
      }
    }
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
          class="ui segment attached secondary"
          v-for="(task,index) in tasks"
          @dragover.prevent
          @dragstart="handleDragStart(index)"
          @drop="handleDropOver(index)"
          @dragenter="handleDragEnter(index)"
          @dragend="handleDragEnd"
          @dragexit="task.isDragTarget = false"
          @click="task.selected = true"
          @mouseleave="task.selected = false"
          @touchstart="task.selected = !task.selected"
          :style="[task.isDragTarget ? 'border-top: solid' : 'border-top: none !important', 'z-index = -1', index === this.draggedIndex ? 'opacity: 0.5' : 'opacity: 1']"
          :hidden="task.completed !== showCompleted"
          :key="index"
          :class="task.selected && 'taskelement-active'"
          :draggable="task.draggable"
        >
          <div
            :class="task.completed ? 'completed' : 'notCompleted'"
            class="ui segment vertically attached fitted taskheader"
            @click.prevent
            :style="task.draggable && 'cursor: grab'"
            @mouseenter="task.draggable = true"
            @mouseleave="task.draggable = false"
          >Created on: {{ formatedDate(task.createdAt) }}</div>
          <div
            :data-test-id="'taskBody-' + index"
            :class="task.selected && 'taskelement-active'"
            class="ui clearing attached segment taskelement"
          >
            <FadeTransition>
              <div
                class="ui right floated borderless menu"
                style="border: 0px !important"
                v-if="task.selected && !task.edit && !task.delete"
              >
                <a
                  tabindex="0"
                  data-test-id="markAsCompletedButton"
                  class="ui icon item"
                  @click.stop="markTaskAsCompleted(task)"
                >
                  <i :class="task.completed ? 'redo icon' : 'calendar check icon'"></i>
                </a>
                <a
                  tabindex="0"
                  data-test-id="deleteTaskButton"
                  class="ui icon item"
                  @click.stop="taskDeleteHandler(task)"
                >
                  <i class="calendar minus icon"></i>
                </a>

                <a
                  data-test-id="editTaskButton"
                  class="ui icon item"
                  @click.stop="task.edit = !task.edit"
                >
                  <i class="edit icon"></i>
                </a>
                <a
                  tabindex="0"
                  data-test-id="pushTopButton"
                  class="ui icon item"
                  @click.stop="pushTaskTop(index)"
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
                  <label></label>
                  <textarea @scroll.stop data-test-id="editInputBox" rows="6" v-model="task.body">
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
                <div class="ui right floated borderless menu" style="border: 0px !important">
                  <a
                    tabindex="0"
                    data-test-id="cancelEditButton"
                    class="ui icon item"
                    @click.stop="cancelEditTask(task)"
                    @keydown.enter="cancelEditTask(task)"
                  >
                    <i class="redo icon"></i>
                  </a>
                  <a
                    tabindex="0"
                    data-test-id="confirmEditButton"
                    class="ui icon item"
                    @click.stop="updateTask(task)"
                    @keydown.enter="updateTask(task)"
                  >
                    <i class="check icon"></i>
                  </a>
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
</style>