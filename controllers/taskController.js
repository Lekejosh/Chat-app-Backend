const Board = require("../models/boardModel");
const User = require("../models/userModel");
const Card = require("../models/cardModel");
const Task = require("../models/taskModel");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const ErrorHandler = require("../utils/errorHandler");
const sendEmail = require("../utils/sendMail");

exports.createBoard = catchAsyncErrors(async (req, res, next) => {
  const { title, type, background } = req.body;

  const board = await Board.create({
    title,
    type,
    background,
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, board });
});

exports.getBoard = catchAsyncErrors(async (req, res, next) => {
  const board = await Board.findById(req.params.id).populate("tasks");
  if (!board) {
    return next(new ErrorHandler("Board not Found", 404));
  }
  res.status(200).json({ success: true, board });
});

exports.getAllBoard = catchAsyncErrors(async (req, res, next) => {
  const board = await Board.find({ createdBy: req.user._id });

  if (!board) {
    return next(new ErrorHandler("No Board found", 404));
  }

  res.status(200).json({ success: true, board });
});

exports.boardEdit = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const { title, type, priority, background } = req.body;

  const board = await Board.findByIdAndUpdate(
    id,
    { title, type, priority, background },
    { new: true }
  );

  if (!board) {
    return next(new ErrorHandler("Board not Found", 404));
  }

  res.status(200).json({ success: true, board });
});

exports.deleteBoard = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const board = await Board.findById(id);

  if (!board) {
    return next(new ErrorHandler("Board not Found", 404));
  }
  if (board.createdBy.toString() !== req.user._id.toString()) {
    return next(new ErrorHandler("Unauthorized to perform this action", 401));
  }

  board.remove();
  await board.save();

  res.status(200).json({ success: true });
});

exports.createTask = catchAsyncErrors(async (req, res, next) => {
  const { boardId } = req.params;
  const { title } = req.body;

  const task = await Task.create({ title });

  const board = await Board.findById(boardId);

  if (!board) {
    return next(new ErrorHandler("Board not Found", 404));
  }

  board.tasks.push(task._id);
  await board.save();

  res.status(201).json({
    success: true,
    task,
  });
});

exports.editTask = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { title } = req.body;
  const task = await Task.findByIdAndUpdate(
    id,
    { title: title },
    { new: true }
  );

  if (!task) {
    return next(new ErrorHandler("Task not Found", 404));
  }
  res.status(200).json({
    success: true,
    task,
  });
});

exports.deleteTask = catchAsyncErrors(async (req, res, next) => {
  const { id, boardId } = req.params;
  const task = await Task.findById(id);

  if (!task) {
    return next(new ErrorHandler("Task not found", 404));
  }

  const board = await Board.findById(boardId);

  if (!board) {
    return next(new ErrorHandler("Board not found", 404));
  }

  const tasks = board.tasks;

  // Check if the task exists in the board's tasks
  const taskIndex = tasks.findIndex((task) => task._id.toString() === id);

  if (taskIndex === -1) {
    return next(new ErrorHandler("Task not found in board", 404));
  }

  tasks.splice(taskIndex, 1);
  await task.remove();
  await board.save();

  res.status(200).json({ success: true });
});
