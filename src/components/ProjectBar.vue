<script>
import Warning from "./Warning.vue"
import FadeTransition from './FadeTransition.vue'
import Authentication from './Authentication.vue'

import { store } from '../state/state'
import { httpRequest } from "../lib/httpRequest"

export default {
  emits: ['error', 'new-notifications'],
  components: {
    FadeTransition,
    Authentication,
    Warning
  },
  data() {
    return {
      store,
      auth0User: this.$auth0.user,
      isAuthenticated: this.$auth0.isAuthenticated,
      isLoading: false,

      creatingNewProject: false,
      renamingNewProject: false,

      projectToDelete: null,
      newProjectName: "",

      draggedProjectIndex: -1,
      hoveredProjectIndex: -1,

      touchTimerStart: 0,
      projectBarOverFlown: Boolean,
      scrollSetIntervalId: Object
    }
  },
  watch: {
    isAuthenticated: {
      async handler() {
        if (this.isAuthenticated) {
          await this.getProjects()
          this.projectBarOverFlown = this.isProjectBarOverFlown()
          this.store.populateNotifications()
        }
      },
      immediate: true
    },
  },

  computed: {
    numberOfProjects() {
      return this.store.projects.length
    }
  },

  created() {
    window.addEventListener("resize", this.handleResize);
  },

  destroyed() {
    window.removeEventListener("resize", this.handleResize);
  },

  mounted() {
    setInterval(() => this.store.populateNotifications(), 50000)
  },

  methods: {

    async getProjects() {
      this.isLoading = true
      try {
        const accessToken = await this.$auth0.getAccessTokenSilently();
        const response = await httpRequest(accessToken,
          "get",
          "/projects")
        this.store.setProjects(response)
      } catch (e) {
        console.log(e)
      }
      this.isLoading = false
    },

    isProjectBarOverFlown() {
      return this.$refs.projectBar.scrollWidth > this.$refs.projectBar.clientWidth
    },

    setProjectToDelete() {
      this.projectToDelete = { ...this.store.selectedProject }
    },

    setSelectedProject(project) {
      this.store.setSelectedProject(project)
      this.renamingNewProject = false
    },

    resetProjectToDelete() {
      this.projectToDelete = null
    },

    async reOrderProjects() {
      try {
        const accessToken = await this.$auth0.getAccessTokenSilently();
        await httpRequest(accessToken,
          "patch",
          "/projects",
          {
            projects: this.store.projects.map(project => project._id)
          })
        this.store.reOrderProjects(this.draggedProjectIndex, this.hoveredProjectIndex)
      } catch (e) {
        console.log(e)
      }
    },

    async addProject() {
      try {
        const accessToken = await this.$auth0.getAccessTokenSilently();
        const response = await httpRequest(accessToken,
          "put",
          "/project",
          {
            name: this.newProjectName
          })
        this.store.addProject(response)
      } catch (error) {
        this.$emit('error', error.message)
      } finally {
        this.newProjectName = ""
        this.creatingNewProject = false
        this.projectBarOverFlown = this.isProjectBarOverFlown()
      }
    },

    async changeProjectName() {
      const accessToken = await this.$auth0.getAccessTokenSilently();
      try {
        await httpRequest(accessToken,
          "patch",
          "/project",
          {
            oldName: this.store.selectedProject.name,
            newName: this.newProjectName
          })
        this.store.changeProjectName(
          this.store.selectedProject.name,
          this.newProjectName
        )

      } catch (error) {
        this.$emit('error', error.message)
      } finally {
        this.newProjectName = ""
        this.renamingNewProject = false
        this.projectBarOverFlown = this.isProjectBarOverFlown()
      }
    },

    async deleteProject() {
      try {
        const accessToken = await this.$auth0.getAccessTokenSilently();
        await httpRequest(accessToken,
          "delete",
          "/project",
          {
            name: this.projectToDelete.name
          })
        this.store.deleteProject(this.projectToDelete)
        this.resetProjectToDelete()
      } catch (e) {
        console.log(e)
      }
      this.projectBarOverFlown = this.isProjectBarOverFlown()
    },

    async beforeCreatingProject() {
      this.newProjectName = ""
      this.creatingNewProject = true
      await this.$nextTick()
      this.$refs.newTaskNameInput.focus()
      // scroll max right when creating a new task list so input box is fully visible.
      this.handleScrollRight(1000)
    },

    async beforeRenamingProject() {
      this.newProjectName = ""
      this.renamingNewProject = true
      await this.$nextTick()
      this.$refs.renameProjectInput[0].focus()
    },

    handleDragStart(index) {
      this.draggedProjectIndex = index
      this.hoveredProjectIndex = index
    },

    handleDragEnter(index) {
      this.hoveredProjectIndex = index
    },

    async handleDragEnd() {
      if ((this.draggedProjectIndex !== -1 && this.hoveredProjectIndex !== -1)
        && (this.draggedProjectIndex !== this.hoveredProjectIndex)) {
        try {
          await this.reOrderProjects()
        } catch (e) {
          console.log(e)
        }
      }
      this.resetDragData()
    },

    resetDragData() {
      this.draggedProjectIndex = -1
      this.hoveredProjectIndex = -1
    },

    async handleTouchStart(index) {
      if (this.draggedProjectIndex !== -1) {
        this.hoveredProjectIndex = index
        await this.handleDragEnd()
      } else {
        this.store.setSelectedProject(index)
      }
      let now = new Date()
      this.touchTimerStart = now.valueOf()
      console.log(this.touchTimerStart)
    },

    handleTouchEnd(index) {
      const minTouchDuration = 500
      const now = new Date()
      const touchDuration = now.valueOf() - this.touchTimerStart
      if (touchDuration >= minTouchDuration) {
        this.handleDragStart(index)
      }
      this.touchTimerStart = 0
    },

    handleMouseDown(callback) {
      this.scrollSetIntervalId = setInterval(callback, 20)
    },

    handleMouseUp() {
      clearInterval(this.scrollSetIntervalId)
    },

    handleScrollLeft(step = 10) {
      this.$refs.projectBar.scrollLeft -= step
    },

    handleScrollRight(step = 10) {
      this.$refs.projectBar.scrollLeft += step
    },

    handleResize() {
      this.projectBarOverFlown = this.isProjectBarOverFlown()
    },

    handleWheel(event) {
      const scrollDown = event.deltaY < 0
      scrollDown ? this.handleScrollLeft(50) :
        this.handleScrollRight(50)
    }
  }
}

