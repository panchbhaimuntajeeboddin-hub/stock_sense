import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'stocksense_dev_jwt_secret_key_2026');

      // Attempt DB lookup if connected, otherwise use token payload
      try {
        const dbUser = await prisma.user.findUnique({
          where: { id: decoded.id },
          select: { id: true, name: true, email: true, role: true }
        });
        req.user = dbUser || decoded;
      } catch (err) {
        req.user = decoded;
      }

      return next();
    } catch (error) {
      res.status(401);
      return next(new Error('Not authorized, token invalid or expired'));
    }
  }

  if (!token) {
    res.status(401);
    return next(new Error('Not authorized, no token provided'));
  }
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403);
      return next(new Error(`Forbidden: Role '${req.user?.role}' is not authorized to access this resource`));
    }
    next();
  };
};
