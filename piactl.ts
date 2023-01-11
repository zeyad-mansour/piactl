let { execSync } = require("child_process");
const os = require("os");

export class PiaCTL {
  regions: string[];
  piactlPath: string;
  printOutput: boolean;
  constructor(printOutput = false, piactlPath?: string) {
    this.printOutput = printOutput;
    if (!piactlPath) {
      if (os.platform == "darwin") {
        this.piactlPath = "piactl"; // piactl is added to the path by default on MacOS (unlike Windows)
      } else if (os.platform == "win32") {
        this.piactlPath =
          '"C:\\Program Files\\Private Internet Access\\piactl.exe"';
      } else {
        throw new Error("Invalid platform");
      }
    } else { // use the custom path passed in constructor
      this.piactlPath = piactlPath;
    }
    this.regions = this.getRegions();
  }

  // run shell command
  runCommand(command: string) {
    let res = execSync(command);
    if (this.printOutput) {
      console.log(res.toString());
    }
    return res.toString().trim();
  }

  /**
   * Get array of all the available PIA regions
   */
  getRegions() {
    let res = this.runCommand(`${this.piactlPath} get regions`);
    return res.split(/\r?\n/);
  }

  getVPNIP() {
    let res = this.runCommand(`${this.piactlPath} get vpnip`);
    return res;
  }

  getPubIP() {
    let res = this.runCommand(`${this.piactlPath} get pubip`);
    return res;
  }

  /**
   * Connect vpn (to last set region)
   */
  connect() {
    this.runCommand(`${this.piactlPath} connect`);
    let connected = false;
    while (!connected) {
      let res = this.runCommand(`${this.piactlPath} get connectionstate`);
      if (res.includes("Connected")) {
        connected = true;
      }
    }
  }

  /**
   * Connect to a auto region
   */
  connectAuto() {
    this.runCommand(`${this.piactlPath} set region auto`);
    this.connect();
  }

  /**
   * Connect to a random region
   *
   * @param unitedStates - Choose a random region from the United States only
   */
  connectToRandomRegion(unitedStates = false) {
    let lastIndex = this.regions.length;
    if (unitedStates) {
      lastIndex = 57;
    }
    let randomRegion = this.regions[Math.floor(Math.random() * lastIndex)];
    this.connectToSpecificRegion(randomRegion);
    return randomRegion;
  }

  /**
   * Connect to a specific region (e.g. 'us-idaho')
   *
   * @param region - The region to connect to from `piactl get regions`
   */
  connectToSpecificRegion(region: string) {
    this.runCommand(`${this.piactlPath} set region ${region}`);
    this.connect();
  }
}