</script>

<template>
  <div tabindex="-1" class="ui inverted menu project-bar">
    <div v-if="!isLoading" class="flex-wrapper">
      <div v-if="isAuthenticated" class="ui inverted menu left">
        <div class="item collapsable">
          <i class="user icon"></i>
          {{ auth0User.nickname }}
        </div>
        <div
          v-if="projectBarOverFlown"
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
        ref="projectBar"
        v-if="isAuthenticated"
        class="ui inverted menu taskmenu"
        @wheel.prevent.stop="(event) => handleWheel(event)"
        @scroll.prevent.stop
      >
        <div
          class="link item taskList"
          v-for="(project, index) in store.projects"
          title="You can use drag and drop to reorder projects."
          data-test-id="projectName"
          @click="setSelectedProject(index)"
          @keydown.space.prevent="setSelectedProject(index)"
          @dblclick="beforeRenamingProject"
          @keydown.enter="beforeRenamingProject"
          @dragover.prevent
          @drop.prevent
          @dragstart="handleDragStart(index)"
          @dragenter="handleDragEnter(index)"
          @dragend="handleDragEnd"
          @touchstart.prevent.stop="handleTouchStart(index)"
          @touchend="handleTouchEnd(index)"
          :key="index"
          :class="[store.selectedProject.name === project.name && 'active', hoveredProjectIndex === index ? 'horizontal-shake' : '']"
          :style="[hoveredProjectIndex === index ? 'border-left: 2px solid' : 'border-left: 1px']"
          tabindex="0"
          :draggable="!renamingNewProject"
        >
          <FadeTransition>
            <div
              v-if="store.selectedProject.name === project.name
              && renamingNewProject"
              class="ui action input"
            >
              <input
                ref="renameProjectInput"
                data-test-id="inputNewTaskName"
                v-model="newProjectName"
                type="text"
                :placeholder="project.name"
                @keydown.esc="renamingNewProject = false"
                @keydown.delete.stop
                @keydown.space.stop
                @keydown.enter.stop="newProjectName ? changeProjectName() : renamingNewProject = false"
              />
              <div
                v-if="newProjectName"
                data-test-id="confirmNewName"
                class="ui icon button"
                @click.stop="changeProjectName"
              >
                <i class="check icon"></i>
              </div>
              <div
                v-else
                class="ui icon button"
                data-test-id="cancelNewName"
                @click.stop="renamingNewProject = false"
              >
                <i class="delete icon"></i>
              </div>
            </div>
            <span v-else>
              <i class="tasks icon collapsable"></i>
              {{ project.name }} ({{ project.tasks.filter(task => !task.completed).length }})
              <a
                v-if="store.selectedProject.name === project.name"
                tabindex="0"
                data-test-id="deleteProject"
                title="Delete selected project."
                @click="setProjectToDelete"
                @keydown.space.prevent="setProjectToDelete"
              >
                <i class="inverted delete icon"></i>
              </a>
            </span>
          </FadeTransition>
        </div>
        <a
          class="item"
          data-test-id="createNewTaskListButton"
          title="Create a new project."
          tabindex="0"
          @click="beforeCreatingProject"
          @keydown.space.prevent="beforeCreatingProject"
        >
          <FadeTransition>
            <div v-if="creatingNewProject" class="ui action input">
              <input
                ref="newTaskNameInput"
                @click.stop
                data-test-id="createNewTaskListInput"
                v-model="newProjectName"
                type="text"
                placeholder="New project name..."
                @keydown.delete="!newProjectName && (creatingNewProject = false)"
                @keydown.esc="creatingNewProject = false"
                @keydown.space.stop
                @keydown.enter="newProjectName ? addProject() : creatingNewProject = false"
              />
              <div
                v-if="newProjectName"
                data-test-id="validateTaskListNameButton"
                class="ui icon button"
                @click.stop="addProject"
              >
                <i class="check icon"></i>
              </div>
              <div v-else class="ui icon button" @click.stop="creatingNewProject = false">
                <i class="delete icon"></i>
              </div>
            </div>
          </FadeTransition>
          <div class="addnewprojectbutton">
            <span v-if="!creatingNewProject && numberOfProjects === 0">Create your first project</span>
            <i v-if="!creatingNewProject" class="plus icon"></i>
          </div>
        </a>
      </div>
      <div class="ui inverted menu right">
        <div
          v-if="projectBarOverFlown && isAuthenticated"
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
    <div class="warning-wrapper">
      <Warning
        v-if="projectToDelete"
        @no="resetProjectToDelete"
        @yes="deleteProject"
        :message="'Are you sure you want to delete project ' + projectToDelete.name + '?'"
      ></Warning>
    </div>
  </FadeTransition>
</template>
<style scoped>
.project-bar {
  min-width: 100vw;
  position: fixed;
  z-index: 1000;
}
.addnewprojectbutton {
  display: flex;
  align-items: center;
  gap: 10px;
}
.menu {
  justify-content: center;
  flex: auto;
}
.taskmenu {
  flex: 1 0 auto !important;
  justify-content: flex-start;
  min-height: 50px;
  overflow-x: hidden !important;
  overflow-y: hidden !important;
}
.warning-wrapper {
  margin-bottom: 1em;
  max-width: min(95%, 900px);
  margin-left: auto;
  margin-right: auto;
}
.flex-wrapper {
  display: flex;
  justify-content: space-between;
  max-width: min(100%, 960px);
  min-width: min(100%, 960px);
}

.menu .menu.right,
.menu .menu.left {
  flex: 0 0 auto !important;
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
    transform: translateX(1px);
  }
  50% {
    transform: translateX(-1px);
  }
  75% {
    transform: translateX(1px);
  }
  100% {
    transform: translateX(0);
  }
}
</style>