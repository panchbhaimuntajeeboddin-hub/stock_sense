import * as aiAssistantService from '../services/aiAssistantService.js';
import * as reorderPredictionService from '../services/reorderPredictionService.js';

export const handleInventoryAssistantQuery = async (req, res, next) => {
  try {
    const { message } = req.body;
    const userId = req.user?.id;

    if (!message || !message.trim()) {
      const error = new Error('Message content is required for AI Assistant query');
      error.statusCode = 400;
      throw error;
    }

    const response = await aiAssistantService.processInventoryQuery(message, userId);
    res.status(200).json({
      success: true,
      data: response
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

export const getReorderPredictions = async (req, res, next) => {
  try {
    const { warehouseId, categoryId, riskLevel } = req.query;
    const predictions = await reorderPredictionService.getReorderPredictions({
      warehouseId,
      categoryId,
      riskLevel
    });
    res.status(200).json(predictions);
  } catch (error) {
    next(error);
  }
};

