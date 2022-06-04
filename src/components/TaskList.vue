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
    }
  },
  props: {
    selectedTaskList: String
  },
  computed: {
    formatedTasks() {
      return this.tasks.map(task => {
        task.createdAt = moment(task.createdAt).format("LLLL")
        task.edit = false
        task.selected = false
        task.delete = false
        return task
      }).filter(task => task.completed === this.showCompleted)
    },

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
    setDueDateHandler(date, task) {
      task.origDueDate = task.dueDate
      task.dueDate = date
    },
    setErrorMessage(errorMessage) {
      this.$emit('error', errorMessage)
    },
    async markTaskAsCompleted(task) {
      task.completed = !task.completed
      await this.updateTask(task)
    },
    async taskDeleteHandler(task) {
      task.selected = false
      setTimeout(() => task.delete = true, 300)
    },

    newTaskCreatedHandler(data) {
      this.tasks.unshift(data)
    },

    async deleteTask(task) {
      try {
        const accessToken = await this.$auth0.getAccessTokenSilently();
        const repsonse = await axios.delete("http://localhost:8080/deleteTask", {
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
  }
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
          v-for="task in formatedTasks"
          :key="task"
          :class="task.selected && 'taskelement-active'"
        >
          <div
            :class="task.completed ? 'completed' : 'notCompleted'"
            class="ui segment vertically attached fitted"
          >Created on: {{ task.createdAt }}</div>
          <div
            data-test-id="taskBody"
            @click="task.selected = !task.selected"
            @touchstart="task.selected = !task.selected"
            @mouseleave="task.selected = false"
            :class="task.selected && 'taskelement-active'"
            class="ui clearing attached segment taskelement"
          >
            <FadeTransition>
              <span v-if="task.selected && !task.edit && !task.delete">
                <button
                  tabindex="0"
                  class="ui icon button right floated"
                  :data-tooltip="task.completed ? 'Mark task as not completed' : 'Mark task as completed'"
                  @click.stop="markTaskAsCompleted(task)"
                >
                  <i :class="task.completed ? 'redo icon' : 'calendar check icon'"></i>
                </button>
                <button
                  tabindex="0"
                  class="ui icon button right floated"
                  data-tooltip="Delete task"
                  @click.stop="taskDeleteHandler(task)"
                >
                  <i class="calendar minus icon"></i>
                </button>

                <button
                  tabindex="0"
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
                  <textarea rows="6" v-model="task.body">
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