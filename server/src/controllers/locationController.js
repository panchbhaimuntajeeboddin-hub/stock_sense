import * as locationService from '../services/locationService.js';

export const createLocation = async (req, res, next) => {
  try {
    const location = await locationService.createLocation(req.body);
    res.status(201).json({ success: true, message: 'Location created successfully', data: location });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

export const updateLocation = async (req, res, next) => {
  try {
    const location = await locationService.updateLocation(req.params.id, req.body);
    res.status(200).json({ success: true, message: 'Location updated successfully', data: location });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

export const deleteLocation = async (req, res, next) => {
  try {
    const result = await locationService.deleteLocation(req.params.id);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};
