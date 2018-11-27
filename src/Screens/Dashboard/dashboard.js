import React from "react";
import { Modal } from "antd";
import "antd/dist/antd.css";
import Queue from "../../Helpers/Queue/Queue";
import { QueueContainer } from "../../Components";
import "./dashboard.css";
import { toast, ToastContainer } from "react-toastify";
import {
  ProcessArrivedDark,
  ProcessArrivedLight,
  ProcessDipatchedDark,
  ProcessDipatchedLight,
  ProcessTimeoutDark,
  ProcessTimeoutLight
} from "../../Helpers/Assets";
import "react-toastify/dist/ReactToastify.css";
export default class Dasboard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      Ready_Queue: new Queue(),
      Primary_Queue: new Queue(),
      no_Ofprocesses: props.processes,
      algoType: props.algoType,
      algoName: props.algoName,
      systemTimer: null,
      processor: null,
      burstTimer: null,
      getProcessesTimer: null,
      timeOutActive: false,
      processArrivedActive: false,
      blockqueueActive: false,
      processDispatchActice: false,
      systemEnd: false
    };
  }

  // Will be executed immediately when the system is started
// This method will initiate the system
  componentDidMount() {
    const { no_Ofprocesses, Ready_Queue, Primary_Queue } = this.state;
    for (let i = 0; i < no_Ofprocesses; i++) {
      const number = i + 1;
      //First we will all the process will be in the disk queue called 
    //primary queue, we assume that the process is just created.
      Primary_Queue.Enqueue({
        processId: number,
        processName: `Process # ${number}`,
        executionCount: Math.ceil(Math.random() * 10)
      });
    }
    this.handleGetProcessesFromHardDisk();
    setTimeout(() => {
      this.setState({ processor: Ready_Queue.Dequeue() });
    }, 3000);
    this.setState({
      processor: null,
      // Timer to execute a process after every 5 seconds
      burstTimer: setInterval(this.handleExecute, 5000),
      // Timer to get the processes after every 3 seconds from disk
      getProcessesTimer: setInterval(this.handleGetProcessesFromHardDisk, 3000),
      // Timer to check the system status after every 20 miliseconds
      systemTimer: setInterval(this.handlecheckSystemStatus, 20),
      processorLoaderIncreasing: false
    });
  }

  // Method to get the processes after every 3 seconds from disk
  handleGetProcessesFromHardDisk = () => {
    const {
      Ready_Queue,
      Primary_Queue,
      getProcessesTimer,
    } = this.state;
    if (Primary_Queue.Count()) {
      Ready_Queue.SortedEnqueue(Primary_Queue.Dequeue());
      this.setState({
        Ready_Queue,
        Primary_Queue,
        processArrivedActive: true
      });
      setTimeout(() => {
        this.setState({ processArrivedActive: false });
      }, 1800);
    } else {
      clearInterval(getProcessesTimer);
    }
  };

    // Method to validate preemption on every CPU clock
  // check either there is any more shorter process in the ready queue
 // if there is any than preempt the CPU from that running process put it into 
  // ready queue and dispatch the shortest one
  handlevalidatePreemtion = () => {
    const { Ready_Queue, processor } = this.state;
    console.log("Arrival Process=>", Ready_Queue.Front());
    console.log("CurrentProcess=>", processor);
    const fronProcess = Ready_Queue.Front();
    if (
      processor &&
      fronProcess &&
      fronProcess.executionCount < processor.executionCount
    ) {
      // preempt processor
      console.log(
        `preemting process : ${processor.processId} with ${
          Ready_Queue.Front().processId
        }`
      );
      Ready_Queue.SortedEnqueue(processor);
      this.setState({
        processor: null,
        timeOutActive: true,
        Ready_Queue
      });
      setTimeout(() => {
        this.setState({ timeOutActive: false });
      }, 800);
      setTimeout(() => {
        this.handleDispatchingToProcessor(Ready_Queue.Dequeue());
      }, 1500);
    }
  };

    // Method to dispatch a new process from ready queue
  handleDispatchingToProcessor = process => {
    console.log("Process Dispatche:=>", process);
    this.setState({ processor: process });
    setTimeout(() => {
      this.setState({ processDispatchActice: true });
    }, 400);
    setTimeout(() => {
      this.setState({ processDispatchActice: false });
    }, 2000);
  };

  handleExecute  = () => {
    const { processor, Ready_Queue, algoType } = this.state;
    if (processor) {
      if (processor.executionCount) {
        processor.executionCount--;
        this.setState({ processor });
        if (algoType != 1) this.handlevalidatePreemtion();
      } else {
        //dispatch new one
        if (Ready_Queue.Count()) {
          this.handleDispatchingToProcessor(Ready_Queue.Dequeue());
        } else this.setState({ processor: null });
      }
    }
  };

  // handleBlockProcess = () => {
  //   const { Primary_Queue, Ready_Queue, processor } = this.state;
  //   console.log("Blocking Process");
  //   if (processor) {
  //     Primary_Queue.Enqueue(processor);
  //     let status = Ready_Queue.Dequeue();
  //     this.setState({
  //       Primary_Queue,
  //       processor: null,
  //       Ready_Queue,
  //       blockqueueActive: true
  //     });
  //     setTimeout(() => {
  //       this.setState({ blockqueueActive: false });
  //     }, 2000);
  //     if (status)
  //       setTimeout(() => {
  //         this.handleDispatchingToProcessor(status);
  //       }, 400);
  //     console.log(`Blocked Queue********`);
  //     console.log(Primary_Queue);
  //   }
  // };

  // handleReleaseProcess = () => {
  //   const { Primary_Queue, Ready_Queue } = this.state;
  //   console.log("releaseBlockedProcesses******");
  //   if (Primary_Queue.Count()) {
  //     const blocked = Primary_Queue.Dequeue();
  //     this.setState({ interruptHandledActive: true });
  //     setTimeout(() => {
  //       this.setState({ interruptHandledActive: false });
  //     }, 700);
  //     Ready_Queue.Enqueue(blocked);
  //     // this.handleCreateNotification(
  //     //   "info",
  //     //   `${blocked.processName} Released From Block Queue`
  //     // );
  //     console.log("Releasing Process " + blocked.processName);
  //   }
  // };

  handleCreateNotification = (type, message) => {
    switch (type) {
      case "info": {
        toast.info(message, {
          position: "bottom-left",
          autoClose: 2000,
          hideProgressBar: true,
          closeOnClick: false,
          pauseOnHover: true,
          draggable: false
        });
        break;
      }
      case "success": {
        toast.success(message, {
          position: "bottom-left",
          autoClose: 2000,
          hideProgressBar: true,
          closeOnClick: false,
          pauseOnHover: true,
          draggable: false
        });
        break;
      }
      case "warning": {
        toast.warn(message, {
          position: "bottom-left",
          autoClose: 2000,
          hideProgressBar: true,
          closeOnClick: false,
          pauseOnHover: true,
          draggable: false
        });
        break;
      }
      case "error": {
        toast.error(message, {
          position: "bottom-left",
          autoClose: 2000,
          hideProgressBar: true,
          closeOnClick: false,
          pauseOnHover: true,
          draggable: false
        });
        break;
      }
    }
  };

   // Method to check the system status
  handlecheckSystemStatus = () => {
    const { Ready_Queue, Primary_Queue, processor } = this.state;
    if (!Ready_Queue.Count() && !Primary_Queue.Count() && !processor) {
      this.clearIntervals();
      console.log("system ended=>", processor);
      this.setState({ systemEnd: true });
    }
  };

  //Clear all timers to end up the system
  clearIntervals() {
    const { burstTimer, getProcessesTimer, systemTimer } = this.state;
    clearInterval(burstTimer);
    clearInterval(getProcessesTimer);
    clearInterval(systemTimer);
    this.setState({
      burstTimer: null,
      systemTimer: null,
      getProcessesTimer: null
    });
  }

  render() {
    const {
      Ready_Queue,
      Primary_Queue,
      processor,
      processArrivedActive,
      processDispatchActice,
      timeOutActive
    } = this.state;
    console.log("Render Ready_Queue***", Ready_Queue);
    return (
      <div className="dashboard-screen">
        {/* <ToastContainer closeButton={false} /> */}
        {this.renderHeader()}
        <div className="dasboard-system">
          {Ready_Queue && (
            <div className="readyqueue-container">
              <QueueContainer
                processes={Ready_Queue.QueueArray}
                text="Ready Queue"
                name="ready-queue"
              />
              <div className="interrrupt-handled-images">
                {!processArrivedActive && <img src={ProcessArrivedDark} />}
                {processArrivedActive && <img src={ProcessArrivedLight} />}
              </div>
              <div className="process-dispatched-images">
                {!processDispatchActice && <img src={ProcessDipatchedLight} />}
                {processDispatchActice && <img src={ProcessDipatchedDark} />}
              </div>

              <div className="process-timout-images">
                {!timeOutActive && <img src={ProcessTimeoutLight} />}
                {timeOutActive && <img src={ProcessTimeoutDark} />}
              </div>
            </div>
          )}
          {Primary_Queue && (
            <div className="blockqueue-container">
              <QueueContainer
                processes={Primary_Queue.QueueArray}
                text="Primary Queue"
                name="block-queue"
              />
              {/* <div className="process-interrrupted-images">
                {!blockqueueActive && <img src={BlockQueueInterruptLight} />}
                {blockqueueActive && <img src={BlockQueueInterruptDark} />}
              </div> */}
            </div>
          )}
          {this.renderProcessor(processor)}
          {/* {this.renderBlockMessage()} */}
        </div>
        {/* {this.renderFooter()} */}
        <Modal
          className="info-model process-model"
          visible={this.state.systemEnd}
          title="Title"
          onOk={() => {}}
          onCancel={() => {}}
          footer={null}
        >
          <h4 style={{ textAlign: "center", color: "red" }}>
            System Ended!
            <br />
            Thank you
          </h4>
        </Modal>
      </div>
    );
  }

  renderHeader = () => {
    const { no_Ofprocesses, algoName } = this.state;
    return (
      <div className="header">
        <div className="interrupt-type">
          <h4 style={{ color: "red" }}>{algoName}</h4>
        </div>
        <div className="total-processes">
          <h4 style={{ color: "red" }}>No of Processes : {no_Ofprocesses}</h4>
        </div>
      </div>
    );
  };

  renderFooter = () => {
    return (
      <div className="footer">
        <div className="status">
          <div style={{ color: "red" }}>
            <span
              style={{
                fontWeight: "bolder"
              }}
            >
              Status:
            </span>
            <span
              className="click-interrrupt"
              onClick={this.handleBlockProcess}
            >
              Click to interrupt process
            </span>
          </div>
        </div>
        <div className="time-latency">
          <div style={{ color: "red" }}>Time Latency : 5 sec</div>
        </div>
      </div>
    );
  };

  renderProcessor(process) {
    return (
      <div className="processor">
        <h5 style={{ color: "red" }}>Processor</h5>
        {process && <div className="process">{process.processName}</div>}
        <div
          className="processor-timer"
          id="processorLoader"
          key={ele => {
            this.processorLoader = ele;
          }}
        />
      </div>
    );
  }

  renderBlockMessage() {
    return (
      <h3
        style={{
          position: "absolute",
          bottom: "30px",
          left: "500px"
        }}
      />
    );
  }

  // blinker() {
  //   const blinker = document.getElementById("blink-message");
  //   blinker.style.visibility = "visible";
  //   setInterval(() => {
  //     console.log("Blinking");
  //     console.log(blinker.style.visibility)
  //     if (blinker.style.visibility === "visible")
  //       blinker.style.visibility = "hidden";
  //     else blinker.style.visibility = "visible";
  //   }, 500);
  // }
}
