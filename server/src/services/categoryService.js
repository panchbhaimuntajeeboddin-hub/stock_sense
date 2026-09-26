import prisma from '../config/db.js';

// In-Memory Fallback Category Store if DB is offline
const inMemoryCategories = new Map([
  ['cat-1', { id: 'cat-1', name: 'Raw Materials', description: 'Metals, steel, raw supplies', createdAt: new Date() }],
  ['cat-2', { id: 'cat-2', name: 'Finished Goods', description: 'Assembled office & home goods', createdAt: new Date() }],
  ['cat-3', { id: 'cat-3', name: 'Electronics', description: 'Microcontrollers, boards, chips', createdAt: new Date() }],
  ['cat-4', { id: 'cat-4', name: 'Hardware', description: 'Bolts, screws, copper wiring', createdAt: new Date() }]
]);

export const getAllCategories = async () => {
  try {
    return await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { products: true }
        }
      }
    });
  } catch (err) {
    return Array.from(inMemoryCategories.values());
  }
};

export const getCategoryById = async (id) => {
  try {
    return await prisma.category.findUnique({
      where: { id },
      include: { products: true }
    });
  } catch (err) {
    return inMemoryCategories.get(id) || null;
  }
};

export const createCategory = async ({ name, description }) => {
  const trimmedName = name.trim();
  try {
    const existing = await prisma.category.findUnique({ where: { name: trimmedName } });
    if (existing) {
      const error = new Error('Category with this name already exists');
      error.statusCode = 400;
      throw error;
    }
    return await prisma.category.create({
      data: { name: trimmedName, description }
    });
  } catch (err) {
    if (err.statusCode === 400) throw err;
    // Fallback
    for (const cat of inMemoryCategories.values()) {
      if (cat.name.toLowerCase() === trimmedName.toLowerCase()) {
        const error = new Error('Category with this name already exists');
        error.statusCode = 400;
        throw error;
      }
    }
    const newCat = {
      id: `cat-${Date.now()}`,
      name: trimmedName,
      description,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    inMemoryCategories.set(newCat.id, newCat);
    return newCat;
  }
};

export const updateCategory = async (id, { name, description }) => {
  const trimmedName = name.trim();
  try {
    return await prisma.category.update({
      where: { id },
      data: { name: trimmedName, description }
    });
  } catch (err) {
    if (inMemoryCategories.has(id)) {
      const cat = inMemoryCategories.get(id);
      const updated = { ...cat, name: trimmedName, description, updatedAt: new Date() };
      inMemoryCategories.set(id, updated);
      return updated;
    }
    const error = new Error('Category not found');
    error.statusCode = 404;
    throw error;
  }
};

export const deleteCategory = async (id) => {
  try {
    return await prisma.category.delete({ where: { id } });
  } catch (err) {
    if (inMemoryCategories.has(id)) {
      inMemoryCategories.delete(id);
      return { success: true };
    }
    const error = new Error('Category not found');
    error.statusCode = 404;
    throw error;
  }
};
