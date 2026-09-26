import * as warehouseService from '../services/warehouseService.js';
import * as locationService from '../services/locationService.js';

export const getWarehouses = async (req, res, next) => {
  try {
    const warehouses = await warehouseService.getAllWarehouses();
    res.status(200).json({ success: true, count: warehouses.length, data: warehouses });
  } catch (error) {
    next(error);
  }
};

export const getWarehouseById = async (req, res, next) => {
  try {
    const warehouse = await warehouseService.getWarehouseById(req.params.id);
    res.status(200).json({ success: true, data: warehouse });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

export const createWarehouse = async (req, res, next) => {
  try {
    const warehouse = await warehouseService.createWarehouse(req.body);
    res.status(201).json({ success: true, message: 'Warehouse created successfully', data: warehouse });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

export const updateWarehouse = async (req, res, next) => {
  try {
    const warehouse = await warehouseService.updateWarehouse(req.params.id, req.body);
    res.status(200).json({ success: true, message: 'Warehouse updated successfully', data: warehouse });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

export const deleteWarehouse = async (req, res, next) => {
  try {
    const result = await warehouseService.deleteWarehouse(req.params.id);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

export const getLocationsByWarehouse = async (req, res, next) => {
  try {
    const locations = await locationService.getLocationsByWarehouse(req.params.id);
    res.status(200).json({ success: true, count: locations.length, data: locations });
  } catch (error) {
    next(error);
  }
};
