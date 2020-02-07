import * as manifest from "../../../dist/LocalFileManifest.json";
import { DirectoryNotFoundError } from "../errors/DirectoryNotFoundError";
import { FileNotFoundError } from "../errors/FileNotFoundError";
import { InvalidPathError } from "../errors/InvalidPathError";
import { Cd } from "../executables/Cd";
import { IExecutable } from "../executables/IExecutable";
import { Ls } from "../executables/Ls";
import { Open } from "../executables/Open";
import { Directory } from "./Directory";
import { File } from "./File";
import { FileType } from "./FileType";
import { IFS } from "./IFS";
import { INode } from "./INode";
import { Path } from "./Path";

export class LocalFS implements IFS {
  public root: Directory;
  private executables: IExecutable[];

  constructor() {
    console.debug("Loading filesystem manifest:");
    console.debug(manifest);

    this.root = this.build(manifest);
    this.root.name = "root";

    console.debug("Successfully loaded filesystem:");
    console.debug(this.root);

    const executablesToLoad = [
      new Cd(),
      new Ls(),
      new Open(),
    ];
    this.loadExecutables(executablesToLoad);

    console.debug("Loaded executables:");
    console.debug(this.executables);
    console.debug("New filesystem:");
    console.debug(this.root);
  }

  public read(path: string[]): string {
    console.debug("Read requested for path:");
    console.debug(path);

    const node = this.stat(path);
    let output: string;

    if (node instanceof File) {
      const file: File = node;
      const readableTypes = [
        FileType.Markdown,
        FileType.PDF,
      ];
      if (readableTypes.includes(file.type)) {
        console.debug("Found compatible file to read: ");
        console.debug(file);

        output = file.content;
      } else {
        throw new FileNotFoundError(`The node at "${Path.render(path)}" is not a readable file`);
      }
    } else {
      throw new FileNotFoundError(`The node at "${Path.render(path)}" is not a file`);
    }

    return output;
  }

  public list(path: string[]): INode[] {
    console.debug("List requested for path:");
    console.debug(path);

    const node: INode = this.stat(path);

    if (node instanceof Directory) {
      return (node as Directory).children;
    } else {
      throw new DirectoryNotFoundError(`The node at "${Path.render(path)}" is not a directory`);
    }
  }

  public stat(path: string[]): INode {
    let currNode: Directory = this.root;
    path = path.slice(1, path.length);

    console.debug("Stat requested for path:");
    console.debug(path);

    for (let i = 0; i < path.length; i++) {
      const pathPart = path[i];
      let foundPathPart: boolean = false;

      for (const searchNode of currNode.children) {
        if (i === path.length - 1 && searchNode.name === pathPart) {
          foundPathPart = true;
          return searchNode;
        } else if (searchNode instanceof Directory && searchNode.name === pathPart) {
          foundPathPart = true;
          currNode = searchNode;
        }
      }

      if (!foundPathPart) {
        path.unshift("root");
        throw new InvalidPathError(`The path "${Path.render(path)}" is invalid`);
      }
    }

    return currNode;
  }

  public getExecutables(): IExecutable[] {
    return this.executables;
  }

  private build(jsonNode: any): Directory {
    const directory: Directory = new Directory(jsonNode.name);

    for (const child of jsonNode.children) {
      if ("children" in child) {
        directory.addChild(this.build(child));
      } else {
        const file: File = new File(child.name, child.type, child.content);
        directory.addChild(file);
      }
    }

    return directory;
  }

  private loadExecutables(executables: IExecutable[]): void {
    this.executables = executables;

    const bin: Directory = new Directory("bin");

    for (const executable of executables) {
      const executableFile = new File(executable.name, FileType.Executable, "");
      bin.addChild(executableFile);
    }

    this.root.addChild(bin);
  }
}
