const asyncHandler = (func) => {
  (req, res, next) => {
    Promise.resolve(func(req, res, next)).catch((err) => {
      next(err);
    });
  };
};

// More Simplified Code
// const asyncHandler = (func) => (req, res, next) => {
//   Promise.resolve(func(req, res, next)).catch(next);
// };

module.exports = { asyncHandler };

// Using try-catch block
// const asyncHandler = (fn) => async (req, res, next) => {
//   try {
//     await fn(req, res, next);
//   } catch (error) {
//     res.status(error.code || 500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// const handler = (func) => async(req, res, next) => {
//   try {
//     await func(req, res, next);
//   } catch (error) {
//     res.status(error.code || 500).json({
//       success: false,
//       message: error.message
//     })
//   }
// }
