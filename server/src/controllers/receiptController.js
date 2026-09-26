import * as receiptService from '../services/receiptService.js';

export const getReceipts = async (req, res, next) => {
  try {
    const { status, supplierId, warehouseId } = req.query;
    const receipts = await receiptService.getAllReceipts({ status, supplierId, warehouseId });
    res.status(200).json({ success: true, count: receipts.length, data: receipts });
  } catch (error) {
    next(error);
  }
};

export const getReceiptById = async (req, res, next) => {
  try {
    const receipt = await receiptService.getReceiptById(req.params.id);
    res.status(200).json({ success: true, data: receipt });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

export const createReceipt = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const receipt = await receiptService.createReceipt(req.body, userId);
    res.status(201).json({ success: true, message: 'Receipt created successfully', data: receipt });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

export const updateReceipt = async (req, res, next) => {
  try {
    const receipt = await receiptService.updateReceipt(req.params.id, req.body);
    res.status(200).json({ success: true, message: 'Receipt updated successfully', data: receipt });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

export const validateReceipt = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const receipt = await receiptService.validateReceipt(req.params.id, userId);
    res.status(200).json({ success: true, message: 'Receipt validated! Stock increased automatically.', data: receipt });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

export const cancelReceipt = async (req, res, next) => {
  try {
    const receipt = await receiptService.cancelReceipt(req.params.id);
    res.status(200).json({ success: true, message: 'Receipt canceled successfully', data: receipt });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};
