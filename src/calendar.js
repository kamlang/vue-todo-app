export default class Calendar {

  DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  constructor () {
    this.date = new Date ()
  }

  getDate() {
    return this.date
  }

  create() {
    let [year,month] = [this.date.getFullYear(), this.date.getMonth()]
    let dateArray = []
    let daysArray = []
    let dayShortNameArray = []

    for (let day=1; day <= 35; day++) {
      dateArray.push(new Date(year,month,day))
      }

    for (let i=0; i<7;i++) {
      dayShortNameArray.push(this.DAYS[dateArray[i].getDay()])
    }

    for (let j=0; j<5;j++) {
      daysArray.push(dateArray.slice(j*7,j*7+7))
    }
    this.headers = dayShortNameArray, 
    this.daysGrid = daysArray
  }

  incMonth() {
    this.date = new Date(
      this.date.setMonth(this.date.getMonth() + 1))
  }

  decMonth() {
    this.date = new Date(
      this.date.setMonth(this.date.getMonth() - 1))
  }

  isSameDay(date1,date2) {
    return date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear() ?
      true : false
  }
}