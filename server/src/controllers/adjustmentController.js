import * as adjustmentService from '../services/adjustmentService.js';

export const getAdjustments = async (req, res, next) => {
  try {
    const { productId, warehouseId } = req.query;
    const adjustments = await adjustmentService.getAllAdjustments({ productId, warehouseId });
    res.status(200).json({ success: true, count: adjustments.length, data: adjustments });
  } catch (error) {
    next(error);
  }
};

export const getAdjustmentById = async (req, res, next) => {
  try {
    const adjustment = await adjustmentService.getAdjustmentById(req.params.id);
    res.status(200).json({ success: true, data: adjustment });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

export const createAdjustment = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const adjustment = await adjustmentService.createAdjustment(req.body, userId);
    res.status(201).json({ success: true, message: 'Stock adjustment record created successfully', data: adjustment });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

export const validateAdjustment = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const adjustment = await adjustmentService.validateAdjustment(req.params.id, userId);
    res.status(200).json({
      success: true,
      message: 'Stock adjustment validated! Physical count updated and ledger logged.',
      data: adjustment
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};
