// scheduler/scheduler.js
class Scheduler {
  constructor(numChefs = 2) {
    this.numChefs = numChefs;
    this.orders = [];
    this.chefs = Array(numChefs).fill(0); // Chef availability times
    this.alpha = 0.7; // Weight for prep time
    this.beta = 0.3;  // Weight for waiting time
  }

  addOrder(order) {
    order.timestamp = Date.now();
    order.totalPrep = order.items.reduce((a, b) => a + b.prep_time, 0);
    order.status = "pending";
    this.orders.push(order);
    this.reschedule();
  }

  calculatePriority(order) {
    const waitingTime = (Date.now() - order.timestamp) / 60000; // in minutes
    return (this.alpha * order.totalPrep) - (this.beta * waitingTime);
  }

  reschedule() {
    // Sort orders by dynamic priority
    this.orders.sort((a, b) => this.calculatePriority(a) - this.calculatePriority(b));

    let chefAvailability = [...this.chefs];
    const now = Date.now();

    this.orders.forEach(order => {
      const chefIndex = chefAvailability.indexOf(Math.min(...chefAvailability));
      const startTime = chefAvailability[chefIndex];
      const finishTime = startTime + order.totalPrep;

      order.assignedChef = chefIndex + 1;
      order.startTime = new Date(now + startTime * 60000);
      order.finishTime = new Date(now + finishTime * 60000);
      order.etaMinutes = finishTime;

      chefAvailability[chefIndex] = finishTime;
    });

    this.chefs = chefAvailability;
  }

  getETAs() {
    return this.orders.map(o => ({
      id: o.id,
      customer: o.customer,
      etaMinutes: o.etaMinutes.toFixed(1),
      assignedChef: o.assignedChef,
      status: o.status
    }));
  }
}

export default Scheduler;
