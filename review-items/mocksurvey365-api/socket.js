const SurveyBuilderService = require("./src/services/suveyBuilder.service");
const redisLock = require('./src/utils/redisLock');
let io;

module.exports = {
  init: async (server) => {
    // Initialize Redis connection
    try {
      const redisConnected = await redisLock.connect();
      if (redisConnected) {
        console.log('✅ Redis lock system initialized successfully');
      } else {
        console.warn('⚠️ Redis not available - locks will be skipped');
      }
    } catch (error) {
      console.error('❌ Redis initialization failed:', error);
    }

    io = require("socket.io")(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    io.on("connection", (socket) => {
      console.log("a user connected");

      socket.on("disconnect", () => {
        console.log("user disconnected");
      });

      // risk-based
      socket.on("join_risk_based_resident", async (message) => {
        console.log("new message alerts join risk-based-resident");
        console.log("messages", message);

        if (!message.currentStep || !message.stepData || !message.completedAt) {
          console.log("premature shutdown - missing required fields");
          socket.emit("risk_based_resident_error", {
            error:
              "Missing required fields for risk-based resident (currentStep, stepData, completedAt)",
          });
          return;
        }

        // Join survey-specific room
        const roomName = `survey_${message.surveyId}`;
        socket.join(roomName);
        console.log(`User joined room: ${roomName} for risk-based-resident`);

        try {
          let response = await SurveyBuilderService.riskbasedResident(
            message.currentStep,
            message.stepData,
            message.completedAt
          );
          // Broadcast to all users in this survey's room
          io.to(roomName).emit("risk_based_resident", response);
          console.log(`Broadcasted risk-based resident to room: ${roomName}`);
        } catch (error) {
          console.error("Error in join_risk_based_resident:", error);
          socket.emit("risk_based_resident_error", {
            error: "Failed to risk-based resident",
            message: error.message,
          });
        }
      });

      // non resident risk based
      socket.on("join_risk_based_nonresident", async (message) => {
        console.log("new message alerts join risk-based-nonresident");
        console.log("messages", message);

        if (!message.currentStep || !message.stepData || !message.completedAt) {
          console.log("premature shutdown - missing required fields");
          socket.emit("risk_based_nonresident_error", {
            error:
              "Missing required fields for risk-based nonresident (currentStep, stepData, completedAt)",
          });
          return;
        }

        // Join survey-specific room
        const roomName = `survey_${message.surveyId}`;
        socket.join(roomName);
        console.log(`User joined room: ${roomName} for risk-based-nonresident`);

        try {
          let response = await SurveyBuilderService.nonresidentRiskbased(
            message.currentStep,
            message.stepData,
            message.completedAt
          );
          // Broadcast to all users in this survey's room
          io.to(roomName).emit("risk_based_nonresident", response);
          console.log(`Broadcasted risk-based nonresident to room: ${roomName}`);
        } catch (error) {
          console.error("Error in join_risk_based_nonresident:", error);
          socket.emit("risk_based_nonresident_error", {
            error: "Failed to risk-based nonresident",
            message: error.message,
          });
        }
      });

      // view risk based
      socket.on("join_view_risk_based", async (message) => {
        console.log("new message alerts join view risk based setup");

        if (!message?.surveyId || !message?.userId) {
          console.log("premature shutdown - missing surveyId or userId");
          socket.emit("view_risk_based_setup_error", {
            error: "Invalid surveyId or userId",
          });
          return;
        }

        // Join survey-specific room
        const roomName = `survey_${message.surveyId}`;
        socket.join(roomName);
        console.log(`User ${message.userId} joined room: ${roomName}`);

        try {
          let response = await SurveyBuilderService.viewRiskBasedSetup(
            message.surveyId,
            message.userId
          );

          // Broadcast to all users in this survey's room
          io.to(roomName).emit("view_risk_based", response);
          console.log(`Broadcasted risk based setup data to room: ${roomName}`);
        } catch (error) {
          console.error("Error in join_view_risk_based_setup:", error);
          socket.emit("view_risk_based_setup_error", {
            error: "Failed to load risk based setup",
            message: error.message,
          });
        }
      });



    });
  },
  getIo: () => {
    if (!io) {
      throw new Error("Socket.io not initialized!");
    }
    return io;
  },
};
