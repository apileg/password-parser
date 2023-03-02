import * as process from "process";
import * as fs from "fs/promises";
import * as path from "path";
import doForEachFile from "./do_for_each_file";
import { filter, map, mergeMap, never, Observer } from "rxjs";
import { createWriteStream } from "fs";

interface Args {
  dirWithLogsPath: string;
  password: string;
}

function getArgs(): Args | never {
  const args = process.argv.slice(2);
  const dirWithLogsPath = path.resolve(process.cwd(), args[0]);
  let password: string = "";

  if (args.length === undefined) {
    usage();
  }

  for (let i = 1; i < args.length; i += 1) {
    const length: string | undefined = String(args[1]);

    if (length === undefined) {
      usage();
    }
    password = args[1];
  }

  return {
    dirWithLogsPath,
    password,
  };
}

function usage(): never {
  console.log(
    "Usage: node password_parser.js <dir-with-logs> <password-format>"
  );
  process.exit(-1);
}

const args = getArgs();
main(args);

async function main(args: Args): Promise<void> {
  let files = await fs.readdir(args.dirWithLogsPath);
  files = files.map((f) => path.resolve(args.dirWithLogsPath, f));

  const content$ = doForEachFile(files, (fname) => fs.readFile(fname, "utf-8"));

  const password$ = content$.pipe(
    mergeMap(splitLines),
    map((p) => parsePasswords(p, args.password)),
    filter(notUndefined)
  );

  const savePath = path.join(process.cwd(), "parsed_data.txt");
  const passwords = new Set<string>();

  const observer: Observer<string> = {
    next: (value: string) => {
      passwords.add(value);
    },
    complete() {
      const stream = createWriteStream(savePath);
      passwords.forEach((password) => stream.write(password + ","));
      stream.close();
    },
    error: (err) => {
      console.log(err);
    },
  };

  password$.subscribe(observer);
}

function notUndefined(password: string | undefined): password is string {
  return password !== undefined;
}

function parsePasswords(line: string, prefix: string): string | undefined {
  const prefixJoin = prefix;
  if (line.startsWith(prefixJoin)) {
    return line.substring(prefix.length).trim();
  }

  return undefined;
}

function splitLines(content: string): string[] {
  return content.replace(/\r\n/g, "\n").split("\n");
}
