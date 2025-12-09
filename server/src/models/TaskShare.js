import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db.js";

class TaskShare extends Model {}

TaskShare.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    canEdit: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  },
  {
    sequelize,
    modelName: "TaskShare",
    tableName: "task_shares",
    underscored: true
  }
);

export default TaskShare;
