<script>
import moment from "moment"
import TaskCreater from "./TaskCreater.vue"
import axios from "axios"
export default {
  components: {
    TaskCreater
  },
  data() {
    return {
      tasks: [],
      showCompleted: false
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
        task.selected = false
        return task
      }).filter(task => task.completed === this.showCompleted)
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
        this.newTask = ""
      } catch (e) {
        console.log(e)
      }
    }
  },
  methods: {
    async markTaskAsCompleted(task) {
      task.completed = !task.completed
      await this.updateTask(task)
    },

    newTaskCreatedHandler(data) {
      this.tasks.unshift(data)
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
      } catch (e) {
        console.log(e)
      }
    }
  }
}
</script>

<template>
  <div class="ui text container">
    <div class="ui segments">
      <TaskCreater
        :selectedTaskList="selectedTaskList"
        @newTaskCreated="newTaskCreatedHandler"
        @toggleShowCompleted="showCompleted = !showCompleted"
      ></TaskCreater>

      <div class="ui segment attached secondary" v-for="task in formatedTask">
        <div
          :class="task.completed ? 'completed' : 'notCompleted'"
          class="ui segment vertically attached fitted"
        >Created on: {{ task.createdAt }}</div>
        <div
          @click="task.selected = !task.selected"
          @mouseleave="task.selected = false"
          class="ui clearing attached segment taskelement"
        >
          <span v-if="task.selected && !task.edit">
            <button
              class="ui icon button right floated"
              :data-tooltip="task.completed ? 'Mark task as not completed' : 'Mark task as completed'"
              @click.stop="markTaskAsCompleted(task)"
            >
              <i :class="task.completed ? 'redo icon' : 'calendar check icon'"></i>
            </button>
            <button
              class="ui icon button right floated"
              data-tooltip="Delete task"
              @click.stop="deleteTask(task)"
            >
              <i class="calendar minus icon"></i>
            </button>

            <button
              class="ui icon button right floated"
              data-tooltip="Edit task"
              @click.stop="task.edit = !task.edit"
            >
              <i class="edit icon"></i>
            </button>
          </span>
          <span v-if="!task.edit" style="white-space: pre-line;">{{ task.body }}</span>

          <span v-if="task.edit">
            <div class="ui form">
              <div class="field">
                <label></label>
                <textarea rows="6" v-model="task.body">
          {{ task.body }}
          </textarea>
              </div>
              <button
                data-tooltip="Cancel editing"
                class="ui button icon right floated"
                @click="task.edit = false"
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
}
</style>