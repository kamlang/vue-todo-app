<script>
import moment from "moment"
import Error from "./Error.vue"
import Calendar from "./Calendar.vue"
import axios from "axios"
export default {
  components: {
    Error,
    Calendar
  },
  data() {
    return {
      user: this.$auth0.user,
      tasks: [],
      newTask: "",
      showCompleted: false,
      errorMessage: "",
      showCalendar: false,
      dueDate: Date,
    }
  },
  props: {
    selectedTaskList: String
  },
  computed: {
    formatedTask() {
      return this.tasks.map(task => {
        task.createdAt = moment(task.createdAt).format("LLLL")
        task.edit = false
        return task
      }).filter(task => task.completed === this.showCompleted)
    },
    formatedDueDate() {
      return this.dueDate instanceof Date ? moment(this.dueDate).format("LL") : ""
    },
  },
  watch: {
    async selectedTaskList() {
      const accessToken = await this.$auth0.getAccessTokenSilently();
      try {
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
        this.errorMessage = ""
        this.newTask = ""
      } catch (e) {
        console.log(e)
      }
    }
  },
  methods: {
    setDueDate(date) {
      this.dueDate = date
      this.showCalendar = false
    },
    unSetDueDate() {
      this.dueDate = Date
      this.showCalendar = false
    },
    async toggleTask(task) {
      task.completed = !task.completed
      await this.updateTask(task)
    },

    async deleteTask(task) {
      const accessToken = await this.$auth0.getAccessTokenSilently();
      try {
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
    async addTask() {
      const accessToken = await this.$auth0.getAccessTokenSilently();
      try {
        const response = await axios.put("http://localhost:8080/addTask",
          {
            body: this.newTask,
            duedate: this.dueDate instanceof Date ? this.dueDate.valueOf() : "",
            name: this.selectedTaskList
          },
          {
            headers: {
              "Authorization": `Bearer ${accessToken}`,
              "Content-type": "application/json; charset=UTF-8"
            },
          })
        const data = await response.data
        this.tasks.unshift(data)
        this.newTask = ""
        this.errorMessage = ""
      } catch (e) {
        console.log(e)
        this.errorMessage = e.response.data.message
      }
    },
    async updateTask(task) {
      const accessToken = await this.$auth0.getAccessTokenSilently();
      try {
        const response = await axios.patch("http://localhost:8080/updateTask",
          {
            _id: task._id,
            body: task.body,
            duedate: this.dueDate instanceof Date ? this.dueDate.valueOf() : "",
            completed: task.completed
          },
          {
            headers: {
              "Authorization": `Bearer ${accessToken}`,
              "Content-type": "application/json; charset=UTF-8"
            }
          });
        await response.data
        task.edit = false
        this.errorMessage = ""
      } catch (e) {
        console.log(e)
        this.errorMessage = e.response.data.message
      }
    }
  }
}
</script>

<template>
  <Error :errorMessage="errorMessage" @closed="errorMessage = ''"></Error>
  <div class="ui text container" v-if="user">
    <div class="ui segments">
      <div class="ui segment">
        <i class="user icon"></i>
        {{ user.nickname }}
        <div
          :data-tooltip="showCompleted ? 'Hide completed tasks' : 'Show completed tasks'"
          class="ui toggle checkbox right floated"
          @click="showCompleted = !showCompleted"
        >
          <input type="checkbox" name="public" />
          <label></label>
        </div>
      </div>
      <div class="ui clearing segment">
        <div class="ui form">
          <div class="field">
            <label></label>
            <textarea
              rows="8"
              data-test-id="task-input"
              v-model="newTask"
              placeholder="Add a task ..."
            ></textarea>
          </div>
          <div
            class="ui input left icon"
            data-tooltip="Schedule task to a specific day"
            @click="showCalendar = !showCalendar"
          >
            <i class="calendar icon floated"></i>
            <input
              :value="formatedDueDate"
              @keydown.delete="unSetDueDate"
              @keydown.esc="showCalendar = false"
              type="text"
              placeholder="Date/Time"
            />
          </div>

          <Calendar
            v-if="showCalendar"
            @unSetDate="unSetDueDate"
            @setDate="setDueDate"
            :dueDate="dueDate"
          ></Calendar>
          <button
            data-tooltip="Add a new task"
            class="ui button icon right floated"
            @click="addTask"
          >
            <i class="calendar plus icon"></i>
          </button>
        </div>
      </div>
    </div>
    <div class="ui segment attached secondary" v-for="tsk in formatedTask">
      <div
        :class="tsk.completed ? 'completed' : 'notCompleted'"
        class="ui segment vertically attached fitted"
      >Created on: {{ tsk.createdAt }}</div>
      <div class="ui clearing attached segment">
        <span v-if="!tsk.edit">
          <button
            class="ui icon button right floated"
            :data-tooltip="tsk.completed ? 'Mark task as not completed' : 'Mark task as completed'"
            @click="toggleTask(tsk)"
          >
            <i :class="tsk.completed ? 'redo icon' : 'calendar check icon'"></i>
          </button>
          <button
            class="ui icon button right floated"
            data-tooltip="Delete task"
            @click="deleteTask(tsk)"
          >
            <i class="calendar minus icon"></i>
          </button>

          <button
            class="ui icon button right floated"
            data-tooltip="Edit task"
            @click="tsk.edit = !tsk.edit"
          >
            <i class="edit icon"></i>
          </button>
          <span style="white-space: pre-line;">{{ tsk.body }}</span>
        </span>
        <span v-else>
          <div class="ui form">
            <div class="field">
              <label></label>
              <textarea rows="6" v-model="tsk.body">
          {{ tsk.body }}
          </textarea>
            </div>
            <button
              data-tooltip="Cancel editing"
              class="ui button icon right floated"
              @click="tsk.edit = false"
            >
              <i class="redo icon"></i>
            </button>

            <button
              data-tooltip="Update task"
              class="ui button icon right floated"
              @click="updateTask(tsk)"
            >
              <i class="check icon"></i>
            </button>
          </div>
        </span>
      </div>
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
.icon[class*="right floated"],
.checkbox[class*="right floated"] {
  float: right !important;
  margin-right: 0em !important;
  margin-left: 1em !important;
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
</style>