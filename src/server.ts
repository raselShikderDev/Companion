import type { Server } from "node:http";
import { envVars } from "./app/configs/envVars.js";
import app from "./app.js";
import seedSuperAdmin from "./app/helper/seedSuparAdmin.js";
import { connectRedis } from "./app/configs/redis.config.js";

async function startServer() {
  let server: Server;

  try {
    server = app.listen(envVars.PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${envVars.PORT}`);
    });

    // Function to gracefully shut down the server
    const exitHandler = () => {
      if (server) {
        server.close(() => {
          console.log("Server closed gracefully.");
          process.exit(1); // Exit with a failure code
        });
      } else {
        process.exit(1);
      }
    };

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (error) => {
      console.log(
        "Unhandled Rejection is detected, we are closing our server..."
      );
      if (server) {
        server.close(() => {
          console.log(error);
          exitHandler();
        });
      } else {
        exitHandler();
      }
    });
  } catch (error) {
    console.error("Error during server startup:", error);
    process.exit(1);
  }
}




(async function main() {
  try {
    await startServer();
    await connectRedis();
    await seedSuperAdmin();
  } catch (error) {
    console.error("Error in main:", error);
  }
})();
