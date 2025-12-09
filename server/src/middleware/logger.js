export function requestLogger(req, res, next) {
  console.log(`📌 [${req.method}] ${req.originalUrl}`);

  if (req.body && Object.keys(req.body).length > 0) {
    console.log("📝 Body:", req.body);
  }

  if (req.params && Object.keys(req.params).length > 0) {
    console.log("🔑 Params:", req.params);
  }

  if (req.query && Object.keys(req.query).length > 0) {
    console.log("🔍 Query:", req.query);
  }

  next();
}
