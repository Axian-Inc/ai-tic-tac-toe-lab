import { runCli } from './cli';

runCli(process.argv.slice(2))
  .then((exitCode) => {
    process.exitCode = exitCode;
  })
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stdout.write(`ERROR UNEXPECTED: ${message}\n`);
    process.exitCode = 1;
  });
