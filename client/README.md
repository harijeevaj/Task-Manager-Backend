Task Management API (Node.js + Express + PostgreSQL)

This is a Task Management backend API with:

- User registration & authentication (JWT)
- Task CRUD (create, read, update, delete)
- Task status & priority updates
- Task filtering, sorting & pagination
- Category management
- Optional task sharing
- Proper error handling & validation

Backend only – you can test it with **Postman** or plug in a React frontend.

Authentication Endpoints
(All protected endpoints require: Authorization: Bearer <accessToken>)

Register
Method: POST
URL: /api/auth/register
Body:
{
"username": "hari",
"email": "hari@example.com
",
"password": "Password123"
}

Login
Method: POST
URL: /api/auth/login
Body:
{
"email": "hari@example.com
",
"password": "Password123"
}

Response includes access and refresh token.

Get Logged-In User
Method: GET
URL: /api/auth/me

Task Endpoints

Create Task
Method: POST
URL: /api/tasks
Body:
{
"title": "Build project backend",
"priority": "high"
}

Get All Tasks (supports filters)
Method: GET
URL: /api/tasks

Optional query parameters:
status, priority, search, sortBy, page, limit

Example:
GET /api/tasks?status=todo,in-progress&page=1&limit=10

Get Single Task
Method: GET
URL: /api/tasks/:id

Update Task
Method: PUT
URL: /api/tasks/:id
Body example:
{
"title": "Updated Task Title",
"priority": "urgent"
}

Update Task Status
Method: PUT
URL: /api/tasks/:id/status
Body:
{
"status": "completed"
}

Update Task Priority
Method: PUT
URL: /api/tasks/:id/priority
Body:
{
"priority": "medium"
}

Delete Task
Method: DELETE
URL: /api/tasks/:id
Success response: 204 No Content

Category Endpoints

Create Category
Method: POST
URL: /api/categories
Body:
{
"name": "Work",
"color": "#3B82F6"
}

Get Categories
Method: GET
URL: /api/categories

Delete Category
Method: DELETE
URL: /api/categories/:id

Error Response Format

All errors follow this structure:

{
"success": false,
"error": {
"code": "VALIDATION_ERROR",
"message": "Invalid input"
}
}
