<script>
import Warning from "./Warning.vue"
import axios from 'axios'
import FadeTransition from './FadeTransition.vue'
import Authentication from './Authentication.vue'

export default {
  emits: ['taskListSelected', 'error'],
  components: {
    FadeTransition,
    Authentication,
    Warning
  },
  data() {
    return {
      taskListArray: [],
      auth0User: this.$auth0.user,
      isLoading: this.$auth0.isLoading,
      isAuthenticated: this.$auth0.isAuthenticated,
      selectedTaskList: "",
      taskListToDelete: "",
      newTaskListName: "",
      creatingNewTaskList: false,
      taskListToRename: ""
    }
  },
  methods: {
    setSelectedTaskList(taskList) {
      this.selectedTaskList = taskList
      this.creatingNewTaskList = false
      this.$emit('taskListSelected', taskList)
      this.$emit('error', '')
    },
    async newTaskListHandler() {
      this.newTaskListName = ""
      this.taskListToRename = ""
      this.creatingNewTaskList = !this.creatingNewTaskList
      await this.$nextTick()
      this.$refs.newTaskNameInput.focus()
    },
    async renameTaskListHandler(taskList) {
      this.newTaskListName = ""
      this.taskListToRename = taskList
      this.creatingNewTaskList = false
      await this.$nextTick()
      this.$refs.renameTaskListInput[0].focus()
    },
    async createTaskList() {

      try {
        const accessToken = await this.$auth0.getAccessTokenSilently();
        const response = await axios.put("http://localhost:8080/createTaskList",
          {
            name: this.newTaskListName
          },
          {
            headers: {
              "Authorization": `Bearer ${accessToken}`,
              "Content-type": "application/json; charset=UTF-8"
            },
          })
        await response.data;
        this.taskListArray.push(this.newTaskListName)
        this.setSelectedTaskList(this.newTaskListName)
      } catch (e) {
        console.log(e)
        this.$emit('error', e.response.data.message)
      }
      this.newTaskListName = ""
      this.creatingNewTaskList = false
    },
    async updateTaskList() {
      try {
        const accessToken = await this.$auth0.getAccessTokenSilently();
        const response = await axios.patch("http://localhost:8080/updateTaskList",
          {
            name: this.selectedTaskList,
            newName: this.newTaskListName
          },
          {
            headers: {
              "Authorization": `Bearer ${accessToken}`,
              "Content-type": "application/json; charset=UTF-8"
            },
          })
        await response.data;
        console.log(response)
        this.taskListArray = this.taskListArray.map(task => task == this.selectedTaskList ? this.newTaskListName : task)
      } catch (e) {
        console.log(e.response.data.message)
        this.$emit('error', e.response.data.message)
      }
      this.newTaskListName = ""
      this.taskListToRename = ""
    },
    async deleteTaskList(todo) {
      try {
        const accessToken = await this.$auth0.getAccessTokenSilently();
        await axios.delete("http://localhost:8080/deleteTaskList", {
          data: {
            name: todo
          },
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-type": "application/json; charset=UTF-8"
          },
        })
        this.taskListToDelete = ""
        this.taskListArray = this.taskListArray.filter(task => task != todo)
        this.setSelectedTaskList(this.taskListArray[0])
      } catch (e) {
        console.log(e)
      }
    },
    async getTaskList() {
      try {
        const accessToken = await this.$auth0.getAccessTokenSilently();
        const response = await axios.get("http://localhost:8080/getTaskList", {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-type": "application/json; charset=UTF-8"
          }
        });
        const data = await response.data
        this.taskListArray = data.map(item => item.name)
        this.setSelectedTaskList(this.taskListArray[0])
      } catch (e) {
        console.log(e)
      }
    }
  },
  async mounted() {
    while (this.isLoading) {
      await new Promise((res) => setTimeout(() => {
        console.log("Waiting for authentification....")
        res()
      }, 200))
    }
    if (this.isAuthenticated) await this.getTaskList()
  }
}

