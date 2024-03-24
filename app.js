const express = require("express");
const app = express();
app.use(express.json());
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "todoApplication.db");
let db;
initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server running");
    });
  } catch (error) {
    console.log(`DB Error:${error}`);
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

//APIs for different queries

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query): //if this is true then below query is taken in the code
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}'
    AND priority = '${priority}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}';`;
      break;
    default:
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%';`;
  }

  data = await db.all(getTodosQuery);
  response.send(data);
});

//APIs for get single todo by id

app.get("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const singleTodoQuery = `select * from todo where id=${todoId}`;
  const data = await db.get(singleTodoQuery);
  response.send(data);
});

//update todo data

app.put("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const updateData = request.body;
  const singleTodoQuery = `select * from todo where id=${todoId}`;
  const data = await db.get(singleTodoQuery);
  let updateVal = null;
  switch (true) {
    case updateData.todo !== undefined:
      updateVal = "Todo";
      break;
    case updateData.priority !== undefined:
      updateVal = "Priority";
      break;
    case updateData.status !== undefined:
      updateVal = "Status";
      break;
  }
  const {
    todo = data.todo,
    priority = data.priority,
    status = data.status,
  } = updateData;
  const updateQuery = `UPDATE todo SET todo="${todo}",priority="${priority}",status="${status}" WHERE id=${todoId};`;
  await db.run(updateQuery);
  response.send(`${updateVal} Updated`);
});

//APIs for post method
app.post("/todos", async (request, response) => {
  const todoDetails = request.body;
  const { id, todo, priority, status } = todoDetails;
  const addQuery = `INSERT INTO todo (id, todo, priority, status)
        VALUES (${id},'${todo}','${priority}','${status}');`;
  await db.run(addQuery);
  response.send("Todo Successfully Added");
});

//delete todo item from database

app.delete("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `DELETE FROM
  todo
WHERE
  id = ${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
