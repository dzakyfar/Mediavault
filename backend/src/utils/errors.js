export class AppError extends Error { constructor(status, message){ super(message); this.status=status; } }
export const asyncHandler = fn => (req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next);
export function notFound(req,res,next){ next(new AppError(404, `Route not found: ${req.method} ${req.originalUrl}`)); }
export function errorHandler(err, req, res, next){
  const status = err.status || (err.name === 'PrismaClientKnownRequestError' ? 400 : 500);
  if (process.env.NODE_ENV !== 'test') console.error(err);
  res.status(status).json({ success:false, message: status === 500 ? 'Internal server error' : err.message });
}
