<script>
import Warning from "./Warning.vue"
import axios from 'axios'
import FadeTransition from './FadeTransition.vue'
import Authentication from './Authentication.vue'

export default {
  emits: ['taskListSelected', 'error', 'newNotifications'],
  inject: ['apiUrl'],
  components: {
    FadeTransition,
    Authentication,
    Warning
  },
  props: {
    refreshTaskBar: Boolean,
    taskToUpdate: Object
  },
  data() {
    return {
      taskListArray: [],
      auth0User: this.$auth0.user,
      isLoading: this.$auth0.isLoading,
      isAuthenticated: this.$auth0.isAuthenticated,

      creatingNewTaskList: false,
      selectedTaskList: "",
      taskListToDelete: "",
      draggedTaskListIndex: "",
      newTaskListName: "",
      taskListToRename: "",

      touchTimerStart: 0,
      isOverFlown: Boolean,
      scrollInterval: Object
    }
  },
  watch: {
    isAuthenticated: {
      async handler() {
        if (this.isAuthenticated) {
          await this.getTaskList()
          this.isOverFlown = this.isOverFlownMenu()
          this.checkTaskDueDate()
        }
      },
      immediate: true
    },
    refreshTaskBar() {
      this.getTaskList()
    },
  },
  created() {
    window.addEventListener("resize", this.handleResize);
  },
  destroyed() {
    window.removeEventListener("resize", this.handleResize);
  },
  mounted() {
    setInterval(() => this.checkTaskDueDate(), 50000)
  },
  methods: {
    checkTaskDueDate() {
      if (!this.taskListArray) return
      let taskToNotifyArray = []
      for (let taskList of this.taskListArray) {
        for (let task of taskList.tasks) {
          if (task.dueDate !== null && task.completed === false) {
            const taskDueDate = new Date(task.dueDate)
            if (taskDueDate < Date.now()) {
              task.taskListName = taskList.name
              taskToNotifyArray.push(task)
            }
          }
        }
      }
      this.$emit('newNotifications', taskToNotifyArray)
    },
    isOverFlownMenu() {
      return this.$refs.taskListMenu.scrollWidth > this.$refs.taskListMenu.clientWidth
    },
    setSelectedTaskList(taskListName) {
      this.selectedTaskList = taskListName
      this.creatingNewTaskList = false

      for (let taskList of this.taskListArray) {
        if (taskList.name === taskListName) {
          this.$emit('taskListSelected', taskList)
          break
        }
      }
      this.$emit('error', '')
    },
    async newTaskListHandler() {
      this.newTaskListName = ""
      this.taskListToRename = ""
      this.creatingNewTaskList = !this.creatingNewTaskList
      await this.$nextTick()
      this.$refs.newTaskNameInput.focus()
      // scroll max right when creating a new task list so input box is fully visible.
      this.handleScrollRight(1000)
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
      this.draggedTaskListIndex = index
    },
    handleDragEnter(index) {
      this.taskListArray[index].isDragTarget = true
    },
    handleDropOver(index) {

      if (this.draggedTaskListIndex === '') {
        this.unSetDragTarget()
        return
      }
      if (this.draggedTaskListIndex < index) index += 1
      if (this.draggedTaskListIndex != index) {
        let taskListToInsert = this.taskListArray[this.draggedTaskListIndex]
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
      this.draggedTaskListIndex = ""
    },
    handleTouchStart(index, taskListName) {
      if (this.draggedTaskListIndex !== "") {
        this.handleDropOver(index)
        this.handleDragEnd()
      } else {
        this.setSelectedTaskList(taskListName)
      }
      let now = new Date()
      this.touchTimerStart = now.valueOf()
    },
    handleTouchEnd(index) {
      let minduration = 500
      let now = new Date()
      let delta = now.valueOf() - this.touchTimerStart
      console.log(delta)
      if (delta >= minduration) this.handleDragStart(index)
      this.touchTimerStart = 0
    },
    async updateTaskListOrder() {
      try {
        const accessToken = await this.$auth0.getAccessTokenSilently();
        await axios.patch("https://" + this.apiUrl + "/updateTaskListOrder",
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
        const response = await axios.put("https://" + this.apiUrl + "/createTaskList",
          {
            name: this.newTaskListName
          },
          {
            headers: {
              "Authorization": `Bearer ${accessToken}`,
              "Content-type": "application/json; charset=UTF-8"
            },
          })
        const data = await response.data;
        this.taskListArray.push(data)
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
        const response = await axios.patch("https://" + this.apiUrl + "/updateTaskList",
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
        await axios.delete("https://" + this.apiUrl + "/deleteTaskList", {
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
        this.setSelectedTaskList(this.taskListArray[0].name)
      } catch (e) {
        console.log(e)
      }
    },
    async getTaskList() {
      try {
        const accessToken = await this.$auth0.getAccessTokenSilently();
        const response = await axios.get("https://" + this.apiUrl + "/getTaskList", {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-type": "application/json; charset=UTF-8"
          }
        });
        this.taskListArray = await response.data
        this.selectedTaskList || this.setSelectedTaskList(this.taskListArray[0].name)
      } catch (e) {
        console.log(e)
      }
    },
    handleMouseDown(callback) {
      this.scrollInterval = setInterval(callback, 20)
    },
    handleMouseUp() {
      clearInterval(this.scrollInterval)
    },
    handleScrollLeft(step = 10) {
      this.$refs.taskListMenu.scrollLeft -= step
    },
    handleScrollRight(step = 10) {
      this.$refs.taskListMenu.scrollLeft += step
    },
    handleResize() {
      this.isOverFlown = this.isOverFlownMenu()
    },
    handleWheel(event) {
      event.deltaY < 0 ? this.handleScrollLeft(50) :
        this.handleScrollRight(50)
    }
  }
}

</script>

<template>
  <div tabindex="-1" class="ui inverted menu">
    <div class="flex-wrapper">
      <div v-if="isAuthenticated" class="ui inverted menu">
        <div class="item collapsable">
          <i class="user icon"></i>
          {{ auth0User.nickname }}
        </div>
        <div
          v-if="isOverFlown"
          @mousedown="handleMouseDown(handleScrollLeft)"
          @mouseup="handleMouseUp()"
          @touchstart.prevent.stop="handleMouseDown(handleScrollLeft)"
          @touchend.prevent="handleMouseUp()"
          @touchmove.prevent
          class="link item"
        >
          <i class="angle left icon"></i>
        </div>
      </div>
      <div
        ref="taskListMenu"
        v-if="isAuthenticated"
        class="ui inverted menu taskmenu"
        @wheel.prevent.stop="(event) => handleWheel(event)"
        @scroll.prevent.stop
      >
        <a
          tabindex="0"
          data-test-id="deleteTaskList"
          class="item"
          title="Delete selected task list."
          @click="taskListToDelete = selectedTaskList"
          @keydown.space.prevent="taskListToDelete = selectedTaskList"
          v-if="selectedTaskList"
        >
          <i class="delete icon"></i>
        </a>

        <div
          class="link item taskList"
          v-for="(taskList,index) in taskListArray"
          title="You can use drag and drop to reorder task lists."
          data-test-id="taskListName"
          @click="setSelectedTaskList(taskList.name)"
          @dblclick="renameTaskListHandler(taskList.name)"
          @keydown.space.prevent="setSelectedTaskList(taskList.name)"
          @keydown.enter="renameTaskListHandler(taskList.name)"
          @dragover.prevent
          @dragstart="handleDragStart(index)"
          @drop.prevent="handleDropOver(index)"
          @dragenter="handleDragEnter(index)"
          @dragend="handleDragEnd(index)"
          @dragexit="taskList.isDragTarget = false"
          @touchstart.prevent.stop="handleTouchStart(index, taskList.name)"
          @touchend="handleTouchEnd(index)"
          :class="[selectedTaskList == taskList.name && 'active', draggedTaskListIndex === index ? 'horizontal-shake' : '']"
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
            <span v-else>
              <i class="tasks icon collapsable"></i>
              {{ taskList.name }} ({{ taskList.tasks.filter(t => !t.completed).length }})
            </span>
          </FadeTransition>
        </div>
        <a
          class="item"
          data-test-id="createNewTaskListButton"
          title="Create a new task list."
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
      <div class="ui inverted menu right">
        <div
          v-if="isAuthenticated && isOverFlown"
          @mousedown="handleMouseDown(handleScrollRight)"
          @mouseup="handleMouseUp()"
          @touchstart.prevent.stop="handleMouseDown(handleScrollRight)"
          @touchend.prevent="handleMouseUp()"
          @touchmove.prevent
          class="link item"
        >
          <i class="angle right icon"></i>
        </div>
        <Authentication></Authentication>
      </div>
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
.menu {
  justify-content: center;
  flex: auto;
}
.taskmenu {
  justify-content: flex-start;
  min-height: 50px;
  overflow-x: hidden !important;
  overflow-y: hidden !important;
}
.flex-wrapper {
  display: flex;
  flex: auto;
  justify-content: center;
  max-width: min(100%, 960px);
}

.menu .menu.right,
.menu .menu.left {
  flex: 1 0 auto !important;
}
.horizontal-shake {
  animation: horizontal-shaking 0.5s infinite;
}
</style>
<style>
@media screen and (max-width: 768px) {
  .collapsable {
    display: none !important;
  }
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