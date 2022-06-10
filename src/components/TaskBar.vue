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
      taskListToRename: "",
      draggedIndex: ""
    }
  },
  watch: {
    isAuthenticated: {
      handler() {
        if (this.isAuthenticated) this.getTaskList()
      },
      immediate: true
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

    unSetDragTarget() {
      this.taskListArray = this.taskListArray.map(t => {
        t.isDragTarget = false
        return t
      })
    },
    handleDragStart(index) {
      this.draggedIndex = index
    },
    handleDragEnter(index) {
      this.taskListArray[index].isDragTarget = true
    },
    handleDropOver(index) {

      if (this.draggedIndex === '') {
        this.unSetDragTarget()
        return
      }
      if (this.draggedIndex < index) index += 1
      if (this.draggedIndex != index) {
        let taskListToInsert = this.taskListArray[this.draggedIndex]
        let arr1 = this.taskListArray.slice(0, index).filter(taskList => taskList !== taskListToInsert)
        arr1.push(taskListToInsert)
        let arr2 = this.taskListArray.slice(index,).filter(taskList => taskList !== taskListToInsert)
        this.taskListArray = arr1.concat(arr2)
        this.updateTaskListOrder()
        this.unSetDragTarget()
      }
    },
    handleDragEnd() {
      this.unSetDragTarget()
      this.draggedIndex = ""
    },
    async updateTaskListOrder() {
      try {
        const accessToken = await this.$auth0.getAccessTokenSilently();
        await axios.patch("http://localhost:8080/updateTaskListOrder",
          {
            taskLists: this.taskListArray.map(taskList => taskList._id)
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
        this.taskListArray.push({ name: this.newTaskListName })
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
        this.taskListArray = this.taskListArray.map(taskList => {
          if (taskList.name == this.selectedTaskList) {
            taskList.name = this.newTaskListName
          }
          return taskList
        })
      } catch (e) {
        console.log(e.response.data.message)
        this.$emit('error', e.response.data.message)
      }
      this.newTaskListName = ""
      this.taskListToRename = ""
    },
    async deleteTaskList(taskList) {
      try {
        const accessToken = await this.$auth0.getAccessTokenSilently();
        await axios.delete("http://localhost:8080/deleteTaskList", {
          data: {
            name: taskList
          },
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-type": "application/json; charset=UTF-8"
          },
        })
        this.taskListToDelete = ""
        this.taskListArray = this.taskListArray.filter(t => t.name != taskList
        )
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
        this.taskListArray = await response.data
        //        this.taskListArray = data.map(item => item.name)
        this.setSelectedTaskList(this.taskListArray[0].name)
      } catch (e) {
        console.log(e)
      }
    }
  },
}

</script>

<template>
  <div tabindex="-1" class="ui taskmenu inverted menu">
    <div v-if="isAuthenticated" class="left menu">
      <div class="item">
        <i class="user icon"></i>
        {{ auth0User.nickname }}
      </div>
    </div>
    <div v-if="isAuthenticated" class="center menu">
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

      <div
        class="link item taskList"
        v-for="(taskList,index) in taskListArray"
        data-test-id="taskListName"
        @click.prevent="setSelectedTaskList(taskList.name)"
        @dblclick="renameTaskListHandler(taskList.name)"
        @keydown.space.prevent="setSelectedTaskList(taskList.name)"
        @keydown.enter="renameTaskListHandler(taskList.name)"
        @dragover.prevent
        @dragstart="handleDragStart(index)"
        @drop.prevent="handleDropOver(index)"
        @dragenter="handleDragEnter(index)"
        @dragend="handleDragEnd"
        @dragexit="taskList.isDragTarget = false"
        :class="selectedTaskList == taskList.name && 'active'"
        :style="[taskList.isDragTarget ? 'border-left: 2px solid' : 'border-left: 1px']"
        tabindex="0"
        draggable="true"
      >
        <FadeTransition>
          <div v-if="taskListToRename === taskList.name" class="ui action input">
            <input
              ref="renameTaskListInput"
              data-test-id="inputNewTaskName"
              v-model="newTaskListName"
              type="text"
              :placeholder="taskList.name"
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
          <span v-else draggable>
            <i class="tasks icon"></i>
            {{ taskList.name }} ({{ taskList.tasks.length }})
          </span>
        </FadeTransition>
      </div>
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