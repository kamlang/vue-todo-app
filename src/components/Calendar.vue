<template>
  <div class="two fields">
    <div class="field">
      <div class="ui left icon input" :class="(showCalendar || dueDate) && 'action'">
        <i class="calendar icon"></i>
        <input
          @touchend.prevent.stop="active && (showCalendar = !showCalendar)"
          @mouseup="showCalendar = !showCalendar"
          @keydown.prevent
          @mousedown.prevent
          :value="formatedDueDate"
          type="text"
          placeholder="Due date..."
          tabindex="-1"
        />

        <button
          v-if="dueDate && active || showCalendar"
          @click.stop="unSetDueDate"
          @touchstart.prevent.stop
          @touchend.stop="unSetDueDate"
          class="ui icon button"
        >
          <i class="delete icon"></i>
        </button>
      </div>
    </div>
    <div :class="isTimeValid ? 'success' : 'error'" class="field">
      <div :class="this.dueDate instanceof Date ? '' : 'disabled'" class="ui input left icon">
        <i class="clock icon"></i>
        <input
          tabindex="-1"
          @input="(event) => validateTime(event)"
          @blur="!isTimeValid && (time = '00:00') && validateTime()"
          v-model="time"
          type="text"
          placeholder="00:00"
        />
      </div>
    </div>
  </div>
  <FadeTransition>
    <div v-if="active && showCalendar" class="ui raised segment center aligned calendaritem">
      <i class="icon angle left floated" @click="decMonth"></i>
      <span>{{ getCleanDate(selectedMonth) }}</span>
      <i class="icon angle right right floated" @click="incMonth"></i>
      <table class="ui celled table fixed unstackable">
        <thead>
          <tr>
            <th class="center aligned" v-for="item in computedCalendar.headers">{{ item }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="line in computedCalendar.daysGrid">
            <td
              v-for="date in line"
              :data-test-id="date.getDay()"
              :class="[isSelectable(date) ? 'selectable' : 'disabled', isTodayOrDueDate(date) && 'highlighted']"
              @click.stop
              @touchstart.prevent.stop
              @touchend.stop
              v-on="isSelectable(date) ? { click: () => setDueDate(date), touchend: () => setDueDate(date) } : {}"
              class="center aligned"
            >{{ date.getDate() }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </FadeTransition>
</template>


<script>
import Calendar from "../calendar"
import moment from "moment"
import FadeTransition from "./FadeTransition.vue"
export default {
  components: {
    FadeTransition
  },
  emits: ['dueDateSet'],
  data() {
    return {
      calendar: new Calendar(),
      showCalendar: false,
      dueDate: "",
      time: "00:00",
      isTimeValid: true
    }
  },
  watch: {
    active() {
      if (!this.active) this.showCalendar = false
    },
  },
  props: {
    injectedDueDate: String,
    active: Boolean
  },
  methods: {
    validateTime(event) {
      const timeRegEx = /^([0-9]|[0-1][0-9]|2[0-3]):[0-5][0-9]$/g
      if (timeRegEx.test(this.time)) {
        this.isTimeValid = true
        if (this.dueDate instanceof Date) {
          this.setDueDate(this.dueDate)
        }
      } else {
        this.isTimeValid = false
      }
    },
    setDueDate(selectedDate) {
      this.dueDate = selectedDate
      let hours = this.time.split(':')[0]
      let minutes = this.time.split(':')[1]
      this.dueDate.setHours(hours)
      this.dueDate.setMinutes(minutes)
      this.$emit('dueDateSet', this.dueDate.toString())
      this.showCalendar = false
      console.log(this.dueDate)
    },
    unSetDueDate() {
      this.dueDate = ""
      this.time = "00:00"
      this.showCalendar = false
      this.$emit('dueDateSet', "")
    },
    getCleanDate(date) {
      return moment(date).format("MMMM YY")
    },

    isTodayOrDueDate(date) {
      let today = new Date()
      return this.dueDate instanceof Date ?
        this.calendar.isSameDay(this.dueDate, date) :
        this.calendar.isSameDay(today, date)
    },
    isSelectable(date) {
      let today = new Date()
      return (this.calendar.isSameDay(today, date) ||
        today.getTime() <= date.getTime()) &&
        date.getMonth() === this.selectedMonth.getMonth() ?
        true : false
    },

    incMonth() {
      this.calendar.incMonth()
    },
    decMonth() {
      this.calendar.decMonth()
    },
  },
  computed: {
    formatedDueDate() {
      if (this.injectedDueDate) {
        this.dueDate = new Date(this.injectedDueDate)
        return moment(this.dueDate).format("LL")
      } else {
        return ""
      }
    },
    selectedMonth() {
      return this.calendar.getDate()
    },
    computedCalendar() {
      this.calendar.create()
      return { headers: this.calendar.headers, daysGrid: this.calendar.daysGrid }
    }
  }
}
</script>
<style scoped>
.calendaritem {
  position: absolute !important;
  max-width: 300px;
  z-index: 100 !important;
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
.highlighted {
  background-color: rgb(252, 73, 112);
}
td.disabled {
  color: #aaa;
}

.calendaritem table td,
th {
  padding: 0.271429em 0.271429em !important;
}
</style>