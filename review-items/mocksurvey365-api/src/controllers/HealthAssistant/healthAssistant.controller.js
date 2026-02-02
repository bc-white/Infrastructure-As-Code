const axios = require("axios");
const mongoose = require("mongoose");
const CONSTANTS = require("../../constants/constants");
const auditLogger = require("../../helpers/logger");
const { predictAgent } = require("../../helpers/predictAgent");

const {
  addFtagValidation,
} = require("../../validators/config-validators/config.validators");

const {
  gammaValidation,
} = require("../../validators/subscription-validators/subscription.validator");

const { answerQuestion } = require("../../helpers/fastAskMocky365Agent");



exports.gammaData = async (req, res) => {
  try {
    let textMode = [
      {
        id: 1,
        name: "generate",
      },
      {
        id: 2,
        name: "condense",
      },
      {
        id: 3,
        name: "preserve",
      },
    ];

    let format = [
      {
        id: 1,
        name: "presentation",
      },
      {
        id: 2,
        name: "document",
      },
      {
        id: 3,
        name: "social",
      },
    ];

    let themeName = [
      {
        id: 1,
        name: "Oasis",
      },
      {
        id: 2,
        name: "Night Sky",
      },
    ];

    let numCards = [
      {
        id: 1,
        name: "10",
      },
      {
        id: 2,
        name: "9",
      },
    ];

    let cardSplit = [
      {
        id: 1,
        name: "auto",
      },
      {
        id: 2,
        name: "inputTextBreaks",
      },
    ];

    let exportAs = [
      {
        id: 1,
        name: "pdf",
      },
      {
        id: 2,
        name: "pptx",
      },
    ];

    let textOptions = [
      {
        id: 1,
        amount: "detailed",
        tone: "neutral",
        audience: "outdoors",
      },
      {
        id: 2,
        amount: "brief",
        tone: "professional",
        audience: "enthusiasts",
      },
      {
        id: 3,
        amount: "medium",
        tone: "upbeat",
        audience: "adventure seekers",
      },
      {
        id: 4,
        amount: "extensive",
        tone: "inspiring",
        audience: "seven year olds",
      },
    ];

    let textOptionsLanguage = [
      { id: 1, language: "English (US)", key: "en" },
      { id: 2, language: "Afrikaans", key: "af" },
      { id: 3, language: "Albanian", key: "sq" },
      { id: 4, language: "Arabic", key: "ar" },
      { id: 5, language: "Arabic (Saudi Arabia)", key: "ar-sa" },
      { id: 6, language: "Bengali", key: "bn" },
      { id: 7, language: "Bulgarian", key: "bg" },
      { id: 8, language: "Catalan", key: "ca" },
      { id: 9, language: "Croatian", key: "hr" },
      { id: 10, language: "Czech", key: "cs" },
      { id: 11, language: "Danish", key: "da" },
      { id: 12, language: "Dutch", key: "nl" },
      { id: 13, language: "English (India)", key: "en-in" },
      { id: 14, language: "English (UK)", key: "en-gb" },
      { id: 15, language: "Estonian", key: "et" },
      { id: 16, language: "Finnish", key: "fi" },
      { id: 17, language: "French", key: "fr" },
      { id: 18, language: "German", key: "de" },
      { id: 19, language: "Greek", key: "el" },
      { id: 20, language: "Gujarati", key: "gu" },
      { id: 21, language: "Hausa", key: "ha" },
      { id: 22, language: "Hebrew", key: "he" },
      { id: 23, language: "Hindi", key: "hi" },
      { id: 24, language: "Hungarian", key: "hu" },
      { id: 25, language: "Icelandic", key: "is" },
      { id: 26, language: "Indonesian", key: "id" },
      { id: 27, language: "Italian", key: "it" },
      { id: 28, language: "Japanese (です/ます style)", key: "ja" },
      { id: 29, language: "Japanese (だ/である style)", key: "ja-da" },
      { id: 30, language: "Kannada", key: "kn" },
      { id: 31, language: "Kazakh", key: "kk" },
      { id: 32, language: "Korean", key: "ko" },
      { id: 33, language: "Latvian", key: "lv" },
      { id: 34, language: "Lithuanian", key: "lt" },
      { id: 35, language: "Macedonian", key: "mk" },
      { id: 36, language: "Malay", key: "ms" },
      { id: 37, language: "Malayalam", key: "ml" },
      { id: 38, language: "Marathi", key: "mr" },
      { id: 39, language: "Norwegian", key: "nb" },
      { id: 40, language: "Persian", key: "fa" },
      { id: 41, language: "Polish", key: "pl" },
      { id: 42, language: "Portuguese (Brazil)", key: "pt-br" },
      { id: 43, language: "Portuguese (Portugal)", key: "pt-pt" },
      { id: 44, language: "Romanian", key: "ro" },
      { id: 45, language: "Russian", key: "ru" },
      { id: 46, language: "Serbian", key: "sr" },
      { id: 47, language: "Simplified Chinese", key: "zh-cn" },
      { id: 48, language: "Slovenian", key: "sl" },
      { id: 49, language: "Spanish", key: "es" },
      { id: 50, language: "Spanish (Latin America)", key: "es-419" },
      { id: 51, language: "Spanish (Mexico)", key: "es-mx" },
      { id: 52, language: "Spanish (Spain)", key: "es-es" },
      { id: 53, language: "Swahili", key: "sw" },
      { id: 54, language: "Swedish", key: "sv" },
      { id: 55, language: "Tagalog", key: "tl" },
      { id: 56, language: "Tamil", key: "ta" },
      { id: 57, language: "Telugu", key: "te" },
      { id: 58, language: "Thai", key: "th" },
      { id: 59, language: "Traditional Chinese", key: "zh-tw" },
      { id: 60, language: "Turkish", key: "tr" },
      { id: 61, language: "Ukrainian", key: "uk" },
      { id: 62, language: "Urdu", key: "ur" },
      { id: 63, language: "Uzbek", key: "uz" },
      { id: 64, language: "Vietnamese", key: "vi" },
      { id: 65, language: "Welsh", key: "cy" },
      { id: 66, language: "Yoruba", key: "yo" },
    ];

    const imageOptions = [
      { id: 1, source: "aiGenerated" },
      { id: 2, source: "pictographic" },
      { id: 3, source: "unsplash" },
      { id: 4, source: "giphy" },
      { id: 5, source: "webAllImages" },
      { id: 6, source: "webFreeToUse" },
      { id: 7, source: "webFreeToUseCommercially" },
      { id: 8, source: "placeholder" },
      { id: 9, source: "noImages" },
    ];

    let imageModelStyle = [
      {
        id: 1,
        model: "flux-1-quick",
        style: "minimal, black and white, line art",
      },
      {
        id: 2,
        model: "flux-kontext-fast",
        style: "minimal, black and white, line art",
      },
      {
        id: 3,
        model: "imagen-3-flash",
        style: "minimal, black and white, line art",
      },
      {
        id: 4,
        model: "luma-photon-flash-1",
        style: "minimal, black and white, line art",
      },
      {
        id: 5,
        model: "flux-1-pro",
        style: "minimal, black and white, line art",
      },
      {
        id: 6,
        model: "imagen-3-pro",
        style: "minimal, black and white, line art",
      },
      {
        id: 7,
        model: "ideogram-v3-turbo",
        style: "minimal, black and white, line art",
      },
      {
        id: 8,
        model: "luma-photon-1",
        style: "minimal, black and white, line art",
      },
      {
        id: 9,
        model: "leonardo-phoenix",
        style: "minimal, black and white, line art",
      },
      {
        id: 10,
        model: "flux-kontext-pro",
        style: "minimal, black and white, line art",
      },
      {
        id: 11,
        model: "ideogram-v3",
        style: "minimal, black and white, line art",
      },
      {
        id: 12,
        model: "imagen-4-pro",
        style: "minimal, black and white, line art",
      },
      {
        id: 13,
        model: "recraft-v3",
        style: "minimal, black and white, line art",
      },
      {
        id: 14,
        model: "gpt-image-1-medium",
        style: "minimal, black and white, line art",
      },
      {
        id: 15,
        model: "flux-1-ultra",
        style: "minimal, black and white, line art",
      },
      {
        id: 16,
        model: "imagen-4-ultra",
        style: "minimal, black and white, line art",
      },
      {
        id: 17,
        model: "dall-e-3",
        style: "minimal, black and white, line art",
      },
      {
        id: 18,
        model: "flux-kontext-max",
        style: "minimal, black and white, line art",
      },
      {
        id: 19,
        model: "recraft-v3-svg",
        style: "minimal, black and white, line art",
      },
      {
        id: 20,
        model: "ideogram-v3-quality",
        style: "minimal, black and white, line art",
      },
      {
        id: 21,
        model: "gpt-image-1-high",
        style: "minimal, black and white, line art",
      },
    ];

    let cardOptions = [
      {
        id: 1,
        dimensions: "16x9",
      },
      {
        id: 2,
        dimensions: "4x3",
      },
      {
        id: 3,
        dimensions: "pageless",
      },
      {
        id: 4,
        dimensions: "letter",
      },
      {
        id: 5,
        dimensions: "a4",
      },
    ];

    const data = {
      textMode,
      format,
      themeName,
      numCards,
      cardSplit,
      exportAs,
      textOptions,
      textOptionsLanguage,
      imageOptions,
      imageModelStyle,
      cardOptions,
    };

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Gamma parameters fetched successfully",
      data,
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;
    auditLogger(
      "gamma error",
      `Error during gamma: ${errorMsg}`,
      "AdminActivity",
      req.user._id
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during get final sample investigations: ${errorMsg}`,
    });
  }
};

// get gamma data
exports.getGamma = async (req, res) => {
  try {
    const id = req.params.id;

    const config = {
      headers: {
        "X-API-KEY": `${CONSTANTS.GAMMA_API_KEY}`,
        "Content-Type": "application/json",
      },
    };

    const response = await axios.get(
      `https://public-api.gamma.app/v0.2/generations/${id}`,
      config
    );

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Gamma data generated successfully",
      data: response.data,
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;
    auditLogger(
      "gamma error",
      `Error during gamma: ${errorMsg}`,
      "AdminActivity",
      req.user._id
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during get final sample investigations: ${errorMsg}`,
    });
  }
};

// gama integrations
exports.gamma = async (req, res) => {
  try {
    const { error } = gammaValidation(req.body);
    if (error) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: error.details[0].message,
      });
    }

    const {
      inputText,
      textMode,
      format,
      themeName,
      numCards,
      cardSplit,
      additionalInstructions,
      exportAs,
      textOptions,
      imageOptions,
      cardOptions,
    } = req.body;

    const config = {
      headers: {
        "X-API-KEY": `${CONSTANTS.GAMMA_API_KEY}`,
        "Content-Type": "application/json",
      },
    };

    const payload = {
      inputText,
      textMode,
      format,
      themeName,
      numCards,
      cardSplit,
      additionalInstructions,
      exportAs,
      textOptions,
      imageOptions,
      cardOptions,
      sharingOptions: {
        workspaceAccess: "view",
        externalAccess: "noAccess",
      },
    };

    const response = await axios.post(
      "https://public-api.gamma.app/v0.2/generations",
      payload,
      config
    );

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Gamma data generated successfully",
      data: response.data,
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;
    console.log(errorMsg);
    auditLogger(
      "gamma error",
      `Error during gamma: ${errorMsg}`,
      "AdminActivity",
      req.user._id
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during get final sample investigations: ${errorMsg.message}`,
    });
  }
};


