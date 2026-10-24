import { DataTypes as T } from 'sequelize';
import { sequelize } from '../db.js';

export { T, sequelize };

/** `YYYY-MM-DD` calendar date (no time zone). Sequelize returns DATEONLY as that string. */
export const dateOnly = (allowNull = true) => ({ type: T.DATEONLY, allowNull });
export const money = (allowNull = false) => ({ type: T.DECIMAL(12, 2), allowNull, defaultValue: 0 });
/**
 * A creation-time column the seed (and tests) can set explicitly. Sequelize's automatic `createdAt` is read-only on
 * create, which would silently replace back-dated demo rows with "now".
 */
export const stamp = (name = 'createdAt') => ({ [name]: { type: T.DATE, allowNull: false, defaultValue: T.NOW } });
export const fk = (allowNull = false) => ({ type: T.INTEGER.UNSIGNED, allowNull });

/** Registers a model on the shared connection. */
export const define = (name, attributes, options = {}) => sequelize.define(name, attributes, options);
