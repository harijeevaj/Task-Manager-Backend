import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db.js";
import { TASK_STATUSES, TASK_PRIORITIES } from "../constants/task.js";

class Task extends Model {}

Task.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    status: {
      type: DataTypes.ENUM(...TASK_STATUSES),
      allowNull: false,
      defaultValue: "todo"
    },
    priority: {
      type: DataTypes.ENUM(...TASK_PRIORITIES),
      allowNull: false,
      defaultValue: "medium"
    },
    dueDate: {
      type: DataTypes.DATE
    },
    completedAt: {
      type: DataTypes.DATE
    },
    estimatedHours: {
      type: DataTypes.DECIMAL(5, 2)
    }
  },
  {
    sequelize,
    modelName: "Task",
    tableName: "tasks",
    underscored: true
  }
);

export default Task;