exports.getFtagFromQuestion = async (req, res) => {
  try {
    const { error } = addFtagValidation(req.body);
    if (error) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: error.details[0].message,
      });
    }

    const { question, answer } = req.body;
    const result = await predictAgent(question, answer);

    if (!result) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "Failed to retrieve ftag",
      });
    }

    auditLogger(
      "get ftag from question",
      `Ftag retrieved successfully: ${result}`,
      "AdminActivity",
      req.user._id
    );

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Ftag retrieved successfully",
      data: result,
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;

    auditLogger(
      "get ftag from question error",
      `Error during get ftag from question: ${errorMsg}`,
      "AdminActivity",
      req.user._id
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during get ftag from question: ${errorMsg}`,
    });
  }
};

// Ask Mocky365 - AI Q&A Agent for F-tags and Critical Elements
exports.askMocky365 = async (req, res) => {
  try {
    const { question } = req.body;

    // Validate input
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "Please provide a valid question",
      });
    }

    // Trim and validate question length
    const trimmedQuestion = question.trim();
    if (trimmedQuestion.length > 500) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "Question is too long. Please keep it under 500 characters.",
      });
    }
    // Get userId from request (if authenticated)
    const userId = req.user?._id?.toString();
    
    // Call the new vector embedding agent
    const result = await answerQuestion(trimmedQuestion, userId);

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Answer generated successfully",
      data: result,
    });

  } catch (error) {
    const errorMsg = error.response?.data || error.message;
    console.error("❌ Error in askMocky365:", errorMsg);
    
    auditLogger(
      "askMocky365 error",
      `Error during askMocky365: ${errorMsg}`,
      "AdminActivity",
      req.user?._id
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: "Failed to generate answer",
      error: process.env.NODE_ENV === "development" ? errorMsg : "Internal server error",
    });
  }
};
