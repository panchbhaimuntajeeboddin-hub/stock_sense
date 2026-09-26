import * as transferService from '../services/transferService.js';

export const getTransfers = async (req, res, next) => {
  try {
    const { status, warehouseId } = req.query;
    const transfers = await transferService.getAllTransfers({ status, warehouseId });
    res.status(200).json({ success: true, count: transfers.length, data: transfers });
  } catch (error) {
    next(error);
  }
};

export const getTransferById = async (req, res, next) => {
  try {
    const transfer = await transferService.getTransferById(req.params.id);
    res.status(200).json({ success: true, data: transfer });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

export const createTransfer = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const transfer = await transferService.createTransfer(req.body, userId);
    res.status(201).json({ success: true, message: 'Stock transfer order created successfully', data: transfer });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

export const updateTransfer = async (req, res, next) => {
  try {
    const transfer = await transferService.updateTransfer(req.params.id, req.body);
    res.status(200).json({ success: true, message: 'Stock transfer order updated successfully', data: transfer });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

export const validateTransfer = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const transfer = await transferService.validateTransfer(req.params.id, userId);
    res.status(200).json({
      success: true,
      message: 'Internal stock transfer validated! Stock relocated and ledger logged.',
      data: transfer
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

export const cancelTransfer = async (req, res, next) => {
  try {
    const transfer = await transferService.cancelTransfer(req.params.id);
    res.status(200).json({ success: true, message: 'Stock transfer order canceled successfully', data: transfer });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};
