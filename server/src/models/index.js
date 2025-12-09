import sequelize from "../config/db.js";
import User from "./User.js";
import Category from "./Category.js";
import Task from "./Task.js";
import TaskShare from "./TaskShare.js";
import RefreshToken from "./RefreshToken.js";


User.hasMany(Category, { foreignKey: "user_id", as: "categories" });
Category.belongsTo(User, { foreignKey: "user_id", as: "user" });

User.hasMany(Task, { foreignKey: "user_id", as: "tasks" });
Task.belongsTo(User, { foreignKey: "user_id", as: "user" });

Category.hasMany(Task, { foreignKey: "category_id", as: "tasks" });
Task.belongsTo(Category, { foreignKey: "category_id", as: "category" });

User.hasMany(RefreshToken, { foreignKey: "user_id", as: "refreshTokens" });
RefreshToken.belongsTo(User, { foreignKey: "user_id", as: "user" });

Task.belongsToMany(User, {
  through: TaskShare,
  foreignKey: "task_id",
  otherKey: "shared_with_id",
  as: "sharedWith"
});

User.belongsToMany(Task, {
  through: TaskShare,
  foreignKey: "shared_with_id",
  otherKey: "task_id",
  as: "sharedTasks"
});

TaskShare.belongsTo(User, { foreignKey: "owner_id", as: "owner" });
TaskShare.belongsTo(User, { foreignKey: "shared_with_id", as: "sharedWithUser" });
TaskShare.belongsTo(Task, { foreignKey: "task_id", as: "task" });

export { sequelize, User, Category, Task, TaskShare, RefreshToken };
