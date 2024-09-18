const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();
const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

///API - 1 GET

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodoQuery = "";
  const { search_q = "", priority, status } = request.query;
  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodoQuery = `SELECT * FROM todo WHERE 
            todo LIKE '%${search_q}%'
            AND status='${status}'
            AND priority='${priority}';
            `;
      break;
    case hasPriorityProperty(request.query):
      getTodoQuery = `SELECT * FROM todo WHERE 
            todo LIKE '%${search_q}%'
            AND priority='${priority}';
            `;
      break;
    case hasStatusProperty(request.query):
      getTodoQuery = `SELECT * FROM todo WHERE 
            todo LIKE '%${search_q}%'
            AND status='${status}';
            `;
      break;
    default:
      getTodoQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`;
  }
  data = await db.all(getTodoQuery);
  response.send(data);
});

///API -2 GET todo based on specific todoID
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `SELECT * FROM todo WHERE id=${todoId};`;
  const todo = await db.get(getTodoQuery);
  response.send(todo);
});

///API -3 Create todo in the todo table
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body; //Destructuring variables from the request body
  const insertTodo = `
            INSERT INTO todo (id, todo, priority, status)
            VALUES (${id},'${todo}','${priority}','${status}');`; //Updated the values with the variables
  await db.run(insertTodo);
  response.send("Todo Successfully Added");
});

///API-4 Update details of a specific todo based on the todo ID
app.put("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
  }
  const previousTodoQuery = `SELECT * FROM todo WHERE id=${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;
  const updateTodoQuery = `UPDATE todo SET todo='${todo}',priority='${priority},status='${status}' WHERE id=${todoId};`;
  await db.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

////API-5 Deletes a todo based on todoID
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `DELETE FROM todo WHERE id=${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
