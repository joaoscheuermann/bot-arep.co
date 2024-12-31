import os from 'node:os';
import cluster from 'node:cluster';

import worker from './worker';

if (cluster.isPrimary) {
  const numCPUs = os.cpus().length - 1;

  console.log(`Master ${process.pid} is running`);

  // Fork workers.
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork();
    console.log(`Worker ${worker.process.pid} restarted`);
  });
} else {
  console.log(`Worker ${process.pid} started`);

  const work = async () => {
    for (;;) {
      try {
        console.log('===== Starting worker =====');
        await worker();
        console.log('===== Finished worker =====\n\n');
      } catch (error) {
        console.error(error);
      }
    }
  };

  work().then(() => {
    console.log(`Worker ${process.pid} finished`);
    process.exit(0);
  });
}
