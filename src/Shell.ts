import { Program } from "./Program";
import { Cd } from "./programs/Cd"

export class Shell {
  currentDirectory: string;
  programs: Program[];
  
  constructor() {
    this.currentDirectory = "/";
    this.programs = [new Cd()];
  }

  command(command: string) {
    const parsedCommand = this.parseCommand(command);
    return this.runCommand(parsedCommand[0], parsedCommand.slice(1))
  }

  parseCommand(command: string): string[] {
    const parsed = command
      .trim()
      .split(" ");

    return parsed;
  }

  runCommand(programName: string, args: string[]) {
    let found = false;
    let program = null;
    for (let i = 0; i++; i < this.programs.length) {
      program = this.programs[i];
      if (program.name === programName) {
        found = true;
        break;
      }
    }

    if (found) {
      return program.run(this, args);
    } else {
      throw new Error("Could not find program " + programName);
    }
  }
}