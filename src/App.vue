<script>
import LoginPage from "./components/LoginPage.vue"
import LogoutPage from "./components/LogoutPage.vue"
import Todos from "./components/Todos.vue"
import Error from "./components/Error.vue"
import axios from 'axios'
export default {
  components: {
    LoginPage,
    LogoutPage,
    Todos,
    Error,
  },
  data() {
    return {
      taskListArray: [],
      user: this.$auth0.user,
      selectedTaskList: "",
      taskListToDelete: "",
      newTaskList: "",
      errorMessage: "",
      creatingNewTaskList: false,
    }
  },
  watch: {
    selectedTaskList() {
      this.taskListToDelete = ""
      this.newTaskList = ""
      this.creatingNewTaskList = false
      this.errorMessage = ""
    }
  },
  methods: {
    async createTodo() {
      const accessToken = await this.$auth0.getAccessTokenSilently();

      try {
        const response = await axios.put("http://localhost:8080/createTodo",
          {
            name: this.newTaskList
          },
          {
            headers: {
              "Authorization": `Bearer ${accessToken}`,
              "Content-type": "application/json; charset=UTF-8"
            },
          })
        await response.data;
        this.taskListArray.push(this.newTaskList)
        this.selectedTaskList = this.newTaskList
        this.newTaskList = ""
        this.creatingNewTaskList = false
      } catch (e) {
        this.newTaskList = ""
        this.creatingNewTaskList = false
      }
    },
    async deleteTodo(todo) {
      const accessToken = await this.$auth0.getAccessTokenSilently();
      try {
        await axios.delete("http://localhost:8080/deleteTodo", {
          data: {
            name: todo
          },
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-type": "application/json; charset=UTF-8"
          },
        })
        this.taskListArray = this.taskListArray.filter(td => td != todo)
        this.taskListToDelete = ""
        this.selectedTaskList = this.taskListArray[0]
      } catch (e) {
        console.log(e)
      }
    }
  },
  async mounted() {
    const accessToken = await this.$auth0.getAccessTokenSilently();
    try {
      const response = await axios.get("http://localhost:8080/getTodos", {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-type": "application/json; charset=UTF-8"
        }
      });
      const data = await response.data
      this.taskListArray = data.map(item => item.name)
      this.selectedTaskList = this.taskListArray[0]
    } catch (e) {
      console.log(e)
    }
  }
}
</script>

<template>
  <div class="ui main container">
    <div class="ui stackable pointing menu">
      <a
        v-for="todo in taskListArray"
        class="item"
        @click="selectedTaskList = todo"
        :class="selectedTaskList == todo && 'active'"
      >
        <i class="tasks icon"></i>
        {{ todo }}
        <span
          v-if="todo == selectedTaskList"
          data-tooltip="Delete this task list"
          data-position="bottom center"
        >
          <i class="delete icon" @click.stop="taskListToDelete = todo"></i>
        </span>
      </a>
      <a class="item" v-if="creatingNewTaskList">
        <div class="ui action input">
          <input v-model="newTaskList" type="text" placeholder="New task list name..." />
          <div v-if="newTaskList" class="ui button" @click="createTodo">
            <i class="check icon"></i>
          </div>
          <div v-else class="ui button" @click="createTodo">
            <i class="redo icon"></i>
          </div>
        </div>
      </a>
      <a v-if="user" class="item" @click="creatingNewTaskList = !creatingNewTaskList">
        <i class="plus icon"></i> Add a new task list
      </a>
      <div class="right menu">
        <LoginPage></LoginPage>
        <LogoutPage></LogoutPage>
      </div>
    </div>
    <div v-if="taskListToDelete" class="ui text container small icon negative message yellow">
      <i class="delete icon"></i>
      <div class="ui text container">
        Are you sure you want to delete this todo list ?
        <div class="ui right floated button" @click="taskListToDelete = ''">No</div>
        <div class="ui right floated button" @click="deleteTodo(taskListToDelete)">Yes</div>
      </div>
    </div>
    <Error :errorMessage="errorMessage" @closed="errorMessage = ''"></Error>
    <Todos :selectedTaskList="selectedTaskList"></Todos>
  </div>
</template>
<style scoped>
.icon[class*="right floated"],
.checkbox[class*="right floated"] {
  float: right !important;
  margin-right: 0em !important;
  margin-left: 1em !important;
}
</style>