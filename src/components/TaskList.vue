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
    handleDragEnter(index, event) {
      this.tasks = this.tasks.map(t => {
        t.isDragTarget = false
        return t
      })
      this.tasks[index].isDragTarget = true
    },
    handleDragStart(index, event) {
      console.log(index)
      this.draggedIndex = index
    },
    handleDropOver(index, event) {
      if (this.draggedIndex < index) index += 1
      let taskToInsert = this.tasks[this.draggedIndex]
      let arr1 = this.tasks.slice(0, index).filter(task => task !== taskToInsert)
      arr1.push(taskToInsert)
      let arr2 = this.tasks.slice(index,).filter(task => task !== taskToInsert)
      this.tasks = arr1.concat(arr2)
      this.draggedIndex = ""
      this.tasks = this.tasks.map(t => {
        t.isDragTarget = false
        return t
      })
    },
    newTaskCreatedHandler(data) {
      this.tasks.unshift(data)
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
          @dragstart="event => handleDragStart(index, event)"
          @dragover.prevent
          @dragend="task.isDragTarget = false"
          @drop.prevent="event => handleDropOver(index, event)"
          @dragenter="event => handleDragEnter(index, event)"
          @click="task.selected = !task.selected"
          @touchstart="task.selected = !task.selected"
          @mouseleave="task.selected = false"
          :style="[task.isDragTarget ? 'border-width: 10px !important' : 'border-width: 1px']"
          :hidden="task.completed !== showCompleted"
          :key="index"
          :class="task.selected && 'taskelement-active'"
          :draggable="task.draggable"
        >
          <div
            :class="task.completed ? 'completed' : 'notCompleted'"
            class="ui segment vertically attached"
          >
            Created on: {{ formatedDate(task.createdAt) }}
            <i
              style="min-width: 25px;min-height: 25px;padding:5px;margin:0px"
              @click.prevent
              @mouseenter="task.draggable = true"
              @mouseleave="task.draggable = false"
              class="window restore icon right floated"
            ></i>
          </div>
          <div
            :data-test-id="'taskBody-' + index"
            :class="task.selected && 'taskelement-active'"
            class="ui clearing attached segment taskelement"
          >
            <FadeTransition>
              <span v-if="task.selected && !task.edit && !task.delete">
                <button
                  tabindex="0"
                  data-test-id="markAsCompletedButton"
                  class="ui icon button right floated"
                  :data-tooltip="task.completed ? 'Mark task as not completed' : 'Mark task as completed'"
                  @click.stop="markTaskAsCompleted(task)"
                >
                  <i :class="task.completed ? 'redo icon' : 'calendar check icon'"></i>
                </button>
                <button
                  tabindex="0"
                  data-test-id="deleteTaskButton"
                  class="ui icon button right floated"
                  data-tooltip="Delete task"
                  @click.stop="taskDeleteHandler(task)"
                >
                  <i class="calendar minus icon"></i>
                </button>

                <button
                  tabindex="0"
                  data-test-id="editTaskButton"
                  class="ui icon button right floated"
                  data-tooltip="Edit task"
                  @click.stop="task.edit = !task.edit"
                >
                  <i class="edit icon"></i>
                </button>
              </span>
            </FadeTransition>
            <span v-if="!task.edit && !task.delete" style="white-space: pre-line;">{{ task.body }}</span>
            <FadeTransition>
              <span v-if="task.delete" style="white-space: pre-line;">
                <Warning
                  @yes="deleteTask(task)"
                  @no="task.delete = false"
                  :message="'Are you sure you want to delete this task ?'"
                ></Warning>
              </span>
            </FadeTransition>

            <span v-if="task.edit">
              <div class="ui form">
                <div class="field">
                  <label></label>
                  <textarea data-test-id="editInputBox" rows="6" v-model="task.body">
          {{ task.body }}
          </textarea>
                </div>
                <Calendar
                  :injectedDueDate="task.dueDate"
                  @dueDateSet="(date) => {
                    setDueDateHandler(date, task)
                  }"
                ></Calendar>
                <button
                  data-tooltip="Cancel editing"
                  data-test-id="cancelEditButton"
                  class="ui button icon right floated"
                  @click="() => {
                    task.edit = false
                    task.origDueDate &&
                      (task.dueDate = task.origDueDate)
                  }"
                >
                  <i class="redo icon"></i>
                </button>

                <button
                  data-tooltip="Update task"
                  data-test-id="confirmEditButton"
                  class="ui button icon right floated"
                  @click="updateTask(task)"
                >
                  <i class="check icon"></i>
                </button>
              </div>
            </span>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<style scoped>
.completed {
  background-color: rgb(127, 236, 255);
}
.notCompleted {
  background-color: rgb(252, 73, 112);
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
.taskelement {
  min-height: 65px !important;
  opacity: 0.8;
}

.taskelement-active {
  opacity: 1;
}

.list-enter-active,
.list-leave-active {
  transition: all 0.2s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(100px);
}
</style>