</script>

<template>
  <div tabindex="-1" class="ui taskmenu inverted menu">
    <div v-if="auth0User" class="left menu">
      <div class="item">
        <i class="user icon"></i>
        {{ auth0User.nickname }}
      </div>
    </div>
    <div v-if="auth0User" class="center menu">
      <a
        tabindex="0"
        data-test-id="deleteTaskList"
        class="item"
        @click="taskListToDelete = selectedTaskList"
        @keydown.space.prevent="taskListToDelete = selectedTaskList"
        v-if="selectedTaskList"
      >
        <i class="delete icon"></i>
      </a>

      <a
        class="item"
        v-for="(taskList) in taskListArray"
        data-test-id="taskListName"
        @click="setSelectedTaskList(taskList)"
        @keydown.space.prevent="setSelectedTaskList(taskList)"
        @dblclick="renameTaskListHandler(taskList)"
        @keydown.enter="renameTaskListHandler(taskList)"
        :class="selectedTaskList == taskList && 'active'"
        tabindex="0"
      >
        <i class="tasks icon"></i>
        <FadeTransition>
          <div v-if="taskListToRename === taskList" class="ui action input">
            <input
              ref="renameTaskListInput"
              data-test-id="inputNewTaskName"
              v-model="newTaskListName"
              type="text"
              :placeholder="taskList"
              @keydown.esc="taskListToRename = ''"
              @keydown.delete.stop
              @keydown.space.stop
              @keydown.enter.stop="newTaskListName ? updateTaskList() : taskListToRename = ''"
              @click.stop
            />
            <div
              v-if="newTaskListName"
              data-test-id="confirmNewName"
              class="ui icon button"
              @click.stop="updateTaskList"
            >
              <i class="check icon"></i>
            </div>
            <div
              v-else
              class="ui icon button"
              data-test-id="cancelNewName"
              @click.stop="taskListToRename = ''"
            >
              <i class="delete icon"></i>
            </div>
          </div>
          <div v-else>{{ taskList }}</div>
        </FadeTransition>
      </a>
      <a
        class="item"
        data-test-id="createNewTaskListButton"
        tabindex="0"
        @click="newTaskListHandler"
        @keydown.space.prevent="newTaskListHandler"
      >
        <FadeTransition>
          <div v-if="creatingNewTaskList" class="ui action input">
            <input
              ref="newTaskNameInput"
              @click.stop
              data-test-id="createNewTaskListInput"
              v-model="newTaskListName"
              type="text"
              placeholder="New task list name..."
              @keydown.delete="!newTaskListName && (creatingNewTaskList = false)"
              @keydown.esc="creatingNewTaskList = false"
              @keydown.space.stop
              @keydown.enter="newTaskListName ? createTaskList() : creatingNewTaskList = false"
            />
            <div
              v-if="newTaskListName"
              data-test-id="validateTaskListNameButton"
              class="ui icon button"
              @click.stop="createTaskList"
            >
              <i class="check icon"></i>
            </div>
            <div v-else class="ui icon button" @click.stop="creatingNewTaskList = false">
              <i class="delete icon"></i>
            </div>
          </div>
        </FadeTransition>
        <i v-if="!creatingNewTaskList" class="plus icon"></i>
      </a>
    </div>
    <div class="right menu">
      <Authentication></Authentication>
    </div>
  </div>
  <FadeTransition>
    <div style="margin-bottom: 16px;" v-if="taskListToDelete">
      <Warning
        @no="taskListToDelete = ''"
        @yes="deleteTaskList(taskListToDelete)"
        :message="'Are you sure you want to delete task list ' + taskListToDelete + '?'"
      ></Warning>
    </div>
  </FadeTransition>
</template>
<style scoped>
.taskmenu {
  min-height: 50px;
  overflow-x: auto !important;
  overflow-y: hidden !important;
}
</style>