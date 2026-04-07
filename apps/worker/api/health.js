module.exports = async function healthHandler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.statusCode = 405;
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.end(
      JSON.stringify({
        error: {
          code: "method_not_allowed",
          message: "Only GET is supported on this endpoint.",
        },
      }),
    );
    return;
  }

  res.statusCode = 200;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(
    JSON.stringify({
      ok: true,
      service: "@silver/worker",
    }),
  );
};
