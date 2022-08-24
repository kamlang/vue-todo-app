<script>
import Calendar from "../lib/calendar"
import dayjs from "dayjs"
import FadeTransition from "./FadeTransition.vue"
import localizedFormat from 'dayjs/plugin/localizedFormat'
dayjs.extend(localizedFormat)
export default {
  components: {
    FadeTransition
  },
  emits: ['dueDateSet'],
  data() {
    return {
      calendar: new Calendar(),
      showCalendar: false,
      dueDate: null,
      time: "00:00",
      isTimeValid: true
    }
  },
  watch: {
    active() {
      if (!this.active) this.showCalendar = false
    },
    injectedDueDate() {
      this.injectedDueDate === "" && (this.time = "00:00")
    }
  },
  props: {
    injectedDueDate: String,
    active: Boolean
  },
  methods: {
    validateTime() {
      const timeRegEx = /^([0-9]|[0-1][0-9]|2[0-3]):[0-5][0-9]$/g
      if (timeRegEx.test(this.time)) {
        this.isTimeValid = true
        this._setDueDateTime()
      } else {
        this.isTimeValid = false
      }
    },

    _setDueDateTime() {
      let hours = this.time.split(':')[0]
      let minutes = this.time.split(':')[1]
      this.dueDate.setHours(hours)
      this.dueDate.setMinutes(minutes)
      this.setDueDate(this.dueDate)
    },

    setDueDate(selectedDate) {
      this.dueDate = selectedDate
      this.$emit('dueDateSet', this.dueDate.toString())
      this.showCalendar = false
    },

    unSetDueDate() {
      this.dueDate = null
      this.time = "00:00"
      this.showCalendar = false
      this.$emit('dueDateSet', "")
    },

    getFormatedMonthYear() {
      let date = this.calendar.getCurrentDate()
      return dayjs(date).format("MMMM YY")
    },

    isSameDay(date1, date2) {
      return date1.getDate() === date2.getDate() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getFullYear() === date2.getFullYear() ?
        true : false
    },

    isTodayOrDueDate(date) {
      // if dueDate is not set today date is highlighted in calendar.
      // if dueDate is set then it's highlighted.
      let today = new Date()
      return this.dueDate instanceof Date ?
        this.isSameDay(this.dueDate, date) :
        this.isSameDay(today, date)
    },

    isSelectable(date) {
      // A date is selectable only if it's in the future and belongs to the current month.
      let today = new Date()
      let currentCalendarDate = this.calendar.getCurrentDate()
      return (this.isSameDay(today, date) ||
        today.getTime() <= date.getTime()) &&
        date.getMonth() === currentCalendarDate.getMonth() ?
        true : false
    },

    increaseMonth() {
      this.calendar.increaseMonth()
    },

    decreaseMonth() {
      this.calendar.decreaseMonth()
    },
  },
  computed: {

    formatedDueDate() {
      if (this.injectedDueDate) {
        this.dueDate = new Date(this.injectedDueDate)
        this.time = dayjs(this.dueDate).format("HH:mm")
        return dayjs(this.dueDate).format("LL")
      } else {
        return ""
      }
    },

    computedCalendar() {
      let calendar = this.calendar.getCalendar()
      let [daysInitial, ...daysOfMonth] = calendar
      return { daysInitial, daysOfMonth }
    }
  }
}
</script>

<template>
  <div class="two fields">
    <div class="field">
      <div class="ui left icon input" :class="(showCalendar || dueDate) && 'action'">
        <i class="calendar icon"></i>
        <input
          data-test-id="input-duedate"
          @touchend.prevent.stop="active && (showCalendar = !showCalendar)"
          @mouseup="showCalendar = !showCalendar"
          @keydown.prevent
          @mousedown.prevent
          :value="formatedDueDate"
          type="text"
          placeholder="Set a reminder..."
          tabindex="-1"
        />

        <button
          v-if="dueDate && active || showCalendar"
          data-test-id="delete-duedate-button"
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
          data-test-id="input-time"
          tabindex="-1"
          @input="validateTime"
          @blur="!isTimeValid && (time = '00:00') && validateTime()"
          v-model="time"
          type="text"
          placeholder="00:00"
        />
      </div>
    </div>
  </div>
  <FadeTransition>
    <div
      v-if="active && showCalendar"
      class="ui raised segment center aligned calendaritem"
      data-test-id="calendar"
      draggable="true"
    >
      <i data-test-id="dec-month" class="icon angle left floated" @click="decreaseMonth"></i>
      <span data-test-id="current-month">{{ getFormatedMonthYear() }}</span>
      <i data-test-id="inc-month" class="icon angle right right floated" @click="increaseMonth"></i>
      <table class="ui celled table fixed unstackable">
        <thead>
          <tr>
            <th class="center aligned" v-for="item in computedCalendar.daysInitial">{{ item }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="line in computedCalendar.daysOfMonth">
            <td
              v-for="date in line"
              :data-test-id="date.getMonth() + '-' + date.getDate()"
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
  background-color: var(--teal);
}
td.disabled {
  color: #aaa;
}

.calendaritem table td,
th {
  padding: 0.271429em 0.271429em !important;
}
</style>